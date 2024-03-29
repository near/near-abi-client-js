import { AbiRoot } from "../src";

// TODO for some reason the TS json module resolver fails to match exact patterns for types
// TODO which in this case fails for "type" field.
let rawSchema = `{
  "schema_version": "0.3.0",
  "metadata": {
    "name": "adder",
    "version": "0.1.0",
    "authors": [
      "Near Inc <hello@nearprotocol.com>"
    ],
    "build": {
      "compiler": "rustc 1.64.0",
      "builder": "cargo-near 0.3.0"
    },
    "wasm_hash": "J7WdfLnWv4ibDytmMGnrmpqwA7h2hmgwJum1o56ut4RD"
  },
  "body": {
    "functions": [
      {
        "name": "add",
        "doc": " Adds two pairs point-wise.",
        "kind": "view",
        "params": {
          "serialization_type": "json",
          "args": [
            {
              "name": "a",
              "type_schema": {
                "$ref": "#/definitions/Pair"
              }
            },
            {
              "name": "b",
              "type_schema": {
                "$ref": "#/definitions/Pair"
              }
            },
            {
              "name": "c",
              "serialization_type": "json",
              "type_schema": {
                "type": "integer",
                "format": "uint8",
                "minimum": 0.0
              }
            }
          ]
        },
        "result": {
          "serialization_type": "json",
          "type_schema": {
            "$ref": "#/definitions/Pair"
          }
        }
      },
      {
        "name": "add_borsh",
        "kind": "view",
        "params": {
          "serialization_type": "borsh",
          "args": [
            {
              "name": "a",
              "type_schema": {
                "declaration": "Pair",
                "definitions": {
                  "Pair": {
                    "Struct": [
                      "u32",
                      "u32"
                    ]
                  }
                }
              }
            },
            {
              "name": "b",
              "type_schema": {
                "declaration": "Pair",
                "definitions": {
                  "Pair": {
                    "Struct": [
                      "u32",
                      "u32"
                    ]
                  }
                }
              }
            }
          ]
        },
        "result": {
          "serialization_type": "borsh",
          "type_schema": {
            "declaration": "Pair",
            "definitions": {
              "Pair": {
                "Struct": [
                  "u32",
                  "u32"
                ]
              }
            }
          }
        }
      },
      {
        "name": "add_callback",
        "kind": "view",
        "callbacks": [
          {
            "serialization_type": "json",
            "type_schema": {
              "$ref": "#/definitions/DoublePair"
            }
          },
          {
            "serialization_type": "json",
            "type_schema": {
              "$ref": "#/definitions/DoublePair"
            }
          }
        ],
        "callbacks_vec": {
          "serialization_type": "json",
          "type_schema": {
            "$ref": "#/definitions/DoublePair"
          }
        },
        "result": {
          "serialization_type": "json",
          "type_schema": {
            "$ref": "#/definitions/DoublePair"
          }
        }
      }
    ],
    "root_schema": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "String",
      "type": "string",
      "definitions": {
        "DoublePair": {
          "type": "object",
          "required": [
            "first",
            "second"
          ],
          "properties": {
            "first": {
              "$ref": "#/definitions/Pair"
            },
            "second": {
              "$ref": "#/definitions/Pair"
            }
          }
        },
        "Pair": {
          "type": "array",
          "items": [
            {
              "type": "integer",
              "format": "uint32",
              "minimum": 0.0
            },
            {
              "type": "integer",
              "format": "uint32",
              "minimum": 0.0
            }
          ],
          "maxItems": 2,
          "minItems": 2
        }
      }
    }
  }
}`;

export const testSchema: AbiRoot = JSON.parse(rawSchema);
