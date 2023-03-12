<?php declare(strict_types=1);

namespace Leif\Api;

use Leif\Validator;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

trait ValidationTrait
{
    /**
     * Validates a request against the supplied rules. Returns null
     * if the request successfully validates or an error response
     * on failure.
     */
    public function validate(Request $request, array $rules): ?Response
    {
        $data = $request->toArray();
        $errors = (new Validator($rules))->validate($data);

        if ($errors->isValid()) {
            return null;
        }

        return new JsonResponse($errors->getAllErrors(), Response::HTTP_UNPROCESSABLE_ENTITY);
    }
}
