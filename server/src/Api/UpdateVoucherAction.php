<?php declare(strict_types=1);

namespace Leif\Api;

use DateTimeImmutable;
use InvalidArgumentException;
use Leif\Database;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\User\UserInterface;

final class UpdateVoucherAction
{
    const SQL_GET_VOUCHER = <<<SQL
SELECT v.*
  FROM voucher AS v
 WHERE v.voucher_id = :voucher_id
   AND v.user_id = :user_id
SQL;

    const SQL_DELETE_TRANSACTIONS = <<<SQL
WITH ids AS (
  SELECT transaction_id
    FROM "transaction" AS t
   INNER JOIN voucher AS v
      ON v.voucher_id = t.voucher_id
   WHERE v.voucher_id = :voucher_id
)

DELETE FROM "transaction"
 WHERE transaction_id IN (
   SELECT * FROM ids
 )
SQL;

    const SQL_GET_ATTACHMENT_IDS = <<<SQL
SELECT a.attachment_id
  FROM attachment AS a
 INNER JOIN voucher AS v
    ON v.voucher_id = a.voucher_id
 WHERE v.voucher_id = :voucher_id
SQL;

    const SQL_UPDATE_VOUCHER = <<<SQL
UPDATE voucher
   SET date = :date,
       name = :name,
       notes = :notes,
       updated_at = :updated_at
 WHERE voucher_id = :voucher_id
SQL;


    private Database $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function __invoke(Request $request, UserInterface $user, int $id)
    {
        $voucher = $this->db->selectOne(static::SQL_GET_VOUCHER, [
            ':voucher_id' => $id,
            ':user_id' => $user->getId(),
        ]);

        if ($voucher === null) {
            return new JsonResponse(['message' => 'Not found.'], Response::HTTP_NOT_FOUND);
        }

        $body = $request->toArray();

        $transactions = $body['transactions'] ?? [];

        if ($transactions && !CreateVoucherAction::areCreditsAndDebitsBalanced($transactions)) {
            return new JsonResponse(CreateVoucherAction::ERR_NOT_BALANCED, Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return $this->db->transaction(function () use ($voucher, $body, $transactions, $id) {
            $body['updated_at'] = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');

            $this->db->execute(static::SQL_UPDATE_VOUCHER, [
                ':date' => $body['date'] ?? $voucher['date'],
                ':name' => $body['name'] ?? $voucher['name'],
                ':notes' => $body['notes'] ?? $voucher['notes'],
                ':updated_at' => $body['updated_at'],
                ':voucher_id' => $id,
            ]);

            if ($transactions) {
                $this->db->execute(static::SQL_DELETE_TRANSACTIONS, [
                    ':voucher_id' => $id,
                ]);

                foreach ($transactions as $item) {
                    CreateVoucherAction::insertTransaction($this->db, $item, $id);
                }
            }

            // fetch a list of the previous attachment IDs. when we iterate over
            // the request body we will take note of which attachments are still
            // around and remove them from this list.
            //
            // anything that is still left in this list should be deleted from
            // the database.
            $previousAttachmentIds = array_map(
                fn (array $row) => (int)$row['attachment_id'],
                $this->db->selectAll(static::SQL_GET_ATTACHMENT_IDS, [':voucher_id' => $id])
            );

            foreach ($body['attachments'] ?? [] as $index => $item) {
                $attachmentId = $item['attachment_id'] ?? null;

                if ($attachmentId === null) {
                    $attachmentId = CreateVoucherAction::insertAttachment($this->db, $item, $id);
                    $body['attachments'][$index]['attachment_id'] = $attachmentId;
                    unset($body['attachments'][$index]['data']);
                } else {
                    $indexOfPreviousAttachmentId = array_search((int)$attachmentId, $previousAttachmentIds, true);

                    if ($indexOfPreviousAttachmentId === false) {
                        throw new InvalidArgumentException(
                            "Attachment with ID '$attachmentId' does not exist."
                        );
                    }

                    unset($previousAttachmentIds[$indexOfPreviousAttachmentId]);
                }
            }

            if ($previousAttachmentIds) {
                $questionMarks = implode(', ', array_fill(0, count($previousAttachmentIds), '?'));
                $this->db->execute(
                    "DELETE FROM attachment WHERE attachment_id IN ($questionMarks)",
                    $previousAttachmentIds
                );
            }

            return new JsonResponse($body, Response::HTTP_OK);
        });
    }
}
