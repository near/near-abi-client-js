import { ABI } from "../src";

// TODO for some reason the TS json module resolver fails to match exact patterns for types
// TODO which in this case fails for "type" field.
export const testSchema: ABI = {
	"abi_schema_version": "0.1.0",
	"metadata": {
	  "name": "abi",
	  "version": "0.1.0",
	  "authors": [
		"Near Inc <hello@nearprotocol.com>"
	  ]
	},
	"abi": {
	  "functions": [
		{
		  "name": "add",
		  "is_view": true,
		  "params": [
			{
			  "name": "a",
			  "type_schema": {
				"$ref": "#/definitions/Pair"
			  },
			  "serialization_type": "json"
			},
			{
			  "name": "b",
			  "type_schema": {
				"$ref": "#/definitions/Pair"
			  },
			  "serialization_type": "json"
			},
			{
			  "name": "c",
			  "type_schema": {
				"type": "integer",
				"format": "uint8",
				"minimum": 0.0
			  },
			  "serialization_type": "json"
			}
		  ],
		  "result": {
			"type_schema": {
			  "$ref": "#/definitions/Pair"
			},
			"serialization_type": "json"
		  }
		},
		{
		  "name": "add_callback",
		  "is_view": true,
		  "callbacks": [
			{
			  "type_schema": {
				"$ref": "#/definitions/DoublePair"
			  },
			  "serialization_type": "json"
			},
			{
			  "type_schema": {
				"$ref": "#/definitions/DoublePair"
			  },
			  "serialization_type": "json"
			}
		  ],
		  "callbacks_vec": {
			"type_schema": {
			  "type": "array",
			  "items": {
				"$ref": "#/definitions/DoublePair"
			  }
			},
			"serialization_type": "json"
		  },
		  "result": {
			"type_schema": {
			  "$ref": "#/definitions/DoublePair"
			},
			"serialization_type": "json"
		  }
		},
		{
			"name": "no_params",
			"is_view": true,
			"result": {
			  "type_schema": {
				"type": "object",
				"additionalProperties": {
				  "type": "integer",
				  "format": "uint64",
				  "minimum": 0.0
				}
			  },
			  "serialization_type": "json"
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