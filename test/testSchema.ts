import { AbiRoot } from "../src";

// TODO for some reason the TS json module resolver fails to match exact patterns for types
// TODO which in this case fails for "type" field.
export const testSchema: AbiRoot = {
  "schema_version": "0.1.0",
  "metadata": {
    "name": "abi",
    "version": "0.1.0",
    "authors": [
      "Near Inc <hello@nearprotocol.com>"
    ]
  },
  "body": {
    "functions": [
      {
        "name": "add",
        "doc": " Adds two pairs point-wise.",
        "is_view": true,
        "params": [

          {
            "name": "a",
            "serialization_type": "json",
            "type_schema": {
              "$ref": "#/definitions/Pair"
            }
          },
          {
            "name": "b",
            "serialization_type": "json",
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
        ],
        "result": {
          "serialization_type": "json",
          "type_schema": {
            "$ref": "#/definitions/Pair"
          }
        }
      },
      {
        "name": "add_borsh",
        "is_view": true,
        "params": [
          {
            "name": "a",
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
          },
          {
            "name": "b",
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
        ],
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
        "is_view": true,
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
      },
      {
        "name": "no_params",
        "is_view": true,
        "result": {
          "serialization_type": "json",
          "type_schema": {
            "type": "object",
            "additionalProperties": {
              "type": "integer",
              "format": "uint64",
              "minimum": 0.0
            }
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
};