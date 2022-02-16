<?php
declare(strict_types=1);

/**
 * @var int[] $errors
 * @var string $username
 * @var string $password
 * @var string $workbookName
 */

$errorMap = [
    \Leif\Api\InstallAction::ERR_MISSING_USERNAME => 'Användarnamn saknas.',
    \Leif\Api\InstallAction::ERR_MISSING_PASSWORD => 'Lösenord saknas.',
    \Leif\Api\InstallAction::ERR_MISSING_WORKBOOK_NAME => 'Arbetsboken måste ha ett namn.',
];
?>

<div class="container">
    <div class="row justify-content-center">
        <div class="col-lg-4">
            <div class="text-center">
                <img class="m-3" style="border-radius: 50%; width: 25%" src="/leif.jpg" />
            </div>
            <h3>Installera Leif</h3>

            <?php if ($errors): ?>

            <div class="alert alert-danger" role="alert">
                <ul class="mb-0">
                    <?php foreach ($errors as $error): ?>
                    <li><?php echo $errorMap[$error]; ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>

            <?php endif; ?>

            <form method="POST" target="/install">
                <div class="mb-3">
                    <label class="form-label">Välj användarnamn</label>
                    <input
                            class="form-control form-control-lg"
                            placeholder="Användarnamn"
                            name="username"
                            type="text"
                            value="<?php echo $username; ?>"
                    />
                </div>
                <div class="mb-3">
                    <label class="form-label">Välj lösenord</label>
                    <input
                            class="form-control form-control-lg"
                            placeholder="Lösenord"
                            name="password"
                            type="password"
                            value="<?php echo $password; ?>"
                    />
                </div>
                <div class="mb-3">
                    <label class="form-label">Namn på din första arbetsbok</label>
                    <input
                            class="form-control form-control-lg"
                            placeholder="Bokföring <?php echo date('Y'); ?>"
                            name="workbook_name"
                            type="text"
                            value="<?php echo $workbookName; ?>"
                    />
                </div>
                <div class="d-grid">
                    <button class="btn btn-lg btn-primary">OK</button>
                </div>
            </form>
        </div>
    </div>
</div>
