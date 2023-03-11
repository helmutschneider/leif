<?php declare(strict_types=1);

namespace Leif\Tests;

use Leif\Validator;

final class ValidatorTest extends TestCase
{
    public function validateProvider()
    {
        return [

            'required: missing key' => [
                [
                    'thing' => 'required',
                ],
                [],
                1,
            ],
            'required: key not missing' => [
                [
                    'thing' => 'required',
                ],
                [
                    'thing' => 'yee',
                ],
                0,
            ],
            'required: missing deep key' => [
                [
                    'thing' => 'required',
                    'thing.yee' => 'required',
                    'thing.yee.boi' => 'required',
                ],
                [
                    'thing' => [],
                ],
                2,
            ],
            'required: deep key not missing' => [
                [
                    'thing' => 'required',
                    'thing.yee' => 'required',
                    'thing.yee.boi' => 'required',
                ],
                [
                    'thing' => [
                        'yee' => [
                            'boi' => 1,
                        ],
                    ],
                ],
                0,
            ],
            'required: deep wildcard key with missing value' => [
                [
                    'thing.*.yee' => 'required',
                ],
                [
                    'thing' => [
                        [
                            'yee' => 'boi'
                        ],
                        [
                            // nothing here!
                        ],
                    ],
                ],
                1,
            ],
            'required: deep wildcard key with value' => [
                [
                    'thing.*.yee' => 'required',
                ],
                [
                    'thing' => [
                        [
                            'yee' => 'boi'
                        ],
                        [
                            'yee' => 'bro',
                        ],
                    ],
                ],
                0,
            ],
            'integer: allows integer-like strings' => [
                [
                    'thing' => 'integer',
                ],
                [
                    'thing' => '123'
                ],
                0,
            ],
            'integer: integer value' => [
                [
                    'thing' => 'integer',
                ],
                [
                    'thing' => 123,
                ],
                0,
            ],
            'integer: rejects non-integer value' => [
                [
                    'thing' => 'integer',
                ],
                [
                    'thing' => 'bruh!',
                ],
                1,
            ],
            'string: null value' => [
                [
                    'thing' => 'string',
                ],
                [
                    'thing' => null,
                ],
                1,
            ],
            'string: string value' => [
                [
                    'thing' => 'string',
                ],
                [
                    'thing' => 'yee',
                ],
                0,
            ],
            'date_format: invalid date' => [
                [
                    'thing' => 'date_format:Y-m-d',
                ],
                [
                    'thing' => 'yee!',
                ],
                1,
            ],
            'date_format: correct date' => [
                [
                    'thing' => 'date_format:Y-m-d',
                ],
                [
                    'thing' => '2021-01-01',
                ],
                0,
            ],
            'date_format: correct date with time' => [
                [
                    'thing' => 'date_format:Y-m-d H\\:i\\:s',
                ],
                [
                    'thing' => '2021-01-01 06:30:30',
                ],
                0,
            ],
            'boolean: non bool' => [
                [
                    'thing' => 'boolean',
                ],
                [
                    'thing' => 'yee',
                ],
                1,
            ],
            'boolean: true boolean' => [
                [
                    'thing' => 'boolean',
                ],
                [
                    'thing' => true,
                ],
                0,
            ],
            'boolean: bool-like string' => [
                [
                    'thing' => 'boolean',
                ],
                [
                    'thing' => '0',
                ],
                0,
            ],
            'array: non-array' => [
                [
                    'thing' => 'array',
                ],
                [
                    'thing' => 'yee!',
                ],
                1,
            ],
            'array: value is array' => [
                [
                    'thing' => 'array',
                ],
                [
                    'thing' => [1, 2, 3],
                ],
                0,
            ],
            'composite: required + string with integer value' => [
                [
                    'thing' => 'required|string',
                ],
                [
                    'thing' => 123,
                ],
                1,
            ],
            'composite: required + string with string value' => [
                [
                    'thing' => 'required|string',
                ],
                [
                    'thing' => 'yee',
                ],
                0,
            ],

            'nullable: does nothing when combined with a regular rule' => [
                [
                    'thing' => 'int|null',
                ],
                [
                    'thing' => 123,
                ],
                0,
            ],
            'nullable: allows null' => [
                [
                    'thing' => 'int|null',
                ],
                [
                    'thing' => null,
                ],
                0,
            ],
            'nullable: fails when neither of the rules apply' => [
                [
                    'thing' => 'int|null',
                ],
                [
                    'thing' => 'yee!',
                ],
                1,
            ],
            'nullable: allows null for some properties only' => [
                [
                    'yee.*.bro' => 'int|null',
                ],
                [
                    'yee' => [
                        [
                            'bro' => 1,
                        ],
                        [
                            'bro' => null,
                        ],
                    ],
                ],
                0,
            ],
            'nullable: allows null for some properties only but fails for invalid things' => [
                [
                    'yee.*.bro' => 'int|null',
                ],
                [
                    'yee' => [
                        [
                            'bro' => 1,
                        ],
                        [
                            'bro' => null,
                        ],
                        [
                            'bro' => 'yee!'
                        ]
                    ],
                ],
                1,
            ],
            'null allows null string' => [
                [
                    'yee.*.bro' => 'required|string|null',
                ],
                [
                    'yee' => [
                        [
                            'bro' => 'dude',
                        ],
                        [
                            'bro' => null,
                        ],
                    ],
                ],
                0,
            ],
            'min fails with empty string' => [
                [
                    'yee' => 'string|min:1',
                ],
                [
                    'yee' => '',
                ],
                1,
            ],
            'min success with a string of correct length' => [
                [
                    'yee' => 'string|min:1',
                ],
                [
                    'yee' => 'yee!',
                ],
                0,
            ],
            'min does nothing without value' => [
                [
                    'yee' => 'string|min:1',
                ],
                [],
                0,
            ],
            'max succeeds with empty string' => [
                [
                    'yee' => 'string|max:1',
                ],
                [
                    'yee' => '',
                ],
                0,
            ],
            'max success with a string of correct length' => [
                [
                    'yee' => 'string|max:3',
                ],
                [
                    'yee' => 'yee',
                ],
                0,
            ],
            'max fails with a too long string' => [
                [
                    'yee' => 'string|max:3',
                ],
                [
                    'yee' => 'yee!',
                ],
                1,
            ],
            'max does nothing without value' => [
                [
                    'yee' => 'string|max:1',
                ],
                [],
                0,
            ],
            'numeric fails with string' => [
                [
                    'yee' => 'numeric',
                ],
                [
                    'yee' => 'bruh',
                ],
                1
            ],
            'numeric succeeds with numeric string' => [
                [
                    'yee' => 'numeric',
                ],
                [
                    'yee' => '1.5',
                ],
                0
            ],
        ];
    }

    /**
     * @dataProvider validateProvider
     *
     * @param array $rules
     * @param array $data
     * @param int $expectedErrors
     * @return void
     */
    public function testValidatesCorrectly(array $rules, array $data, int $expectedErrors): void
    {
        $validator = new Validator($rules);
        $result = $validator->validate($data);

        $this->assertCount($expectedErrors, $result->getAllErrors());

        if ($expectedErrors !== $result->getErrorCount()) {
            var_dump($result->getAllErrors());
        }
    }

    public function testFlatten()
    {
        $stuff = Validator::flatten([
            'a' => [
                0 => ['yee', 'boi'],
                1 => [
                    'my' => 'dude',
                ],
            ],
        ]);

        $this->assertArrayHasKey('a', $stuff);
        $this->assertArrayHasKey('a.0', $stuff);

        $this->assertArrayHasKey('a.0.0', $stuff);
        $this->assertSame('yee', $stuff['a.0.0']);

        $this->assertArrayHasKey('a.0.1', $stuff);
        $this->assertSame('boi', $stuff['a.0.1']);

        $this->assertArrayHasKey('a.1', $stuff);
        $this->assertArrayHasKey('a.1.my', $stuff);
        $this->assertSame('dude', $stuff['a.1.my']);
    }
}
