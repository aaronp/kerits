var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  if (mod && typeof mod === "object" || typeof mod === "function") {
    for (let key of __getOwnPropNames(mod))
      if (!__hasOwnProp.call(to, key))
        __defProp(to, key, {
          get: __accessProp.bind(mod, key),
          enumerable: true
        });
  }
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};
var __esm = (fn, res, err) => () => {
  if (fn)
    try {
      res = fn(fn = 0);
    } catch (e) {
      err = [e];
    }
  if (err)
    throw err[0];
  return res;
};

// node_modules/json-canonicalize/bundles/index.umd.js
var require_index_umd = __commonJS(function(exports, module) {
  (function(global, factory) {
    typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.JsonCanonicalize = {}));
  })(exports, function(exports2) {
    var CircularRootPathName = "$";
    function _serialize(obj, options) {
      var buffer = "";
      var vInclude = options && options.include;
      var vExclude = options && options.exclude;
      if (vExclude) {
        if (typeof vExclude === "string")
          vExclude = [vExclude];
      }
      if (vInclude)
        vInclude.sort();
      var visited = new WeakMap;
      var allowCircular = options && options.allowCircular;
      var filterUndefined = options && options.filterUndefined;
      var undefinedInArrayToNull = options && options.undefinedInArrayToNull;
      serialize(obj, CircularRootPathName);
      return buffer;
      function serialize(object, path) {
        if (object === null || typeof object !== "object" || object.toJSON != null) {
          buffer += JSON.stringify(object);
        } else if (Array.isArray(object)) {
          var visitedPath = visited.get(object);
          if (visitedPath !== undefined) {
            if (path.startsWith(visitedPath)) {
              if (!allowCircular) {
                throw new Error("Circular reference detected");
              }
              buffer += '"[Circular:' + visitedPath + ']"';
              return;
            }
          }
          visited.set(object, path);
          buffer += "[";
          var next_1 = false;
          object.forEach(function(element, index) {
            if (next_1) {
              buffer += ",";
            }
            next_1 = true;
            if (undefinedInArrayToNull && element === undefined) {
              element = null;
            }
            serialize(element, path + "[" + index + "]");
          });
          buffer += "]";
        } else {
          var visitedPath = visited.get(object);
          if (visitedPath !== undefined) {
            if (path.startsWith(visitedPath)) {
              if (!allowCircular) {
                throw new Error("Circular reference detected");
              }
              buffer += '"[Circular:' + visitedPath + ']"';
              return;
            }
          }
          visited.set(object, path);
          buffer += "{";
          var next_2 = false;
          var addProp_1 = function(property) {
            if (vExclude && vExclude.includes(property)) {
              return;
            }
            if (next_2) {
              buffer += ",";
            }
            next_2 = true;
            buffer += JSON.stringify(property);
            buffer += ":";
            serialize(object[property], path + "." + property);
          };
          if (path === CircularRootPathName && vInclude) {
            vInclude.forEach(function(property) {
              if (object.hasOwnProperty(property)) {
                addProp_1(property);
              }
            });
          } else {
            var vKeys = Object.keys(object);
            if (filterUndefined) {
              vKeys = vKeys.filter(function(k) {
                return object[k] !== undefined;
              });
            }
            vKeys.sort();
            vKeys.forEach(function(property) {
              addProp_1(property);
            });
          }
          buffer += "}";
        }
      }
    }
    function canonicalize(obj, allowCircular) {
      return _serialize(obj, {
        allowCircular,
        filterUndefined: true,
        undefinedInArrayToNull: true
      });
    }
    function canonicalizeEx(obj, options) {
      return _serialize(obj, options);
    }
    exports2.canonicalize = canonicalize;
    exports2.canonicalizeEx = canonicalizeEx;
    Object.defineProperty(exports2, "__esModule", { value: true });
  });
});

// node_modules/@sinclair/typebox/build/esm/type/guard/value.mjs
function IsAsyncIterator(value) {
  return IsObject(value) && !IsArray(value) && !IsUint8Array(value) && Symbol.asyncIterator in value;
}
function IsArray(value) {
  return Array.isArray(value);
}
function IsBigInt(value) {
  return typeof value === "bigint";
}
function IsBoolean(value) {
  return typeof value === "boolean";
}
function IsDate(value) {
  return value instanceof globalThis.Date;
}
function IsFunction(value) {
  return typeof value === "function";
}
function IsIterator(value) {
  return IsObject(value) && !IsArray(value) && !IsUint8Array(value) && Symbol.iterator in value;
}
function IsNull(value) {
  return value === null;
}
function IsNumber(value) {
  return typeof value === "number";
}
function IsObject(value) {
  return typeof value === "object" && value !== null;
}
function IsRegExp(value) {
  return value instanceof globalThis.RegExp;
}
function IsString(value) {
  return typeof value === "string";
}
function IsSymbol(value) {
  return typeof value === "symbol";
}
function IsUint8Array(value) {
  return value instanceof globalThis.Uint8Array;
}
function IsUndefined(value) {
  return value === undefined;
}

// node_modules/@sinclair/typebox/build/esm/type/clone/value.mjs
function ArrayType(value) {
  return value.map((value) => Visit(value));
}
function DateType(value) {
  return new Date(value.getTime());
}
function Uint8ArrayType(value) {
  return new Uint8Array(value);
}
function RegExpType(value) {
  return new RegExp(value.source, value.flags);
}
function ObjectType(value) {
  const result = {};
  for (const key of Object.getOwnPropertyNames(value)) {
    result[key] = Visit(value[key]);
  }
  for (const key of Object.getOwnPropertySymbols(value)) {
    result[key] = Visit(value[key]);
  }
  return result;
}
function Visit(value) {
  return IsArray(value) ? ArrayType(value) : IsDate(value) ? DateType(value) : IsUint8Array(value) ? Uint8ArrayType(value) : IsRegExp(value) ? RegExpType(value) : IsObject(value) ? ObjectType(value) : value;
}
function Clone(value) {
  return Visit(value);
}
var init_value = () => {};

// node_modules/@sinclair/typebox/build/esm/type/clone/type.mjs
function CloneType(schema, options) {
  return options === undefined ? Clone(schema) : Clone({ ...options, ...schema });
}
var init_type = __esm(() => {
  init_value();
});

// node_modules/@sinclair/typebox/build/esm/type/clone/index.mjs
var init_clone = __esm(() => {
  init_type();
  init_value();
});

// node_modules/@sinclair/typebox/build/esm/value/guard/guard.mjs
function IsAsyncIterator2(value) {
  return IsObject2(value) && globalThis.Symbol.asyncIterator in value;
}
function IsIterator2(value) {
  return IsObject2(value) && globalThis.Symbol.iterator in value;
}
function IsPromise(value) {
  return value instanceof globalThis.Promise;
}
function IsDate2(value) {
  return value instanceof Date && globalThis.Number.isFinite(value.getTime());
}
function IsUint8Array2(value) {
  return value instanceof globalThis.Uint8Array;
}
function IsObject2(value) {
  return value !== null && typeof value === "object";
}
function IsArray2(value) {
  return globalThis.Array.isArray(value) && !globalThis.ArrayBuffer.isView(value);
}
function IsUndefined2(value) {
  return value === undefined;
}
function IsNull2(value) {
  return value === null;
}
function IsBoolean2(value) {
  return typeof value === "boolean";
}
function IsNumber2(value) {
  return typeof value === "number";
}
function IsInteger(value) {
  return globalThis.Number.isInteger(value);
}
function IsBigInt2(value) {
  return typeof value === "bigint";
}
function IsString2(value) {
  return typeof value === "string";
}
function IsFunction2(value) {
  return typeof value === "function";
}
function IsSymbol2(value) {
  return typeof value === "symbol";
}

// node_modules/@sinclair/typebox/build/esm/value/guard/index.mjs
var init_guard = () => {};

// node_modules/@sinclair/typebox/build/esm/system/policy.mjs
var TypeSystemPolicy;
var init_policy = __esm(() => {
  init_guard();
  (function(TypeSystemPolicy) {
    TypeSystemPolicy.InstanceMode = "default";
    TypeSystemPolicy.ExactOptionalPropertyTypes = false;
    TypeSystemPolicy.AllowArrayObject = false;
    TypeSystemPolicy.AllowNaN = false;
    TypeSystemPolicy.AllowNullVoid = false;
    function IsExactOptionalProperty(value, key) {
      return TypeSystemPolicy.ExactOptionalPropertyTypes ? key in value : value[key] !== undefined;
    }
    TypeSystemPolicy.IsExactOptionalProperty = IsExactOptionalProperty;
    function IsObjectLike(value) {
      const isObject = IsObject2(value);
      return TypeSystemPolicy.AllowArrayObject ? isObject : isObject && !IsArray2(value);
    }
    TypeSystemPolicy.IsObjectLike = IsObjectLike;
    function IsRecordLike(value) {
      return IsObjectLike(value) && !(value instanceof Date) && !(value instanceof Uint8Array);
    }
    TypeSystemPolicy.IsRecordLike = IsRecordLike;
    function IsNumberLike(value) {
      return TypeSystemPolicy.AllowNaN ? IsNumber2(value) : Number.isFinite(value);
    }
    TypeSystemPolicy.IsNumberLike = IsNumberLike;
    function IsVoidLike(value) {
      const isUndefined = IsUndefined2(value);
      return TypeSystemPolicy.AllowNullVoid ? isUndefined || value === null : isUndefined;
    }
    TypeSystemPolicy.IsVoidLike = IsVoidLike;
  })(TypeSystemPolicy || (TypeSystemPolicy = {}));
});

// node_modules/@sinclair/typebox/build/esm/type/create/immutable.mjs
function ImmutableArray(value) {
  return globalThis.Object.freeze(value).map((value) => Immutable(value));
}
function ImmutableDate(value) {
  return value;
}
function ImmutableUint8Array(value) {
  return value;
}
function ImmutableRegExp(value) {
  return value;
}
function ImmutableObject(value) {
  const result = {};
  for (const key of Object.getOwnPropertyNames(value)) {
    result[key] = Immutable(value[key]);
  }
  for (const key of Object.getOwnPropertySymbols(value)) {
    result[key] = Immutable(value[key]);
  }
  return globalThis.Object.freeze(result);
}
function Immutable(value) {
  return IsArray(value) ? ImmutableArray(value) : IsDate(value) ? ImmutableDate(value) : IsUint8Array(value) ? ImmutableUint8Array(value) : IsRegExp(value) ? ImmutableRegExp(value) : IsObject(value) ? ImmutableObject(value) : value;
}
var init_immutable = () => {};

// node_modules/@sinclair/typebox/build/esm/type/create/type.mjs
function CreateType(schema, options) {
  const result = options !== undefined ? { ...options, ...schema } : schema;
  switch (TypeSystemPolicy.InstanceMode) {
    case "freeze":
      return Immutable(result);
    case "clone":
      return Clone(result);
    default:
      return result;
  }
}
var init_type2 = __esm(() => {
  init_policy();
  init_immutable();
  init_value();
});

// node_modules/@sinclair/typebox/build/esm/type/create/index.mjs
var init_create = __esm(() => {
  init_type2();
});

// node_modules/@sinclair/typebox/build/esm/type/error/error.mjs
var TypeBoxError;
var init_error = __esm(() => {
  TypeBoxError = class TypeBoxError extends Error {
    constructor(message) {
      super(message);
    }
  };
});

// node_modules/@sinclair/typebox/build/esm/type/error/index.mjs
var init_error2 = __esm(() => {
  init_error();
});

// node_modules/@sinclair/typebox/build/esm/type/symbols/symbols.mjs
var TransformKind, ReadonlyKind, OptionalKind, Hint, Kind;
var init_symbols = __esm(() => {
  TransformKind = Symbol.for("TypeBox.Transform");
  ReadonlyKind = Symbol.for("TypeBox.Readonly");
  OptionalKind = Symbol.for("TypeBox.Optional");
  Hint = Symbol.for("TypeBox.Hint");
  Kind = Symbol.for("TypeBox.Kind");
});

// node_modules/@sinclair/typebox/build/esm/type/symbols/index.mjs
var init_symbols2 = __esm(() => {
  init_symbols();
});

// node_modules/@sinclair/typebox/build/esm/type/guard/kind.mjs
function IsReadonly(value) {
  return IsObject(value) && value[ReadonlyKind] === "Readonly";
}
function IsOptional(value) {
  return IsObject(value) && value[OptionalKind] === "Optional";
}
function IsAny(value) {
  return IsKindOf(value, "Any");
}
function IsArgument(value) {
  return IsKindOf(value, "Argument");
}
function IsArray3(value) {
  return IsKindOf(value, "Array");
}
function IsAsyncIterator3(value) {
  return IsKindOf(value, "AsyncIterator");
}
function IsBigInt3(value) {
  return IsKindOf(value, "BigInt");
}
function IsBoolean3(value) {
  return IsKindOf(value, "Boolean");
}
function IsComputed(value) {
  return IsKindOf(value, "Computed");
}
function IsConstructor(value) {
  return IsKindOf(value, "Constructor");
}
function IsDate3(value) {
  return IsKindOf(value, "Date");
}
function IsFunction3(value) {
  return IsKindOf(value, "Function");
}
function IsInteger2(value) {
  return IsKindOf(value, "Integer");
}
function IsIntersect(value) {
  return IsKindOf(value, "Intersect");
}
function IsIterator3(value) {
  return IsKindOf(value, "Iterator");
}
function IsKindOf(value, kind) {
  return IsObject(value) && Kind in value && value[Kind] === kind;
}
function IsLiteralValue(value) {
  return IsBoolean(value) || IsNumber(value) || IsString(value);
}
function IsLiteral(value) {
  return IsKindOf(value, "Literal");
}
function IsMappedKey(value) {
  return IsKindOf(value, "MappedKey");
}
function IsMappedResult(value) {
  return IsKindOf(value, "MappedResult");
}
function IsNever(value) {
  return IsKindOf(value, "Never");
}
function IsNot(value) {
  return IsKindOf(value, "Not");
}
function IsNull3(value) {
  return IsKindOf(value, "Null");
}
function IsNumber3(value) {
  return IsKindOf(value, "Number");
}
function IsObject3(value) {
  return IsKindOf(value, "Object");
}
function IsPromise2(value) {
  return IsKindOf(value, "Promise");
}
function IsRecord(value) {
  return IsKindOf(value, "Record");
}
function IsRef(value) {
  return IsKindOf(value, "Ref");
}
function IsRegExp2(value) {
  return IsKindOf(value, "RegExp");
}
function IsString3(value) {
  return IsKindOf(value, "String");
}
function IsSymbol3(value) {
  return IsKindOf(value, "Symbol");
}
function IsTemplateLiteral(value) {
  return IsKindOf(value, "TemplateLiteral");
}
function IsThis(value) {
  return IsKindOf(value, "This");
}
function IsTransform(value) {
  return IsObject(value) && TransformKind in value;
}
function IsTuple(value) {
  return IsKindOf(value, "Tuple");
}
function IsUndefined3(value) {
  return IsKindOf(value, "Undefined");
}
function IsUnion(value) {
  return IsKindOf(value, "Union");
}
function IsUint8Array3(value) {
  return IsKindOf(value, "Uint8Array");
}
function IsUnknown(value) {
  return IsKindOf(value, "Unknown");
}
function IsUnsafe(value) {
  return IsKindOf(value, "Unsafe");
}
function IsVoid(value) {
  return IsKindOf(value, "Void");
}
function IsKind(value) {
  return IsObject(value) && Kind in value && IsString(value[Kind]);
}
function IsSchema(value) {
  return IsAny(value) || IsArgument(value) || IsArray3(value) || IsBoolean3(value) || IsBigInt3(value) || IsAsyncIterator3(value) || IsComputed(value) || IsConstructor(value) || IsDate3(value) || IsFunction3(value) || IsInteger2(value) || IsIntersect(value) || IsIterator3(value) || IsLiteral(value) || IsMappedKey(value) || IsMappedResult(value) || IsNever(value) || IsNot(value) || IsNull3(value) || IsNumber3(value) || IsObject3(value) || IsPromise2(value) || IsRecord(value) || IsRef(value) || IsRegExp2(value) || IsString3(value) || IsSymbol3(value) || IsTemplateLiteral(value) || IsThis(value) || IsTuple(value) || IsUndefined3(value) || IsUnion(value) || IsUint8Array3(value) || IsUnknown(value) || IsUnsafe(value) || IsVoid(value) || IsKind(value);
}
var init_kind = __esm(() => {
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/guard/type.mjs
function IsPattern(value) {
  try {
    new RegExp(value);
    return true;
  } catch {
    return false;
  }
}
function IsControlCharacterFree(value) {
  if (!IsString(value))
    return false;
  for (let i = 0;i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code >= 7 && code <= 13 || code === 27 || code === 127) {
      return false;
    }
  }
  return true;
}
function IsAdditionalProperties(value) {
  return IsOptionalBoolean(value) || IsSchema2(value);
}
function IsOptionalBigInt(value) {
  return IsUndefined(value) || IsBigInt(value);
}
function IsOptionalNumber(value) {
  return IsUndefined(value) || IsNumber(value);
}
function IsOptionalBoolean(value) {
  return IsUndefined(value) || IsBoolean(value);
}
function IsOptionalString(value) {
  return IsUndefined(value) || IsString(value);
}
function IsOptionalPattern(value) {
  return IsUndefined(value) || IsString(value) && IsControlCharacterFree(value) && IsPattern(value);
}
function IsOptionalFormat(value) {
  return IsUndefined(value) || IsString(value) && IsControlCharacterFree(value);
}
function IsOptionalSchema(value) {
  return IsUndefined(value) || IsSchema2(value);
}
function IsOptional2(value) {
  return IsObject(value) && value[OptionalKind] === "Optional";
}
function IsAny2(value) {
  return IsKindOf2(value, "Any") && IsOptionalString(value.$id);
}
function IsArgument2(value) {
  return IsKindOf2(value, "Argument") && IsNumber(value.index);
}
function IsArray4(value) {
  return IsKindOf2(value, "Array") && value.type === "array" && IsOptionalString(value.$id) && IsSchema2(value.items) && IsOptionalNumber(value.minItems) && IsOptionalNumber(value.maxItems) && IsOptionalBoolean(value.uniqueItems) && IsOptionalSchema(value.contains) && IsOptionalNumber(value.minContains) && IsOptionalNumber(value.maxContains);
}
function IsAsyncIterator4(value) {
  return IsKindOf2(value, "AsyncIterator") && value.type === "AsyncIterator" && IsOptionalString(value.$id) && IsSchema2(value.items);
}
function IsBigInt4(value) {
  return IsKindOf2(value, "BigInt") && value.type === "bigint" && IsOptionalString(value.$id) && IsOptionalBigInt(value.exclusiveMaximum) && IsOptionalBigInt(value.exclusiveMinimum) && IsOptionalBigInt(value.maximum) && IsOptionalBigInt(value.minimum) && IsOptionalBigInt(value.multipleOf);
}
function IsBoolean4(value) {
  return IsKindOf2(value, "Boolean") && value.type === "boolean" && IsOptionalString(value.$id);
}
function IsComputed2(value) {
  return IsKindOf2(value, "Computed") && IsString(value.target) && IsArray(value.parameters) && value.parameters.every((schema) => IsSchema2(schema));
}
function IsConstructor2(value) {
  return IsKindOf2(value, "Constructor") && value.type === "Constructor" && IsOptionalString(value.$id) && IsArray(value.parameters) && value.parameters.every((schema) => IsSchema2(schema)) && IsSchema2(value.returns);
}
function IsDate4(value) {
  return IsKindOf2(value, "Date") && value.type === "Date" && IsOptionalString(value.$id) && IsOptionalNumber(value.exclusiveMaximumTimestamp) && IsOptionalNumber(value.exclusiveMinimumTimestamp) && IsOptionalNumber(value.maximumTimestamp) && IsOptionalNumber(value.minimumTimestamp) && IsOptionalNumber(value.multipleOfTimestamp);
}
function IsFunction4(value) {
  return IsKindOf2(value, "Function") && value.type === "Function" && IsOptionalString(value.$id) && IsArray(value.parameters) && value.parameters.every((schema) => IsSchema2(schema)) && IsSchema2(value.returns);
}
function IsInteger3(value) {
  return IsKindOf2(value, "Integer") && value.type === "integer" && IsOptionalString(value.$id) && IsOptionalNumber(value.exclusiveMaximum) && IsOptionalNumber(value.exclusiveMinimum) && IsOptionalNumber(value.maximum) && IsOptionalNumber(value.minimum) && IsOptionalNumber(value.multipleOf);
}
function IsProperties(value) {
  return IsObject(value) && Object.entries(value).every(([key, schema]) => IsControlCharacterFree(key) && IsSchema2(schema));
}
function IsIntersect2(value) {
  return IsKindOf2(value, "Intersect") && (IsString(value.type) && value.type !== "object" ? false : true) && IsArray(value.allOf) && value.allOf.every((schema) => IsSchema2(schema) && !IsTransform2(schema)) && IsOptionalString(value.type) && (IsOptionalBoolean(value.unevaluatedProperties) || IsOptionalSchema(value.unevaluatedProperties)) && IsOptionalString(value.$id);
}
function IsIterator4(value) {
  return IsKindOf2(value, "Iterator") && value.type === "Iterator" && IsOptionalString(value.$id) && IsSchema2(value.items);
}
function IsKindOf2(value, kind) {
  return IsObject(value) && Kind in value && value[Kind] === kind;
}
function IsLiteralString(value) {
  return IsLiteral2(value) && IsString(value.const);
}
function IsLiteralNumber(value) {
  return IsLiteral2(value) && IsNumber(value.const);
}
function IsLiteralBoolean(value) {
  return IsLiteral2(value) && IsBoolean(value.const);
}
function IsLiteral2(value) {
  return IsKindOf2(value, "Literal") && IsOptionalString(value.$id) && IsLiteralValue2(value.const);
}
function IsLiteralValue2(value) {
  return IsBoolean(value) || IsNumber(value) || IsString(value);
}
function IsMappedKey2(value) {
  return IsKindOf2(value, "MappedKey") && IsArray(value.keys) && value.keys.every((key) => IsNumber(key) || IsString(key));
}
function IsMappedResult2(value) {
  return IsKindOf2(value, "MappedResult") && IsProperties(value.properties);
}
function IsNever2(value) {
  return IsKindOf2(value, "Never") && IsObject(value.not) && Object.getOwnPropertyNames(value.not).length === 0;
}
function IsNot2(value) {
  return IsKindOf2(value, "Not") && IsSchema2(value.not);
}
function IsNull4(value) {
  return IsKindOf2(value, "Null") && value.type === "null" && IsOptionalString(value.$id);
}
function IsNumber4(value) {
  return IsKindOf2(value, "Number") && value.type === "number" && IsOptionalString(value.$id) && IsOptionalNumber(value.exclusiveMaximum) && IsOptionalNumber(value.exclusiveMinimum) && IsOptionalNumber(value.maximum) && IsOptionalNumber(value.minimum) && IsOptionalNumber(value.multipleOf);
}
function IsObject4(value) {
  return IsKindOf2(value, "Object") && value.type === "object" && IsOptionalString(value.$id) && IsProperties(value.properties) && IsAdditionalProperties(value.additionalProperties) && IsOptionalNumber(value.minProperties) && IsOptionalNumber(value.maxProperties);
}
function IsPromise3(value) {
  return IsKindOf2(value, "Promise") && value.type === "Promise" && IsOptionalString(value.$id) && IsSchema2(value.item);
}
function IsRecord2(value) {
  return IsKindOf2(value, "Record") && value.type === "object" && IsOptionalString(value.$id) && IsAdditionalProperties(value.additionalProperties) && IsObject(value.patternProperties) && ((schema) => {
    const keys = Object.getOwnPropertyNames(schema.patternProperties);
    return keys.length === 1 && IsPattern(keys[0]) && IsObject(schema.patternProperties) && IsSchema2(schema.patternProperties[keys[0]]);
  })(value);
}
function IsRef2(value) {
  return IsKindOf2(value, "Ref") && IsOptionalString(value.$id) && IsString(value.$ref);
}
function IsRegExp3(value) {
  return IsKindOf2(value, "RegExp") && IsOptionalString(value.$id) && IsString(value.source) && IsString(value.flags) && IsOptionalNumber(value.maxLength) && IsOptionalNumber(value.minLength);
}
function IsString4(value) {
  return IsKindOf2(value, "String") && value.type === "string" && IsOptionalString(value.$id) && IsOptionalNumber(value.minLength) && IsOptionalNumber(value.maxLength) && IsOptionalPattern(value.pattern) && IsOptionalFormat(value.format);
}
function IsSymbol4(value) {
  return IsKindOf2(value, "Symbol") && value.type === "symbol" && IsOptionalString(value.$id);
}
function IsTemplateLiteral2(value) {
  return IsKindOf2(value, "TemplateLiteral") && value.type === "string" && IsString(value.pattern) && value.pattern[0] === "^" && value.pattern[value.pattern.length - 1] === "$";
}
function IsThis2(value) {
  return IsKindOf2(value, "This") && IsOptionalString(value.$id) && IsString(value.$ref);
}
function IsTransform2(value) {
  return IsObject(value) && TransformKind in value;
}
function IsTuple2(value) {
  return IsKindOf2(value, "Tuple") && value.type === "array" && IsOptionalString(value.$id) && IsNumber(value.minItems) && IsNumber(value.maxItems) && value.minItems === value.maxItems && (IsUndefined(value.items) && IsUndefined(value.additionalItems) && value.minItems === 0 || IsArray(value.items) && value.items.every((schema) => IsSchema2(schema)));
}
function IsUndefined4(value) {
  return IsKindOf2(value, "Undefined") && value.type === "undefined" && IsOptionalString(value.$id);
}
function IsUnion2(value) {
  return IsKindOf2(value, "Union") && IsOptionalString(value.$id) && IsObject(value) && IsArray(value.anyOf) && value.anyOf.every((schema) => IsSchema2(schema));
}
function IsUint8Array4(value) {
  return IsKindOf2(value, "Uint8Array") && value.type === "Uint8Array" && IsOptionalString(value.$id) && IsOptionalNumber(value.minByteLength) && IsOptionalNumber(value.maxByteLength);
}
function IsUnknown2(value) {
  return IsKindOf2(value, "Unknown") && IsOptionalString(value.$id);
}
function IsUnsafe2(value) {
  return IsKindOf2(value, "Unsafe");
}
function IsVoid2(value) {
  return IsKindOf2(value, "Void") && value.type === "void" && IsOptionalString(value.$id);
}
function IsKind2(value) {
  return IsObject(value) && Kind in value && IsString(value[Kind]) && !KnownTypes.includes(value[Kind]);
}
function IsSchema2(value) {
  return IsObject(value) && (IsAny2(value) || IsArgument2(value) || IsArray4(value) || IsBoolean4(value) || IsBigInt4(value) || IsAsyncIterator4(value) || IsComputed2(value) || IsConstructor2(value) || IsDate4(value) || IsFunction4(value) || IsInteger3(value) || IsIntersect2(value) || IsIterator4(value) || IsLiteral2(value) || IsMappedKey2(value) || IsMappedResult2(value) || IsNever2(value) || IsNot2(value) || IsNull4(value) || IsNumber4(value) || IsObject4(value) || IsPromise3(value) || IsRecord2(value) || IsRef2(value) || IsRegExp3(value) || IsString4(value) || IsSymbol4(value) || IsTemplateLiteral2(value) || IsThis2(value) || IsTuple2(value) || IsUndefined4(value) || IsUnion2(value) || IsUint8Array4(value) || IsUnknown2(value) || IsUnsafe2(value) || IsVoid2(value) || IsKind2(value));
}
var KnownTypes;
var init_type3 = __esm(() => {
  init_symbols2();
  KnownTypes = [
    "Argument",
    "Any",
    "Array",
    "AsyncIterator",
    "BigInt",
    "Boolean",
    "Computed",
    "Constructor",
    "Date",
    "Enum",
    "Function",
    "Integer",
    "Intersect",
    "Iterator",
    "Literal",
    "MappedKey",
    "MappedResult",
    "Not",
    "Null",
    "Number",
    "Object",
    "Promise",
    "Record",
    "Ref",
    "RegExp",
    "String",
    "Symbol",
    "TemplateLiteral",
    "This",
    "Tuple",
    "Undefined",
    "Union",
    "Uint8Array",
    "Unknown",
    "Void"
  ];
});

// node_modules/@sinclair/typebox/build/esm/type/guard/index.mjs
var init_guard2 = __esm(() => {
  init_kind();
  init_type3();
});

// node_modules/@sinclair/typebox/build/esm/type/helpers/index.mjs
var init_helpers = () => {};

// node_modules/@sinclair/typebox/build/esm/type/patterns/patterns.mjs
var PatternBoolean = "(true|false)", PatternNumber = "(0|[1-9][0-9]*)", PatternString = "(.*)", PatternNever = "(?!.*)", PatternBooleanExact, PatternNumberExact, PatternStringExact, PatternNeverExact;
var init_patterns = __esm(() => {
  PatternBooleanExact = `^${PatternBoolean}$`;
  PatternNumberExact = `^${PatternNumber}$`;
  PatternStringExact = `^${PatternString}$`;
  PatternNeverExact = `^${PatternNever}$`;
});

// node_modules/@sinclair/typebox/build/esm/type/patterns/index.mjs
var init_patterns2 = __esm(() => {
  init_patterns();
});

// node_modules/@sinclair/typebox/build/esm/type/registry/format.mjs
function Has(format) {
  return map.has(format);
}
function Set2(format, func) {
  map.set(format, func);
}
function Get(format) {
  return map.get(format);
}
var map;
var init_format = __esm(() => {
  map = new Map;
});

// node_modules/@sinclair/typebox/build/esm/type/registry/type.mjs
function Has2(kind) {
  return map2.has(kind);
}
function Get2(kind) {
  return map2.get(kind);
}
var map2;
var init_type4 = __esm(() => {
  map2 = new Map;
});

// node_modules/@sinclair/typebox/build/esm/type/registry/index.mjs
var init_registry = __esm(() => {
  init_format();
  init_type4();
});

// node_modules/@sinclair/typebox/build/esm/type/sets/set.mjs
function SetIncludes(T, S) {
  return T.includes(S);
}
function SetDistinct(T) {
  return [...new Set(T)];
}
function SetIntersect(T, S) {
  return T.filter((L) => S.includes(L));
}
function SetIntersectManyResolve(T, Init) {
  return T.reduce((Acc, L) => {
    return SetIntersect(Acc, L);
  }, Init);
}
function SetIntersectMany(T) {
  return T.length === 1 ? T[0] : T.length > 1 ? SetIntersectManyResolve(T.slice(1), T[0]) : [];
}
function SetUnionMany(T) {
  const Acc = [];
  for (const L of T)
    Acc.push(...L);
  return Acc;
}

// node_modules/@sinclair/typebox/build/esm/type/sets/index.mjs
var init_sets = () => {};

// node_modules/@sinclair/typebox/build/esm/type/any/any.mjs
function Any(options) {
  return CreateType({ [Kind]: "Any" }, options);
}
var init_any = __esm(() => {
  init_create();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/any/index.mjs
var init_any2 = __esm(() => {
  init_any();
});

// node_modules/@sinclair/typebox/build/esm/type/array/array.mjs
function Array2(items, options) {
  return CreateType({ [Kind]: "Array", type: "array", items }, options);
}
var init_array = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/array/index.mjs
var init_array2 = __esm(() => {
  init_array();
});

// node_modules/@sinclair/typebox/build/esm/type/argument/argument.mjs
function Argument(index) {
  return CreateType({ [Kind]: "Argument", index });
}
var init_argument = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/argument/index.mjs
var init_argument2 = __esm(() => {
  init_argument();
});

// node_modules/@sinclair/typebox/build/esm/type/async-iterator/async-iterator.mjs
function AsyncIterator(items, options) {
  return CreateType({ [Kind]: "AsyncIterator", type: "AsyncIterator", items }, options);
}
var init_async_iterator = __esm(() => {
  init_symbols2();
  init_type2();
});

// node_modules/@sinclair/typebox/build/esm/type/async-iterator/index.mjs
var init_async_iterator2 = __esm(() => {
  init_async_iterator();
});

// node_modules/@sinclair/typebox/build/esm/type/computed/computed.mjs
function Computed(target, parameters, options) {
  return CreateType({ [Kind]: "Computed", target, parameters }, options);
}
var init_computed = __esm(() => {
  init_create();
  init_symbols();
});

// node_modules/@sinclair/typebox/build/esm/type/computed/index.mjs
var init_computed2 = __esm(() => {
  init_computed();
});

// node_modules/@sinclair/typebox/build/esm/type/discard/discard.mjs
function DiscardKey(value, key) {
  const { [key]: _, ...rest } = value;
  return rest;
}
function Discard(value, keys) {
  return keys.reduce((acc, key) => DiscardKey(acc, key), value);
}

// node_modules/@sinclair/typebox/build/esm/type/discard/index.mjs
var init_discard = () => {};

// node_modules/@sinclair/typebox/build/esm/type/never/never.mjs
function Never(options) {
  return CreateType({ [Kind]: "Never", not: {} }, options);
}
var init_never = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/never/index.mjs
var init_never2 = __esm(() => {
  init_never();
});

// node_modules/@sinclair/typebox/build/esm/type/mapped/mapped-key.mjs
var init_mapped_key = () => {};

// node_modules/@sinclair/typebox/build/esm/type/mapped/mapped-result.mjs
function MappedResult(properties) {
  return CreateType({
    [Kind]: "MappedResult",
    properties
  });
}
var init_mapped_result = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/constructor/constructor.mjs
function Constructor(parameters, returns, options) {
  return CreateType({ [Kind]: "Constructor", type: "Constructor", parameters, returns }, options);
}
var init_constructor = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/constructor/index.mjs
var init_constructor2 = __esm(() => {
  init_constructor();
});

// node_modules/@sinclair/typebox/build/esm/type/function/function.mjs
function Function(parameters, returns, options) {
  return CreateType({ [Kind]: "Function", type: "Function", parameters, returns }, options);
}
var init_function = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/function/index.mjs
var init_function2 = __esm(() => {
  init_function();
});

// node_modules/@sinclair/typebox/build/esm/type/union/union-create.mjs
function UnionCreate(T, options) {
  return CreateType({ [Kind]: "Union", anyOf: T }, options);
}
var init_union_create = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/union/union-evaluated.mjs
function IsUnionOptional(types) {
  return types.some((type) => IsOptional(type));
}
function RemoveOptionalFromRest(types) {
  return types.map((left) => IsOptional(left) ? RemoveOptionalFromType(left) : left);
}
function RemoveOptionalFromType(T) {
  return Discard(T, [OptionalKind]);
}
function ResolveUnion(types, options) {
  const isOptional = IsUnionOptional(types);
  return isOptional ? Optional(UnionCreate(RemoveOptionalFromRest(types), options)) : UnionCreate(RemoveOptionalFromRest(types), options);
}
function UnionEvaluated(T, options) {
  return T.length === 1 ? CreateType(T[0], options) : T.length === 0 ? Never(options) : ResolveUnion(T, options);
}
var init_union_evaluated = __esm(() => {
  init_type2();
  init_symbols2();
  init_discard();
  init_never2();
  init_optional2();
  init_union_create();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/union/union-type.mjs
var init_union_type = () => {};

// node_modules/@sinclair/typebox/build/esm/type/union/union.mjs
function Union(types, options) {
  return types.length === 0 ? Never(options) : types.length === 1 ? CreateType(types[0], options) : UnionCreate(types, options);
}
var init_union = __esm(() => {
  init_never2();
  init_type2();
  init_union_create();
});

// node_modules/@sinclair/typebox/build/esm/type/union/index.mjs
var init_union2 = __esm(() => {
  init_union_evaluated();
  init_union_type();
  init_union();
});

// node_modules/@sinclair/typebox/build/esm/type/template-literal/parse.mjs
function Unescape(pattern) {
  return pattern.replace(/\\\$/g, "$").replace(/\\\*/g, "*").replace(/\\\^/g, "^").replace(/\\\|/g, "|").replace(/\\\(/g, "(").replace(/\\\)/g, ")");
}
function IsNonEscaped(pattern, index, char) {
  return pattern[index] === char && pattern.charCodeAt(index - 1) !== 92;
}
function IsOpenParen(pattern, index) {
  return IsNonEscaped(pattern, index, "(");
}
function IsCloseParen(pattern, index) {
  return IsNonEscaped(pattern, index, ")");
}
function IsSeparator(pattern, index) {
  return IsNonEscaped(pattern, index, "|");
}
function IsGroup(pattern) {
  if (!(IsOpenParen(pattern, 0) && IsCloseParen(pattern, pattern.length - 1)))
    return false;
  let count = 0;
  for (let index = 0;index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      count += 1;
    if (IsCloseParen(pattern, index))
      count -= 1;
    if (count === 0 && index !== pattern.length - 1)
      return false;
  }
  return true;
}
function InGroup(pattern) {
  return pattern.slice(1, pattern.length - 1);
}
function IsPrecedenceOr(pattern) {
  let count = 0;
  for (let index = 0;index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      count += 1;
    if (IsCloseParen(pattern, index))
      count -= 1;
    if (IsSeparator(pattern, index) && count === 0)
      return true;
  }
  return false;
}
function IsPrecedenceAnd(pattern) {
  for (let index = 0;index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      return true;
  }
  return false;
}
function Or(pattern) {
  let [count, start] = [0, 0];
  const expressions = [];
  for (let index = 0;index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      count += 1;
    if (IsCloseParen(pattern, index))
      count -= 1;
    if (IsSeparator(pattern, index) && count === 0) {
      const range = pattern.slice(start, index);
      if (range.length > 0)
        expressions.push(TemplateLiteralParse(range));
      start = index + 1;
    }
  }
  const range = pattern.slice(start);
  if (range.length > 0)
    expressions.push(TemplateLiteralParse(range));
  if (expressions.length === 0)
    return { type: "const", const: "" };
  if (expressions.length === 1)
    return expressions[0];
  return { type: "or", expr: expressions };
}
function And(pattern) {
  function Group(value, index) {
    if (!IsOpenParen(value, index))
      throw new TemplateLiteralParserError(`TemplateLiteralParser: Index must point to open parens`);
    let count = 0;
    for (let scan = index;scan < value.length; scan++) {
      if (IsOpenParen(value, scan))
        count += 1;
      if (IsCloseParen(value, scan))
        count -= 1;
      if (count === 0)
        return [index, scan];
    }
    throw new TemplateLiteralParserError(`TemplateLiteralParser: Unclosed group parens in expression`);
  }
  function Range(pattern, index) {
    for (let scan = index;scan < pattern.length; scan++) {
      if (IsOpenParen(pattern, scan))
        return [index, scan];
    }
    return [index, pattern.length];
  }
  const expressions = [];
  for (let index = 0;index < pattern.length; index++) {
    if (IsOpenParen(pattern, index)) {
      const [start, end] = Group(pattern, index);
      const range = pattern.slice(start, end + 1);
      expressions.push(TemplateLiteralParse(range));
      index = end;
    } else {
      const [start, end] = Range(pattern, index);
      const range = pattern.slice(start, end);
      if (range.length > 0)
        expressions.push(TemplateLiteralParse(range));
      index = end - 1;
    }
  }
  return expressions.length === 0 ? { type: "const", const: "" } : expressions.length === 1 ? expressions[0] : { type: "and", expr: expressions };
}
function TemplateLiteralParse(pattern) {
  return IsGroup(pattern) ? TemplateLiteralParse(InGroup(pattern)) : IsPrecedenceOr(pattern) ? Or(pattern) : IsPrecedenceAnd(pattern) ? And(pattern) : { type: "const", const: Unescape(pattern) };
}
function TemplateLiteralParseExact(pattern) {
  return TemplateLiteralParse(pattern.slice(1, pattern.length - 1));
}
var TemplateLiteralParserError;
var init_parse = __esm(() => {
  init_error2();
  TemplateLiteralParserError = class TemplateLiteralParserError extends TypeBoxError {
  };
});

// node_modules/@sinclair/typebox/build/esm/type/template-literal/finite.mjs
function IsNumberExpression(expression) {
  return expression.type === "or" && expression.expr.length === 2 && expression.expr[0].type === "const" && expression.expr[0].const === "0" && expression.expr[1].type === "const" && expression.expr[1].const === "[1-9][0-9]*";
}
function IsBooleanExpression(expression) {
  return expression.type === "or" && expression.expr.length === 2 && expression.expr[0].type === "const" && expression.expr[0].const === "true" && expression.expr[1].type === "const" && expression.expr[1].const === "false";
}
function IsStringExpression(expression) {
  return expression.type === "const" && expression.const === ".*";
}
function IsTemplateLiteralExpressionFinite(expression) {
  return IsNumberExpression(expression) || IsStringExpression(expression) ? false : IsBooleanExpression(expression) ? true : expression.type === "and" ? expression.expr.every((expr) => IsTemplateLiteralExpressionFinite(expr)) : expression.type === "or" ? expression.expr.every((expr) => IsTemplateLiteralExpressionFinite(expr)) : expression.type === "const" ? true : (() => {
    throw new TemplateLiteralFiniteError(`Unknown expression type`);
  })();
}
function IsTemplateLiteralFinite(schema) {
  const expression = TemplateLiteralParseExact(schema.pattern);
  return IsTemplateLiteralExpressionFinite(expression);
}
var TemplateLiteralFiniteError;
var init_finite = __esm(() => {
  init_parse();
  init_error2();
  TemplateLiteralFiniteError = class TemplateLiteralFiniteError extends TypeBoxError {
  };
});

// node_modules/@sinclair/typebox/build/esm/type/template-literal/generate.mjs
function* GenerateReduce(buffer) {
  if (buffer.length === 1)
    return yield* buffer[0];
  for (const left of buffer[0]) {
    for (const right of GenerateReduce(buffer.slice(1))) {
      yield `${left}${right}`;
    }
  }
}
function* GenerateAnd(expression) {
  return yield* GenerateReduce(expression.expr.map((expr) => [...TemplateLiteralExpressionGenerate(expr)]));
}
function* GenerateOr(expression) {
  for (const expr of expression.expr)
    yield* TemplateLiteralExpressionGenerate(expr);
}
function* GenerateConst(expression) {
  return yield expression.const;
}
function* TemplateLiteralExpressionGenerate(expression) {
  return expression.type === "and" ? yield* GenerateAnd(expression) : expression.type === "or" ? yield* GenerateOr(expression) : expression.type === "const" ? yield* GenerateConst(expression) : (() => {
    throw new TemplateLiteralGenerateError("Unknown expression");
  })();
}
function TemplateLiteralGenerate(schema) {
  const expression = TemplateLiteralParseExact(schema.pattern);
  return IsTemplateLiteralExpressionFinite(expression) ? [...TemplateLiteralExpressionGenerate(expression)] : [];
}
var TemplateLiteralGenerateError;
var init_generate = __esm(() => {
  init_finite();
  init_parse();
  init_error2();
  TemplateLiteralGenerateError = class TemplateLiteralGenerateError extends TypeBoxError {
  };
});

// node_modules/@sinclair/typebox/build/esm/type/literal/literal.mjs
function Literal(value, options) {
  return CreateType({
    [Kind]: "Literal",
    const: value,
    type: typeof value
  }, options);
}
var init_literal = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/literal/index.mjs
var init_literal2 = __esm(() => {
  init_literal();
});

// node_modules/@sinclair/typebox/build/esm/type/boolean/boolean.mjs
function Boolean(options) {
  return CreateType({ [Kind]: "Boolean", type: "boolean" }, options);
}
var init_boolean = __esm(() => {
  init_symbols2();
  init_create();
});

// node_modules/@sinclair/typebox/build/esm/type/boolean/index.mjs
var init_boolean2 = __esm(() => {
  init_boolean();
});

// node_modules/@sinclair/typebox/build/esm/type/bigint/bigint.mjs
function BigInt2(options) {
  return CreateType({ [Kind]: "BigInt", type: "bigint" }, options);
}
var init_bigint = __esm(() => {
  init_symbols2();
  init_create();
});

// node_modules/@sinclair/typebox/build/esm/type/bigint/index.mjs
var init_bigint2 = __esm(() => {
  init_bigint();
});

// node_modules/@sinclair/typebox/build/esm/type/number/number.mjs
function Number2(options) {
  return CreateType({ [Kind]: "Number", type: "number" }, options);
}
var init_number = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/number/index.mjs
var init_number2 = __esm(() => {
  init_number();
});

// node_modules/@sinclair/typebox/build/esm/type/string/string.mjs
function String2(options) {
  return CreateType({ [Kind]: "String", type: "string" }, options);
}
var init_string = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/string/index.mjs
var init_string2 = __esm(() => {
  init_string();
});

// node_modules/@sinclair/typebox/build/esm/type/template-literal/syntax.mjs
function* FromUnion(syntax) {
  const trim = syntax.trim().replace(/"|'/g, "");
  return trim === "boolean" ? yield Boolean() : trim === "number" ? yield Number2() : trim === "bigint" ? yield BigInt2() : trim === "string" ? yield String2() : yield (() => {
    const literals = trim.split("|").map((literal) => Literal(literal.trim()));
    return literals.length === 0 ? Never() : literals.length === 1 ? literals[0] : UnionEvaluated(literals);
  })();
}
function* FromTerminal(syntax) {
  if (syntax[1] !== "{") {
    const L = Literal("$");
    const R = FromSyntax(syntax.slice(1));
    return yield* [L, ...R];
  }
  for (let i = 2;i < syntax.length; i++) {
    if (syntax[i] === "}") {
      const L = FromUnion(syntax.slice(2, i));
      const R = FromSyntax(syntax.slice(i + 1));
      return yield* [...L, ...R];
    }
  }
  yield Literal(syntax);
}
function* FromSyntax(syntax) {
  for (let i = 0;i < syntax.length; i++) {
    if (syntax[i] === "$") {
      const L = Literal(syntax.slice(0, i));
      const R = FromTerminal(syntax.slice(i));
      return yield* [L, ...R];
    }
  }
  yield Literal(syntax);
}
function TemplateLiteralSyntax(syntax) {
  return [...FromSyntax(syntax)];
}
var init_syntax = __esm(() => {
  init_literal2();
  init_boolean2();
  init_bigint2();
  init_number2();
  init_string2();
  init_union2();
  init_never2();
});

// node_modules/@sinclair/typebox/build/esm/type/template-literal/pattern.mjs
function Escape(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function Visit2(schema, acc) {
  return IsTemplateLiteral(schema) ? schema.pattern.slice(1, schema.pattern.length - 1) : IsUnion(schema) ? `(${schema.anyOf.map((schema) => Visit2(schema, acc)).join("|")})` : IsNumber3(schema) ? `${acc}${PatternNumber}` : IsInteger2(schema) ? `${acc}${PatternNumber}` : IsBigInt3(schema) ? `${acc}${PatternNumber}` : IsString3(schema) ? `${acc}${PatternString}` : IsLiteral(schema) ? `${acc}${Escape(schema.const.toString())}` : IsBoolean3(schema) ? `${acc}${PatternBoolean}` : (() => {
    throw new TemplateLiteralPatternError(`Unexpected Kind '${schema[Kind]}'`);
  })();
}
function TemplateLiteralPattern(kinds) {
  return `^${kinds.map((schema) => Visit2(schema, "")).join("")}$`;
}
var TemplateLiteralPatternError;
var init_pattern = __esm(() => {
  init_patterns2();
  init_symbols2();
  init_error2();
  init_kind();
  TemplateLiteralPatternError = class TemplateLiteralPatternError extends TypeBoxError {
  };
});

// node_modules/@sinclair/typebox/build/esm/type/template-literal/union.mjs
function TemplateLiteralToUnion(schema) {
  const R = TemplateLiteralGenerate(schema);
  const L = R.map((S) => Literal(S));
  return UnionEvaluated(L);
}
var init_union3 = __esm(() => {
  init_union2();
  init_literal2();
  init_generate();
});

// node_modules/@sinclair/typebox/build/esm/type/template-literal/template-literal.mjs
function TemplateLiteral(unresolved, options) {
  const pattern = IsString(unresolved) ? TemplateLiteralPattern(TemplateLiteralSyntax(unresolved)) : TemplateLiteralPattern(unresolved);
  return CreateType({ [Kind]: "TemplateLiteral", type: "string", pattern }, options);
}
var init_template_literal = __esm(() => {
  init_type2();
  init_syntax();
  init_pattern();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/template-literal/index.mjs
var init_template_literal2 = __esm(() => {
  init_finite();
  init_generate();
  init_syntax();
  init_parse();
  init_pattern();
  init_union3();
  init_template_literal();
});

// node_modules/@sinclair/typebox/build/esm/type/indexed/indexed-property-keys.mjs
function FromTemplateLiteral(templateLiteral) {
  const keys = TemplateLiteralGenerate(templateLiteral);
  return keys.map((key) => key.toString());
}
function FromUnion2(types) {
  const result = [];
  for (const type of types)
    result.push(...IndexPropertyKeys(type));
  return result;
}
function FromLiteral(literalValue) {
  return [literalValue.toString()];
}
function IndexPropertyKeys(type) {
  return [...new Set(IsTemplateLiteral(type) ? FromTemplateLiteral(type) : IsUnion(type) ? FromUnion2(type.anyOf) : IsLiteral(type) ? FromLiteral(type.const) : IsNumber3(type) ? ["[number]"] : IsInteger2(type) ? ["[number]"] : [])];
}
var init_indexed_property_keys = __esm(() => {
  init_template_literal2();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/indexed/indexed-from-mapped-result.mjs
function FromProperties(type, properties, options) {
  const result = {};
  for (const K2 of Object.getOwnPropertyNames(properties)) {
    result[K2] = Index(type, IndexPropertyKeys(properties[K2]), options);
  }
  return result;
}
function FromMappedResult(type, mappedResult, options) {
  return FromProperties(type, mappedResult.properties, options);
}
function IndexFromMappedResult(type, mappedResult, options) {
  const properties = FromMappedResult(type, mappedResult, options);
  return MappedResult(properties);
}
var init_indexed_from_mapped_result = __esm(() => {
  init_mapped2();
  init_indexed_property_keys();
  init_indexed2();
});

// node_modules/@sinclair/typebox/build/esm/type/indexed/indexed.mjs
function FromRest(types, key) {
  return types.map((type) => IndexFromPropertyKey(type, key));
}
function FromIntersectRest(types) {
  return types.filter((type) => !IsNever(type));
}
function FromIntersect(types, key) {
  return IntersectEvaluated(FromIntersectRest(FromRest(types, key)));
}
function FromUnionRest(types) {
  return types.some((L) => IsNever(L)) ? [] : types;
}
function FromUnion3(types, key) {
  return UnionEvaluated(FromUnionRest(FromRest(types, key)));
}
function FromTuple(types, key) {
  return key in types ? types[key] : key === "[number]" ? UnionEvaluated(types) : Never();
}
function FromArray(type, key) {
  return key === "[number]" ? type : Never();
}
function FromProperty(properties, propertyKey) {
  return propertyKey in properties ? properties[propertyKey] : Never();
}
function IndexFromPropertyKey(type, propertyKey) {
  return IsIntersect(type) ? FromIntersect(type.allOf, propertyKey) : IsUnion(type) ? FromUnion3(type.anyOf, propertyKey) : IsTuple(type) ? FromTuple(type.items ?? [], propertyKey) : IsArray3(type) ? FromArray(type.items, propertyKey) : IsObject3(type) ? FromProperty(type.properties, propertyKey) : Never();
}
function IndexFromPropertyKeys(type, propertyKeys) {
  return propertyKeys.map((propertyKey) => IndexFromPropertyKey(type, propertyKey));
}
function FromSchema(type, propertyKeys) {
  return UnionEvaluated(IndexFromPropertyKeys(type, propertyKeys));
}
function Index(type, key, options) {
  if (IsRef(type) || IsRef(key)) {
    const error = `Index types using Ref parameters require both Type and Key to be of TSchema`;
    if (!IsSchema(type) || !IsSchema(key))
      throw new TypeBoxError(error);
    return Computed("Index", [type, key]);
  }
  if (IsMappedResult(key))
    return IndexFromMappedResult(type, key, options);
  if (IsMappedKey(key))
    return IndexFromMappedKey(type, key, options);
  return CreateType(IsSchema(key) ? FromSchema(type, IndexPropertyKeys(key)) : FromSchema(type, key), options);
}
var init_indexed = __esm(() => {
  init_type2();
  init_error2();
  init_computed2();
  init_never2();
  init_intersect2();
  init_union2();
  init_indexed_property_keys();
  init_indexed_from_mapped_key();
  init_indexed_from_mapped_result();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/indexed/indexed-from-mapped-key.mjs
function MappedIndexPropertyKey(type, key, options) {
  return { [key]: Index(type, [key], Clone(options)) };
}
function MappedIndexPropertyKeys(type, propertyKeys, options) {
  return propertyKeys.reduce((result, left) => {
    return { ...result, ...MappedIndexPropertyKey(type, left, options) };
  }, {});
}
function MappedIndexProperties(type, mappedKey, options) {
  return MappedIndexPropertyKeys(type, mappedKey.keys, options);
}
function IndexFromMappedKey(type, mappedKey, options) {
  const properties = MappedIndexProperties(type, mappedKey, options);
  return MappedResult(properties);
}
var init_indexed_from_mapped_key = __esm(() => {
  init_indexed();
  init_mapped2();
  init_value();
});

// node_modules/@sinclair/typebox/build/esm/type/indexed/index.mjs
var init_indexed2 = __esm(() => {
  init_indexed_from_mapped_key();
  init_indexed_from_mapped_result();
  init_indexed_property_keys();
  init_indexed();
});

// node_modules/@sinclair/typebox/build/esm/type/iterator/iterator.mjs
function Iterator(items, options) {
  return CreateType({ [Kind]: "Iterator", type: "Iterator", items }, options);
}
var init_iterator = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/iterator/index.mjs
var init_iterator2 = __esm(() => {
  init_iterator();
});

// node_modules/@sinclair/typebox/build/esm/type/object/object.mjs
function RequiredArray(properties) {
  return globalThis.Object.keys(properties).filter((key) => !IsOptional(properties[key]));
}
function _Object_(properties, options) {
  const required = RequiredArray(properties);
  const schema = required.length > 0 ? { [Kind]: "Object", type: "object", required, properties } : { [Kind]: "Object", type: "object", properties };
  return CreateType(schema, options);
}
var Object2;
var init_object = __esm(() => {
  init_type2();
  init_symbols2();
  init_kind();
  Object2 = _Object_;
});

// node_modules/@sinclair/typebox/build/esm/type/object/index.mjs
var init_object2 = __esm(() => {
  init_object();
});

// node_modules/@sinclair/typebox/build/esm/type/promise/promise.mjs
function Promise2(item, options) {
  return CreateType({ [Kind]: "Promise", type: "Promise", item }, options);
}
var init_promise = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/promise/index.mjs
var init_promise2 = __esm(() => {
  init_promise();
});

// node_modules/@sinclair/typebox/build/esm/type/readonly/readonly.mjs
function RemoveReadonly(schema) {
  return CreateType(Discard(schema, [ReadonlyKind]));
}
function AddReadonly(schema) {
  return CreateType({ ...schema, [ReadonlyKind]: "Readonly" });
}
function ReadonlyWithFlag(schema, F) {
  return F === false ? RemoveReadonly(schema) : AddReadonly(schema);
}
function Readonly(schema, enable) {
  const F = enable ?? true;
  return IsMappedResult(schema) ? ReadonlyFromMappedResult(schema, F) : ReadonlyWithFlag(schema, F);
}
var init_readonly = __esm(() => {
  init_type2();
  init_symbols2();
  init_discard();
  init_readonly_from_mapped_result();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/readonly/readonly-from-mapped-result.mjs
function FromProperties2(K, F) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(K))
    Acc[K2] = Readonly(K[K2], F);
  return Acc;
}
function FromMappedResult2(R, F) {
  return FromProperties2(R.properties, F);
}
function ReadonlyFromMappedResult(R, F) {
  const P = FromMappedResult2(R, F);
  return MappedResult(P);
}
var init_readonly_from_mapped_result = __esm(() => {
  init_mapped2();
  init_readonly();
});

// node_modules/@sinclair/typebox/build/esm/type/readonly/index.mjs
var init_readonly2 = __esm(() => {
  init_readonly_from_mapped_result();
  init_readonly();
});

// node_modules/@sinclair/typebox/build/esm/type/tuple/tuple.mjs
function Tuple(types, options) {
  return CreateType(types.length > 0 ? { [Kind]: "Tuple", type: "array", items: types, additionalItems: false, minItems: types.length, maxItems: types.length } : { [Kind]: "Tuple", type: "array", minItems: types.length, maxItems: types.length }, options);
}
var init_tuple = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/tuple/index.mjs
var init_tuple2 = __esm(() => {
  init_tuple();
});

// node_modules/@sinclair/typebox/build/esm/type/mapped/mapped.mjs
function FromMappedResult3(K, P) {
  return K in P ? FromSchemaType(K, P[K]) : MappedResult(P);
}
function MappedKeyToKnownMappedResultProperties(K) {
  return { [K]: Literal(K) };
}
function MappedKeyToUnknownMappedResultProperties(P) {
  const Acc = {};
  for (const L of P)
    Acc[L] = Literal(L);
  return Acc;
}
function MappedKeyToMappedResultProperties(K, P) {
  return SetIncludes(P, K) ? MappedKeyToKnownMappedResultProperties(K) : MappedKeyToUnknownMappedResultProperties(P);
}
function FromMappedKey(K, P) {
  const R = MappedKeyToMappedResultProperties(K, P);
  return FromMappedResult3(K, R);
}
function FromRest2(K, T) {
  return T.map((L) => FromSchemaType(K, L));
}
function FromProperties3(K, T) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(T))
    Acc[K2] = FromSchemaType(K, T[K2]);
  return Acc;
}
function FromSchemaType(K, T) {
  const options = { ...T };
  return IsOptional(T) ? Optional(FromSchemaType(K, Discard(T, [OptionalKind]))) : IsReadonly(T) ? Readonly(FromSchemaType(K, Discard(T, [ReadonlyKind]))) : IsMappedResult(T) ? FromMappedResult3(K, T.properties) : IsMappedKey(T) ? FromMappedKey(K, T.keys) : IsConstructor(T) ? Constructor(FromRest2(K, T.parameters), FromSchemaType(K, T.returns), options) : IsFunction3(T) ? Function(FromRest2(K, T.parameters), FromSchemaType(K, T.returns), options) : IsAsyncIterator3(T) ? AsyncIterator(FromSchemaType(K, T.items), options) : IsIterator3(T) ? Iterator(FromSchemaType(K, T.items), options) : IsIntersect(T) ? Intersect(FromRest2(K, T.allOf), options) : IsUnion(T) ? Union(FromRest2(K, T.anyOf), options) : IsTuple(T) ? Tuple(FromRest2(K, T.items ?? []), options) : IsObject3(T) ? Object2(FromProperties3(K, T.properties), options) : IsArray3(T) ? Array2(FromSchemaType(K, T.items), options) : IsPromise2(T) ? Promise2(FromSchemaType(K, T.item), options) : T;
}
function MappedFunctionReturnType(K, T) {
  const Acc = {};
  for (const L of K)
    Acc[L] = FromSchemaType(L, T);
  return Acc;
}
function Mapped(key, map, options) {
  const K = IsSchema(key) ? IndexPropertyKeys(key) : key;
  const RT = map({ [Kind]: "MappedKey", keys: K });
  const R = MappedFunctionReturnType(K, RT);
  return Object2(R, options);
}
var init_mapped = __esm(() => {
  init_symbols2();
  init_discard();
  init_array2();
  init_async_iterator2();
  init_constructor2();
  init_function2();
  init_indexed2();
  init_intersect2();
  init_iterator2();
  init_literal2();
  init_object2();
  init_optional2();
  init_promise2();
  init_readonly2();
  init_tuple2();
  init_union2();
  init_sets();
  init_mapped_result();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/mapped/index.mjs
var init_mapped2 = __esm(() => {
  init_mapped_key();
  init_mapped_result();
  init_mapped();
});

// node_modules/@sinclair/typebox/build/esm/type/optional/optional.mjs
function RemoveOptional(schema) {
  return CreateType(Discard(schema, [OptionalKind]));
}
function AddOptional(schema) {
  return CreateType({ ...schema, [OptionalKind]: "Optional" });
}
function OptionalWithFlag(schema, F) {
  return F === false ? RemoveOptional(schema) : AddOptional(schema);
}
function Optional(schema, enable) {
  const F = enable ?? true;
  return IsMappedResult(schema) ? OptionalFromMappedResult(schema, F) : OptionalWithFlag(schema, F);
}
var init_optional = __esm(() => {
  init_type2();
  init_symbols2();
  init_discard();
  init_optional_from_mapped_result();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/optional/optional-from-mapped-result.mjs
function FromProperties4(P, F) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Optional(P[K2], F);
  return Acc;
}
function FromMappedResult4(R, F) {
  return FromProperties4(R.properties, F);
}
function OptionalFromMappedResult(R, F) {
  const P = FromMappedResult4(R, F);
  return MappedResult(P);
}
var init_optional_from_mapped_result = __esm(() => {
  init_mapped2();
  init_optional();
});

// node_modules/@sinclair/typebox/build/esm/type/optional/index.mjs
var init_optional2 = __esm(() => {
  init_optional_from_mapped_result();
  init_optional();
});

// node_modules/@sinclair/typebox/build/esm/type/intersect/intersect-create.mjs
function IntersectCreate(T, options = {}) {
  const allObjects = T.every((schema) => IsObject3(schema));
  const clonedUnevaluatedProperties = IsSchema(options.unevaluatedProperties) ? { unevaluatedProperties: options.unevaluatedProperties } : {};
  return CreateType(options.unevaluatedProperties === false || IsSchema(options.unevaluatedProperties) || allObjects ? { ...clonedUnevaluatedProperties, [Kind]: "Intersect", type: "object", allOf: T } : { ...clonedUnevaluatedProperties, [Kind]: "Intersect", allOf: T }, options);
}
var init_intersect_create = __esm(() => {
  init_type2();
  init_symbols2();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/intersect/intersect-evaluated.mjs
function IsIntersectOptional(types) {
  return types.every((left) => IsOptional(left));
}
function RemoveOptionalFromType2(type) {
  return Discard(type, [OptionalKind]);
}
function RemoveOptionalFromRest2(types) {
  return types.map((left) => IsOptional(left) ? RemoveOptionalFromType2(left) : left);
}
function ResolveIntersect(types, options) {
  return IsIntersectOptional(types) ? Optional(IntersectCreate(RemoveOptionalFromRest2(types), options)) : IntersectCreate(RemoveOptionalFromRest2(types), options);
}
function IntersectEvaluated(types, options = {}) {
  if (types.length === 1)
    return CreateType(types[0], options);
  if (types.length === 0)
    return Never(options);
  if (types.some((schema) => IsTransform(schema)))
    throw new Error("Cannot intersect transform types");
  return ResolveIntersect(types, options);
}
var init_intersect_evaluated = __esm(() => {
  init_symbols2();
  init_type2();
  init_discard();
  init_never2();
  init_optional2();
  init_intersect_create();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/intersect/intersect-type.mjs
var init_intersect_type = () => {};

// node_modules/@sinclair/typebox/build/esm/type/intersect/intersect.mjs
function Intersect(types, options) {
  if (types.length === 1)
    return CreateType(types[0], options);
  if (types.length === 0)
    return Never(options);
  if (types.some((schema) => IsTransform(schema)))
    throw new Error("Cannot intersect transform types");
  return IntersectCreate(types, options);
}
var init_intersect = __esm(() => {
  init_type2();
  init_never2();
  init_intersect_create();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/intersect/index.mjs
var init_intersect2 = __esm(() => {
  init_intersect_evaluated();
  init_intersect_type();
  init_intersect();
});

// node_modules/@sinclair/typebox/build/esm/type/ref/ref.mjs
function Ref(...args) {
  const [$ref, options] = typeof args[0] === "string" ? [args[0], args[1]] : [args[0].$id, args[1]];
  if (typeof $ref !== "string")
    throw new TypeBoxError("Ref: $ref must be a string");
  return CreateType({ [Kind]: "Ref", $ref }, options);
}
var init_ref = __esm(() => {
  init_error2();
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/ref/index.mjs
var init_ref2 = __esm(() => {
  init_ref();
});

// node_modules/@sinclair/typebox/build/esm/type/awaited/awaited.mjs
function FromComputed(target, parameters) {
  return Computed("Awaited", [Computed(target, parameters)]);
}
function FromRef($ref) {
  return Computed("Awaited", [Ref($ref)]);
}
function FromIntersect2(types) {
  return Intersect(FromRest3(types));
}
function FromUnion4(types) {
  return Union(FromRest3(types));
}
function FromPromise(type) {
  return Awaited(type);
}
function FromRest3(types) {
  return types.map((type) => Awaited(type));
}
function Awaited(type, options) {
  return CreateType(IsComputed(type) ? FromComputed(type.target, type.parameters) : IsIntersect(type) ? FromIntersect2(type.allOf) : IsUnion(type) ? FromUnion4(type.anyOf) : IsPromise2(type) ? FromPromise(type.item) : IsRef(type) ? FromRef(type.$ref) : type, options);
}
var init_awaited = __esm(() => {
  init_type2();
  init_computed2();
  init_intersect2();
  init_union2();
  init_ref2();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/awaited/index.mjs
var init_awaited2 = __esm(() => {
  init_awaited();
});

// node_modules/@sinclair/typebox/build/esm/type/keyof/keyof-property-keys.mjs
function FromRest4(types) {
  const result = [];
  for (const L of types)
    result.push(KeyOfPropertyKeys(L));
  return result;
}
function FromIntersect3(types) {
  const propertyKeysArray = FromRest4(types);
  const propertyKeys = SetUnionMany(propertyKeysArray);
  return propertyKeys;
}
function FromUnion5(types) {
  const propertyKeysArray = FromRest4(types);
  const propertyKeys = SetIntersectMany(propertyKeysArray);
  return propertyKeys;
}
function FromTuple2(types) {
  return types.map((_, indexer) => indexer.toString());
}
function FromArray2(_) {
  return ["[number]"];
}
function FromProperties5(T) {
  return globalThis.Object.getOwnPropertyNames(T);
}
function FromPatternProperties(patternProperties) {
  if (!includePatternProperties)
    return [];
  const patternPropertyKeys = globalThis.Object.getOwnPropertyNames(patternProperties);
  return patternPropertyKeys.map((key) => {
    return key[0] === "^" && key[key.length - 1] === "$" ? key.slice(1, key.length - 1) : key;
  });
}
function KeyOfPropertyKeys(type) {
  return IsIntersect(type) ? FromIntersect3(type.allOf) : IsUnion(type) ? FromUnion5(type.anyOf) : IsTuple(type) ? FromTuple2(type.items ?? []) : IsArray3(type) ? FromArray2(type.items) : IsObject3(type) ? FromProperties5(type.properties) : IsRecord(type) ? FromPatternProperties(type.patternProperties) : [];
}
function KeyOfPattern(schema) {
  includePatternProperties = true;
  const keys = KeyOfPropertyKeys(schema);
  includePatternProperties = false;
  const pattern = keys.map((key) => `(${key})`);
  return `^(${pattern.join("|")})$`;
}
var includePatternProperties = false;
var init_keyof_property_keys = __esm(() => {
  init_sets();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/keyof/keyof.mjs
function FromComputed2(target, parameters) {
  return Computed("KeyOf", [Computed(target, parameters)]);
}
function FromRef2($ref) {
  return Computed("KeyOf", [Ref($ref)]);
}
function KeyOfFromType(type, options) {
  const propertyKeys = KeyOfPropertyKeys(type);
  const propertyKeyTypes = KeyOfPropertyKeysToRest(propertyKeys);
  const result = UnionEvaluated(propertyKeyTypes);
  return CreateType(result, options);
}
function KeyOfPropertyKeysToRest(propertyKeys) {
  return propertyKeys.map((L) => L === "[number]" ? Number2() : Literal(L));
}
function KeyOf(type, options) {
  return IsComputed(type) ? FromComputed2(type.target, type.parameters) : IsRef(type) ? FromRef2(type.$ref) : IsMappedResult(type) ? KeyOfFromMappedResult(type, options) : KeyOfFromType(type, options);
}
var init_keyof = __esm(() => {
  init_type2();
  init_literal2();
  init_number2();
  init_computed2();
  init_ref2();
  init_keyof_property_keys();
  init_union2();
  init_keyof_from_mapped_result();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/keyof/keyof-from-mapped-result.mjs
function FromProperties6(properties, options) {
  const result = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(properties))
    result[K2] = KeyOf(properties[K2], Clone(options));
  return result;
}
function FromMappedResult5(mappedResult, options) {
  return FromProperties6(mappedResult.properties, options);
}
function KeyOfFromMappedResult(mappedResult, options) {
  const properties = FromMappedResult5(mappedResult, options);
  return MappedResult(properties);
}
var init_keyof_from_mapped_result = __esm(() => {
  init_mapped2();
  init_keyof();
  init_value();
});

// node_modules/@sinclair/typebox/build/esm/type/keyof/keyof-property-entries.mjs
var init_keyof_property_entries = () => {};

// node_modules/@sinclair/typebox/build/esm/type/keyof/index.mjs
var init_keyof2 = __esm(() => {
  init_keyof_from_mapped_result();
  init_keyof_property_entries();
  init_keyof_property_keys();
  init_keyof();
});

// node_modules/@sinclair/typebox/build/esm/type/composite/composite.mjs
function CompositeKeys(T) {
  const Acc = [];
  for (const L of T)
    Acc.push(...KeyOfPropertyKeys(L));
  return SetDistinct(Acc);
}
function FilterNever(T) {
  return T.filter((L) => !IsNever(L));
}
function CompositeProperty(T, K) {
  const Acc = [];
  for (const L of T)
    Acc.push(...IndexFromPropertyKeys(L, [K]));
  return FilterNever(Acc);
}
function CompositeProperties(T, K) {
  const Acc = {};
  for (const L of K) {
    Acc[L] = IntersectEvaluated(CompositeProperty(T, L));
  }
  return Acc;
}
function Composite(T, options) {
  const K = CompositeKeys(T);
  const P = CompositeProperties(T, K);
  const R = Object2(P, options);
  return R;
}
var init_composite = __esm(() => {
  init_intersect2();
  init_indexed2();
  init_keyof2();
  init_object2();
  init_sets();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/composite/index.mjs
var init_composite2 = __esm(() => {
  init_composite();
});

// node_modules/@sinclair/typebox/build/esm/type/date/date.mjs
function Date2(options) {
  return CreateType({ [Kind]: "Date", type: "Date" }, options);
}
var init_date = __esm(() => {
  init_symbols2();
  init_type2();
});

// node_modules/@sinclair/typebox/build/esm/type/date/index.mjs
var init_date2 = __esm(() => {
  init_date();
});

// node_modules/@sinclair/typebox/build/esm/type/null/null.mjs
function Null(options) {
  return CreateType({ [Kind]: "Null", type: "null" }, options);
}
var init_null = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/null/index.mjs
var init_null2 = __esm(() => {
  init_null();
});

// node_modules/@sinclair/typebox/build/esm/type/symbol/symbol.mjs
function Symbol2(options) {
  return CreateType({ [Kind]: "Symbol", type: "symbol" }, options);
}
var init_symbol = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/symbol/index.mjs
var init_symbol2 = __esm(() => {
  init_symbol();
});

// node_modules/@sinclair/typebox/build/esm/type/undefined/undefined.mjs
function Undefined(options) {
  return CreateType({ [Kind]: "Undefined", type: "undefined" }, options);
}
var init_undefined = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/undefined/index.mjs
var init_undefined2 = __esm(() => {
  init_undefined();
});

// node_modules/@sinclair/typebox/build/esm/type/uint8array/uint8array.mjs
function Uint8Array2(options) {
  return CreateType({ [Kind]: "Uint8Array", type: "Uint8Array" }, options);
}
var init_uint8array = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/uint8array/index.mjs
var init_uint8array2 = __esm(() => {
  init_uint8array();
});

// node_modules/@sinclair/typebox/build/esm/type/unknown/unknown.mjs
function Unknown(options) {
  return CreateType({ [Kind]: "Unknown" }, options);
}
var init_unknown = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/unknown/index.mjs
var init_unknown2 = __esm(() => {
  init_unknown();
});

// node_modules/@sinclair/typebox/build/esm/type/const/const.mjs
function FromArray3(T) {
  return T.map((L) => FromValue(L, false));
}
function FromProperties7(value) {
  const Acc = {};
  for (const K of globalThis.Object.getOwnPropertyNames(value))
    Acc[K] = Readonly(FromValue(value[K], false));
  return Acc;
}
function ConditionalReadonly(T, root) {
  return root === true ? T : Readonly(T);
}
function FromValue(value, root) {
  return IsAsyncIterator(value) ? ConditionalReadonly(Any(), root) : IsIterator(value) ? ConditionalReadonly(Any(), root) : IsArray(value) ? Readonly(Tuple(FromArray3(value))) : IsUint8Array(value) ? Uint8Array2() : IsDate(value) ? Date2() : IsObject(value) ? ConditionalReadonly(Object2(FromProperties7(value)), root) : IsFunction(value) ? ConditionalReadonly(Function([], Unknown()), root) : IsUndefined(value) ? Undefined() : IsNull(value) ? Null() : IsSymbol(value) ? Symbol2() : IsBigInt(value) ? BigInt2() : IsNumber(value) ? Literal(value) : IsBoolean(value) ? Literal(value) : IsString(value) ? Literal(value) : Object2({});
}
function Const(T, options) {
  return CreateType(FromValue(T, true), options);
}
var init_const = __esm(() => {
  init_any2();
  init_bigint2();
  init_date2();
  init_function2();
  init_literal2();
  init_null2();
  init_object2();
  init_symbol2();
  init_tuple2();
  init_readonly2();
  init_undefined2();
  init_uint8array2();
  init_unknown2();
  init_create();
});

// node_modules/@sinclair/typebox/build/esm/type/const/index.mjs
var init_const2 = __esm(() => {
  init_const();
});

// node_modules/@sinclair/typebox/build/esm/type/constructor-parameters/constructor-parameters.mjs
function ConstructorParameters(schema, options) {
  return IsConstructor(schema) ? Tuple(schema.parameters, options) : Never(options);
}
var init_constructor_parameters = __esm(() => {
  init_tuple2();
  init_never2();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/constructor-parameters/index.mjs
var init_constructor_parameters2 = __esm(() => {
  init_constructor_parameters();
});

// node_modules/@sinclair/typebox/build/esm/type/enum/enum.mjs
function Enum(item, options) {
  if (IsUndefined(item))
    throw new Error("Enum undefined or empty");
  const values1 = globalThis.Object.getOwnPropertyNames(item).filter((key) => isNaN(key)).map((key) => item[key]);
  const values2 = [...new Set(values1)];
  const anyOf = values2.map((value) => Literal(value));
  return Union(anyOf, { ...options, [Hint]: "Enum" });
}
var init_enum = __esm(() => {
  init_literal2();
  init_symbols2();
  init_union2();
});

// node_modules/@sinclair/typebox/build/esm/type/enum/index.mjs
var init_enum2 = __esm(() => {
  init_enum();
});

// node_modules/@sinclair/typebox/build/esm/type/extends/extends-check.mjs
function IntoBooleanResult(result) {
  return result === ExtendsResult.False ? result : ExtendsResult.True;
}
function Throw(message) {
  throw new ExtendsResolverError(message);
}
function IsStructuralRight(right) {
  return IsNever2(right) || IsIntersect2(right) || IsUnion2(right) || IsUnknown2(right) || IsAny2(right);
}
function StructuralRight(left, right) {
  return IsNever2(right) ? FromNeverRight(left, right) : IsIntersect2(right) ? FromIntersectRight(left, right) : IsUnion2(right) ? FromUnionRight(left, right) : IsUnknown2(right) ? FromUnknownRight(left, right) : IsAny2(right) ? FromAnyRight(left, right) : Throw("StructuralRight");
}
function FromAnyRight(left, right) {
  return ExtendsResult.True;
}
function FromAny(left, right) {
  return IsIntersect2(right) ? FromIntersectRight(left, right) : IsUnion2(right) && right.anyOf.some((schema) => IsAny2(schema) || IsUnknown2(schema)) ? ExtendsResult.True : IsUnion2(right) ? ExtendsResult.Union : IsUnknown2(right) ? ExtendsResult.True : IsAny2(right) ? ExtendsResult.True : ExtendsResult.Union;
}
function FromArrayRight(left, right) {
  return IsUnknown2(left) ? ExtendsResult.False : IsAny2(left) ? ExtendsResult.Union : IsNever2(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromArray4(left, right) {
  return IsObject4(right) && IsObjectArrayLike(right) ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : !IsArray4(right) ? ExtendsResult.False : IntoBooleanResult(Visit3(left.items, right.items));
}
function FromAsyncIterator(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : !IsAsyncIterator4(right) ? ExtendsResult.False : IntoBooleanResult(Visit3(left.items, right.items));
}
function FromBigInt(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject4(right) ? FromObjectRight(left, right) : IsRecord2(right) ? FromRecordRight(left, right) : IsBigInt4(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromBooleanRight(left, right) {
  return IsLiteralBoolean(left) ? ExtendsResult.True : IsBoolean4(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromBoolean(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject4(right) ? FromObjectRight(left, right) : IsRecord2(right) ? FromRecordRight(left, right) : IsBoolean4(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromConstructor(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject4(right) ? FromObjectRight(left, right) : !IsConstructor2(right) ? ExtendsResult.False : left.parameters.length > right.parameters.length ? ExtendsResult.False : !left.parameters.every((schema, index) => IntoBooleanResult(Visit3(right.parameters[index], schema)) === ExtendsResult.True) ? ExtendsResult.False : IntoBooleanResult(Visit3(left.returns, right.returns));
}
function FromDate(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject4(right) ? FromObjectRight(left, right) : IsRecord2(right) ? FromRecordRight(left, right) : IsDate4(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromFunction(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject4(right) ? FromObjectRight(left, right) : !IsFunction4(right) ? ExtendsResult.False : left.parameters.length > right.parameters.length ? ExtendsResult.False : !left.parameters.every((schema, index) => IntoBooleanResult(Visit3(right.parameters[index], schema)) === ExtendsResult.True) ? ExtendsResult.False : IntoBooleanResult(Visit3(left.returns, right.returns));
}
function FromIntegerRight(left, right) {
  return IsLiteral2(left) && IsNumber(left.const) ? ExtendsResult.True : IsNumber4(left) || IsInteger3(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromInteger(left, right) {
  return IsInteger3(right) || IsNumber4(right) ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : IsObject4(right) ? FromObjectRight(left, right) : IsRecord2(right) ? FromRecordRight(left, right) : ExtendsResult.False;
}
function FromIntersectRight(left, right) {
  return right.allOf.every((schema) => Visit3(left, schema) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromIntersect4(left, right) {
  return left.allOf.some((schema) => Visit3(schema, right) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromIterator(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : !IsIterator4(right) ? ExtendsResult.False : IntoBooleanResult(Visit3(left.items, right.items));
}
function FromLiteral2(left, right) {
  return IsLiteral2(right) && right.const === left.const ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : IsObject4(right) ? FromObjectRight(left, right) : IsRecord2(right) ? FromRecordRight(left, right) : IsString4(right) ? FromStringRight(left, right) : IsNumber4(right) ? FromNumberRight(left, right) : IsInteger3(right) ? FromIntegerRight(left, right) : IsBoolean4(right) ? FromBooleanRight(left, right) : ExtendsResult.False;
}
function FromNeverRight(left, right) {
  return ExtendsResult.False;
}
function FromNever(left, right) {
  return ExtendsResult.True;
}
function UnwrapTNot(schema) {
  let [current, depth] = [schema, 0];
  while (true) {
    if (!IsNot2(current))
      break;
    current = current.not;
    depth += 1;
  }
  return depth % 2 === 0 ? current : Unknown();
}
function FromNot(left, right) {
  return IsNot2(left) ? Visit3(UnwrapTNot(left), right) : IsNot2(right) ? Visit3(left, UnwrapTNot(right)) : Throw("Invalid fallthrough for Not");
}
function FromNull(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject4(right) ? FromObjectRight(left, right) : IsRecord2(right) ? FromRecordRight(left, right) : IsNull4(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromNumberRight(left, right) {
  return IsLiteralNumber(left) ? ExtendsResult.True : IsNumber4(left) || IsInteger3(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromNumber(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject4(right) ? FromObjectRight(left, right) : IsRecord2(right) ? FromRecordRight(left, right) : IsInteger3(right) || IsNumber4(right) ? ExtendsResult.True : ExtendsResult.False;
}
function IsObjectPropertyCount(schema, count) {
  return Object.getOwnPropertyNames(schema.properties).length === count;
}
function IsObjectStringLike(schema) {
  return IsObjectArrayLike(schema);
}
function IsObjectSymbolLike(schema) {
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "description" in schema.properties && IsUnion2(schema.properties.description) && schema.properties.description.anyOf.length === 2 && (IsString4(schema.properties.description.anyOf[0]) && IsUndefined4(schema.properties.description.anyOf[1]) || IsString4(schema.properties.description.anyOf[1]) && IsUndefined4(schema.properties.description.anyOf[0]));
}
function IsObjectNumberLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectBooleanLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectBigIntLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectDateLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectUint8ArrayLike(schema) {
  return IsObjectArrayLike(schema);
}
function IsObjectFunctionLike(schema) {
  const length = Number2();
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "length" in schema.properties && IntoBooleanResult(Visit3(schema.properties["length"], length)) === ExtendsResult.True;
}
function IsObjectConstructorLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectArrayLike(schema) {
  const length = Number2();
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "length" in schema.properties && IntoBooleanResult(Visit3(schema.properties["length"], length)) === ExtendsResult.True;
}
function IsObjectPromiseLike(schema) {
  const then = Function([Any()], Any());
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "then" in schema.properties && IntoBooleanResult(Visit3(schema.properties["then"], then)) === ExtendsResult.True;
}
function Property(left, right) {
  return Visit3(left, right) === ExtendsResult.False ? ExtendsResult.False : IsOptional2(left) && !IsOptional2(right) ? ExtendsResult.False : ExtendsResult.True;
}
function FromObjectRight(left, right) {
  return IsUnknown2(left) ? ExtendsResult.False : IsAny2(left) ? ExtendsResult.Union : IsNever2(left) || IsLiteralString(left) && IsObjectStringLike(right) || IsLiteralNumber(left) && IsObjectNumberLike(right) || IsLiteralBoolean(left) && IsObjectBooleanLike(right) || IsSymbol4(left) && IsObjectSymbolLike(right) || IsBigInt4(left) && IsObjectBigIntLike(right) || IsString4(left) && IsObjectStringLike(right) || IsSymbol4(left) && IsObjectSymbolLike(right) || IsNumber4(left) && IsObjectNumberLike(right) || IsInteger3(left) && IsObjectNumberLike(right) || IsBoolean4(left) && IsObjectBooleanLike(right) || IsUint8Array4(left) && IsObjectUint8ArrayLike(right) || IsDate4(left) && IsObjectDateLike(right) || IsConstructor2(left) && IsObjectConstructorLike(right) || IsFunction4(left) && IsObjectFunctionLike(right) ? ExtendsResult.True : IsRecord2(left) && IsString4(RecordKey(left)) ? (() => {
    return right[Hint] === "Record" ? ExtendsResult.True : ExtendsResult.False;
  })() : IsRecord2(left) && IsNumber4(RecordKey(left)) ? (() => {
    return IsObjectPropertyCount(right, 0) ? ExtendsResult.True : ExtendsResult.False;
  })() : ExtendsResult.False;
}
function FromObject(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsRecord2(right) ? FromRecordRight(left, right) : !IsObject4(right) ? ExtendsResult.False : (() => {
    for (const key of Object.getOwnPropertyNames(right.properties)) {
      if (!(key in left.properties) && !IsOptional2(right.properties[key])) {
        return ExtendsResult.False;
      }
      if (IsOptional2(right.properties[key])) {
        return ExtendsResult.True;
      }
      if (Property(left.properties[key], right.properties[key]) === ExtendsResult.False) {
        return ExtendsResult.False;
      }
    }
    return ExtendsResult.True;
  })();
}
function FromPromise2(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject4(right) && IsObjectPromiseLike(right) ? ExtendsResult.True : !IsPromise3(right) ? ExtendsResult.False : IntoBooleanResult(Visit3(left.item, right.item));
}
function RecordKey(schema) {
  return PatternNumberExact in schema.patternProperties ? Number2() : (PatternStringExact in schema.patternProperties) ? String2() : Throw("Unknown record key pattern");
}
function RecordValue(schema) {
  return PatternNumberExact in schema.patternProperties ? schema.patternProperties[PatternNumberExact] : (PatternStringExact in schema.patternProperties) ? schema.patternProperties[PatternStringExact] : Throw("Unable to get record value schema");
}
function FromRecordRight(left, right) {
  const [Key, Value] = [RecordKey(right), RecordValue(right)];
  return IsLiteralString(left) && IsNumber4(Key) && IntoBooleanResult(Visit3(left, Value)) === ExtendsResult.True ? ExtendsResult.True : IsUint8Array4(left) && IsNumber4(Key) ? Visit3(left, Value) : IsString4(left) && IsNumber4(Key) ? Visit3(left, Value) : IsArray4(left) && IsNumber4(Key) ? Visit3(left, Value) : IsObject4(left) ? (() => {
    for (const key of Object.getOwnPropertyNames(left.properties)) {
      if (Property(Value, left.properties[key]) === ExtendsResult.False) {
        return ExtendsResult.False;
      }
    }
    return ExtendsResult.True;
  })() : ExtendsResult.False;
}
function FromRecord(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject4(right) ? FromObjectRight(left, right) : !IsRecord2(right) ? ExtendsResult.False : Visit3(RecordValue(left), RecordValue(right));
}
function FromRegExp(left, right) {
  const L = IsRegExp3(left) ? String2() : left;
  const R = IsRegExp3(right) ? String2() : right;
  return Visit3(L, R);
}
function FromStringRight(left, right) {
  return IsLiteral2(left) && IsString(left.const) ? ExtendsResult.True : IsString4(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromString(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject4(right) ? FromObjectRight(left, right) : IsRecord2(right) ? FromRecordRight(left, right) : IsString4(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromSymbol(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject4(right) ? FromObjectRight(left, right) : IsRecord2(right) ? FromRecordRight(left, right) : IsSymbol4(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromTemplateLiteral2(left, right) {
  return IsTemplateLiteral2(left) ? Visit3(TemplateLiteralToUnion(left), right) : IsTemplateLiteral2(right) ? Visit3(left, TemplateLiteralToUnion(right)) : Throw("Invalid fallthrough for TemplateLiteral");
}
function IsArrayOfTuple(left, right) {
  return IsArray4(right) && left.items !== undefined && left.items.every((schema) => Visit3(schema, right.items) === ExtendsResult.True);
}
function FromTupleRight(left, right) {
  return IsNever2(left) ? ExtendsResult.True : IsUnknown2(left) ? ExtendsResult.False : IsAny2(left) ? ExtendsResult.Union : ExtendsResult.False;
}
function FromTuple3(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject4(right) && IsObjectArrayLike(right) ? ExtendsResult.True : IsArray4(right) && IsArrayOfTuple(left, right) ? ExtendsResult.True : !IsTuple2(right) ? ExtendsResult.False : IsUndefined(left.items) && !IsUndefined(right.items) || !IsUndefined(left.items) && IsUndefined(right.items) ? ExtendsResult.False : IsUndefined(left.items) && !IsUndefined(right.items) ? ExtendsResult.True : left.items.every((schema, index) => Visit3(schema, right.items[index]) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUint8Array(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject4(right) ? FromObjectRight(left, right) : IsRecord2(right) ? FromRecordRight(left, right) : IsUint8Array4(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUndefined(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject4(right) ? FromObjectRight(left, right) : IsRecord2(right) ? FromRecordRight(left, right) : IsVoid2(right) ? FromVoidRight(left, right) : IsUndefined4(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUnionRight(left, right) {
  return right.anyOf.some((schema) => Visit3(left, schema) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUnion6(left, right) {
  return left.anyOf.every((schema) => Visit3(schema, right) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUnknownRight(left, right) {
  return ExtendsResult.True;
}
function FromUnknown(left, right) {
  return IsNever2(right) ? FromNeverRight(left, right) : IsIntersect2(right) ? FromIntersectRight(left, right) : IsUnion2(right) ? FromUnionRight(left, right) : IsAny2(right) ? FromAnyRight(left, right) : IsString4(right) ? FromStringRight(left, right) : IsNumber4(right) ? FromNumberRight(left, right) : IsInteger3(right) ? FromIntegerRight(left, right) : IsBoolean4(right) ? FromBooleanRight(left, right) : IsArray4(right) ? FromArrayRight(left, right) : IsTuple2(right) ? FromTupleRight(left, right) : IsObject4(right) ? FromObjectRight(left, right) : IsUnknown2(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromVoidRight(left, right) {
  return IsUndefined4(left) ? ExtendsResult.True : IsUndefined4(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromVoid(left, right) {
  return IsIntersect2(right) ? FromIntersectRight(left, right) : IsUnion2(right) ? FromUnionRight(left, right) : IsUnknown2(right) ? FromUnknownRight(left, right) : IsAny2(right) ? FromAnyRight(left, right) : IsObject4(right) ? FromObjectRight(left, right) : IsVoid2(right) ? ExtendsResult.True : ExtendsResult.False;
}
function Visit3(left, right) {
  return IsTemplateLiteral2(left) || IsTemplateLiteral2(right) ? FromTemplateLiteral2(left, right) : IsRegExp3(left) || IsRegExp3(right) ? FromRegExp(left, right) : IsNot2(left) || IsNot2(right) ? FromNot(left, right) : IsAny2(left) ? FromAny(left, right) : IsArray4(left) ? FromArray4(left, right) : IsBigInt4(left) ? FromBigInt(left, right) : IsBoolean4(left) ? FromBoolean(left, right) : IsAsyncIterator4(left) ? FromAsyncIterator(left, right) : IsConstructor2(left) ? FromConstructor(left, right) : IsDate4(left) ? FromDate(left, right) : IsFunction4(left) ? FromFunction(left, right) : IsInteger3(left) ? FromInteger(left, right) : IsIntersect2(left) ? FromIntersect4(left, right) : IsIterator4(left) ? FromIterator(left, right) : IsLiteral2(left) ? FromLiteral2(left, right) : IsNever2(left) ? FromNever(left, right) : IsNull4(left) ? FromNull(left, right) : IsNumber4(left) ? FromNumber(left, right) : IsObject4(left) ? FromObject(left, right) : IsRecord2(left) ? FromRecord(left, right) : IsString4(left) ? FromString(left, right) : IsSymbol4(left) ? FromSymbol(left, right) : IsTuple2(left) ? FromTuple3(left, right) : IsPromise3(left) ? FromPromise2(left, right) : IsUint8Array4(left) ? FromUint8Array(left, right) : IsUndefined4(left) ? FromUndefined(left, right) : IsUnion2(left) ? FromUnion6(left, right) : IsUnknown2(left) ? FromUnknown(left, right) : IsVoid2(left) ? FromVoid(left, right) : Throw(`Unknown left type operand '${left[Kind]}'`);
}
function ExtendsCheck(left, right) {
  return Visit3(left, right);
}
var ExtendsResolverError, ExtendsResult;
var init_extends_check = __esm(() => {
  init_any2();
  init_function2();
  init_number2();
  init_string2();
  init_unknown2();
  init_template_literal2();
  init_patterns2();
  init_symbols2();
  init_error2();
  init_guard2();
  ExtendsResolverError = class ExtendsResolverError extends TypeBoxError {
  };
  (function(ExtendsResult) {
    ExtendsResult[ExtendsResult["Union"] = 0] = "Union";
    ExtendsResult[ExtendsResult["True"] = 1] = "True";
    ExtendsResult[ExtendsResult["False"] = 2] = "False";
  })(ExtendsResult || (ExtendsResult = {}));
});

// node_modules/@sinclair/typebox/build/esm/type/extends/extends-from-mapped-result.mjs
function FromProperties8(P, Right, True, False, options) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Extends(P[K2], Right, True, False, Clone(options));
  return Acc;
}
function FromMappedResult6(Left, Right, True, False, options) {
  return FromProperties8(Left.properties, Right, True, False, options);
}
function ExtendsFromMappedResult(Left, Right, True, False, options) {
  const P = FromMappedResult6(Left, Right, True, False, options);
  return MappedResult(P);
}
var init_extends_from_mapped_result = __esm(() => {
  init_mapped2();
  init_extends();
  init_value();
});

// node_modules/@sinclair/typebox/build/esm/type/extends/extends.mjs
function ExtendsResolve(left, right, trueType, falseType) {
  const R = ExtendsCheck(left, right);
  return R === ExtendsResult.Union ? Union([trueType, falseType]) : R === ExtendsResult.True ? trueType : falseType;
}
function Extends(L, R, T, F, options) {
  return IsMappedResult(L) ? ExtendsFromMappedResult(L, R, T, F, options) : IsMappedKey(L) ? CreateType(ExtendsFromMappedKey(L, R, T, F, options)) : CreateType(ExtendsResolve(L, R, T, F), options);
}
var init_extends = __esm(() => {
  init_type2();
  init_union2();
  init_extends_check();
  init_extends_from_mapped_key();
  init_extends_from_mapped_result();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/extends/extends-from-mapped-key.mjs
function FromPropertyKey(K, U, L, R, options) {
  return {
    [K]: Extends(Literal(K), U, L, R, Clone(options))
  };
}
function FromPropertyKeys(K, U, L, R, options) {
  return K.reduce((Acc, LK) => {
    return { ...Acc, ...FromPropertyKey(LK, U, L, R, options) };
  }, {});
}
function FromMappedKey2(K, U, L, R, options) {
  return FromPropertyKeys(K.keys, U, L, R, options);
}
function ExtendsFromMappedKey(T, U, L, R, options) {
  const P = FromMappedKey2(T, U, L, R, options);
  return MappedResult(P);
}
var init_extends_from_mapped_key = __esm(() => {
  init_mapped2();
  init_literal2();
  init_extends();
  init_value();
});

// node_modules/@sinclair/typebox/build/esm/type/extends/extends-undefined.mjs
function Intersect2(schema) {
  return schema.allOf.every((schema) => ExtendsUndefinedCheck(schema));
}
function Union2(schema) {
  return schema.anyOf.some((schema) => ExtendsUndefinedCheck(schema));
}
function Not(schema) {
  return !ExtendsUndefinedCheck(schema.not);
}
function ExtendsUndefinedCheck(schema) {
  return schema[Kind] === "Intersect" ? Intersect2(schema) : schema[Kind] === "Union" ? Union2(schema) : schema[Kind] === "Not" ? Not(schema) : schema[Kind] === "Undefined" ? true : false;
}
var init_extends_undefined = __esm(() => {
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/extends/index.mjs
var init_extends2 = __esm(() => {
  init_extends_check();
  init_extends_from_mapped_key();
  init_extends_from_mapped_result();
  init_extends_undefined();
  init_extends();
});

// node_modules/@sinclair/typebox/build/esm/type/exclude/exclude-from-template-literal.mjs
function ExcludeFromTemplateLiteral(L, R) {
  return Exclude(TemplateLiteralToUnion(L), R);
}
var init_exclude_from_template_literal = __esm(() => {
  init_exclude();
  init_template_literal2();
});

// node_modules/@sinclair/typebox/build/esm/type/exclude/exclude.mjs
function ExcludeRest(L, R) {
  const excluded = L.filter((inner) => ExtendsCheck(inner, R) === ExtendsResult.False);
  return excluded.length === 1 ? excluded[0] : Union(excluded);
}
function Exclude(L, R, options = {}) {
  if (IsTemplateLiteral(L))
    return CreateType(ExcludeFromTemplateLiteral(L, R), options);
  if (IsMappedResult(L))
    return CreateType(ExcludeFromMappedResult(L, R), options);
  return CreateType(IsUnion(L) ? ExcludeRest(L.anyOf, R) : ExtendsCheck(L, R) !== ExtendsResult.False ? Never() : L, options);
}
var init_exclude = __esm(() => {
  init_type2();
  init_union2();
  init_never2();
  init_extends2();
  init_exclude_from_mapped_result();
  init_exclude_from_template_literal();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/exclude/exclude-from-mapped-result.mjs
function FromProperties9(P, U) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Exclude(P[K2], U);
  return Acc;
}
function FromMappedResult7(R, T) {
  return FromProperties9(R.properties, T);
}
function ExcludeFromMappedResult(R, T) {
  const P = FromMappedResult7(R, T);
  return MappedResult(P);
}
var init_exclude_from_mapped_result = __esm(() => {
  init_mapped2();
  init_exclude();
});

// node_modules/@sinclair/typebox/build/esm/type/exclude/index.mjs
var init_exclude2 = __esm(() => {
  init_exclude_from_mapped_result();
  init_exclude_from_template_literal();
  init_exclude();
});

// node_modules/@sinclair/typebox/build/esm/type/extract/extract-from-template-literal.mjs
function ExtractFromTemplateLiteral(L, R) {
  return Extract(TemplateLiteralToUnion(L), R);
}
var init_extract_from_template_literal = __esm(() => {
  init_extract();
  init_template_literal2();
});

// node_modules/@sinclair/typebox/build/esm/type/extract/extract.mjs
function ExtractRest(L, R) {
  const extracted = L.filter((inner) => ExtendsCheck(inner, R) !== ExtendsResult.False);
  return extracted.length === 1 ? extracted[0] : Union(extracted);
}
function Extract(L, R, options) {
  if (IsTemplateLiteral(L))
    return CreateType(ExtractFromTemplateLiteral(L, R), options);
  if (IsMappedResult(L))
    return CreateType(ExtractFromMappedResult(L, R), options);
  return CreateType(IsUnion(L) ? ExtractRest(L.anyOf, R) : ExtendsCheck(L, R) !== ExtendsResult.False ? L : Never(), options);
}
var init_extract = __esm(() => {
  init_type2();
  init_union2();
  init_never2();
  init_extends2();
  init_extract_from_mapped_result();
  init_extract_from_template_literal();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/extract/extract-from-mapped-result.mjs
function FromProperties10(P, T) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Extract(P[K2], T);
  return Acc;
}
function FromMappedResult8(R, T) {
  return FromProperties10(R.properties, T);
}
function ExtractFromMappedResult(R, T) {
  const P = FromMappedResult8(R, T);
  return MappedResult(P);
}
var init_extract_from_mapped_result = __esm(() => {
  init_mapped2();
  init_extract();
});

// node_modules/@sinclair/typebox/build/esm/type/extract/index.mjs
var init_extract2 = __esm(() => {
  init_extract_from_mapped_result();
  init_extract_from_template_literal();
  init_extract();
});

// node_modules/@sinclair/typebox/build/esm/type/instance-type/instance-type.mjs
function InstanceType(schema, options) {
  return IsConstructor(schema) ? CreateType(schema.returns, options) : Never(options);
}
var init_instance_type = __esm(() => {
  init_type2();
  init_never2();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/instance-type/index.mjs
var init_instance_type2 = __esm(() => {
  init_instance_type();
});

// node_modules/@sinclair/typebox/build/esm/type/readonly-optional/readonly-optional.mjs
function ReadonlyOptional(schema) {
  return Readonly(Optional(schema));
}
var init_readonly_optional = __esm(() => {
  init_readonly2();
  init_optional2();
});

// node_modules/@sinclair/typebox/build/esm/type/readonly-optional/index.mjs
var init_readonly_optional2 = __esm(() => {
  init_readonly_optional();
});

// node_modules/@sinclair/typebox/build/esm/type/record/record.mjs
function RecordCreateFromPattern(pattern, T, options) {
  return CreateType({ [Kind]: "Record", type: "object", patternProperties: { [pattern]: T } }, options);
}
function RecordCreateFromKeys(K, T, options) {
  const result = {};
  for (const K2 of K)
    result[K2] = T;
  return Object2(result, { ...options, [Hint]: "Record" });
}
function FromTemplateLiteralKey(K, T, options) {
  return IsTemplateLiteralFinite(K) ? RecordCreateFromKeys(IndexPropertyKeys(K), T, options) : RecordCreateFromPattern(K.pattern, T, options);
}
function FromUnionKey(key, type, options) {
  return RecordCreateFromKeys(IndexPropertyKeys(Union(key)), type, options);
}
function FromLiteralKey(key, type, options) {
  return RecordCreateFromKeys([key.toString()], type, options);
}
function FromRegExpKey(key, type, options) {
  return RecordCreateFromPattern(key.source, type, options);
}
function FromStringKey(key, type, options) {
  const pattern = IsUndefined(key.pattern) ? PatternStringExact : key.pattern;
  return RecordCreateFromPattern(pattern, type, options);
}
function FromAnyKey(_, type, options) {
  return RecordCreateFromPattern(PatternStringExact, type, options);
}
function FromNeverKey(_key, type, options) {
  return RecordCreateFromPattern(PatternNeverExact, type, options);
}
function FromBooleanKey(_key, type, options) {
  return Object2({ true: type, false: type }, options);
}
function FromIntegerKey(_key, type, options) {
  return RecordCreateFromPattern(PatternNumberExact, type, options);
}
function FromNumberKey(_, type, options) {
  return RecordCreateFromPattern(PatternNumberExact, type, options);
}
function Record(key, type, options = {}) {
  return IsUnion(key) ? FromUnionKey(key.anyOf, type, options) : IsTemplateLiteral(key) ? FromTemplateLiteralKey(key, type, options) : IsLiteral(key) ? FromLiteralKey(key.const, type, options) : IsBoolean3(key) ? FromBooleanKey(key, type, options) : IsInteger2(key) ? FromIntegerKey(key, type, options) : IsNumber3(key) ? FromNumberKey(key, type, options) : IsRegExp2(key) ? FromRegExpKey(key, type, options) : IsString3(key) ? FromStringKey(key, type, options) : IsAny(key) ? FromAnyKey(key, type, options) : IsNever(key) ? FromNeverKey(key, type, options) : Never(options);
}
function RecordPattern(record) {
  return globalThis.Object.getOwnPropertyNames(record.patternProperties)[0];
}
function RecordKey2(type) {
  const pattern = RecordPattern(type);
  return pattern === PatternStringExact ? String2() : pattern === PatternNumberExact ? Number2() : String2({ pattern });
}
function RecordValue2(type) {
  return type.patternProperties[RecordPattern(type)];
}
var init_record = __esm(() => {
  init_type2();
  init_symbols2();
  init_never2();
  init_number2();
  init_object2();
  init_string2();
  init_union2();
  init_template_literal2();
  init_patterns2();
  init_indexed2();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/record/index.mjs
var init_record2 = __esm(() => {
  init_record();
});

// node_modules/@sinclair/typebox/build/esm/type/instantiate/instantiate.mjs
function FromConstructor2(args, type) {
  type.parameters = FromTypes(args, type.parameters);
  type.returns = FromType(args, type.returns);
  return type;
}
function FromFunction2(args, type) {
  type.parameters = FromTypes(args, type.parameters);
  type.returns = FromType(args, type.returns);
  return type;
}
function FromIntersect5(args, type) {
  type.allOf = FromTypes(args, type.allOf);
  return type;
}
function FromUnion7(args, type) {
  type.anyOf = FromTypes(args, type.anyOf);
  return type;
}
function FromTuple4(args, type) {
  if (IsUndefined(type.items))
    return type;
  type.items = FromTypes(args, type.items);
  return type;
}
function FromArray5(args, type) {
  type.items = FromType(args, type.items);
  return type;
}
function FromAsyncIterator2(args, type) {
  type.items = FromType(args, type.items);
  return type;
}
function FromIterator2(args, type) {
  type.items = FromType(args, type.items);
  return type;
}
function FromPromise3(args, type) {
  type.item = FromType(args, type.item);
  return type;
}
function FromObject2(args, type) {
  const mappedProperties = FromProperties11(args, type.properties);
  return { ...type, ...Object2(mappedProperties) };
}
function FromRecord2(args, type) {
  const mappedKey = FromType(args, RecordKey2(type));
  const mappedValue = FromType(args, RecordValue2(type));
  const result = Record(mappedKey, mappedValue);
  return { ...type, ...result };
}
function FromArgument(args, argument) {
  return argument.index in args ? args[argument.index] : Unknown();
}
function FromProperty2(args, type) {
  const isReadonly = IsReadonly(type);
  const isOptional = IsOptional(type);
  const mapped = FromType(args, type);
  return isReadonly && isOptional ? ReadonlyOptional(mapped) : isReadonly && !isOptional ? Readonly(mapped) : !isReadonly && isOptional ? Optional(mapped) : mapped;
}
function FromProperties11(args, properties) {
  return globalThis.Object.getOwnPropertyNames(properties).reduce((result, key) => {
    return { ...result, [key]: FromProperty2(args, properties[key]) };
  }, {});
}
function FromTypes(args, types) {
  return types.map((type) => FromType(args, type));
}
function FromType(args, type) {
  return IsConstructor(type) ? FromConstructor2(args, type) : IsFunction3(type) ? FromFunction2(args, type) : IsIntersect(type) ? FromIntersect5(args, type) : IsUnion(type) ? FromUnion7(args, type) : IsTuple(type) ? FromTuple4(args, type) : IsArray3(type) ? FromArray5(args, type) : IsAsyncIterator3(type) ? FromAsyncIterator2(args, type) : IsIterator3(type) ? FromIterator2(args, type) : IsPromise2(type) ? FromPromise3(args, type) : IsObject3(type) ? FromObject2(args, type) : IsRecord(type) ? FromRecord2(args, type) : IsArgument(type) ? FromArgument(args, type) : type;
}
function Instantiate(type, args) {
  return FromType(args, CloneType(type));
}
var init_instantiate = __esm(() => {
  init_type();
  init_unknown2();
  init_readonly_optional2();
  init_readonly2();
  init_optional2();
  init_object2();
  init_record2();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/instantiate/index.mjs
var init_instantiate2 = __esm(() => {
  init_instantiate();
});

// node_modules/@sinclair/typebox/build/esm/type/integer/integer.mjs
function Integer(options) {
  return CreateType({ [Kind]: "Integer", type: "integer" }, options);
}
var init_integer = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/integer/index.mjs
var init_integer2 = __esm(() => {
  init_integer();
});

// node_modules/@sinclair/typebox/build/esm/type/intrinsic/intrinsic-from-mapped-key.mjs
function MappedIntrinsicPropertyKey(K, M, options) {
  return {
    [K]: Intrinsic(Literal(K), M, Clone(options))
  };
}
function MappedIntrinsicPropertyKeys(K, M, options) {
  const result = K.reduce((Acc, L) => {
    return { ...Acc, ...MappedIntrinsicPropertyKey(L, M, options) };
  }, {});
  return result;
}
function MappedIntrinsicProperties(T, M, options) {
  return MappedIntrinsicPropertyKeys(T["keys"], M, options);
}
function IntrinsicFromMappedKey(T, M, options) {
  const P = MappedIntrinsicProperties(T, M, options);
  return MappedResult(P);
}
var init_intrinsic_from_mapped_key = __esm(() => {
  init_mapped2();
  init_intrinsic();
  init_literal2();
  init_value();
});

// node_modules/@sinclair/typebox/build/esm/type/intrinsic/intrinsic.mjs
function ApplyUncapitalize(value) {
  const [first, rest] = [value.slice(0, 1), value.slice(1)];
  return [first.toLowerCase(), rest].join("");
}
function ApplyCapitalize(value) {
  const [first, rest] = [value.slice(0, 1), value.slice(1)];
  return [first.toUpperCase(), rest].join("");
}
function ApplyUppercase(value) {
  return value.toUpperCase();
}
function ApplyLowercase(value) {
  return value.toLowerCase();
}
function FromTemplateLiteral3(schema, mode, options) {
  const expression = TemplateLiteralParseExact(schema.pattern);
  const finite = IsTemplateLiteralExpressionFinite(expression);
  if (!finite)
    return { ...schema, pattern: FromLiteralValue(schema.pattern, mode) };
  const strings = [...TemplateLiteralExpressionGenerate(expression)];
  const literals = strings.map((value) => Literal(value));
  const mapped = FromRest5(literals, mode);
  const union = Union(mapped);
  return TemplateLiteral([union], options);
}
function FromLiteralValue(value, mode) {
  return typeof value === "string" ? mode === "Uncapitalize" ? ApplyUncapitalize(value) : mode === "Capitalize" ? ApplyCapitalize(value) : mode === "Uppercase" ? ApplyUppercase(value) : mode === "Lowercase" ? ApplyLowercase(value) : value : value.toString();
}
function FromRest5(T, M) {
  return T.map((L) => Intrinsic(L, M));
}
function Intrinsic(schema, mode, options = {}) {
  return IsMappedKey(schema) ? IntrinsicFromMappedKey(schema, mode, options) : IsTemplateLiteral(schema) ? FromTemplateLiteral3(schema, mode, options) : IsUnion(schema) ? Union(FromRest5(schema.anyOf, mode), options) : IsLiteral(schema) ? Literal(FromLiteralValue(schema.const, mode), options) : CreateType(schema, options);
}
var init_intrinsic = __esm(() => {
  init_type2();
  init_template_literal2();
  init_intrinsic_from_mapped_key();
  init_literal2();
  init_union2();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/intrinsic/capitalize.mjs
function Capitalize(T, options = {}) {
  return Intrinsic(T, "Capitalize", options);
}
var init_capitalize = __esm(() => {
  init_intrinsic();
});

// node_modules/@sinclair/typebox/build/esm/type/intrinsic/lowercase.mjs
function Lowercase(T, options = {}) {
  return Intrinsic(T, "Lowercase", options);
}
var init_lowercase = __esm(() => {
  init_intrinsic();
});

// node_modules/@sinclair/typebox/build/esm/type/intrinsic/uncapitalize.mjs
function Uncapitalize(T, options = {}) {
  return Intrinsic(T, "Uncapitalize", options);
}
var init_uncapitalize = __esm(() => {
  init_intrinsic();
});

// node_modules/@sinclair/typebox/build/esm/type/intrinsic/uppercase.mjs
function Uppercase(T, options = {}) {
  return Intrinsic(T, "Uppercase", options);
}
var init_uppercase = __esm(() => {
  init_intrinsic();
});

// node_modules/@sinclair/typebox/build/esm/type/intrinsic/index.mjs
var init_intrinsic2 = __esm(() => {
  init_capitalize();
  init_intrinsic_from_mapped_key();
  init_intrinsic();
  init_lowercase();
  init_uncapitalize();
  init_uppercase();
});

// node_modules/@sinclair/typebox/build/esm/type/omit/omit-from-mapped-result.mjs
function FromProperties12(properties, propertyKeys, options) {
  const result = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(properties))
    result[K2] = Omit(properties[K2], propertyKeys, Clone(options));
  return result;
}
function FromMappedResult9(mappedResult, propertyKeys, options) {
  return FromProperties12(mappedResult.properties, propertyKeys, options);
}
function OmitFromMappedResult(mappedResult, propertyKeys, options) {
  const properties = FromMappedResult9(mappedResult, propertyKeys, options);
  return MappedResult(properties);
}
var init_omit_from_mapped_result = __esm(() => {
  init_mapped2();
  init_omit();
  init_value();
});

// node_modules/@sinclair/typebox/build/esm/type/omit/omit.mjs
function FromIntersect6(types, propertyKeys) {
  return types.map((type) => OmitResolve(type, propertyKeys));
}
function FromUnion8(types, propertyKeys) {
  return types.map((type) => OmitResolve(type, propertyKeys));
}
function FromProperty3(properties, key) {
  const { [key]: _, ...R } = properties;
  return R;
}
function FromProperties13(properties, propertyKeys) {
  return propertyKeys.reduce((T, K2) => FromProperty3(T, K2), properties);
}
function FromObject3(type, propertyKeys, properties) {
  const options = Discard(type, [TransformKind, "$id", "required", "properties"]);
  const mappedProperties = FromProperties13(properties, propertyKeys);
  return Object2(mappedProperties, options);
}
function UnionFromPropertyKeys(propertyKeys) {
  const result = propertyKeys.reduce((result, key) => IsLiteralValue(key) ? [...result, Literal(key)] : result, []);
  return Union(result);
}
function OmitResolve(type, propertyKeys) {
  return IsIntersect(type) ? Intersect(FromIntersect6(type.allOf, propertyKeys)) : IsUnion(type) ? Union(FromUnion8(type.anyOf, propertyKeys)) : IsObject3(type) ? FromObject3(type, propertyKeys, type.properties) : Object2({});
}
function Omit(type, key, options) {
  const typeKey = IsArray(key) ? UnionFromPropertyKeys(key) : key;
  const propertyKeys = IsSchema(key) ? IndexPropertyKeys(key) : key;
  const isTypeRef = IsRef(type);
  const isKeyRef = IsRef(key);
  return IsMappedResult(type) ? OmitFromMappedResult(type, propertyKeys, options) : IsMappedKey(key) ? OmitFromMappedKey(type, key, options) : isTypeRef && isKeyRef ? Computed("Omit", [type, typeKey], options) : !isTypeRef && isKeyRef ? Computed("Omit", [type, typeKey], options) : isTypeRef && !isKeyRef ? Computed("Omit", [type, typeKey], options) : CreateType({ ...OmitResolve(type, propertyKeys), ...options });
}
var init_omit = __esm(() => {
  init_type2();
  init_symbols();
  init_computed2();
  init_literal2();
  init_indexed2();
  init_intersect2();
  init_union2();
  init_object2();
  init_omit_from_mapped_key();
  init_omit_from_mapped_result();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/omit/omit-from-mapped-key.mjs
function FromPropertyKey2(type, key, options) {
  return { [key]: Omit(type, [key], Clone(options)) };
}
function FromPropertyKeys2(type, propertyKeys, options) {
  return propertyKeys.reduce((Acc, LK) => {
    return { ...Acc, ...FromPropertyKey2(type, LK, options) };
  }, {});
}
function FromMappedKey3(type, mappedKey, options) {
  return FromPropertyKeys2(type, mappedKey.keys, options);
}
function OmitFromMappedKey(type, mappedKey, options) {
  const properties = FromMappedKey3(type, mappedKey, options);
  return MappedResult(properties);
}
var init_omit_from_mapped_key = __esm(() => {
  init_mapped2();
  init_omit();
  init_value();
});

// node_modules/@sinclair/typebox/build/esm/type/omit/index.mjs
var init_omit2 = __esm(() => {
  init_omit_from_mapped_key();
  init_omit_from_mapped_result();
  init_omit();
});

// node_modules/@sinclair/typebox/build/esm/type/pick/pick-from-mapped-result.mjs
function FromProperties14(properties, propertyKeys, options) {
  const result = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(properties))
    result[K2] = Pick(properties[K2], propertyKeys, Clone(options));
  return result;
}
function FromMappedResult10(mappedResult, propertyKeys, options) {
  return FromProperties14(mappedResult.properties, propertyKeys, options);
}
function PickFromMappedResult(mappedResult, propertyKeys, options) {
  const properties = FromMappedResult10(mappedResult, propertyKeys, options);
  return MappedResult(properties);
}
var init_pick_from_mapped_result = __esm(() => {
  init_mapped2();
  init_pick();
  init_value();
});

// node_modules/@sinclair/typebox/build/esm/type/pick/pick.mjs
function FromIntersect7(types, propertyKeys) {
  return types.map((type) => PickResolve(type, propertyKeys));
}
function FromUnion9(types, propertyKeys) {
  return types.map((type) => PickResolve(type, propertyKeys));
}
function FromProperties15(properties, propertyKeys) {
  const result = {};
  for (const K2 of propertyKeys)
    if (K2 in properties)
      result[K2] = properties[K2];
  return result;
}
function FromObject4(Type, keys, properties) {
  const options = Discard(Type, [TransformKind, "$id", "required", "properties"]);
  const mappedProperties = FromProperties15(properties, keys);
  return Object2(mappedProperties, options);
}
function UnionFromPropertyKeys2(propertyKeys) {
  const result = propertyKeys.reduce((result, key) => IsLiteralValue(key) ? [...result, Literal(key)] : result, []);
  return Union(result);
}
function PickResolve(type, propertyKeys) {
  return IsIntersect(type) ? Intersect(FromIntersect7(type.allOf, propertyKeys)) : IsUnion(type) ? Union(FromUnion9(type.anyOf, propertyKeys)) : IsObject3(type) ? FromObject4(type, propertyKeys, type.properties) : Object2({});
}
function Pick(type, key, options) {
  const typeKey = IsArray(key) ? UnionFromPropertyKeys2(key) : key;
  const propertyKeys = IsSchema(key) ? IndexPropertyKeys(key) : key;
  const isTypeRef = IsRef(type);
  const isKeyRef = IsRef(key);
  return IsMappedResult(type) ? PickFromMappedResult(type, propertyKeys, options) : IsMappedKey(key) ? PickFromMappedKey(type, key, options) : isTypeRef && isKeyRef ? Computed("Pick", [type, typeKey], options) : !isTypeRef && isKeyRef ? Computed("Pick", [type, typeKey], options) : isTypeRef && !isKeyRef ? Computed("Pick", [type, typeKey], options) : CreateType({ ...PickResolve(type, propertyKeys), ...options });
}
var init_pick = __esm(() => {
  init_type2();
  init_computed2();
  init_intersect2();
  init_literal2();
  init_object2();
  init_union2();
  init_indexed2();
  init_symbols();
  init_kind();
  init_pick_from_mapped_key();
  init_pick_from_mapped_result();
});

// node_modules/@sinclair/typebox/build/esm/type/pick/pick-from-mapped-key.mjs
function FromPropertyKey3(type, key, options) {
  return {
    [key]: Pick(type, [key], Clone(options))
  };
}
function FromPropertyKeys3(type, propertyKeys, options) {
  return propertyKeys.reduce((result, leftKey) => {
    return { ...result, ...FromPropertyKey3(type, leftKey, options) };
  }, {});
}
function FromMappedKey4(type, mappedKey, options) {
  return FromPropertyKeys3(type, mappedKey.keys, options);
}
function PickFromMappedKey(type, mappedKey, options) {
  const properties = FromMappedKey4(type, mappedKey, options);
  return MappedResult(properties);
}
var init_pick_from_mapped_key = __esm(() => {
  init_mapped2();
  init_pick();
  init_value();
});

// node_modules/@sinclair/typebox/build/esm/type/pick/index.mjs
var init_pick2 = __esm(() => {
  init_pick_from_mapped_key();
  init_pick_from_mapped_result();
  init_pick();
});

// node_modules/@sinclair/typebox/build/esm/type/partial/partial.mjs
function FromComputed3(target, parameters) {
  return Computed("Partial", [Computed(target, parameters)]);
}
function FromRef3($ref) {
  return Computed("Partial", [Ref($ref)]);
}
function FromProperties16(properties) {
  const partialProperties = {};
  for (const K of globalThis.Object.getOwnPropertyNames(properties))
    partialProperties[K] = Optional(properties[K]);
  return partialProperties;
}
function FromObject5(type, properties) {
  const options = Discard(type, [TransformKind, "$id", "required", "properties"]);
  const mappedProperties = FromProperties16(properties);
  return Object2(mappedProperties, options);
}
function FromRest6(types) {
  return types.map((type) => PartialResolve(type));
}
function PartialResolve(type) {
  return IsComputed(type) ? FromComputed3(type.target, type.parameters) : IsRef(type) ? FromRef3(type.$ref) : IsIntersect(type) ? Intersect(FromRest6(type.allOf)) : IsUnion(type) ? Union(FromRest6(type.anyOf)) : IsObject3(type) ? FromObject5(type, type.properties) : IsBigInt3(type) ? type : IsBoolean3(type) ? type : IsInteger2(type) ? type : IsLiteral(type) ? type : IsNull3(type) ? type : IsNumber3(type) ? type : IsString3(type) ? type : IsSymbol3(type) ? type : IsUndefined3(type) ? type : Object2({});
}
function Partial(type, options) {
  if (IsMappedResult(type)) {
    return PartialFromMappedResult(type, options);
  } else {
    return CreateType({ ...PartialResolve(type), ...options });
  }
}
var init_partial = __esm(() => {
  init_type2();
  init_computed2();
  init_optional2();
  init_object2();
  init_intersect2();
  init_union2();
  init_ref2();
  init_discard();
  init_symbols2();
  init_partial_from_mapped_result();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/partial/partial-from-mapped-result.mjs
function FromProperties17(K, options) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(K))
    Acc[K2] = Partial(K[K2], Clone(options));
  return Acc;
}
function FromMappedResult11(R, options) {
  return FromProperties17(R.properties, options);
}
function PartialFromMappedResult(R, options) {
  const P = FromMappedResult11(R, options);
  return MappedResult(P);
}
var init_partial_from_mapped_result = __esm(() => {
  init_mapped2();
  init_partial();
  init_value();
});

// node_modules/@sinclair/typebox/build/esm/type/partial/index.mjs
var init_partial2 = __esm(() => {
  init_partial_from_mapped_result();
  init_partial();
});

// node_modules/@sinclair/typebox/build/esm/type/required/required.mjs
function FromComputed4(target, parameters) {
  return Computed("Required", [Computed(target, parameters)]);
}
function FromRef4($ref) {
  return Computed("Required", [Ref($ref)]);
}
function FromProperties18(properties) {
  const requiredProperties = {};
  for (const K of globalThis.Object.getOwnPropertyNames(properties))
    requiredProperties[K] = Discard(properties[K], [OptionalKind]);
  return requiredProperties;
}
function FromObject6(type, properties) {
  const options = Discard(type, [TransformKind, "$id", "required", "properties"]);
  const mappedProperties = FromProperties18(properties);
  return Object2(mappedProperties, options);
}
function FromRest7(types) {
  return types.map((type) => RequiredResolve(type));
}
function RequiredResolve(type) {
  return IsComputed(type) ? FromComputed4(type.target, type.parameters) : IsRef(type) ? FromRef4(type.$ref) : IsIntersect(type) ? Intersect(FromRest7(type.allOf)) : IsUnion(type) ? Union(FromRest7(type.anyOf)) : IsObject3(type) ? FromObject6(type, type.properties) : IsBigInt3(type) ? type : IsBoolean3(type) ? type : IsInteger2(type) ? type : IsLiteral(type) ? type : IsNull3(type) ? type : IsNumber3(type) ? type : IsString3(type) ? type : IsSymbol3(type) ? type : IsUndefined3(type) ? type : Object2({});
}
function Required(type, options) {
  if (IsMappedResult(type)) {
    return RequiredFromMappedResult(type, options);
  } else {
    return CreateType({ ...RequiredResolve(type), ...options });
  }
}
var init_required = __esm(() => {
  init_type2();
  init_computed2();
  init_object2();
  init_intersect2();
  init_union2();
  init_ref2();
  init_symbols2();
  init_discard();
  init_required_from_mapped_result();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/required/required-from-mapped-result.mjs
function FromProperties19(P, options) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Required(P[K2], options);
  return Acc;
}
function FromMappedResult12(R, options) {
  return FromProperties19(R.properties, options);
}
function RequiredFromMappedResult(R, options) {
  const P = FromMappedResult12(R, options);
  return MappedResult(P);
}
var init_required_from_mapped_result = __esm(() => {
  init_mapped2();
  init_required();
});

// node_modules/@sinclair/typebox/build/esm/type/required/index.mjs
var init_required2 = __esm(() => {
  init_required_from_mapped_result();
  init_required();
});

// node_modules/@sinclair/typebox/build/esm/type/module/compute.mjs
function DereferenceParameters(moduleProperties, types) {
  return types.map((type) => {
    return IsRef(type) ? Dereference(moduleProperties, type.$ref) : FromType2(moduleProperties, type);
  });
}
function Dereference(moduleProperties, ref) {
  return ref in moduleProperties ? IsRef(moduleProperties[ref]) ? Dereference(moduleProperties, moduleProperties[ref].$ref) : FromType2(moduleProperties, moduleProperties[ref]) : Never();
}
function FromAwaited(parameters) {
  return Awaited(parameters[0]);
}
function FromIndex(parameters) {
  return Index(parameters[0], parameters[1]);
}
function FromKeyOf(parameters) {
  return KeyOf(parameters[0]);
}
function FromPartial(parameters) {
  return Partial(parameters[0]);
}
function FromOmit(parameters) {
  return Omit(parameters[0], parameters[1]);
}
function FromPick(parameters) {
  return Pick(parameters[0], parameters[1]);
}
function FromRequired(parameters) {
  return Required(parameters[0]);
}
function FromComputed5(moduleProperties, target, parameters) {
  const dereferenced = DereferenceParameters(moduleProperties, parameters);
  return target === "Awaited" ? FromAwaited(dereferenced) : target === "Index" ? FromIndex(dereferenced) : target === "KeyOf" ? FromKeyOf(dereferenced) : target === "Partial" ? FromPartial(dereferenced) : target === "Omit" ? FromOmit(dereferenced) : target === "Pick" ? FromPick(dereferenced) : target === "Required" ? FromRequired(dereferenced) : Never();
}
function FromArray6(moduleProperties, type) {
  return Array2(FromType2(moduleProperties, type));
}
function FromAsyncIterator3(moduleProperties, type) {
  return AsyncIterator(FromType2(moduleProperties, type));
}
function FromConstructor3(moduleProperties, parameters, instanceType) {
  return Constructor(FromTypes2(moduleProperties, parameters), FromType2(moduleProperties, instanceType));
}
function FromFunction3(moduleProperties, parameters, returnType) {
  return Function(FromTypes2(moduleProperties, parameters), FromType2(moduleProperties, returnType));
}
function FromIntersect8(moduleProperties, types) {
  return Intersect(FromTypes2(moduleProperties, types));
}
function FromIterator3(moduleProperties, type) {
  return Iterator(FromType2(moduleProperties, type));
}
function FromObject7(moduleProperties, properties) {
  return Object2(globalThis.Object.keys(properties).reduce((result, key) => {
    return { ...result, [key]: FromType2(moduleProperties, properties[key]) };
  }, {}));
}
function FromRecord3(moduleProperties, type) {
  const [value, pattern] = [FromType2(moduleProperties, RecordValue2(type)), RecordPattern(type)];
  const result = CloneType(type);
  result.patternProperties[pattern] = value;
  return result;
}
function FromTransform(moduleProperties, transform) {
  return IsRef(transform) ? { ...Dereference(moduleProperties, transform.$ref), [TransformKind]: transform[TransformKind] } : transform;
}
function FromTuple5(moduleProperties, types) {
  return Tuple(FromTypes2(moduleProperties, types));
}
function FromUnion10(moduleProperties, types) {
  return Union(FromTypes2(moduleProperties, types));
}
function FromTypes2(moduleProperties, types) {
  return types.map((type) => FromType2(moduleProperties, type));
}
function FromType2(moduleProperties, type) {
  return IsOptional(type) ? CreateType(FromType2(moduleProperties, Discard(type, [OptionalKind])), type) : IsReadonly(type) ? CreateType(FromType2(moduleProperties, Discard(type, [ReadonlyKind])), type) : IsTransform(type) ? CreateType(FromTransform(moduleProperties, type), type) : IsArray3(type) ? CreateType(FromArray6(moduleProperties, type.items), type) : IsAsyncIterator3(type) ? CreateType(FromAsyncIterator3(moduleProperties, type.items), type) : IsComputed(type) ? CreateType(FromComputed5(moduleProperties, type.target, type.parameters)) : IsConstructor(type) ? CreateType(FromConstructor3(moduleProperties, type.parameters, type.returns), type) : IsFunction3(type) ? CreateType(FromFunction3(moduleProperties, type.parameters, type.returns), type) : IsIntersect(type) ? CreateType(FromIntersect8(moduleProperties, type.allOf), type) : IsIterator3(type) ? CreateType(FromIterator3(moduleProperties, type.items), type) : IsObject3(type) ? CreateType(FromObject7(moduleProperties, type.properties), type) : IsRecord(type) ? CreateType(FromRecord3(moduleProperties, type)) : IsTuple(type) ? CreateType(FromTuple5(moduleProperties, type.items || []), type) : IsUnion(type) ? CreateType(FromUnion10(moduleProperties, type.anyOf), type) : type;
}
function ComputeType(moduleProperties, key) {
  return key in moduleProperties ? FromType2(moduleProperties, moduleProperties[key]) : Never();
}
function ComputeModuleProperties(moduleProperties) {
  return globalThis.Object.getOwnPropertyNames(moduleProperties).reduce((result, key) => {
    return { ...result, [key]: ComputeType(moduleProperties, key) };
  }, {});
}
var init_compute = __esm(() => {
  init_create();
  init_clone();
  init_discard();
  init_array2();
  init_awaited2();
  init_async_iterator2();
  init_constructor2();
  init_indexed2();
  init_function2();
  init_intersect2();
  init_iterator2();
  init_keyof2();
  init_object2();
  init_omit2();
  init_pick2();
  init_never2();
  init_partial2();
  init_record2();
  init_required2();
  init_tuple2();
  init_union2();
  init_symbols2();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/module/module.mjs
class TModule {
  constructor($defs) {
    const computed = ComputeModuleProperties($defs);
    const identified = this.WithIdentifiers(computed);
    this.$defs = identified;
  }
  Import(key, options) {
    const $defs = { ...this.$defs, [key]: CreateType(this.$defs[key], options) };
    return CreateType({ [Kind]: "Import", $defs, $ref: key });
  }
  WithIdentifiers($defs) {
    return globalThis.Object.getOwnPropertyNames($defs).reduce((result, key) => {
      return { ...result, [key]: { ...$defs[key], $id: key } };
    }, {});
  }
}
function Module(properties) {
  return new TModule(properties);
}
var init_module = __esm(() => {
  init_create();
  init_symbols2();
  init_compute();
});

// node_modules/@sinclair/typebox/build/esm/type/module/index.mjs
var init_module2 = __esm(() => {
  init_module();
});

// node_modules/@sinclair/typebox/build/esm/type/not/not.mjs
function Not2(type, options) {
  return CreateType({ [Kind]: "Not", not: type }, options);
}
var init_not = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/not/index.mjs
var init_not2 = __esm(() => {
  init_not();
});

// node_modules/@sinclair/typebox/build/esm/type/parameters/parameters.mjs
function Parameters(schema, options) {
  return IsFunction3(schema) ? Tuple(schema.parameters, options) : Never();
}
var init_parameters = __esm(() => {
  init_tuple2();
  init_never2();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/parameters/index.mjs
var init_parameters2 = __esm(() => {
  init_parameters();
});

// node_modules/@sinclair/typebox/build/esm/type/recursive/recursive.mjs
function Recursive(callback, options = {}) {
  if (IsUndefined(options.$id))
    options.$id = `T${Ordinal++}`;
  const thisType = CloneType(callback({ [Kind]: "This", $ref: `${options.$id}` }));
  thisType.$id = options.$id;
  return CreateType({ [Hint]: "Recursive", ...thisType }, options);
}
var Ordinal = 0;
var init_recursive = __esm(() => {
  init_type();
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/recursive/index.mjs
var init_recursive2 = __esm(() => {
  init_recursive();
});

// node_modules/@sinclair/typebox/build/esm/type/regexp/regexp.mjs
function RegExp2(unresolved, options) {
  const expr = IsString(unresolved) ? new globalThis.RegExp(unresolved) : unresolved;
  return CreateType({ [Kind]: "RegExp", type: "RegExp", source: expr.source, flags: expr.flags }, options);
}
var init_regexp = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/regexp/index.mjs
var init_regexp2 = __esm(() => {
  init_regexp();
});

// node_modules/@sinclair/typebox/build/esm/type/rest/rest.mjs
function RestResolve(T) {
  return IsIntersect(T) ? T.allOf : IsUnion(T) ? T.anyOf : IsTuple(T) ? T.items ?? [] : [];
}
function Rest(T) {
  return RestResolve(T);
}
var init_rest = __esm(() => {
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/rest/index.mjs
var init_rest2 = __esm(() => {
  init_rest();
});

// node_modules/@sinclair/typebox/build/esm/type/return-type/return-type.mjs
function ReturnType(schema, options) {
  return IsFunction3(schema) ? CreateType(schema.returns, options) : Never(options);
}
var init_return_type = __esm(() => {
  init_type2();
  init_never2();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/return-type/index.mjs
var init_return_type2 = __esm(() => {
  init_return_type();
});

// node_modules/@sinclair/typebox/build/esm/type/schema/anyschema.mjs
var init_anyschema = () => {};

// node_modules/@sinclair/typebox/build/esm/type/schema/schema.mjs
var init_schema = () => {};

// node_modules/@sinclair/typebox/build/esm/type/schema/index.mjs
var init_schema2 = __esm(() => {
  init_anyschema();
  init_schema();
});

// node_modules/@sinclair/typebox/build/esm/type/static/static.mjs
var init_static = () => {};

// node_modules/@sinclair/typebox/build/esm/type/static/index.mjs
var init_static2 = __esm(() => {
  init_static();
});

// node_modules/@sinclair/typebox/build/esm/type/transform/transform.mjs
class TransformDecodeBuilder {
  constructor(schema) {
    this.schema = schema;
  }
  Decode(decode) {
    return new TransformEncodeBuilder(this.schema, decode);
  }
}

class TransformEncodeBuilder {
  constructor(schema, decode) {
    this.schema = schema;
    this.decode = decode;
  }
  EncodeTransform(encode, schema) {
    const Encode = (value) => schema[TransformKind].Encode(encode(value));
    const Decode = (value) => this.decode(schema[TransformKind].Decode(value));
    const Codec = { Encode, Decode };
    return { ...schema, [TransformKind]: Codec };
  }
  EncodeSchema(encode, schema) {
    const Codec = { Decode: this.decode, Encode: encode };
    return { ...schema, [TransformKind]: Codec };
  }
  Encode(encode) {
    return IsTransform(this.schema) ? this.EncodeTransform(encode, this.schema) : this.EncodeSchema(encode, this.schema);
  }
}
function Transform(schema) {
  return new TransformDecodeBuilder(schema);
}
var init_transform = __esm(() => {
  init_symbols2();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/transform/index.mjs
var init_transform2 = __esm(() => {
  init_transform();
});

// node_modules/@sinclair/typebox/build/esm/type/unsafe/unsafe.mjs
function Unsafe(options = {}) {
  return CreateType({ [Kind]: options[Kind] ?? "Unsafe" }, options);
}
var init_unsafe = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/unsafe/index.mjs
var init_unsafe2 = __esm(() => {
  init_unsafe();
});

// node_modules/@sinclair/typebox/build/esm/type/void/void.mjs
function Void(options) {
  return CreateType({ [Kind]: "Void", type: "void" }, options);
}
var init_void = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/void/index.mjs
var init_void2 = __esm(() => {
  init_void();
});

// node_modules/@sinclair/typebox/build/esm/type/type/type.mjs
var exports_type3 = {};
__export(exports_type3, {
  Any: () => Any,
  Argument: () => Argument,
  Array: () => Array2,
  AsyncIterator: () => AsyncIterator,
  Awaited: () => Awaited,
  BigInt: () => BigInt2,
  Boolean: () => Boolean,
  Capitalize: () => Capitalize,
  Composite: () => Composite,
  Const: () => Const,
  Constructor: () => Constructor,
  ConstructorParameters: () => ConstructorParameters,
  Date: () => Date2,
  Enum: () => Enum,
  Exclude: () => Exclude,
  Extends: () => Extends,
  Extract: () => Extract,
  Function: () => Function,
  Index: () => Index,
  InstanceType: () => InstanceType,
  Instantiate: () => Instantiate,
  Integer: () => Integer,
  Intersect: () => Intersect,
  Iterator: () => Iterator,
  KeyOf: () => KeyOf,
  Literal: () => Literal,
  Lowercase: () => Lowercase,
  Mapped: () => Mapped,
  Module: () => Module,
  Never: () => Never,
  Not: () => Not2,
  Null: () => Null,
  Number: () => Number2,
  Object: () => Object2,
  Omit: () => Omit,
  Optional: () => Optional,
  Parameters: () => Parameters,
  Partial: () => Partial,
  Pick: () => Pick,
  Promise: () => Promise2,
  Readonly: () => Readonly,
  ReadonlyOptional: () => ReadonlyOptional,
  Record: () => Record,
  Recursive: () => Recursive,
  Ref: () => Ref,
  RegExp: () => RegExp2,
  Required: () => Required,
  Rest: () => Rest,
  ReturnType: () => ReturnType,
  String: () => String2,
  Symbol: () => Symbol2,
  TemplateLiteral: () => TemplateLiteral,
  Transform: () => Transform,
  Tuple: () => Tuple,
  Uint8Array: () => Uint8Array2,
  Uncapitalize: () => Uncapitalize,
  Undefined: () => Undefined,
  Union: () => Union,
  Unknown: () => Unknown,
  Unsafe: () => Unsafe,
  Uppercase: () => Uppercase,
  Void: () => Void
});
var init_type5 = __esm(() => {
  init_any2();
  init_argument2();
  init_array2();
  init_async_iterator2();
  init_awaited2();
  init_bigint2();
  init_boolean2();
  init_composite2();
  init_const2();
  init_constructor2();
  init_constructor_parameters2();
  init_date2();
  init_enum2();
  init_exclude2();
  init_extends2();
  init_extract2();
  init_function2();
  init_indexed2();
  init_instance_type2();
  init_instantiate2();
  init_integer2();
  init_intersect2();
  init_intrinsic2();
  init_iterator2();
  init_keyof2();
  init_literal2();
  init_mapped2();
  init_module2();
  init_never2();
  init_not2();
  init_null2();
  init_number2();
  init_object2();
  init_omit2();
  init_optional2();
  init_parameters2();
  init_partial2();
  init_pick2();
  init_promise2();
  init_readonly2();
  init_readonly_optional2();
  init_record2();
  init_recursive2();
  init_ref2();
  init_regexp2();
  init_required2();
  init_rest2();
  init_return_type2();
  init_string2();
  init_symbol2();
  init_template_literal2();
  init_transform2();
  init_tuple2();
  init_uint8array2();
  init_undefined2();
  init_union2();
  init_unknown2();
  init_unsafe2();
  init_void2();
});

// node_modules/@sinclair/typebox/build/esm/type/type/index.mjs
var Type;
var init_type6 = __esm(() => {
  init_type5();
  Type = exports_type3;
});

// node_modules/@sinclair/typebox/build/esm/index.mjs
var init_esm = __esm(() => {
  init_clone();
  init_create();
  init_error2();
  init_guard2();
  init_helpers();
  init_patterns2();
  init_registry();
  init_sets();
  init_symbols2();
  init_any2();
  init_array2();
  init_argument2();
  init_async_iterator2();
  init_awaited2();
  init_bigint2();
  init_boolean2();
  init_composite2();
  init_const2();
  init_constructor2();
  init_constructor_parameters2();
  init_date2();
  init_enum2();
  init_exclude2();
  init_extends2();
  init_extract2();
  init_function2();
  init_indexed2();
  init_instance_type2();
  init_instantiate2();
  init_integer2();
  init_intersect2();
  init_iterator2();
  init_intrinsic2();
  init_keyof2();
  init_literal2();
  init_module2();
  init_mapped2();
  init_never2();
  init_not2();
  init_null2();
  init_number2();
  init_object2();
  init_omit2();
  init_optional2();
  init_parameters2();
  init_partial2();
  init_pick2();
  init_promise2();
  init_readonly2();
  init_readonly_optional2();
  init_record2();
  init_recursive2();
  init_ref2();
  init_regexp2();
  init_required2();
  init_rest2();
  init_return_type2();
  init_schema2();
  init_static2();
  init_string2();
  init_symbol2();
  init_template_literal2();
  init_transform2();
  init_tuple2();
  init_uint8array2();
  init_undefined2();
  init_union2();
  init_unknown2();
  init_unsafe2();
  init_void2();
  init_type6();
});

// src/cesr/digest.ts
var exports_digest = {};
__export(exports_digest, {
  DigestCodes: () => DigestCodes,
  decode: () => decode,
  decodeDigest: () => decodeDigest,
  digestVerfer: () => digestVerfer,
  encode: () => encode,
  encodeDigest: () => encodeDigest,
  getCodeMeta: () => getCodeMeta,
  verferMatchesDigest: () => verferMatchesDigest
});

// src/cesr/keys.ts
var exports_keys = {};
__export(exports_keys, {
  decodeKey: () => decodeKey,
  encodeKey: () => encodeKey
});

// src/said/surfaces.ts
var exports_surfaces = {};
__export(exports_surfaces, {
  ACDC_CREDENTIAL_SURFACE: () => ACDC_CREDENTIAL_SURFACE,
  ACDC_SCHEMA_SURFACE: () => ACDC_SCHEMA_SURFACE,
  KEL_DIP_SURFACE: () => KEL_DIP_SURFACE,
  KEL_DRT_SURFACE: () => KEL_DRT_SURFACE,
  KEL_ICP_SURFACE: () => KEL_ICP_SURFACE,
  KEL_IXN_SURFACE: () => KEL_IXN_SURFACE,
  KEL_ROT_SURFACE: () => KEL_ROT_SURFACE,
  TEL_BIS_SURFACE: () => TEL_BIS_SURFACE,
  TEL_BRV_SURFACE: () => TEL_BRV_SURFACE,
  TEL_ISS_SURFACE: () => TEL_ISS_SURFACE,
  TEL_REV_SURFACE: () => TEL_REV_SURFACE,
  TEL_VCP_SURFACE: () => TEL_VCP_SURFACE,
  TEL_VCP_WITH_NONCE_SURFACE: () => TEL_VCP_WITH_NONCE_SURFACE,
  TEL_VRT_SURFACE: () => TEL_VRT_SURFACE,
  buildACDCCredentialSurface: () => buildACDCCredentialSurface
});

// src/cesr/sigs.ts
var exports_sigs = {};
__export(exports_sigs, {
  decodeSig: () => decodeSig,
  encodeSig: () => encodeSig
});

// src/cesr/event-codec.ts
var exports_event_codec = {};
__export(exports_event_codec, {
  decodeCesrEvent: () => decodeCesrEvent,
  decodeCesrEventFromStream: () => decodeCesrEventFromStream,
  decodeCesrStream: () => decodeCesrStream,
  encodeCesrEvent: () => encodeCesrEvent,
  encodeCesrStream: () => encodeCesrStream
});

// src/cesr/attachments.ts
var exports_attachments = {};
__export(exports_attachments, {
  decodeAttachmentGroups: () => decodeAttachmentGroups,
  decodeAttachmentGroupsFromStream: () => decodeAttachmentGroupsFromStream,
  encodeAttachmentGroups: () => encodeAttachmentGroups
});

// src/cesr/prefix.ts
var exports_prefix = {};
__export(exports_prefix, {
  inspect: () => inspect
});

// src/cesr/types.ts
var exports_types = {};

// src/kel/event-signing.ts
var exports_event_signing = {};
__export(exports_event_signing, {
  encodeEventBytes: () => encodeEventBytes,
  signCesrEventWithSigner: () => signCesrEventWithSigner
});

// src/kel/rotation.ts
var exports_rotation = {};
__export(exports_rotation, {
  assertKeyRevelation: () => assertKeyRevelation,
  buildNextCommitment: () => buildNextCommitment,
  matchKeyRevelation: () => matchKeyRevelation,
  meetsThreshold: () => meetsThreshold,
  planRotation: () => planRotation,
  resolveCurrentKeys: () => resolveCurrentKeys
});

// src/kel/validation.ts
var exports_validation = {};
__export(exports_validation, {
  isDelegatedEvent: () => isDelegatedEvent,
  isValidKeriEvent: () => isValidKeriEvent,
  validateEventSaid: () => validateEventSaid,
  validateKel: () => validateKel,
  validateKelChain: () => validateKelChain,
  validateKeyChain: () => validateKeyChain,
  validateRequiredFields: () => validateRequiredFields,
  validateSignedIcp: () => validateSignedIcp
});

// src/kel/validation-predicates.ts
var exports_validation_predicates = {};
__export(exports_validation_predicates, {
  eventContainsAnchorForSaid: () => eventContainsAnchorForSaid,
  isDelegationAnchor: () => isDelegationAnchor,
  verifyVrcAgainstThreshold: () => verifyVrcAgainstThreshold,
  verifyWitnessReceipt: () => verifyWitnessReceipt
});

// src/kel/predicates.ts
var exports_predicates = {};
__export(exports_predicates, {
  isDip: () => isDip,
  isDrt: () => isDrt,
  isEstablishment: () => isEstablishment2,
  isIcp: () => isIcp,
  isIxn: () => isIxn,
  isRot: () => isRot
});

// src/said/next-key-digest.ts
var exports_next_key_digest = {};
__export(exports_next_key_digest, {
  nextKeyDigestQb64FromPublicKeyQb64: () => nextKeyDigestQb64FromPublicKeyQb64
});

// src/said/said.ts
var exports_said = {};
__export(exports_said, {
  encodeSAID: () => encodeSAID,
  saidFromJson: () => saidFromJson,
  validateSAID: () => validateSAID
});

// src/signature/hashing.ts
var exports_hashing = {};
__export(exports_hashing, {
  hash: () => hash2,
  hashBase64Url: () => hashBase64Url,
  hashHex: () => hashHex,
  hashObject: () => hashObject
});

// src/signature/primitives.ts
var exports_primitives = {};
__export(exports_primitives, {
  bytesToHex: () => bytesToHex3,
  canonicalize: () => import_json_canonicalize2.canonicalize,
  canonicalizeToBytes: () => canonicalizeToBytes,
  decodeBase64Url: () => decodeBase64Url,
  encodeBase64Url: () => encodeBase64Url,
  generateKeyPair: () => generateKeyPair,
  getPublicKey: () => getPublicKey,
  hexToBytes: () => hexToBytes3,
  randomBytes: () => randomBytes4,
  sha256: () => sha2562,
  sha256Hex: () => sha256Hex,
  sha512: () => sha5122,
  sha512Hex: () => sha512Hex,
  sign: () => sign,
  verify: () => verify3
});

// node_modules/@noble/hashes/_u64.js
var U32_MASK64 = /* @__PURE__ */ (() => BigInt(2 ** 32 - 1))();
var _32n = /* @__PURE__ */ BigInt(32);
function fromBig(n, le = false) {
  if (le)
    return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
  return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
function split(lst, le = false) {
  const len = lst.length;
  let Ah = new Uint32Array(len);
  let Al = new Uint32Array(len);
  for (let i = 0;i < len; i++) {
    const { h, l } = fromBig(lst[i], le);
    [Ah[i], Al[i]] = [h, l];
  }
  return [Ah, Al];
}
var fromNumH = (n) => n / 2 ** 32 | 0;
var fromNumL = (n) => n >>> 0;
function setU64FromNum(view, byteOffset, n, isLE) {
  const h = fromNumH(n);
  const l = fromNumL(n);
  view.setUint32(byteOffset, isLE ? l : h, isLE);
  view.setUint32(byteOffset + 4, isLE ? h : l, isLE);
}
var shrSH = (h, _l, s) => h >>> s;
var shrSL = (h, l, s) => h << 32 - s | l >>> s;
var rotrSH = (h, l, s) => h >>> s | l << 32 - s;
var rotrSL = (h, l, s) => h << 32 - s | l >>> s;
var rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
var rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
var rotr32H = (_h, l) => l;
var rotr32L = (h, _l) => h;
function add(Ah, Al, Bh, Bl) {
  const l = (Al >>> 0) + (Bl >>> 0);
  return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
}
var add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
var add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
var add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
var add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
var add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
var add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;

// node_modules/@noble/hashes/utils.js
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
var atitle = (title) => title ? `"${title}" ` : "";
function anumber(n, title = "") {
  if (typeof n !== "number")
    throw new TypeError(atitle(title) + "expected number, got " + typeof n);
  if (!Number.isSafeInteger(n) || n < 0)
    throw new RangeError(atitle(title) + "expected integer >= 0, got " + n);
  return n;
}
function abool(value, title = "") {
  if (typeof value !== "boolean")
    throw new TypeError(atitle(title) + "expected boolean, got type=" + typeof value);
  return value;
}
function abytes(value, length, title = "") {
  if (isBytes(value) && (length === undefined || value.length === length))
    return value;
  if (length !== undefined)
    anumber(length, "length");
  const bytes = isBytes(value);
  const ofLen = length !== undefined ? ` of length ${length}` : "";
  const got = bytes ? `length=${value.length}` : `type=${typeof value}`;
  const message = atitle(title) + "expected Uint8Array" + ofLen + ", got " + got;
  if (!bytes)
    throw new TypeError(message);
  throw new RangeError(message);
}
function copyBytes(bytes) {
  return Uint8Array.from(abytes(bytes));
}
function ahash(h) {
  if (typeof h !== "function" || typeof h.create !== "function")
    throw new TypeError("expected hash wrapped by utils.createHasher");
  anumber(h.outputLen);
  anumber(h.blockLen);
  if (h.outputLen < 1 || h.blockLen < 1)
    throw new Error("hash blockLen / outputLen must be >= 1");
}
var aobject = (value, label) => {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new TypeError((label === "object" ? "" : `"${label}" `) + "expected object, got type=" + typeof value);
};
var aopts = (value, label) => {
  aobject(value, label);
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null)
    throw new TypeError(`"${label}" expected plain object`);
  if (Object.hasOwn(value, "__proto__"))
    throw new TypeError(`"${label}.__proto__" is not allowed`);
};
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("hash was destroyed");
  if (checkFinished && instance.finished)
    throw new Error("digest() was already called");
}
function aoutput(out, instance) {
  abytes(out, undefined, "output");
  const min = instance.outputLen;
  if (!(out.length >= min)) {
    throw new RangeError('"output" expected length >= ' + min);
  }
}
function u8(arr) {
  return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}
function u32(arr) {
  return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
function clean(...arrays) {
  for (let i = 0;i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function rotr(word, shift) {
  return word << 32 - shift | word >>> shift;
}
var isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
function byteSwap(word) {
  return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
}
var swap8IfBE = isLE ? (n) => n : (n) => byteSwap(n) >>> 0;
function byteSwap32(arr) {
  for (let i = 0;i < arr.length; i++) {
    arr[i] = byteSwap(arr[i]);
  }
  return arr;
}
var swap32IfBE = isLE ? (u) => u : byteSwap32;
var hasHexBuiltin = /* @__PURE__ */ (() => typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function")();
var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
function bytesToHex(bytes) {
  abytes(bytes);
  if (hasHexBuiltin)
    return bytes.toHex();
  let hex = "";
  for (let i = 0;i < bytes.length; i++) {
    hex += hexes[bytes[i]];
  }
  return hex;
}
function asciiToBase16(ch) {
  return ch >= 48 && ch <= 57 ? ch - 48 : ch >= 65 && ch <= 70 ? ch - (65 - 10) : ch >= 97 && ch <= 102 ? ch - (97 - 10) : undefined;
}
function hexToBytes(hex) {
  if (typeof hex !== "string")
    throw new TypeError("hex string expected, got " + typeof hex);
  if (hasHexBuiltin) {
    try {
      return Uint8Array.fromHex(hex);
    } catch (error) {
      if (error instanceof SyntaxError)
        throw new RangeError(error.message);
      throw error;
    }
  }
  const hl = hex.length;
  const al = hl / 2;
  if (hl % 2)
    throw new RangeError("hex string expected, got unpadded hex of length " + hl);
  const array = new Uint8Array(al);
  for (let ai = 0, hi = 0;ai < al; ai++, hi += 2) {
    const n1 = asciiToBase16(hex.charCodeAt(hi));
    const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
    if (n1 === undefined || n2 === undefined) {
      const char = hex[hi] + hex[hi + 1];
      throw new RangeError('hex string expected, got non-hex character "' + char + '" at index ' + hi);
    }
    array[ai] = n1 * 16 + n2;
  }
  return array;
}
function concatBytes(...arrays) {
  let sum = 0;
  for (let i = 0;i < arrays.length; i++) {
    const a = arrays[i];
    abytes(a);
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad = 0;i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad);
    pad += a.length;
  }
  return res;
}
function checkOpts(defaults, opts, title = "opts") {
  aopts(defaults, "defaults");
  if (opts !== undefined)
    aopts(opts, title);
  const merged = Object.assign(Object.create(null), defaults, opts);
  return merged;
}
function createHasher(hashCons, info = {}) {
  if (typeof hashCons !== "function")
    throw new TypeError('"hashCons" expected function, got type=' + typeof hashCons);
  info = checkOpts({}, info, "info");
  const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
  const tmp = hashCons(undefined);
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.canXOF = tmp.canXOF;
  hashC.create = (opts) => hashCons(opts);
  Object.assign(hashC, info);
  return Object.freeze(hashC);
}
function randomBytes(bytesLength = 32) {
  anumber(bytesLength, "bytesLength");
  const cr = typeof globalThis === "object" ? globalThis.crypto : null;
  if (typeof cr?.getRandomValues !== "function")
    throw new Error("crypto.getRandomValues must be defined");
  if (bytesLength > 65536)
    throw new RangeError(`"bytesLength" expected <= 65536, got ${bytesLength}`);
  return cr.getRandomValues(new Uint8Array(bytesLength));
}
var oidNist = (suffix) => ({
  oid: Uint8Array.from([6, 9, 96, 134, 72, 1, 101, 3, 4, 2, suffix])
});

// node_modules/@noble/hashes/_md.js
function Chi(a, b, c) {
  return a & b ^ ~a & c;
}
function Maj(a, b, c) {
  return a & b ^ a & c ^ b & c;
}

class HashMD {
  blockLen;
  outputLen;
  canXOF = false;
  padOffset;
  isLE;
  buffer;
  view;
  finished = false;
  length = 0;
  pos = 0;
  destroyed = false;
  constructor(blockLen, outputLen, padOffset, isLE) {
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.padOffset = padOffset;
    this.isLE = isLE;
    this.buffer = new Uint8Array(blockLen);
    this.view = createView(this.buffer);
  }
  update(data) {
    aexists(this);
    abytes(data);
    const { view, buffer, blockLen } = this;
    const len = data.length;
    let processed = false;
    for (let pos = 0;pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        const dataView = createView(data);
        for (;blockLen <= len - pos; pos += blockLen)
          this.process(dataView, pos);
        processed = true;
        continue;
      }
      buffer.set(pos === 0 && take === len ? data : data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(view, 0);
        this.pos = 0;
        processed = true;
      }
    }
    this.length += data.length;
    if (processed)
      this.roundClean();
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    this.finished = true;
    const { buffer, view, blockLen, isLE } = this;
    let { pos } = this;
    buffer[pos++] = 128;
    buffer.fill(0, pos);
    if (this.padOffset > blockLen - pos) {
      this.process(view, 0);
      buffer.fill(0);
    }
    setU64FromNum(view, blockLen - 8, this.length * 8, isLE);
    this.process(view, 0);
    this.roundClean();
    const oview = out === buffer ? view : createView(out);
    const len = this.outputLen;
    const outLen = len / 4;
    const state = this.get();
    if (len % 4 || outLen > state.length)
      throw new Error("invalid outputLen");
    for (let i = 0;i < outLen; i++)
      oview.setUint32(4 * i, state[i], isLE);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneIntoMeta(to) {
    const { buffer, length, finished, destroyed, pos } = this;
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    if (pos)
      to.buffer.set(buffer);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
}
var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);
var SHA512_IV = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  4089235720,
  3144134277,
  2227873595,
  1013904242,
  4271175723,
  2773480762,
  1595750129,
  1359893119,
  2917565137,
  2600822924,
  725511199,
  528734635,
  4215389547,
  1541459225,
  327033209
]);

// node_modules/@noble/hashes/_blake.js
var BSIGMA = /* @__PURE__ */ Uint8Array.from([
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  14,
  10,
  4,
  8,
  9,
  15,
  13,
  6,
  1,
  12,
  0,
  2,
  11,
  7,
  5,
  3,
  11,
  8,
  12,
  0,
  5,
  2,
  15,
  13,
  10,
  14,
  3,
  6,
  7,
  1,
  9,
  4,
  7,
  9,
  3,
  1,
  13,
  12,
  11,
  14,
  2,
  6,
  5,
  10,
  4,
  0,
  15,
  8,
  9,
  0,
  5,
  7,
  2,
  4,
  10,
  15,
  14,
  1,
  11,
  12,
  6,
  8,
  3,
  13,
  2,
  12,
  6,
  10,
  0,
  11,
  8,
  3,
  4,
  13,
  7,
  5,
  15,
  14,
  1,
  9,
  12,
  5,
  1,
  15,
  14,
  13,
  4,
  10,
  0,
  7,
  6,
  3,
  9,
  2,
  8,
  11,
  13,
  11,
  7,
  14,
  12,
  1,
  3,
  9,
  5,
  0,
  15,
  4,
  8,
  6,
  2,
  10,
  6,
  15,
  14,
  9,
  11,
  3,
  0,
  8,
  12,
  2,
  13,
  7,
  1,
  4,
  10,
  5,
  10,
  2,
  8,
  4,
  7,
  6,
  1,
  5,
  15,
  11,
  9,
  14,
  3,
  12,
  13,
  0,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  14,
  10,
  4,
  8,
  9,
  15,
  13,
  6,
  1,
  12,
  0,
  2,
  11,
  7,
  5,
  3,
  11,
  8,
  12,
  0,
  5,
  2,
  15,
  13,
  10,
  14,
  3,
  6,
  7,
  1,
  9,
  4,
  7,
  9,
  3,
  1,
  13,
  12,
  11,
  14,
  2,
  6,
  5,
  10,
  4,
  0,
  15,
  8,
  9,
  0,
  5,
  7,
  2,
  4,
  10,
  15,
  14,
  1,
  11,
  12,
  6,
  8,
  3,
  13,
  2,
  12,
  6,
  10,
  0,
  11,
  8,
  3,
  4,
  13,
  7,
  5,
  15,
  14,
  1,
  9
]);
function G1s(a, b, c, d, x) {
  a = a + b + x | 0;
  d = rotr(d ^ a, 16);
  c = c + d | 0;
  b = rotr(b ^ c, 12);
  return { a, b, c, d };
}
function G2s(a, b, c, d, x) {
  a = a + b + x | 0;
  d = rotr(d ^ a, 8);
  c = c + d | 0;
  b = rotr(b ^ c, 7);
  return { a, b, c, d };
}

// node_modules/@noble/hashes/blake2.js
var B2B_IV = /* @__PURE__ */ Uint32Array.from([
  4089235720,
  1779033703,
  2227873595,
  3144134277,
  4271175723,
  1013904242,
  1595750129,
  2773480762,
  2917565137,
  1359893119,
  725511199,
  2600822924,
  4215389547,
  528734635,
  327033209,
  1541459225
]);
var BBUF = /* @__PURE__ */ new Uint32Array(32);
function G1b(a, b, c, d, msg, x) {
  const Xl = msg[x], Xh = msg[x + 1];
  let Al = BBUF[2 * a], Ah = BBUF[2 * a + 1];
  let Bl = BBUF[2 * b], Bh = BBUF[2 * b + 1];
  let Cl = BBUF[2 * c], Ch = BBUF[2 * c + 1];
  let Dl = BBUF[2 * d], Dh = BBUF[2 * d + 1];
  const ll = add3L(Al, Bl, Xl);
  Ah = add3H(ll, Ah, Bh, Xh);
  Al = ll | 0;
  let xh = Dh ^ Ah, xl = Dl ^ Al;
  Dh = rotr32H(xh, xl);
  Dl = rotr32L(xh, xl);
  ({ h: Ch, l: Cl } = add(Ch, Cl, Dh, Dl));
  xh = Bh ^ Ch;
  xl = Bl ^ Cl;
  Bh = rotrSH(xh, xl, 24);
  Bl = rotrSL(xh, xl, 24);
  BBUF[2 * a] = Al;
  BBUF[2 * a + 1] = Ah;
  BBUF[2 * b] = Bl;
  BBUF[2 * b + 1] = Bh;
  BBUF[2 * c] = Cl;
  BBUF[2 * c + 1] = Ch;
  BBUF[2 * d] = Dl;
  BBUF[2 * d + 1] = Dh;
}
function G2b(a, b, c, d, msg, x) {
  const Xl = msg[x], Xh = msg[x + 1];
  let Al = BBUF[2 * a], Ah = BBUF[2 * a + 1];
  let Bl = BBUF[2 * b], Bh = BBUF[2 * b + 1];
  let Cl = BBUF[2 * c], Ch = BBUF[2 * c + 1];
  let Dl = BBUF[2 * d], Dh = BBUF[2 * d + 1];
  const ll = add3L(Al, Bl, Xl);
  Ah = add3H(ll, Ah, Bh, Xh);
  Al = ll | 0;
  let xh = Dh ^ Ah, xl = Dl ^ Al;
  Dh = rotrSH(xh, xl, 16);
  Dl = rotrSL(xh, xl, 16);
  ({ h: Ch, l: Cl } = add(Ch, Cl, Dh, Dl));
  xh = Bh ^ Ch;
  xl = Bl ^ Cl;
  Bh = rotrBH(xh, xl, 63);
  Bl = rotrBL(xh, xl, 63);
  BBUF[2 * a] = Al;
  BBUF[2 * a + 1] = Ah;
  BBUF[2 * b] = Bl;
  BBUF[2 * b + 1] = Bh;
  BBUF[2 * c] = Cl;
  BBUF[2 * c + 1] = Ch;
  BBUF[2 * d] = Dl;
  BBUF[2 * d + 1] = Dh;
}
function checkBlake2Opts(outputLen, opts = {}, keyLen, saltLen, persLen) {
  anumber(keyLen);
  if (outputLen <= 0 || outputLen > keyLen)
    throw new Error('"dkLen" must be 1..' + keyLen + ", got " + outputLen);
  const { key, salt, personalization } = opts;
  if (key !== undefined && (key.length < 1 || key.length > keyLen))
    throw new Error('"key" expected to be undefined or of length=1..' + keyLen);
  if (salt !== undefined)
    abytes(salt, saltLen, "salt");
  if (personalization !== undefined)
    abytes(personalization, persLen, "personalization");
}

class _BLAKE2 {
  buffer;
  buffer32;
  finished = false;
  destroyed = false;
  length = 0;
  pos = 0;
  blockLen;
  outputLen;
  canXOF = false;
  constructor(blockLen, outputLen) {
    anumber(blockLen);
    anumber(outputLen);
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.buffer = new Uint8Array(blockLen);
    this.buffer32 = u32(this.buffer);
  }
  update(data) {
    aexists(this);
    abytes(data);
    const { blockLen, buffer, buffer32 } = this;
    const len = data.length;
    const offset = data.byteOffset;
    const buf = data.buffer;
    for (let pos = 0;pos < len; ) {
      if (this.pos === blockLen) {
        swap32IfBE(buffer32);
        this.compress(buffer32, 0, false);
        swap32IfBE(buffer32);
        this.pos = 0;
      }
      const take = Math.min(blockLen - this.pos, len - pos);
      const dataOffset = offset + pos;
      if (take === blockLen && !(dataOffset % 4) && pos + take < len) {
        const data32 = new Uint32Array(buf, dataOffset, Math.floor((len - pos) / 4));
        swap32IfBE(data32);
        for (let pos32 = 0;pos + blockLen < len; pos32 += buffer32.length, pos += blockLen) {
          this.length += blockLen;
          this.compress(data32, pos32, false);
        }
        swap32IfBE(data32);
        continue;
      }
      buffer.set(pos === 0 && take === len ? data : data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      this.length += take;
      pos += take;
    }
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    if (out.byteOffset & 3)
      throw new RangeError('"output" expected 4-byte aligned byteOffset, got ' + out.byteOffset);
    const { pos, buffer32 } = this;
    this.finished = true;
    this.buffer.fill(0, pos);
    swap32IfBE(buffer32);
    this.compress(buffer32, 0, true);
    swap32IfBE(buffer32);
    const state = this.get();
    const out32 = out === this.buffer ? buffer32 : u32(out);
    const full = Math.floor(this.outputLen / 4);
    for (let i = 0;i < full; i++)
      out32[i] = swap8IfBE(state[i]);
    const tail = this.outputLen % 4;
    if (!tail)
      return;
    const off = full * 4;
    const word = state[full];
    for (let i = 0;i < tail; i++)
      out[off + i] = word >>> 8 * i;
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    const { buffer, length, finished, destroyed, outputLen, pos } = this;
    to ||= new this.constructor({ dkLen: outputLen });
    to.set(...this.get());
    to.buffer.set(buffer);
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    to.outputLen = outputLen;
    return to;
  }
  clone() {
    return this._cloneInto();
  }
}

class _BLAKE2b extends _BLAKE2 {
  v0l = B2B_IV[0] | 0;
  v0h = B2B_IV[1] | 0;
  v1l = B2B_IV[2] | 0;
  v1h = B2B_IV[3] | 0;
  v2l = B2B_IV[4] | 0;
  v2h = B2B_IV[5] | 0;
  v3l = B2B_IV[6] | 0;
  v3h = B2B_IV[7] | 0;
  v4l = B2B_IV[8] | 0;
  v4h = B2B_IV[9] | 0;
  v5l = B2B_IV[10] | 0;
  v5h = B2B_IV[11] | 0;
  v6l = B2B_IV[12] | 0;
  v6h = B2B_IV[13] | 0;
  v7l = B2B_IV[14] | 0;
  v7h = B2B_IV[15] | 0;
  constructor(opts = {}) {
    opts = checkOpts({}, opts);
    const olen = opts.dkLen === undefined ? 64 : opts.dkLen;
    super(128, olen);
    checkBlake2Opts(olen, opts, 64, 16, 16);
    let { key, personalization, salt } = opts;
    let keyLength = 0;
    if (key !== undefined) {
      abytes(key, undefined, "key");
      keyLength = key.length;
    }
    this.v0l ^= this.outputLen | keyLength << 8 | 1 << 16 | 1 << 24;
    if (salt !== undefined) {
      abytes(salt, undefined, "salt");
      const slt = u32(copyBytes(salt));
      this.v4l ^= swap8IfBE(slt[0]);
      this.v4h ^= swap8IfBE(slt[1]);
      this.v5l ^= swap8IfBE(slt[2]);
      this.v5h ^= swap8IfBE(slt[3]);
    }
    if (personalization !== undefined) {
      abytes(personalization, undefined, "personalization");
      const pers = u32(copyBytes(personalization));
      this.v6l ^= swap8IfBE(pers[0]);
      this.v6h ^= swap8IfBE(pers[1]);
      this.v7l ^= swap8IfBE(pers[2]);
      this.v7h ^= swap8IfBE(pers[3]);
    }
    if (key !== undefined) {
      const tmp = new Uint8Array(this.blockLen);
      tmp.set(key);
      this.update(tmp);
      clean(tmp);
    }
  }
  get() {
    let { v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h } = this;
    return [v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h];
  }
  set(v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h) {
    this.v0l = v0l | 0;
    this.v0h = v0h | 0;
    this.v1l = v1l | 0;
    this.v1h = v1h | 0;
    this.v2l = v2l | 0;
    this.v2h = v2h | 0;
    this.v3l = v3l | 0;
    this.v3h = v3h | 0;
    this.v4l = v4l | 0;
    this.v4h = v4h | 0;
    this.v5l = v5l | 0;
    this.v5h = v5h | 0;
    this.v6l = v6l | 0;
    this.v6h = v6h | 0;
    this.v7l = v7l | 0;
    this.v7h = v7h | 0;
  }
  compress(msg, offset, isLast) {
    const { v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h } = this;
    {
      BBUF[0] = v0l;
      BBUF[1] = v0h;
      BBUF[2] = v1l;
      BBUF[3] = v1h;
      BBUF[4] = v2l;
      BBUF[5] = v2h;
      BBUF[6] = v3l;
      BBUF[7] = v3h;
      BBUF[8] = v4l;
      BBUF[9] = v4h;
      BBUF[10] = v5l;
      BBUF[11] = v5h;
      BBUF[12] = v6l;
      BBUF[13] = v6h;
      BBUF[14] = v7l;
      BBUF[15] = v7h;
    }
    BBUF.set(B2B_IV, 16);
    const l = fromNumL(this.length);
    const h = fromNumH(this.length);
    BBUF[24] = B2B_IV[8] ^ l;
    BBUF[25] = B2B_IV[9] ^ h;
    if (isLast) {
      BBUF[28] = ~BBUF[28];
      BBUF[29] = ~BBUF[29];
    }
    let j = 0;
    const s = BSIGMA;
    for (let i = 0;i < 12; i++) {
      G1b(0, 4, 8, 12, msg, offset + 2 * s[j++]);
      G2b(0, 4, 8, 12, msg, offset + 2 * s[j++]);
      G1b(1, 5, 9, 13, msg, offset + 2 * s[j++]);
      G2b(1, 5, 9, 13, msg, offset + 2 * s[j++]);
      G1b(2, 6, 10, 14, msg, offset + 2 * s[j++]);
      G2b(2, 6, 10, 14, msg, offset + 2 * s[j++]);
      G1b(3, 7, 11, 15, msg, offset + 2 * s[j++]);
      G2b(3, 7, 11, 15, msg, offset + 2 * s[j++]);
      G1b(0, 5, 10, 15, msg, offset + 2 * s[j++]);
      G2b(0, 5, 10, 15, msg, offset + 2 * s[j++]);
      G1b(1, 6, 11, 12, msg, offset + 2 * s[j++]);
      G2b(1, 6, 11, 12, msg, offset + 2 * s[j++]);
      G1b(2, 7, 8, 13, msg, offset + 2 * s[j++]);
      G2b(2, 7, 8, 13, msg, offset + 2 * s[j++]);
      G1b(3, 4, 9, 14, msg, offset + 2 * s[j++]);
      G2b(3, 4, 9, 14, msg, offset + 2 * s[j++]);
    }
    this.v0l ^= BBUF[0] ^ BBUF[16];
    this.v0h ^= BBUF[1] ^ BBUF[17];
    this.v1l ^= BBUF[2] ^ BBUF[18];
    this.v1h ^= BBUF[3] ^ BBUF[19];
    this.v2l ^= BBUF[4] ^ BBUF[20];
    this.v2h ^= BBUF[5] ^ BBUF[21];
    this.v3l ^= BBUF[6] ^ BBUF[22];
    this.v3h ^= BBUF[7] ^ BBUF[23];
    this.v4l ^= BBUF[8] ^ BBUF[24];
    this.v4h ^= BBUF[9] ^ BBUF[25];
    this.v5l ^= BBUF[10] ^ BBUF[26];
    this.v5h ^= BBUF[11] ^ BBUF[27];
    this.v6l ^= BBUF[12] ^ BBUF[28];
    this.v6h ^= BBUF[13] ^ BBUF[29];
    this.v7l ^= BBUF[14] ^ BBUF[30];
    this.v7h ^= BBUF[15] ^ BBUF[31];
    clean(BBUF);
  }
  destroy() {
    this.destroyed = true;
    clean(this.buffer32);
    this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }
}
var blake2b = /* @__PURE__ */ createHasher((opts) => new _BLAKE2b(opts));
function _compress(s, offset, msg, rounds, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15) {
  let j = 0;
  for (let i = 0;i < rounds; i++) {
    ({ a: v0, b: v4, c: v8, d: v12 } = G1s(v0, v4, v8, v12, msg[offset + s[j++]]));
    ({ a: v0, b: v4, c: v8, d: v12 } = G2s(v0, v4, v8, v12, msg[offset + s[j++]]));
    ({ a: v1, b: v5, c: v9, d: v13 } = G1s(v1, v5, v9, v13, msg[offset + s[j++]]));
    ({ a: v1, b: v5, c: v9, d: v13 } = G2s(v1, v5, v9, v13, msg[offset + s[j++]]));
    ({ a: v2, b: v6, c: v10, d: v14 } = G1s(v2, v6, v10, v14, msg[offset + s[j++]]));
    ({ a: v2, b: v6, c: v10, d: v14 } = G2s(v2, v6, v10, v14, msg[offset + s[j++]]));
    ({ a: v3, b: v7, c: v11, d: v15 } = G1s(v3, v7, v11, v15, msg[offset + s[j++]]));
    ({ a: v3, b: v7, c: v11, d: v15 } = G2s(v3, v7, v11, v15, msg[offset + s[j++]]));
    ({ a: v0, b: v5, c: v10, d: v15 } = G1s(v0, v5, v10, v15, msg[offset + s[j++]]));
    ({ a: v0, b: v5, c: v10, d: v15 } = G2s(v0, v5, v10, v15, msg[offset + s[j++]]));
    ({ a: v1, b: v6, c: v11, d: v12 } = G1s(v1, v6, v11, v12, msg[offset + s[j++]]));
    ({ a: v1, b: v6, c: v11, d: v12 } = G2s(v1, v6, v11, v12, msg[offset + s[j++]]));
    ({ a: v2, b: v7, c: v8, d: v13 } = G1s(v2, v7, v8, v13, msg[offset + s[j++]]));
    ({ a: v2, b: v7, c: v8, d: v13 } = G2s(v2, v7, v8, v13, msg[offset + s[j++]]));
    ({ a: v3, b: v4, c: v9, d: v14 } = G1s(v3, v4, v9, v14, msg[offset + s[j++]]));
    ({ a: v3, b: v4, c: v9, d: v14 } = G2s(v3, v4, v9, v14, msg[offset + s[j++]]));
  }
  return { v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15 };
}
var B2S_IV = /* @__PURE__ */ SHA256_IV.slice();

class _BLAKE2s extends _BLAKE2 {
  v0 = B2S_IV[0] | 0;
  v1 = B2S_IV[1] | 0;
  v2 = B2S_IV[2] | 0;
  v3 = B2S_IV[3] | 0;
  v4 = B2S_IV[4] | 0;
  v5 = B2S_IV[5] | 0;
  v6 = B2S_IV[6] | 0;
  v7 = B2S_IV[7] | 0;
  constructor(opts = {}) {
    opts = checkOpts({}, opts);
    const olen = opts.dkLen === undefined ? 32 : opts.dkLen;
    super(64, olen);
    checkBlake2Opts(olen, opts, 32, 8, 8);
    let { key, personalization, salt } = opts;
    let keyLength = 0;
    if (key !== undefined) {
      abytes(key, undefined, "key");
      keyLength = key.length;
    }
    this.v0 ^= this.outputLen | keyLength << 8 | 1 << 16 | 1 << 24;
    if (salt !== undefined) {
      abytes(salt, undefined, "salt");
      const slt = u32(copyBytes(salt));
      this.v4 ^= swap8IfBE(slt[0]);
      this.v5 ^= swap8IfBE(slt[1]);
    }
    if (personalization !== undefined) {
      abytes(personalization, undefined, "personalization");
      const pers = u32(copyBytes(personalization));
      this.v6 ^= swap8IfBE(pers[0]);
      this.v7 ^= swap8IfBE(pers[1]);
    }
    if (key !== undefined) {
      const tmp = new Uint8Array(this.blockLen);
      tmp.set(key);
      this.update(tmp);
      clean(tmp);
    }
  }
  get() {
    const { v0, v1, v2, v3, v4, v5, v6, v7 } = this;
    return [v0, v1, v2, v3, v4, v5, v6, v7];
  }
  set(v0, v1, v2, v3, v4, v5, v6, v7) {
    this.v0 = v0 | 0;
    this.v1 = v1 | 0;
    this.v2 = v2 | 0;
    this.v3 = v3 | 0;
    this.v4 = v4 | 0;
    this.v5 = v5 | 0;
    this.v6 = v6 | 0;
    this.v7 = v7 | 0;
  }
  compress(msg, offset, isLast) {
    const l = fromNumL(this.length);
    const h = fromNumH(this.length);
    const { v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15 } = _compress(BSIGMA, offset, msg, 10, this.v0, this.v1, this.v2, this.v3, this.v4, this.v5, this.v6, this.v7, B2S_IV[0], B2S_IV[1], B2S_IV[2], B2S_IV[3], l ^ B2S_IV[4], h ^ B2S_IV[5], isLast ? ~B2S_IV[6] : B2S_IV[6], B2S_IV[7]);
    this.v0 ^= v0 ^ v8;
    this.v1 ^= v1 ^ v9;
    this.v2 ^= v2 ^ v10;
    this.v3 ^= v3 ^ v11;
    this.v4 ^= v4 ^ v12;
    this.v5 ^= v5 ^ v13;
    this.v6 ^= v6 ^ v14;
    this.v7 ^= v7 ^ v15;
  }
  destroy() {
    this.destroyed = true;
    clean(this.buffer32);
    this.set(0, 0, 0, 0, 0, 0, 0, 0);
  }
}
var blake2s = /* @__PURE__ */ createHasher((opts) => new _BLAKE2s(opts));

// node_modules/@noble/hashes/blake3.js
var B3_Flags = {
  CHUNK_START: 1,
  CHUNK_END: 2,
  PARENT: 4,
  ROOT: 8,
  KEYED_HASH: 16,
  DERIVE_KEY_CONTEXT: 32,
  DERIVE_KEY_MATERIAL: 64
};
var B3_IV = /* @__PURE__ */ SHA256_IV.slice();
var B3_SIGMA = /* @__PURE__ */ (() => {
  const Id = Array.from({ length: 16 }, (_, i) => i);
  const permute = (arr) => [2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8].map((i) => arr[i]);
  const res = [];
  for (let i = 0, v = Id;i < 7; i++, v = permute(v))
    res.push(...v);
  return Uint8Array.from(res);
})();

class _BLAKE3 extends _BLAKE2 {
  canXOF = true;
  chunkPos = 0;
  chunksDone = 0;
  flags = 0 | 0;
  IV;
  state;
  stack = [];
  posOut = 0;
  bufferOut32 = new Uint32Array(16);
  bufferOut;
  chunkOut = 0;
  enableXOF = true;
  constructor(opts = {}, flags = 0) {
    opts = checkOpts({}, opts);
    super(64, opts.dkLen === undefined ? 32 : opts.dkLen);
    const { key, context } = opts;
    const hasContext = context !== undefined;
    if (key !== undefined) {
      if (hasContext)
        throw new Error('cannot use both "key" and "context"');
      abytes(key, 32, "key");
      const k = copyBytes(key);
      this.IV = u32(k);
      swap32IfBE(this.IV);
      this.flags = flags | B3_Flags.KEYED_HASH;
    } else if (hasContext) {
      abytes(context, undefined, "context");
      const ctx = context;
      const contextKey = new _BLAKE3({ dkLen: 32 }, B3_Flags.DERIVE_KEY_CONTEXT).update(ctx).digest();
      this.IV = u32(contextKey);
      swap32IfBE(this.IV);
      this.flags = flags | B3_Flags.DERIVE_KEY_MATERIAL;
    } else {
      this.IV = B3_IV;
      this.flags = flags;
    }
    this.state = this.IV.slice();
    this.bufferOut = u8(this.bufferOut32);
  }
  get() {
    return [];
  }
  set() {}
  b2Compress(counter, flags, buf, bufPos = 0) {
    const { state: s, pos } = this;
    const t0 = fromNumL(counter);
    const t1 = fromNumH(counter);
    const { v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15 } = _compress(B3_SIGMA, bufPos, buf, 7, s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], B3_IV[0], B3_IV[1], B3_IV[2], B3_IV[3], t0, t1, pos, flags);
    s[0] = v0 ^ v8;
    s[1] = v1 ^ v9;
    s[2] = v2 ^ v10;
    s[3] = v3 ^ v11;
    s[4] = v4 ^ v12;
    s[5] = v5 ^ v13;
    s[6] = v6 ^ v14;
    s[7] = v7 ^ v15;
  }
  compress(buf, bufPos = 0, isLast = false) {
    let flags = this.flags;
    if (!this.chunkPos)
      flags |= B3_Flags.CHUNK_START;
    if (this.chunkPos === 15 || isLast)
      flags |= B3_Flags.CHUNK_END;
    if (!isLast)
      this.pos = this.blockLen;
    this.b2Compress(this.chunksDone, flags, buf, bufPos);
    this.chunkPos += 1;
    if (this.chunkPos === 16 || isLast) {
      let chunk = this.state;
      this.state = this.IV.slice();
      for (let last, chunks = this.chunksDone + 1;isLast || !(chunks & 1); chunks = Math.floor(chunks / 2)) {
        if (!(last = this.stack.pop()))
          break;
        this.buffer32.set(last, 0);
        this.buffer32.set(chunk, 8);
        this.pos = this.blockLen;
        this.b2Compress(0, this.flags | B3_Flags.PARENT, this.buffer32, 0);
        chunk = this.state;
        this.state = this.IV.slice();
      }
      this.chunksDone++;
      this.chunkPos = 0;
      this.stack.push(chunk);
    }
    this.pos = 0;
  }
  _cloneInto(to) {
    const staleOutput = !!to && to.finished && !to.destroyed;
    to = super._cloneInto(to);
    const { IV, flags, state, chunkPos, posOut, chunkOut, stack, chunksDone } = this;
    to.state.set(state);
    to.stack = stack.map((i) => Uint32Array.from(i));
    if (IV === B3_IV) {
      if (to.IV !== B3_IV)
        clean(to.IV);
      to.IV = B3_IV;
    } else if (to.IV === B3_IV) {
      to.IV = IV.slice();
    } else {
      to.IV.set(IV);
    }
    to.flags = flags;
    to.chunkPos = chunkPos;
    to.chunksDone = chunksDone;
    to.posOut = posOut;
    to.chunkOut = chunkOut;
    to.enableXOF = this.enableXOF;
    if (this.finished) {
      to.bufferOut32.set(this.bufferOut32);
    } else if (staleOutput) {
      clean(to.bufferOut32);
    }
    return to;
  }
  destroy() {
    this.destroyed = true;
    clean(this.state, this.buffer32, this.bufferOut32);
    if (this.IV !== B3_IV)
      clean(this.IV);
    clean(...this.stack);
  }
  b2CompressOut() {
    const { state: s, pos, flags, buffer32, bufferOut32: out32 } = this;
    const outCounter = this.chunkOut++;
    const t0 = fromNumL(outCounter);
    const t1 = fromNumH(outCounter);
    swap32IfBE(buffer32);
    const { v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15 } = _compress(B3_SIGMA, 0, buffer32, 7, s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], B3_IV[0], B3_IV[1], B3_IV[2], B3_IV[3], t0, t1, pos, flags);
    out32[0] = v0 ^ v8;
    out32[1] = v1 ^ v9;
    out32[2] = v2 ^ v10;
    out32[3] = v3 ^ v11;
    out32[4] = v4 ^ v12;
    out32[5] = v5 ^ v13;
    out32[6] = v6 ^ v14;
    out32[7] = v7 ^ v15;
    out32[8] = s[0] ^ v8;
    out32[9] = s[1] ^ v9;
    out32[10] = s[2] ^ v10;
    out32[11] = s[3] ^ v11;
    out32[12] = s[4] ^ v12;
    out32[13] = s[5] ^ v13;
    out32[14] = s[6] ^ v14;
    out32[15] = s[7] ^ v15;
    swap32IfBE(buffer32);
    swap32IfBE(out32);
    this.posOut = 0;
  }
  finish() {
    if (this.finished)
      return;
    this.finished = true;
    this.buffer.fill(0, this.pos);
    let flags = this.flags | B3_Flags.ROOT;
    if (this.stack.length) {
      flags |= B3_Flags.PARENT;
      swap32IfBE(this.buffer32);
      this.compress(this.buffer32, 0, true);
      swap32IfBE(this.buffer32);
      this.chunksDone = 0;
      this.pos = this.blockLen;
    } else {
      flags |= (!this.chunkPos ? B3_Flags.CHUNK_START : 0) | B3_Flags.CHUNK_END;
    }
    this.flags = flags;
    this.b2CompressOut();
  }
  writeInto(out) {
    aexists(this, false);
    abytes(out);
    this.finish();
    const { blockLen, bufferOut } = this;
    for (let pos = 0, len = out.length;pos < len; ) {
      if (this.posOut >= blockLen)
        this.b2CompressOut();
      const take = Math.min(blockLen - this.posOut, len - pos);
      out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
      this.posOut += take;
      pos += take;
    }
    return out;
  }
  xofInto(out) {
    if (!this.enableXOF)
      throw new Error("no XOF after digest()");
    return this.writeInto(out);
  }
  xof(bytes) {
    anumber(bytes);
    return this.xofInto(new Uint8Array(bytes));
  }
  digestInto(out) {
    aoutput(out, this);
    if (this.finished)
      throw new Error("digest() was already called");
    this.enableXOF = false;
    this.writeInto(out.length === this.outputLen ? out : out.subarray(0, this.outputLen));
    this.destroy();
  }
  digest() {
    const out = new Uint8Array(this.outputLen);
    this.digestInto(out);
    return out;
  }
}
var blake3 = /* @__PURE__ */ createHasher((opts = {}) => new _BLAKE3(opts));

// node_modules/@noble/hashes/sha2.js
var SHA256_K = /* @__PURE__ */ Uint32Array.from([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);

class SHA2_32B extends HashMD {
  A = 0;
  B = 0;
  C = 0;
  D = 0;
  E = 0;
  F = 0;
  G = 0;
  H = 0;
  constructor(outputLen, IV) {
    super(64, outputLen, 8, false);
    this.A = IV[0] | 0;
    this.B = IV[1] | 0;
    this.C = IV[2] | 0;
    this.D = IV[3] | 0;
    this.E = IV[4] | 0;
    this.F = IV[5] | 0;
    this.G = IV[6] | 0;
    this.H = IV[7] | 0;
  }
  get() {
    const { A, B, C, D, E, F, G, H } = this;
    return [A, B, C, D, E, F, G, H];
  }
  set(A, B, C, D, E, F, G, H) {
    this.A = A | 0;
    this.B = B | 0;
    this.C = C | 0;
    this.D = D | 0;
    this.E = E | 0;
    this.F = F | 0;
    this.G = G | 0;
    this.H = H | 0;
  }
  _cloneInto(to) {
    (to ||= new this.constructor).set(...this.get());
    return this._cloneIntoMeta(to);
  }
  process(view, offset) {
    for (let i = 0;i < 16; i++, offset += 4)
      SHA256_W[i] = view.getUint32(offset, false);
    for (let i = 16;i < 64; i++) {
      const W15 = SHA256_W[i - 15];
      const W2 = SHA256_W[i - 2];
      const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
      const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
      SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
    }
    let { A, B, C, D, E, F, G, H } = this;
    for (let i = 0;i < 64; i++) {
      const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
      const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
      const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
      const T2 = sigma0 + Maj(A, B, C) | 0;
      H = G;
      G = F;
      F = E;
      E = D + T1 | 0;
      D = C;
      C = B;
      B = A;
      A = T1 + T2 | 0;
    }
    A = A + this.A | 0;
    B = B + this.B | 0;
    C = C + this.C | 0;
    D = D + this.D | 0;
    E = E + this.E | 0;
    F = F + this.F | 0;
    G = G + this.G | 0;
    H = H + this.H | 0;
    this.set(A, B, C, D, E, F, G, H);
  }
  roundClean() {
    clean(SHA256_W);
  }
  destroy() {
    this.destroyed = true;
    this.set(0, 0, 0, 0, 0, 0, 0, 0);
    clean(this.buffer);
  }
}

class _SHA256 extends SHA2_32B {
  constructor() {
    super(32, SHA256_IV);
  }
}
var K512 = /* @__PURE__ */ (() => split([
  "0x428a2f98d728ae22",
  "0x7137449123ef65cd",
  "0xb5c0fbcfec4d3b2f",
  "0xe9b5dba58189dbbc",
  "0x3956c25bf348b538",
  "0x59f111f1b605d019",
  "0x923f82a4af194f9b",
  "0xab1c5ed5da6d8118",
  "0xd807aa98a3030242",
  "0x12835b0145706fbe",
  "0x243185be4ee4b28c",
  "0x550c7dc3d5ffb4e2",
  "0x72be5d74f27b896f",
  "0x80deb1fe3b1696b1",
  "0x9bdc06a725c71235",
  "0xc19bf174cf692694",
  "0xe49b69c19ef14ad2",
  "0xefbe4786384f25e3",
  "0x0fc19dc68b8cd5b5",
  "0x240ca1cc77ac9c65",
  "0x2de92c6f592b0275",
  "0x4a7484aa6ea6e483",
  "0x5cb0a9dcbd41fbd4",
  "0x76f988da831153b5",
  "0x983e5152ee66dfab",
  "0xa831c66d2db43210",
  "0xb00327c898fb213f",
  "0xbf597fc7beef0ee4",
  "0xc6e00bf33da88fc2",
  "0xd5a79147930aa725",
  "0x06ca6351e003826f",
  "0x142929670a0e6e70",
  "0x27b70a8546d22ffc",
  "0x2e1b21385c26c926",
  "0x4d2c6dfc5ac42aed",
  "0x53380d139d95b3df",
  "0x650a73548baf63de",
  "0x766a0abb3c77b2a8",
  "0x81c2c92e47edaee6",
  "0x92722c851482353b",
  "0xa2bfe8a14cf10364",
  "0xa81a664bbc423001",
  "0xc24b8b70d0f89791",
  "0xc76c51a30654be30",
  "0xd192e819d6ef5218",
  "0xd69906245565a910",
  "0xf40e35855771202a",
  "0x106aa07032bbd1b8",
  "0x19a4c116b8d2d0c8",
  "0x1e376c085141ab53",
  "0x2748774cdf8eeb99",
  "0x34b0bcb5e19b48a8",
  "0x391c0cb3c5c95a63",
  "0x4ed8aa4ae3418acb",
  "0x5b9cca4f7763e373",
  "0x682e6ff3d6b2b8a3",
  "0x748f82ee5defb2fc",
  "0x78a5636f43172f60",
  "0x84c87814a1f0ab72",
  "0x8cc702081a6439ec",
  "0x90befffa23631e28",
  "0xa4506cebde82bde9",
  "0xbef9a3f7b2c67915",
  "0xc67178f2e372532b",
  "0xca273eceea26619c",
  "0xd186b8c721c0c207",
  "0xeada7dd6cde0eb1e",
  "0xf57d4f7fee6ed178",
  "0x06f067aa72176fba",
  "0x0a637dc5a2c898a6",
  "0x113f9804bef90dae",
  "0x1b710b35131c471b",
  "0x28db77f523047d84",
  "0x32caab7b40c72493",
  "0x3c9ebe0a15c9bebc",
  "0x431d67c49c100d4c",
  "0x4cc5d4becb3e42b6",
  "0x597f299cfc657e2a",
  "0x5fcb6fab3ad6faec",
  "0x6c44198c4a475817"
].map((n) => BigInt(n))))();
var SHA512_Kh = /* @__PURE__ */ (() => K512[0])();
var SHA512_Kl = /* @__PURE__ */ (() => K512[1])();
var SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
var SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);

class SHA2_64B extends HashMD {
  Ah = 0;
  Al = 0;
  Bh = 0;
  Bl = 0;
  Ch = 0;
  Cl = 0;
  Dh = 0;
  Dl = 0;
  Eh = 0;
  El = 0;
  Fh = 0;
  Fl = 0;
  Gh = 0;
  Gl = 0;
  Hh = 0;
  Hl = 0;
  constructor(outputLen, IV) {
    super(128, outputLen, 16, false);
    this.Ah = IV[0] | 0;
    this.Al = IV[1] | 0;
    this.Bh = IV[2] | 0;
    this.Bl = IV[3] | 0;
    this.Ch = IV[4] | 0;
    this.Cl = IV[5] | 0;
    this.Dh = IV[6] | 0;
    this.Dl = IV[7] | 0;
    this.Eh = IV[8] | 0;
    this.El = IV[9] | 0;
    this.Fh = IV[10] | 0;
    this.Fl = IV[11] | 0;
    this.Gh = IV[12] | 0;
    this.Gl = IV[13] | 0;
    this.Hh = IV[14] | 0;
    this.Hl = IV[15] | 0;
  }
  get() {
    const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
    return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
  }
  set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
    this.Ah = Ah | 0;
    this.Al = Al | 0;
    this.Bh = Bh | 0;
    this.Bl = Bl | 0;
    this.Ch = Ch | 0;
    this.Cl = Cl | 0;
    this.Dh = Dh | 0;
    this.Dl = Dl | 0;
    this.Eh = Eh | 0;
    this.El = El | 0;
    this.Fh = Fh | 0;
    this.Fl = Fl | 0;
    this.Gh = Gh | 0;
    this.Gl = Gl | 0;
    this.Hh = Hh | 0;
    this.Hl = Hl | 0;
  }
  _cloneInto(to) {
    (to ||= new this.constructor).set(...this.get());
    return this._cloneIntoMeta(to);
  }
  process(view, offset) {
    for (let i = 0;i < 16; i++, offset += 4) {
      SHA512_W_H[i] = view.getUint32(offset);
      SHA512_W_L[i] = view.getUint32(offset += 4);
    }
    for (let i = 16;i < 80; i++) {
      const W15h = SHA512_W_H[i - 15] | 0;
      const W15l = SHA512_W_L[i - 15] | 0;
      const s0h = rotrSH(W15h, W15l, 1) ^ rotrSH(W15h, W15l, 8) ^ shrSH(W15h, W15l, 7);
      const s0l = rotrSL(W15h, W15l, 1) ^ rotrSL(W15h, W15l, 8) ^ shrSL(W15h, W15l, 7);
      const W2h = SHA512_W_H[i - 2] | 0;
      const W2l = SHA512_W_L[i - 2] | 0;
      const s1h = rotrSH(W2h, W2l, 19) ^ rotrBH(W2h, W2l, 61) ^ shrSH(W2h, W2l, 6);
      const s1l = rotrSL(W2h, W2l, 19) ^ rotrBL(W2h, W2l, 61) ^ shrSL(W2h, W2l, 6);
      const SUMl = add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
      const SUMh = add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
      SHA512_W_H[i] = SUMh | 0;
      SHA512_W_L[i] = SUMl | 0;
    }
    let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
    for (let i = 0;i < 80; i++) {
      const sigma1h = rotrSH(Eh, El, 14) ^ rotrSH(Eh, El, 18) ^ rotrBH(Eh, El, 41);
      const sigma1l = rotrSL(Eh, El, 14) ^ rotrSL(Eh, El, 18) ^ rotrBL(Eh, El, 41);
      const CHIh = Eh & Fh ^ ~Eh & Gh;
      const CHIl = El & Fl ^ ~El & Gl;
      const T1ll = add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
      const T1h = add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
      const T1l = T1ll | 0;
      const sigma0h = rotrSH(Ah, Al, 28) ^ rotrBH(Ah, Al, 34) ^ rotrBH(Ah, Al, 39);
      const sigma0l = rotrSL(Ah, Al, 28) ^ rotrBL(Ah, Al, 34) ^ rotrBL(Ah, Al, 39);
      const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
      const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
      Hh = Gh | 0;
      Hl = Gl | 0;
      Gh = Fh | 0;
      Gl = Fl | 0;
      Fh = Eh | 0;
      Fl = El | 0;
      ({ h: Eh, l: El } = add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
      Dh = Ch | 0;
      Dl = Cl | 0;
      Ch = Bh | 0;
      Cl = Bl | 0;
      Bh = Ah | 0;
      Bl = Al | 0;
      const All = add3L(T1l, sigma0l, MAJl);
      Ah = add3H(All, T1h, sigma0h, MAJh);
      Al = All | 0;
    }
    ({ h: Ah, l: Al } = add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
    ({ h: Bh, l: Bl } = add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
    ({ h: Ch, l: Cl } = add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
    ({ h: Dh, l: Dl } = add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
    ({ h: Eh, l: El } = add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
    ({ h: Fh, l: Fl } = add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
    ({ h: Gh, l: Gl } = add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
    ({ h: Hh, l: Hl } = add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
    this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
  }
  roundClean() {
    clean(SHA512_W_H, SHA512_W_L);
  }
  destroy() {
    this.destroyed = true;
    clean(this.buffer);
    this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }
}

class _SHA512 extends SHA2_64B {
  constructor() {
    super(64, SHA512_IV);
  }
}
var sha256 = /* @__PURE__ */ createHasher(() => new _SHA256, /* @__PURE__ */ oidNist(1));
var sha512 = /* @__PURE__ */ createHasher(() => new _SHA512, /* @__PURE__ */ oidNist(3));

// node_modules/@noble/hashes/sha3.js
var _0n = BigInt(0);
var _1n = BigInt(1);
var _2n = BigInt(2);
var _7n = BigInt(7);
var _256n = BigInt(256);
var _0x71n = BigInt(113);
var SHA3_PI = [];
var SHA3_ROTL = [];
var _SHA3_IOTA = [];
for (let round = 0, R = _1n, x = 1, y = 0;round < 24; round++) {
  [x, y] = [y, (2 * x + 3 * y) % 5];
  SHA3_PI.push(2 * (5 * y + x));
  SHA3_ROTL.push((round + 1) * (round + 2) / 2 % 64);
  let t = _0n;
  for (let j = 0;j < 7; j++) {
    R = (R << _1n ^ (R >> _7n) * _0x71n) % _256n;
    if (R & _2n)
      t ^= _1n << (_1n << BigInt(j)) - _1n;
  }
  _SHA3_IOTA.push(t);
}
var IOTAS = split(_SHA3_IOTA, true);
var SHA3_IOTA_H = IOTAS[0];
var SHA3_IOTA_L = IOTAS[1];
var rotlSH = (h, l, s) => h << s | l >>> 32 - s;
var rotlSL = (h, l, s) => l << s | h >>> 32 - s;
var rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
var rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
var rotlH = (h, l, s) => s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s);
var rotlL = (h, l, s) => s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s);
var B = new Uint32Array(5 * 2);
function keccakP(s, rounds = 24) {
  if (!(s instanceof Uint32Array))
    throw new TypeError('"s" expected Uint32Array(50), got type=' + typeof s);
  if (s.length !== 50)
    throw new RangeError('"s" expected Uint32Array(50), got length=' + s.length);
  anumber(rounds, "rounds");
  if (rounds < 1 || rounds > 24)
    throw new Error('"rounds" expected integer 1..24');
  for (let round = 24 - rounds;round < 24; round++) {
    for (let x = 0;x < 10; x++)
      B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
    for (let x = 0;x < 10; x += 2) {
      const idx1 = (x + 8) % 10;
      const idx0 = (x + 2) % 10;
      const B0 = B[idx0];
      const B1 = B[idx0 + 1];
      const Th = rotlH(B0, B1, 1) ^ B[idx1];
      const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
      for (let y = 0;y < 50; y += 10) {
        s[x + y] ^= Th;
        s[x + y + 1] ^= Tl;
      }
    }
    let curH = s[2];
    let curL = s[3];
    for (let t = 0;t < 24; t++) {
      const shift = SHA3_ROTL[t];
      const Th = rotlH(curH, curL, shift);
      const Tl = rotlL(curH, curL, shift);
      const PI = SHA3_PI[t];
      curH = s[PI];
      curL = s[PI + 1];
      s[PI] = Th;
      s[PI + 1] = Tl;
    }
    for (let y = 0;y < 50; y += 10) {
      const b0 = s[y], b1 = s[y + 1], b2 = s[y + 2], b3 = s[y + 3];
      s[y] ^= ~s[y + 2] & s[y + 4];
      s[y + 1] ^= ~s[y + 3] & s[y + 5];
      s[y + 2] ^= ~s[y + 4] & s[y + 6];
      s[y + 3] ^= ~s[y + 5] & s[y + 7];
      s[y + 4] ^= ~s[y + 6] & s[y + 8];
      s[y + 5] ^= ~s[y + 7] & s[y + 9];
      s[y + 6] ^= ~s[y + 8] & b0;
      s[y + 7] ^= ~s[y + 9] & b1;
      s[y + 8] ^= ~b0 & b2;
      s[y + 9] ^= ~b1 & b3;
    }
    s[0] ^= SHA3_IOTA_H[round];
    s[1] ^= SHA3_IOTA_L[round];
  }
  clean(B);
}

class Keccak {
  state;
  pos = 0;
  posOut = 0;
  finished = false;
  state32;
  destroyed = false;
  blockLen;
  suffix;
  outputLen;
  canXOF;
  enableXOF = false;
  rounds;
  constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
    anumber(blockLen, "blockLen");
    anumber(suffix, "suffix");
    anumber(rounds, "rounds");
    abool(enableXOF, "enableXOF");
    this.blockLen = blockLen;
    this.suffix = suffix;
    this.outputLen = outputLen;
    this.enableXOF = enableXOF;
    this.canXOF = enableXOF;
    this.rounds = rounds;
    anumber(outputLen, "outputLen");
    if (!(0 < blockLen && blockLen < 200))
      throw new Error('"blockLen" must be 1..199');
    this.state = new Uint8Array(200);
    this.state32 = u32(this.state);
  }
  clone() {
    return this._cloneInto();
  }
  keccak() {
    swap32IfBE(this.state32);
    keccakP(this.state32, this.rounds);
    swap32IfBE(this.state32);
    this.posOut = 0;
    this.pos = 0;
  }
  update(data) {
    aexists(this);
    abytes(data);
    const { blockLen, state, state32 } = this;
    const len = data.length;
    const canUseU32 = blockLen % 4 === 0 && data.byteOffset % 4 === 0;
    const blockLen32 = blockLen / 4;
    const data32 = canUseU32 && len >= blockLen ? u32(data) : undefined;
    for (let pos = 0;pos < len; ) {
      if (data32 !== undefined && this.pos === 0 && pos % 4 === 0 && len - pos >= blockLen) {
        for (let i = 0, o = pos / 4;i < blockLen32; i++)
          state32[i] ^= data32[o + i];
        pos += blockLen;
        this.pos = blockLen;
        this.keccak();
        continue;
      }
      const take = Math.min(blockLen - this.pos, len - pos);
      for (let i = 0;i < take; i++)
        state[this.pos++] ^= data[pos++];
      if (this.pos === blockLen)
        this.keccak();
    }
    return this;
  }
  finish() {
    if (this.finished)
      return;
    this.finished = true;
    const { state, suffix, pos, blockLen } = this;
    state[pos] ^= suffix;
    if ((suffix & 128) !== 0 && pos === blockLen - 1)
      this.keccak();
    state[blockLen - 1] ^= 128;
    this.keccak();
  }
  writeInto(out) {
    aexists(this, false);
    abytes(out);
    this.finish();
    const bufferOut = this.state;
    const { blockLen } = this;
    for (let pos = 0, len = out.length;pos < len; ) {
      if (this.posOut >= blockLen)
        this.keccak();
      const take = Math.min(blockLen - this.posOut, len - pos);
      out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
      this.posOut += take;
      pos += take;
    }
    return out;
  }
  xofInto(out) {
    if (!this.enableXOF)
      throw new Error("XOF is not enabled");
    return this.writeInto(out);
  }
  xof(bytes) {
    anumber(bytes);
    return this.xofInto(new Uint8Array(bytes));
  }
  digestInto(out) {
    aoutput(out, this);
    if (this.finished)
      throw new Error("digest() was already called");
    this.writeInto(out.length === this.outputLen ? out : out.subarray(0, this.outputLen));
    this.destroy();
  }
  digest() {
    const out = new Uint8Array(this.outputLen);
    this.digestInto(out);
    return out;
  }
  destroy() {
    this.destroyed = true;
    clean(this.state);
  }
  _cloneInto(to) {
    const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
    to ||= new Keccak(blockLen, suffix, outputLen, enableXOF, rounds);
    to.blockLen = blockLen;
    to.state32.set(this.state32);
    to.pos = this.pos;
    to.posOut = this.posOut;
    to.finished = this.finished;
    to.rounds = rounds;
    to.suffix = suffix;
    to.outputLen = outputLen;
    to.enableXOF = enableXOF;
    to.canXOF = this.canXOF;
    to.destroyed = this.destroyed;
    return to;
  }
}
var genKeccak = (suffix, blockLen, outputLen, info = {}) => createHasher(() => new Keccak(blockLen, suffix, outputLen), info);
var sha3_256 = /* @__PURE__ */ genKeccak(6, 136, 32, /* @__PURE__ */ oidNist(8));
var sha3_512 = /* @__PURE__ */ genKeccak(6, 72, 64, /* @__PURE__ */ oidNist(10));

// node_modules/cesr-ts/src/kering.ts
class EmptyMaterialError {
  _err;
  constructor(err) {
    this._err = new Error(err);
  }
  get err() {
    return this._err;
  }
}

// node_modules/cesr-ts/src/core.ts
var Serials;
((Serials) => {
  Serials["JSON"] = "JSON";
})(Serials ||= {});
var Ident;
((Ident) => {
  Ident["KERI"] = "KERI";
  Ident["ACDC"] = "ACDC";
})(Ident ||= {});

class Version {
  major;
  minor;
  constructor(major = 1, minor = 0) {
    this.major = major;
    this.minor = minor;
  }
}
var Versionage = new Version;
var encoder = new TextEncoder;
var decoder = new TextDecoder;
var VERFULLSIZE = 17;
var MINSNIFFSIZE = 12 + VERFULLSIZE;
var VEREX = "(KERI|ACDC)([0-9a-f])([0-9a-f])([A-Z]{4})([0-9a-f]{6})_";
function deversify(versionString) {
  let kind;
  let size;
  let proto;
  const version = Versionage;
  const re = new RegExp(VEREX);
  const match = re.exec(versionString);
  if (match) {
    [proto, version.major, version.minor, kind, size] = [
      match[1],
      +match[2],
      +match[3],
      match[4],
      match[5]
    ];
    if (!Object.values(Serials).includes(kind)) {
      throw new Error(`Invalid serialization kind = ${kind}`);
    }
    if (!Object.values(Ident).includes(proto)) {
      throw new Error(`Invalid serialization kind = ${kind}`);
    }
    const ta = kind;
    kind = Serials[ta];
    const pa = proto;
    proto = Ident[pa];
    return [proto, kind, version, size];
  }
  throw new Error(`Invalid version string = ${versionString}`);
}
function versify(ident = "KERI" /* KERI */, version, kind = "JSON" /* JSON */, size = 0) {
  version = version == undefined ? Versionage : version;
  return `${ident}${version.major.toString(16)}${version.minor.toString()}${kind}${size.toString(16).padStart(6, "0")}_`;
}
var B64ChrByIdx = new Map([
  [0, "A"],
  [1, "B"],
  [2, "C"],
  [3, "D"],
  [4, "E"],
  [5, "F"],
  [6, "G"],
  [7, "H"],
  [8, "I"],
  [9, "J"],
  [10, "K"],
  [11, "L"],
  [12, "M"],
  [13, "N"],
  [14, "O"],
  [15, "P"],
  [16, "Q"],
  [17, "R"],
  [18, "S"],
  [19, "T"],
  [20, "U"],
  [21, "V"],
  [22, "W"],
  [23, "X"],
  [24, "Y"],
  [25, "Z"],
  [26, "a"],
  [27, "b"],
  [28, "c"],
  [29, "d"],
  [30, "e"],
  [31, "f"],
  [32, "g"],
  [33, "h"],
  [34, "i"],
  [35, "j"],
  [36, "k"],
  [37, "l"],
  [38, "m"],
  [39, "n"],
  [40, "o"],
  [41, "p"],
  [42, "q"],
  [43, "r"],
  [44, "s"],
  [45, "t"],
  [46, "u"],
  [47, "v"],
  [48, "w"],
  [49, "x"],
  [50, "y"],
  [51, "z"],
  [52, "0"],
  [53, "1"],
  [54, "2"],
  [55, "3"],
  [56, "4"],
  [57, "5"],
  [58, "6"],
  [59, "7"],
  [60, "8"],
  [61, "9"],
  [62, "-"],
  [63, "_"]
]);
var B64IdxByChr = new Map(Array.from(B64ChrByIdx, (entry) => [entry[1], entry[0]]));
function intToB64(i, l = 1) {
  let out = "";
  while (l != 0) {
    out = B64ChrByIdx.get(i % 64) + out;
    i = Math.floor(i / 64);
    if (i == 0) {
      break;
    }
  }
  const x = l - out.length;
  for (let i = 0;i < x; i++) {
    out = "A" + out;
  }
  return out;
}
function b64ToInt(s) {
  if (s.length == 0) {
    throw new Error("Empty string, conversion undefined.");
  }
  let i = 0;
  const rev = s.split("").reverse();
  rev.forEach((c, e) => {
    i |= B64IdxByChr.get(c) << e * 6;
  });
  return i;
}
function b(s) {
  return encoder.encode(s);
}
function d(u) {
  return decoder.decode(u);
}
function readInt(array) {
  let value = 0;
  for (let i = 0;i < array.length; i++) {
    value = value * 256 + array[i];
  }
  return value;
}

// node_modules/cesr-ts/src/matter.ts
import { Buffer } from "buffer";

class Codex {
  has(prop) {
    const m = new Map(Array.from(Object.entries(this), (v) => [v[1], v[0]]));
    return m.has(prop);
  }
}

class MatterCodex extends Codex {
  Ed25519_Seed = "A";
  Ed25519N = "B";
  X25519 = "C";
  Ed25519 = "D";
  Blake3_256 = "E";
  SHA3_256 = "H";
  SHA2_256 = "I";
  ECDSA_256k1_Seed = "J";
  X25519_Private = "O";
  X25519_Cipher_Seed = "P";
  ECDSA_256r1_Seed = "Q";
  Salt_128 = "0A";
  Ed25519_Sig = "0B";
  ECDSA_256k1_Sig = "0C";
  ECDSA_256r1_Sig = "0I";
  StrB64_L0 = "4A";
  StrB64_L1 = "5A";
  StrB64_L2 = "6A";
  ECDSA_256k1N = "1AAA";
  ECDSA_256k1 = "1AAB";
  X25519_Cipher_Salt = "1AAH";
  ECDSA_256r1N = "1AAI";
  ECDSA_256r1 = "1AAJ";
  StrB64_Big_L0 = "7AAA";
  StrB64_Big_L1 = "8AAA";
  StrB64_Big_L2 = "9AAA";
}
var MtrDex = new MatterCodex;

class NonTransCodex extends Codex {
  Ed25519N = "B";
  ECDSA_256k1N = "1AAA";
  Ed448N = "1AAC";
  ECDSA_256r1N = "1AAI";
}
var NonTransDex = new NonTransCodex;

class DigiCodex extends Codex {
  Blake3_256 = "E";
  Blake2b_256 = "F";
  Blake2s_256 = "G";
  SHA3_256 = "H";
  SHA2_256 = "I";
  Blake3_512 = "0D";
  Blake2b_512 = "0E";
  SHA3_512 = "0F";
  SHA2_512 = "0G";
}
var DigiDex = new DigiCodex;

class NumCodex extends Codex {
  Short = "M";
  Long = "0H";
  Big = "N";
  Huge = "0A";
}
var NumDex = new NumCodex;

class BexCodex extends Codex {
  StrB64_L0 = "4A";
  StrB64_L1 = "5A";
  StrB64_L2 = "6A";
  StrB64_Big_L0 = "7AAA";
  StrB64_Big_L1 = "8AAA";
  StrB64_Big_L2 = "9AAA";
}
var BexDex = new BexCodex;

class SmallVarRawSizeCodex extends Codex {
  Lead0 = "4";
  Lead1 = "5";
  Lead2 = "6";
}
var SmallVrzDex = new SmallVarRawSizeCodex;

class LargeVarRawSizeCodex extends Codex {
  Lead0_Big = "7";
  Lead1_Big = "8";
  Lead2_Big = "9";
}
var LargeVrzDex = new LargeVarRawSizeCodex;

class Sizage {
  hs;
  ss;
  ls;
  fs;
  constructor(hs, ss, fs, ls) {
    this.hs = hs;
    this.ss = ss;
    this.fs = fs;
    this.ls = ls;
  }
}

class Matter {
  static Sizes = new Map(Object.entries({
    A: new Sizage(1, 0, 44, 0),
    B: new Sizage(1, 0, 44, 0),
    C: new Sizage(1, 0, 44, 0),
    D: new Sizage(1, 0, 44, 0),
    E: new Sizage(1, 0, 44, 0),
    F: new Sizage(1, 0, 44, 0),
    G: new Sizage(1, 0, 44, 0),
    H: new Sizage(1, 0, 44, 0),
    I: new Sizage(1, 0, 44, 0),
    J: new Sizage(1, 0, 44, 0),
    K: new Sizage(1, 0, 76, 0),
    L: new Sizage(1, 0, 76, 0),
    M: new Sizage(1, 0, 4, 0),
    N: new Sizage(1, 0, 12, 0),
    O: new Sizage(1, 0, 44, 0),
    P: new Sizage(1, 0, 124, 0),
    Q: new Sizage(1, 0, 44, 0),
    "0A": new Sizage(2, 0, 24, 0),
    "0B": new Sizage(2, 0, 88, 0),
    "0C": new Sizage(2, 0, 88, 0),
    "0D": new Sizage(2, 0, 88, 0),
    "0E": new Sizage(2, 0, 88, 0),
    "0F": new Sizage(2, 0, 88, 0),
    "0G": new Sizage(2, 0, 88, 0),
    "0H": new Sizage(2, 0, 8, 0),
    "0I": new Sizage(2, 0, 88, 0),
    "1AAA": new Sizage(4, 0, 48, 0),
    "1AAB": new Sizage(4, 0, 48, 0),
    "1AAC": new Sizage(4, 0, 80, 0),
    "1AAD": new Sizage(4, 0, 80, 0),
    "1AAE": new Sizage(4, 0, 56, 0),
    "1AAF": new Sizage(4, 0, 8, 0),
    "1AAG": new Sizage(4, 0, 36, 0),
    "1AAH": new Sizage(4, 0, 100, 0),
    "1AAI": new Sizage(4, 0, 48, 0),
    "1AAJ": new Sizage(4, 0, 48, 0),
    "2AAA": new Sizage(4, 0, 8, 1),
    "3AAA": new Sizage(4, 0, 8, 2),
    "4A": new Sizage(2, 2, undefined, 0),
    "5A": new Sizage(2, 2, undefined, 1),
    "6A": new Sizage(2, 2, undefined, 2),
    "7AAA": new Sizage(4, 4, undefined, 0),
    "8AAA": new Sizage(4, 4, undefined, 1),
    "9AAA": new Sizage(4, 4, undefined, 2),
    "4B": new Sizage(2, 2, undefined, 0),
    "5B": new Sizage(2, 2, undefined, 1),
    "6B": new Sizage(2, 2, undefined, 2),
    "7AAB": new Sizage(4, 4, undefined, 0),
    "8AAB": new Sizage(4, 4, undefined, 1),
    "9AAB": new Sizage(4, 4, undefined, 2)
  }));
  static Hards = new Map([
    ["A", 1],
    ["B", 1],
    ["C", 1],
    ["D", 1],
    ["E", 1],
    ["F", 1],
    ["G", 1],
    ["H", 1],
    ["I", 1],
    ["J", 1],
    ["K", 1],
    ["L", 1],
    ["M", 1],
    ["N", 1],
    ["O", 1],
    ["P", 1],
    ["Q", 1],
    ["R", 1],
    ["S", 1],
    ["T", 1],
    ["U", 1],
    ["V", 1],
    ["W", 1],
    ["X", 1],
    ["Y", 1],
    ["Z", 1],
    ["a", 1],
    ["b", 1],
    ["c", 1],
    ["d", 1],
    ["e", 1],
    ["f", 1],
    ["g", 1],
    ["h", 1],
    ["i", 1],
    ["j", 1],
    ["k", 1],
    ["l", 1],
    ["m", 1],
    ["n", 1],
    ["o", 1],
    ["p", 1],
    ["q", 1],
    ["r", 1],
    ["s", 1],
    ["t", 1],
    ["u", 1],
    ["v", 1],
    ["w", 1],
    ["x", 1],
    ["y", 1],
    ["z", 1],
    ["0", 2],
    ["1", 4],
    ["2", 4],
    ["3", 4],
    ["4", 2],
    ["5", 2],
    ["6", 2],
    ["7", 4],
    ["8", 4],
    ["9", 4]
  ]);
  _code = "";
  _size = -1;
  _raw = new Uint8Array(0);
  constructor({
    raw,
    code = MtrDex.Ed25519N,
    qb64b,
    qb64,
    qb2,
    rize
  }) {
    let size = -1;
    if (raw != null) {
      if (code.length == 0) {
        throw new Error("Improper initialization need either (raw and code) or qb64b or qb64 or qb2.");
      }
      if (SmallVrzDex.has(code[0]) || LargeVrzDex.has(code[0])) {
        if (rize !== undefined) {
          if (rize < 0)
            throw new Error(`missing var raw size for code=${code}`);
        } else {
          rize = raw.length;
        }
        const ls = (3 - rize % 3) % 3;
        size = Math.floor((rize + ls) / 3);
        if (SmallVrzDex.has(code[0])) {
          if (size <= 64 ** 2 - 1) {
            const hs = 2;
            const s = Object.values(SmallVrzDex)[ls];
            code = `${s}${code.substring(1, hs)}`;
          } else if (size <= 64 ** 4 - 1) {
            const hs = 4;
            const s = Object.values(LargeVrzDex)[ls];
            code = `${s}${"AAAA".substring(0, hs - 2)}${code[1]}`;
          } else {
            throw new Error(`Unsupported raw size for code=${code}`);
          }
        } else {
          if (size <= 64 ** 4 - 1) {
            const hs = 4;
            const s = Object.values(LargeVrzDex)[ls];
            code = `${s}${code.substring(1, hs)}`;
          } else {
            throw new Error(`Unsupported raw size for code=${code}`);
          }
        }
      } else {
        const sizage = Matter.Sizes.get(code);
        if (sizage.fs == -1) {
          throw new Error(`Unsupported variable size code=${code}`);
        }
        rize = Matter._rawSize(code);
      }
      raw = raw.slice(0, rize);
      if (raw.length != rize) {
        throw new Error(`Not enougth raw bytes for code=${code} expected ${rize} got ${raw.length}.`);
      }
      this._code = code;
      this._size = size;
      this._raw = raw;
    } else if (qb64 !== undefined) {
      this._exfil(qb64);
    } else if (qb64b !== undefined) {
      const qb64 = d(qb64b);
      this._exfil(qb64);
    } else if (qb2 !== undefined) {
      this._bexfil(qb2);
    } else {
      throw new EmptyMaterialError("EmptyMaterialError");
    }
  }
  get code() {
    return this._code;
  }
  get size() {
    return this._size;
  }
  get raw() {
    return this._raw;
  }
  get qb64() {
    return this._infil();
  }
  get qb64b() {
    return b(this.qb64);
  }
  get transferable() {
    return !NonTransDex.has(this.code);
  }
  get digestive() {
    return DigiDex.has(this.code);
  }
  static _rawSize(code) {
    const sizage = this.Sizes.get(code);
    const cs = sizage.hs + sizage.ss;
    if (sizage.fs === -1) {
      throw Error(`Non-fixed raw size code ${code}.`);
    }
    return Math.floor((sizage.fs - cs) * 3 / 4) - sizage.ls;
  }
  static _leadSize(code) {
    const sizage = this.Sizes.get(code);
    return sizage.ls;
  }
  get both() {
    const sizage = Matter.Sizes.get(this.code);
    return `${this.code}${intToB64(this.size, sizage.ss)}`;
  }
  _infil() {
    const code = this.code;
    const size = this.size;
    const raw = this.raw;
    const ps = (3 - raw.length % 3) % 3;
    const sizage = Matter.Sizes.get(code);
    if (sizage.fs === undefined) {
      const cs = sizage.hs + sizage.ss;
      if (cs % 4) {
        throw new Error(`Whole code size not multiple of 4 for variable length material. cs=${cs}`);
      }
      if (size < 0 || size > 64 ** sizage.ss - 1) {
        throw new Error(`Invalid size=${size} for code=${code}.`);
      }
      const both = `${code}${intToB64(size, sizage.ss)}`;
      if (both.length % 4 !== ps - sizage.ls) {
        throw new Error(`Invalid code=${both} for converted raw pad size=${ps}.`);
      }
      const bytes = new Uint8Array(sizage.ls + raw.length);
      for (let i = 0;i < sizage.ls; i++) {
        bytes[i] = 0;
      }
      for (let i = 0;i < raw.length; i++) {
        const odx = i + ps;
        bytes[odx] = raw[i];
      }
      return both + Buffer.from(bytes).toString("base64url");
    } else {
      const both = code;
      const cs = both.length;
      if (cs % 4 != ps - sizage.ls) {
        throw new Error(`Invalid code=${both} for converted raw pad size=${ps}, ${raw.length}.`);
      }
      const bytes = new Uint8Array(ps + raw.length);
      for (let i = 0;i < ps; i++) {
        bytes[i] = 0;
      }
      for (let i = 0;i < raw.length; i++) {
        const odx = i + ps;
        bytes[odx] = raw[i];
      }
      return both + Buffer.from(bytes).toString("base64url").slice(cs % 4);
    }
  }
  _exfil(qb64) {
    if (qb64.length == 0) {
      throw new Error("Empty Material");
    }
    const first = qb64[0];
    if (!Array.from(Matter.Hards.keys()).includes(first)) {
      throw new Error(`Unexpected code ${first}`);
    }
    const hs = Matter.Hards.get(first);
    if (qb64.length < hs) {
      throw new Error(`Shortage Error`);
    }
    const hard = qb64.slice(0, hs);
    if (!Array.from(Matter.Sizes.keys()).includes(hard)) {
      throw new Error(`Unsupported code ${hard}`);
    }
    const sizage = Matter.Sizes.get(hard);
    const cs = sizage.hs + sizage.ss;
    let size = -1;
    if (sizage.fs == -1) {
      throw new Error("Variable size codes not supported yet");
    } else {
      size = sizage.fs;
    }
    if (qb64.length < sizage.fs) {
      throw new Error(`Need ${sizage.fs - qb64.length} more chars.`);
    }
    qb64 = qb64.slice(0, sizage.fs);
    const ps = cs % 4;
    const pbs = 2 * (ps == 0 ? sizage.ls : ps);
    let raw;
    if (ps != 0) {
      const base = new Array(ps + 1).join("A") + qb64.slice(cs);
      const paw = Buffer.from(base, "base64url");
      const pi = readInt(paw.subarray(0, ps));
      if (pi & 2 ** pbs - 1) {
        throw new Error(`Non zeroed prepad bits = {pi & (2 ** pbs - 1 ):<06b} in {qb64b[cs:cs+1]}.`);
      }
      raw = paw.subarray(ps);
    } else {
      const base = qb64.slice(cs);
      const paw = Buffer.from(base, "base64url");
      const li = readInt(paw.subarray(0, sizage.ls));
      if (li != 0) {
        if (li == 1) {
          throw new Error(`Non zeroed lead byte = 0x{li:02x}.`);
        } else {
          throw new Error(`Non zeroed lead bytes = 0x{li:04x}`);
        }
      }
      raw = paw.subarray(sizage.ls);
    }
    this._code = hard;
    this._size = size;
    this._raw = Uint8Array.from(raw);
  }
  _bexfil(qb2) {
    throw new Error(`qb2 not yet supported: ${qb2}`);
  }
}

// src/cesr/keys.ts
function encodeKey(publicKey, transferable = true, algo = "ed25519") {
  let code;
  if (algo === "secp256k1") {
    code = transferable ? MtrDex.ECDSA_256k1 : MtrDex.ECDSA_256k1N;
  } else {
    code = transferable ? MtrDex.Ed25519 : MtrDex.Ed25519N;
  }
  const matter = new Matter({ raw: publicKey, code });
  return { algo, qb64: matter.qb64, raw: publicKey };
}
function decodeKey(qb64) {
  const matter = new Matter({ qb64 });
  if (matter.code === MtrDex.Ed25519 || matter.code === MtrDex.Ed25519N) {
    return { algo: "ed25519", qb64, raw: matter.raw };
  }
  if (matter.code === MtrDex.ECDSA_256k1 || matter.code === MtrDex.ECDSA_256k1N) {
    return { algo: "secp256k1", qb64, raw: matter.raw };
  }
  throw new Error(`Unsupported key code: ${matter.code}`);
}

// src/cesr/digest.ts
function getCodeMeta(code) {
  const sizage = Matter.Sizes.get(code);
  if (!sizage) {
    throw new Error(`Unknown CESR code: ${code}`);
  }
  const algorithmMap = {
    B: "Ed25519_NonTransferable",
    D: "Ed25519",
    E: "Blake3_256",
    H: "SHA3_256",
    I: "SHA2_256",
    "0A": "Salt_128",
    "0B": "Ed25519_Sig"
  };
  let family = "matter";
  if (code === "0B" || code === "0A") {
    family = "siger";
  }
  return {
    code,
    family,
    algorithm: algorithmMap[code] || code,
    rawSize: sizage.fs ? Math.floor((sizage.fs - sizage.hs - sizage.ss) * 3 / 4) - (sizage.ls || 0) : -1,
    codeLen: sizage.hs
  };
}
function encode(raw, code) {
  const matter = new Matter({ raw, code });
  return matter.qb64;
}
function decode(cesr) {
  if (cesr.length === 0) {
    throw new Error("Empty CESR string");
  }
  const matter = new Matter({ qb64: cesr });
  const meta = getCodeMeta(matter.code);
  return {
    code: matter.code,
    raw: matter.raw,
    meta
  };
}
function encodeDigest(digest, code = MtrDex.Blake3_256) {
  return encode(digest, code);
}
function decodeDigest(cesr) {
  const decoded = decode(cesr);
  const validDigestCodes = [
    MtrDex.Blake3_256,
    "F",
    "G",
    MtrDex.SHA3_256,
    MtrDex.SHA2_256,
    "0D",
    "0E",
    "0F",
    "0G"
  ];
  if (!validDigestCodes.includes(decoded.code)) {
    throw new Error(`Expected digest code, got ${decoded.code}`);
  }
  return decoded;
}
function digestVerfer(verferQb64, algorithm = MtrDex.Blake3_256) {
  decodeKey(verferQb64);
  const digester = DIGESTERS[algorithm];
  if (digester === undefined) {
    throw new Error(`Unsupported digest code for a next-key commitment: ${algorithm}`);
  } else {
    return new Matter({ raw: digester(new TextEncoder().encode(verferQb64)), code: algorithm }).qb64;
  }
}
var DigestCodes = {
  Blake3_256: "E",
  Blake2b_256: "F",
  Blake2s_256: "G",
  SHA3_256: "H",
  SHA2_256: "I",
  Blake3_512: "0D",
  Blake2b_512: "0E",
  SHA3_512: "0F",
  SHA2_512: "0G"
};
var DIGESTERS = {
  [DigestCodes.Blake3_256]: (ser) => blake3(ser, { dkLen: 32 }),
  [DigestCodes.Blake3_512]: (ser) => blake3(ser, { dkLen: 64 }),
  [DigestCodes.Blake2b_256]: (ser) => blake2b(ser, { dkLen: 32 }),
  [DigestCodes.Blake2b_512]: (ser) => blake2b(ser, { dkLen: 64 }),
  [DigestCodes.Blake2s_256]: (ser) => blake2s(ser, { dkLen: 32 }),
  [DigestCodes.SHA3_256]: (ser) => sha3_256(ser),
  [DigestCodes.SHA3_512]: (ser) => sha3_512(ser),
  [DigestCodes.SHA2_256]: (ser) => sha256(ser),
  [DigestCodes.SHA2_512]: (ser) => sha512(ser)
};
function verferMatchesDigest(verferQb64, digestQb64) {
  try {
    return digestVerfer(verferQb64, decode(digestQb64).code) === digestQb64;
  } catch {
    return false;
  }
}

// src/common/canonical.ts
var import_json_canonicalize = __toESM(require_index_umd(), 1);
function canonical(obj) {
  return import_json_canonicalize.canonicalize(obj);
}

// src/common/data.ts
var SAID_PLACEHOLDER = "#".repeat(44);

class Data {
  data;
  constructor(data) {
    this.data = data;
  }
  static computeVersionString(eventWithoutVersion, kind = "JSON", protocol = "KERI", saidFieldName = "d") {
    let version = `${protocol}10${kind}000000_`;
    let previousSize = 0;
    for (let iteration = 0;iteration < 10; iteration++) {
      const eventWithVersion = { ...eventWithoutVersion, v: version };
      if (saidFieldName in eventWithVersion) {
        eventWithVersion[saidFieldName] = SAID_PLACEHOLDER;
      }
      const { raw } = Data.fromJson(eventWithVersion).canonicalize();
      const size = raw.length;
      if (size === previousSize) {
        return version;
      }
      previousSize = size;
      const sizeDecimal = size.toString(10).padStart(6, "0");
      version = `${protocol}10${kind}${sizeDecimal}_`;
    }
    throw new Error("Version string calculation did not converge");
  }
  static fromJson(obj) {
    return new Data(structuredClone(obj));
  }
  toJson() {
    return structuredClone(this.data);
  }
  saidify(fieldName = "d") {
    const dataWithPlaceholder = structuredClone(this.data);
    dataWithPlaceholder[fieldName] = SAID_PLACEHOLDER;
    const canonicalText = canonical(dataWithPlaceholder);
    const canonicalBytes = new TextEncoder().encode(canonicalText);
    const said = Data.digest(canonicalBytes);
    const finalData = structuredClone(this.data);
    finalData[fieldName] = said;
    return { said, data: finalData };
  }
  canonicalize() {
    const text = canonical(this.data);
    const raw = new TextEncoder().encode(text);
    return { raw, text };
  }
  static digest(raw) {
    const hash = blake3(raw, { dkLen: 32 });
    return encodeDigest(hash, "E");
  }
  static digestFor(obj) {
    const { raw } = Data.fromJson(obj).canonicalize();
    return Data.digest(raw);
  }
}
function saidOf(obj, fieldName = "d") {
  const data = Data.fromJson(obj);
  const { said } = data.saidify(fieldName);
  return said;
}
async function inferSchema(value) {
  await Promise.resolve().then(() => init_esm());
  function infer(v) {
    if (v === null) {
      return Type.Null();
    }
    if (Array.isArray(v)) {
      if (v.length === 0) {
        return Type.Array(Type.Unknown());
      }
      return Type.Array(infer(v[0]));
    }
    switch (typeof v) {
      case "string":
        return Type.String();
      case "number":
        return Type.Number();
      case "boolean":
        return Type.Boolean();
      case "object": {
        const properties = {};
        for (const [key, val] of Object.entries(v)) {
          properties[key] = infer(val);
        }
        return Type.Object(properties);
      }
      default:
        return Type.Unknown();
    }
  }
  return infer(value);
}
function schemaSaidOf(schema) {
  const canonicalText = canonical(schema);
  return Data.digest(new TextEncoder().encode(canonicalText));
}
async function createSaidMessageType(example) {
  const schema = await inferSchema(example);
  const schemaSaid = schemaSaidOf(schema);
  return `SAID:${schemaSaid}`;
}

// src/common/serialize-insertion-order.ts
function serializeInsertionOrder(value) {
  return serializeValue(value);
}
function serializeValue(value) {
  if (value === null)
    return "null";
  switch (typeof value) {
    case "string":
      return JSON.stringify(value);
    case "number":
      if (!Number.isFinite(value)) {
        throw new TypeError(`serializeInsertionOrder: non-finite number: ${value}`);
      }
      return JSON.stringify(value);
    case "boolean":
      return value ? "true" : "false";
    case "object": {
      if (Array.isArray(value)) {
        return serializeArray(value);
      }
      return serializeObject(value);
    }
    default:
      throw new TypeError(`serializeInsertionOrder: unsupported type '${typeof value}'`);
  }
}
function serializeArray(arr) {
  const parts = [];
  for (let i = 0;i < arr.length; i++) {
    const element = arr[i];
    if (element === undefined) {
      throw new TypeError(`serializeInsertionOrder: undefined at array index ${i}`);
    }
    parts.push(serializeValue(element));
  }
  return `[${parts.join(",")}]`;
}
function serializeObject(obj) {
  const proto = Object.getPrototypeOf(obj);
  if (proto !== null && proto !== Object.prototype) {
    throw new TypeError(`serializeInsertionOrder: expected plain object, got ${proto.constructor?.name ?? "non-plain object"}`);
  }
  const keys = Object.keys(obj);
  const parts = [];
  for (const key of keys) {
    const val = obj[key];
    if (val === undefined) {
      throw new TypeError(`serializeInsertionOrder: undefined at property '${key}'`);
    }
    parts.push(`${JSON.stringify(key)}:${serializeValue(val)}`);
  }
  return `{${parts.join(",")}}`;
}

// src/common/derivation-surface.ts
function assertValidSurface(s) {
  const fields = s.derivedFieldsInOrder;
  if (!fields.includes(s.saidField))
    throw new Error(`DerivationSurface: saidField '${s.saidField}' missing from derivedFieldsInOrder`);
  if (new Set(fields).size !== fields.length)
    throw new Error(`DerivationSurface: derivedFieldsInOrder contains duplicates`);
  if (s.hasVersionString && !fields.includes(s.versionStringField))
    throw new Error(`DerivationSurface: versionStringField '${s.versionStringField}' missing from derivedFieldsInOrder`);
  if (s.hasVersionString && s.saidField === s.versionStringField)
    throw new Error(`DerivationSurface: saidField and versionStringField must differ`);
}
function project(artifact, fields) {
  const out = {};
  for (const f of fields) {
    if (f in artifact)
      out[f] = artifact[f];
  }
  return out;
}
function digestInsertionOrderJson(obj) {
  const bytes = new TextEncoder().encode(serializeInsertionOrder(obj));
  return Data.digest(bytes);
}
function computeKeriVersionString(preimage, versionStringField, kind, protocol, saidFieldName) {
  let version = `${protocol}10${kind}000000_`;
  let previousSize = 0;
  for (let iteration = 0;iteration < 10; iteration++) {
    const measured = {};
    for (const key of Object.keys(preimage)) {
      if (key === versionStringField) {
        measured[key] = version;
      } else if (key === saidFieldName) {
        measured[key] = SAID_PLACEHOLDER;
      } else {
        measured[key] = preimage[key];
      }
    }
    const bytes = new TextEncoder().encode(serializeInsertionOrder(measured));
    const size = bytes.length;
    if (size === previousSize) {
      return version;
    }
    previousSize = size;
    const sizeHex = size.toString(16).padStart(6, "0");
    version = `${protocol}10${kind}${sizeHex}_`;
  }
  throw new Error("KERI version string calculation did not converge");
}
function deriveSaid(artifact, surface) {
  assertValidSurface(surface);
  for (const f of surface.derivedFieldsInOrder) {
    if (!(f in artifact)) {
      throw new Error(`deriveSaid: artifact missing field '${f}' required by derivedFieldsInOrder`);
    }
  }
  if (surface.hasVersionString && !(surface.versionStringField in artifact)) {
    throw new Error(`deriveSaid: artifact missing versionStringField '${surface.versionStringField}'`);
  }
  const preimage = project(artifact, surface.derivedFieldsInOrder);
  preimage[surface.saidField] = SAID_PLACEHOLDER;
  if (surface.hasVersionString) {
    const version = computeKeriVersionString(preimage, surface.versionStringField, "JSON", surface.protocol, surface.saidField);
    preimage[surface.versionStringField] = version;
  }
  const said = digestInsertionOrderJson(preimage);
  const sealed = surface.hasVersionString ? {
    ...artifact,
    [surface.versionStringField]: preimage[surface.versionStringField],
    [surface.saidField]: said
  } : { ...artifact, [surface.saidField]: said };
  return { sealed, said };
}
function recomputeSaid(artifact, surface) {
  assertValidSurface(surface);
  const declaredRaw = artifact[surface.saidField];
  const declared = typeof declaredRaw === "string" ? declaredRaw : undefined;
  if (surface.hasVersionString && !(surface.versionStringField in artifact)) {
    return { matches: false, declared: undefined, recomputed: "" };
  }
  const preimage = project(artifact, surface.derivedFieldsInOrder);
  preimage[surface.saidField] = SAID_PLACEHOLDER;
  const recomputed = digestInsertionOrderJson(preimage);
  return {
    matches: declared !== undefined && declared === recomputed,
    declared,
    recomputed
  };
}
function serializeForSigning(artifact, surface) {
  const projected = project(artifact, surface.derivedFieldsInOrder);
  const text = serializeInsertionOrder(projected);
  const raw = new TextEncoder().encode(text);
  return { raw, text };
}

// src/said/surfaces.ts
var KEL_ICP_SURFACE = {
  saidField: "d",
  derivedFieldsInOrder: ["v", "t", "d", "i", "s", "kt", "k", "nt", "n", "bt", "b", "c", "a"],
  hasVersionString: true,
  versionStringField: "v",
  protocol: "KERI"
};
var KEL_ROT_SURFACE = {
  saidField: "d",
  derivedFieldsInOrder: ["v", "t", "d", "i", "s", "p", "kt", "k", "nt", "n", "bt", "br", "ba", "a"],
  hasVersionString: true,
  versionStringField: "v",
  protocol: "KERI"
};
var KEL_IXN_SURFACE = {
  saidField: "d",
  derivedFieldsInOrder: ["v", "t", "d", "i", "s", "p", "a"],
  hasVersionString: true,
  versionStringField: "v",
  protocol: "KERI"
};
var KEL_DIP_SURFACE = {
  saidField: "d",
  derivedFieldsInOrder: ["v", "t", "d", "i", "s", "kt", "k", "nt", "n", "bt", "b", "c", "a", "di"],
  hasVersionString: true,
  versionStringField: "v",
  protocol: "KERI"
};
var KEL_DRT_SURFACE = {
  saidField: "d",
  derivedFieldsInOrder: ["v", "t", "d", "i", "s", "p", "kt", "k", "nt", "n", "bt", "br", "ba", "a"],
  hasVersionString: true,
  versionStringField: "v",
  protocol: "KERI"
};
var TEL_VCP_SURFACE = {
  saidField: "d",
  derivedFieldsInOrder: ["v", "t", "d", "i", "ii", "s", "c", "bt", "b"],
  hasVersionString: true,
  versionStringField: "v",
  protocol: "KERI"
};
var TEL_VCP_WITH_NONCE_SURFACE = {
  saidField: "d",
  derivedFieldsInOrder: ["v", "t", "d", "i", "ii", "s", "c", "bt", "b", "n"],
  hasVersionString: true,
  versionStringField: "v",
  protocol: "KERI"
};
var TEL_VRT_SURFACE = {
  saidField: "d",
  derivedFieldsInOrder: ["v", "t", "d", "i", "p", "s", "bt", "br", "ba"],
  hasVersionString: true,
  versionStringField: "v",
  protocol: "KERI"
};
var TEL_ISS_SURFACE = {
  saidField: "d",
  derivedFieldsInOrder: ["v", "t", "d", "i", "s", "ri", "dt"],
  hasVersionString: true,
  versionStringField: "v",
  protocol: "KERI"
};
var TEL_REV_SURFACE = {
  saidField: "d",
  derivedFieldsInOrder: ["v", "t", "d", "i", "s", "ri", "p", "dt"],
  hasVersionString: true,
  versionStringField: "v",
  protocol: "KERI"
};
var TEL_BIS_SURFACE = {
  saidField: "d",
  derivedFieldsInOrder: ["v", "t", "d", "i", "ii", "s", "ra", "dt"],
  hasVersionString: true,
  versionStringField: "v",
  protocol: "KERI"
};
var TEL_BRV_SURFACE = {
  saidField: "d",
  derivedFieldsInOrder: ["v", "t", "d", "i", "s", "p", "ra", "dt"],
  hasVersionString: true,
  versionStringField: "v",
  protocol: "KERI"
};
var ACDC_SCHEMA_SURFACE = {
  saidField: "d",
  derivedFieldsInOrder: ["v", "t", "d", "s"],
  hasVersionString: true,
  versionStringField: "v",
  protocol: "ACDC"
};
var ACDC_CREDENTIAL_SURFACE = {
  saidField: "d",
  derivedFieldsInOrder: ["v", "d", "i", "s", "a"],
  hasVersionString: true,
  versionStringField: "v",
  protocol: "ACDC"
};
function buildACDCCredentialSurface(artifact) {
  const canonicalOrder = ["v", "d", "u", "i", "ri", "rd", "s", "a", "A", "e", "r"];
  const present = canonicalOrder.filter((f) => (f in artifact));
  if (present.length === 0)
    throw new Error("buildACDCCredentialSurface: no fields present");
  return {
    saidField: "d",
    derivedFieldsInOrder: present,
    hasVersionString: true,
    versionStringField: "v",
    protocol: "ACDC"
  };
}

// src/acdc/acdc-data.ts
function isACDC(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj))
    return false;
  const o = obj;
  return typeof o.v === "string" && o.v.startsWith("ACDC") && typeof o.d === "string" && typeof o.i === "string" && typeof o.s === "string";
}
function createProof(signerAid, signature, keyRef, dt) {
  return {
    t: "Ed25519",
    i: signerAid,
    s: signature,
    ...keyRef !== undefined ? { k: keyRef } : {},
    ...dt !== undefined ? { dt } : {}
  };
}
function create2(params) {
  const artifact = {
    v: "",
    d: ""
  };
  if (params.u !== undefined)
    artifact.u = params.u;
  artifact.i = params.i;
  if (params.ri !== undefined)
    artifact.ri = params.ri;
  if (params.rd !== undefined)
    artifact.rd = params.rd;
  artifact.s = params.s;
  if (params.a !== undefined)
    artifact.a = params.a;
  if (params.A !== undefined)
    artifact.A = params.A;
  if (params.e !== undefined)
    artifact.e = params.e;
  if (params.r !== undefined)
    artifact.r = params.r;
  const surface = buildACDCCredentialSurface(artifact);
  const { sealed } = deriveSaid(artifact, surface);
  return sealed;
}
var ACDCData = {
  isACDC,
  createProof,
  create: create2
};

// src/schema/schema-data.ts
var PERMITTED_SCHEMA_FIELDS = new Set(["v", "t", "d", "s"]);
function create3(jsonSchema) {
  const cleanJsonSchema = { ...jsonSchema };
  delete cleanJsonSchema.$id;
  const envelope = {
    v: "",
    t: "sch",
    d: "",
    s: cleanJsonSchema
  };
  const { sealed, said } = deriveSaid(envelope, ACDC_SCHEMA_SURFACE);
  return {
    ...sealed,
    s: { ...cleanJsonSchema, $id: `did:keri:${said}` }
  };
}
function extractJsonSchema(schema) {
  return schema.s;
}
function parse2(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, reason: "schema must be a non-null, non-array object" };
  }
  const obj = data;
  for (const key of Object.keys(obj)) {
    if (!PERMITTED_SCHEMA_FIELDS.has(key)) {
      return { ok: false, reason: `schema has unknown top-level field: '${key}'` };
    }
  }
  if (typeof obj.v !== "string") {
    return { ok: false, reason: "schema missing or invalid required field: v (expected string)" };
  }
  if (obj.t !== "sch") {
    return { ok: false, reason: `schema type field must be 'sch', got '${String(obj.t)}'` };
  }
  if (typeof obj.d !== "string") {
    return { ok: false, reason: "schema missing or invalid required field: d (expected string)" };
  }
  if (!obj.s || typeof obj.s !== "object" || Array.isArray(obj.s)) {
    return { ok: false, reason: "schema missing or invalid required field: s (expected non-null object)" };
  }
  const schema = {
    v: obj.v,
    t: "sch",
    d: obj.d,
    s: obj.s
  };
  return { ok: true, schema };
}
function isValid(obj) {
  return parse2(obj).ok;
}
var SchemaData = {
  create: create3,
  extractJsonSchema,
  parse: parse2,
  isValid
};

// src/schema/ops.ts
function said(schema) {
  return schema.d;
}
function verifySaid(schema) {
  return validateSaid(schema).valid;
}
function validateSaid(schema) {
  const cleanS = { ...schema.s };
  delete cleanS.$id;
  const envelope = {
    v: schema.v,
    t: schema.t,
    d: schema.d,
    s: cleanS
  };
  const result = recomputeSaid(envelope, ACDC_SCHEMA_SURFACE);
  return {
    valid: result.matches,
    expected: result.recomputed,
    actual: schema.d
  };
}
function parseAndVerifySaid(data) {
  const parseResult = SchemaData.parse(data);
  if (!parseResult.ok)
    return parseResult;
  const validation = validateSaid(parseResult.schema);
  if (!validation.valid) {
    return {
      ok: false,
      reason: `schema SAID mismatch: claimed ${validation.actual}, computed ${validation.expected}`
    };
  }
  return { ok: true, schema: parseResult.schema };
}
function validate(schema, data) {
  const jsonSchema = schema.s;
  const errors = validateJsonSchema(jsonSchema, data, "");
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}
function validateJsonSchema(schema, data, path) {
  const errors = [];
  if (schema.type === "object") {
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      errors.push({ path: path || "/", message: "Expected object", keyword: "type" });
      return errors;
    }
    const obj = data;
    for (const field of schema.required ?? []) {
      if (!(field in obj)) {
        errors.push({
          path: `${path}/${field}`,
          message: `Missing required field: ${field}`,
          keyword: "required"
        });
      }
    }
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in obj && propSchema && typeof propSchema === "object") {
          errors.push(...validateJsonSchema(propSchema, obj[key], `${path}/${key}`));
        }
      }
    }
  } else if (schema.type === "string") {
    if (typeof data !== "string") {
      errors.push({ path: path || "/", message: "Expected string", keyword: "type" });
    }
  } else if (schema.type === "number") {
    if (typeof data !== "number") {
      errors.push({ path: path || "/", message: "Expected number", keyword: "type" });
    }
  } else if (schema.type === "boolean") {
    if (typeof data !== "boolean") {
      errors.push({ path: path || "/", message: "Expected boolean", keyword: "type" });
    }
  } else if (schema.type === "array") {
    if (!Array.isArray(data)) {
      errors.push({ path: path || "/", message: "Expected array", keyword: "type" });
    }
  }
  return errors;
}
function flattenSchemaFields(schema) {
  const jsonSchema = schema.s;
  if (!jsonSchema.properties)
    return [];
  const defs = jsonSchema.$defs;
  const fields = [];
  for (const [key, propSchema] of Object.entries(jsonSchema.properties)) {
    if (!propSchema || typeof propSchema !== "object")
      continue;
    flattenProperty(propSchema, `/${key}`, fields, defs);
  }
  return fields;
}
function flattenProperty(prop, path, fields, defs) {
  if (typeof prop.$ref === "string") {
    const match = prop.$ref.match(/^#\/\$defs\/(.+)$/);
    const defName = match?.[1];
    if (defName !== undefined && defs && defName in defs) {
      const resolved = defs[defName];
      flattenProperty(resolved, path, fields, defs);
      return;
    }
    fields.push({ path, type: "unknown" });
    return;
  }
  if (prop.type === "schemaSaid" && typeof prop.schemaSaid === "string") {
    fields.push({ path, type: "ref", target: prop.schemaSaid });
    return;
  }
  if (prop.type === "array" && prop.items && typeof prop.items === "object") {
    const items = prop.items;
    if (items.type === "schemaSaid" && typeof items.schemaSaid === "string") {
      fields.push({ path: `${path}/items`, type: "ref", target: items.schemaSaid });
    } else if (items.type === "object" && items.properties) {
      for (const [subKey, subProp] of Object.entries(items.properties)) {
        if (subProp && typeof subProp === "object") {
          flattenProperty(subProp, `${path}/items/${subKey}`, fields, defs);
        }
      }
    } else {
      fields.push({ path: `${path}/items`, type: String(items.type ?? "unknown") });
    }
    return;
  }
  if (prop.type === "object" && prop.properties) {
    for (const [subKey, subProp] of Object.entries(prop.properties)) {
      if (subProp && typeof subProp === "object") {
        flattenProperty(subProp, `${path}/${subKey}`, fields, defs);
      }
    }
    return;
  }
  fields.push({ path, type: String(prop.type ?? "unknown") });
}
var SchemaOps = {
  said,
  verifySaid,
  validateSaid,
  parseAndVerifySaid,
  validate,
  flattenSchemaFields
};

// node_modules/@noble/curves/utils.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function aarray(item, title, inner = () => {}) {
  if (!Array.isArray(item))
    throw new TypeError(`"${title}" expected array, got type=${typeof item}`);
  for (let i = 0;i < item.length; i++)
    inner(item[i], `${title}[${i}]`);
  return item;
}
var abytes2 = (value, length, title) => abytes(value, length, title);
var anumber2 = anumber;
function astring(value, title = "") {
  if (typeof value !== "string") {
    const prefix = title && `"${title}" `;
    throw new TypeError(prefix + "expected string, got type=" + typeof value);
  }
  return value;
}
function aobject2(value, title = "object") {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new TypeError(title === "object" ? "expected valid options object" : `"${title}" expected object, got type=${typeof value}`);
  return value;
}
function afunction(value, title) {
  if (typeof value !== "function")
    throw new TypeError(`"${title}" is invalid: expected function, got ${typeof value}`);
  return value;
}
var bytesToHex2 = bytesToHex;
var concatBytes2 = (...arrays) => concatBytes(...arrays);
var hexToBytes2 = (hex) => hexToBytes(hex);
var isBytes2 = isBytes;
var randomBytes2 = (bytesLength) => randomBytes(bytesLength);
var _0n2 = /* @__PURE__ */ BigInt(0);
var _1n2 = /* @__PURE__ */ BigInt(1);
var atitle2 = (title) => title ? `"${title}" ` : "";
function abool2(value, title = "") {
  if (typeof value !== "boolean")
    throw new TypeError(atitle2(title) + "expected boolean, got type=" + typeof value);
  return value;
}
function abignumber(n) {
  if (typeof n === "bigint") {
    if (!isPosBig(n))
      throw new RangeError("positive bigint expected, got " + n);
  } else
    anumber2(n);
  return n;
}
function asafenumber(value, title = "") {
  if (typeof value !== "number") {
    const prefix = title && `"${title}" `;
    throw new TypeError(prefix + "expected number, got type=" + typeof value);
  }
  if (!Number.isSafeInteger(value)) {
    const prefix = title && `"${title}" `;
    throw new RangeError(prefix + "expected safe integer, got " + value);
  }
}
function numberToHexUnpadded(num) {
  const hex = abignumber(num).toString(16);
  return hex.length & 1 ? "0" + hex : hex;
}
function hexToNumber(hex) {
  if (typeof hex !== "string")
    throw new TypeError("hex string expected, got " + typeof hex);
  return hex === "" ? _0n2 : BigInt("0x" + hex);
}
function bytesToNumberBE(bytes) {
  return hexToNumber(bytesToHex(bytes));
}
function bytesToNumberLE(bytes) {
  return hexToNumber(bytesToHex(copyBytes2(abytes(bytes)).reverse()));
}
function numberToBytesBE(n, len) {
  anumber(len);
  if (len === 0)
    throw new Error("zero output length is invalid");
  n = abignumber(n);
  const expectedLen = len * 2;
  const hex = n.toString(16);
  if (hex.length > expectedLen)
    throw new RangeError("number is too large");
  return hexToBytes(hex.padStart(expectedLen, "0"));
}
function numberToBytesLE(n, len) {
  return numberToBytesBE(n, len).reverse();
}
function copyBytes2(bytes) {
  return Uint8Array.from(abytes2(bytes));
}
function isPosBig(n) {
  return typeof n === "bigint" && _0n2 <= n;
}
function inRange(n, min, max) {
  return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
}
function aInRange(title, n, min, max) {
  if (!inRange(n, min, max))
    throw new RangeError("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
}
function bitLen(n) {
  if (n < _0n2)
    throw new Error("expected non-negative bigint, got " + n);
  return n === _0n2 ? 0 : n.toString(2).length;
}
var bitMask = (n) => {
  asafenumber(n, "n");
  return (_1n2 << BigInt(n)) - _1n2;
};
function createHmacDrbg(hashLen, qByteLen, hmacFn) {
  anumber(hashLen, "hashLen");
  anumber(qByteLen, "qByteLen");
  if (typeof hmacFn !== "function")
    throw new TypeError("hmacFn must be a function");
  const u8n = (len) => new Uint8Array(len);
  const NULL = Uint8Array.of();
  const byte0 = Uint8Array.of(0);
  const byte1 = Uint8Array.of(1);
  const _maxDrbgIters = 1000;
  let v = u8n(hashLen);
  let k = u8n(hashLen);
  let i = 0;
  const reset = () => {
    v.fill(1);
    k.fill(0);
    i = 0;
  };
  const h = (...msgs) => hmacFn(k, concatBytes2(v, ...msgs));
  const reseed = (seed = NULL) => {
    k = h(byte0, seed);
    v = h();
    if (seed.length === 0)
      return;
    k = h(byte1, seed);
    v = h();
  };
  const gen = () => {
    if (i++ >= _maxDrbgIters)
      throw new Error("drbg: tried max amount of iterations");
    let len = 0;
    const out = [];
    while (len < qByteLen) {
      v = h();
      const sl = v.slice();
      out.push(sl);
      len += v.length;
    }
    return concatBytes2(...out);
  };
  const genUntil = (seed, pred) => {
    reset();
    reseed(seed);
    let res = undefined;
    while ((res = pred(gen())) === undefined)
      reseed();
    reset();
    return res;
  };
  return genUntil;
}
function validateObject(object, fields = {}, optFields = {}, title = "object") {
  aobject2(object, title);
  aobject2(fields, "fields");
  aobject2(optFields, "optFields");
  function checkField(fieldName, expectedType, isOpt) {
    const label = title === "object" ? `param "${String(fieldName)}"` : `"${title}.${String(fieldName)}"`;
    const val = object[fieldName];
    if (!Object.hasOwn(object, fieldName) && (isOpt ? val !== undefined : expectedType !== "function")) {
      throw new TypeError(`${label} is invalid: expected own property`);
    }
    if (isOpt && val === undefined)
      return;
    const current = typeof val;
    if (current !== expectedType || val === null)
      throw new TypeError(`${label} is invalid: expected ${expectedType}, got ${current}`);
  }
  const iter = (f, isOpt) => Object.entries(f).forEach(([k, v]) => checkField(k, v, isOpt));
  iter(fields, false);
  iter(optFields, true);
}

// node_modules/@noble/curves/abstract/modular.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n3 = /* @__PURE__ */ BigInt(0);
var _1n3 = /* @__PURE__ */ BigInt(1);
var _2n2 = /* @__PURE__ */ BigInt(2);
var _3n = /* @__PURE__ */ BigInt(3);
var _4n = /* @__PURE__ */ BigInt(4);
var _5n = /* @__PURE__ */ BigInt(5);
var _7n2 = /* @__PURE__ */ BigInt(7);
var _8n = /* @__PURE__ */ BigInt(8);
var _9n = /* @__PURE__ */ BigInt(9);
var _15n = /* @__PURE__ */ BigInt(15);
var _16n = /* @__PURE__ */ BigInt(16);
var POW_WINDOWED_MIN = /* @__PURE__ */ BigInt("0x10000000000000000");
function mod(a, b) {
  if (b <= _0n3)
    throw new Error("mod: expected positive modulus, got " + b);
  const result = a % b;
  return result >= _0n3 ? result : b + result;
}
function pow(num, power, modulo) {
  if (modulo <= _1n3)
    throw new Error("pow: expected modulus > 1, got " + modulo);
  if (typeof power !== "bigint")
    throw new TypeError("invalid exponent: expected bigint, got " + typeof power);
  if (power < _0n3)
    throw new Error("invalid exponent, negatives unsupported");
  if (power === _0n3)
    return _1n3;
  if (power === _1n3)
    return num;
  let d = num % modulo;
  if (d < _0n3)
    d += modulo;
  if (power < POW_WINDOWED_MIN) {
    let p = _1n3;
    while (power > _0n3) {
      if (power & _1n3)
        p = p * d % modulo;
      d = d * d % modulo;
      power >>= _1n3;
    }
    return p;
  }
  const digits = [];
  while (power > _0n3) {
    digits.push(Number(power & _15n));
    power >>= _4n;
  }
  const table = new Array(16);
  table[0] = _1n3;
  table[1] = d;
  for (let i = 2;i < 16; i++)
    table[i] = table[i - 1] * d % modulo;
  let p = table[digits[digits.length - 1]];
  for (let w = digits.length - 2;w >= 0; w--) {
    p = p * p % modulo;
    p = p * p % modulo;
    p = p * p % modulo;
    p = p * p % modulo;
    const digit = digits[w];
    if (digit !== 0)
      p = p * table[digit] % modulo;
  }
  return p;
}
function pow2(x, power, modulo) {
  if (modulo <= _1n3)
    throw new Error("pow2: expected modulus > 1, got " + modulo);
  if (power < _0n3)
    throw new Error("pow2: expected non-negative exponent, got " + power);
  let res = x;
  while (power-- > _0n3) {
    res *= res;
    res %= modulo;
  }
  return res;
}
function invert(number, modulo) {
  if (number === _0n3)
    throw new Error("invert: expected non-zero number");
  if (modulo <= _1n3)
    throw new Error("invert: expected modulus > 1, got " + modulo);
  let a = mod(number, modulo);
  let b = modulo;
  let x = _0n3, u = _1n3;
  while (a !== _0n3) {
    const q = b / a;
    const r = b - a * q;
    const m = x - u * q;
    b = a, a = r, x = u, u = m;
  }
  const gcd = b;
  if (gcd !== _1n3)
    throw new Error("invert: does not exist");
  return mod(x, modulo);
}
function invertCt(a, prime) {
  if (prime <= _1n3)
    throw new Error("invertCt: expected prime modulus > 1, got " + prime);
  const an = mod(a, prime);
  if (an === _0n3)
    throw new Error("invertCt: expected non-zero number");
  const inverse = pow(an, prime - _2n2, prime);
  if (mod(an * inverse, prime) !== _1n3)
    throw new Error("invertCt: does not exist");
  return inverse;
}
function assertIsSquare(Fp, root, n) {
  const F = Fp;
  if (!F.eql(F.sqr(root), n))
    throw new Error("Cannot find square root");
}
function aoddModulus(order, fnName) {
  if ((order & _1n3) === _0n3)
    throw new Error(fnName + ": expected odd modulus, got " + order);
}
function sqrt3mod4(Fp, n) {
  const F = Fp;
  const p1div4 = (F.ORDER + _1n3) / _4n;
  const root = F.pow(n, p1div4);
  assertIsSquare(F, root, n);
  return root;
}
function sqrt5mod8(Fp, n) {
  const F = Fp;
  const p5div8 = (F.ORDER - _5n) / _8n;
  const n2 = F.mul(n, _2n2);
  const v = F.pow(n2, p5div8);
  const nv = F.mul(n, v);
  const i = F.mul(F.mul(nv, _2n2), v);
  const root = F.mul(nv, F.sub(i, F.ONE));
  assertIsSquare(F, root, n);
  return root;
}
function sqrt9mod16(P) {
  const Fp_ = Field(P);
  const tn = tonelliShanks(P);
  const c1 = tn(Fp_, Fp_.neg(Fp_.ONE));
  const c2 = tn(Fp_, c1);
  const c3 = tn(Fp_, Fp_.neg(c1));
  const c4 = (P + _7n2) / _16n;
  return (Fp, n) => {
    const F = Fp;
    let tv1 = F.pow(n, c4);
    let tv2 = F.mul(tv1, c1);
    const tv3 = F.mul(tv1, c2);
    const tv4 = F.mul(tv1, c3);
    const e1 = F.eql(F.sqr(tv2), n);
    const e2 = F.eql(F.sqr(tv3), n);
    tv1 = F.cmov(tv1, tv2, e1);
    tv2 = F.cmov(tv4, tv3, e2);
    const e3 = F.eql(F.sqr(tv2), n);
    const root = F.cmov(tv1, tv2, e3);
    assertIsSquare(F, root, n);
    return root;
  };
}
function tonelliShanks(P) {
  if (P < _3n)
    throw new Error("sqrt is not defined for small field");
  aoddModulus(P, "tonelliShanks");
  let Q = P - _1n3;
  let S = 0;
  while (Q % _2n2 === _0n3) {
    Q /= _2n2;
    S++;
  }
  let Z = _2n2;
  const _Fp = Field(P);
  while (FpLegendre(_Fp, Z) === 1) {
    if (Z++ > 1000)
      throw new Error("Cannot find square root: probably non-prime P");
  }
  if (S === 1)
    return sqrt3mod4;
  let cc = _Fp.pow(Z, Q);
  const Q1div2 = (Q + _1n3) / _2n2;
  return function tonelliSlow(Fp, n) {
    const F = Fp;
    if (F.is0(n))
      return n;
    if (FpLegendre(F, n) !== 1)
      throw new Error("Cannot find square root");
    let M = S;
    let c = F.mul(F.ONE, cc);
    let t = F.pow(n, Q);
    let R = F.pow(n, Q1div2);
    while (!F.eql(t, F.ONE)) {
      if (F.is0(t))
        throw new Error("Cannot find square root: probably non-prime P");
      let i = 1;
      let t_tmp = F.sqr(t);
      while (!F.eql(t_tmp, F.ONE)) {
        i++;
        t_tmp = F.sqr(t_tmp);
        if (i === M)
          throw new Error("Cannot find square root");
      }
      const exponent = _1n3 << BigInt(M - i - 1);
      const b = F.pow(c, exponent);
      M = i;
      c = F.sqr(b);
      t = F.mul(t, c);
      R = F.mul(R, b);
    }
    return R;
  };
}
function FpSqrt(P) {
  aoddModulus(P, "Fp.sqrt");
  if (P % _4n === _3n)
    return sqrt3mod4;
  if (P % _8n === _5n)
    return sqrt5mod8;
  if (P % _16n === _9n)
    return sqrt9mod16(P);
  return tonelliShanks(P);
}
var isNegativeLE = (num, modulo) => (mod(num, modulo) & _1n3) === _1n3;
var FIELD_FIELDS = [
  "create",
  "isValid",
  "is0",
  "neg",
  "inv",
  "sqrt",
  "sqr",
  "eql",
  "add",
  "sub",
  "mul",
  "pow",
  "div",
  "addN",
  "subN",
  "mulN",
  "sqrN"
];
function validateField(field) {
  aobject2(field, "field");
  if (typeof field.ORDER !== "bigint")
    throw new TypeError('param "ORDER" is invalid: expected bigint, got ' + typeof field.ORDER);
  asafenumber(field.BYTES, "BYTES");
  asafenumber(field.BITS, "BITS");
  for (const name of FIELD_FIELDS)
    afunction(field[name], "field." + name);
  if (field.BYTES < 1 || field.BITS < 1)
    throw new Error("invalid field: expected BYTES/BITS > 0");
  if (field.ORDER <= _1n3)
    throw new Error("invalid field: expected ORDER > 1, got " + field.ORDER);
  return field;
}
function FpInvertBatch(Fp, nums, passZero = false) {
  validateField(Fp);
  aarray(nums, "nums");
  abool2(passZero, "passZero");
  const F = Fp;
  const inverted = new Array(nums.length).fill(passZero ? F.ZERO : undefined);
  const multipliedAcc = nums.reduce((acc, num, i) => {
    if (F.is0(num))
      return acc;
    inverted[i] = acc;
    return F.mul(acc, num);
  }, F.ONE);
  const invertedAcc = F.inv(multipliedAcc);
  nums.reduceRight((acc, num, i) => {
    if (F.is0(num))
      return acc;
    inverted[i] = F.mul(acc, inverted[i]);
    return F.mul(acc, num);
  }, invertedAcc);
  return inverted;
}
function FpLegendre(Fp, n) {
  validateField(Fp);
  const F = Fp;
  aoddModulus(F.ORDER, "FpLegendre");
  const p1mod2 = (F.ORDER - _1n3) / _2n2;
  const powered = F.pow(n, p1mod2);
  const yes = F.eql(powered, F.ONE);
  const zero = F.eql(powered, F.ZERO);
  const no = F.eql(powered, F.neg(F.ONE));
  if (!yes && !zero && !no)
    throw new Error("invalid Legendre symbol result");
  return yes ? 1 : zero ? 0 : -1;
}
function nLength(n, nBitLength) {
  if (nBitLength !== undefined)
    anumber2(nBitLength);
  if (n <= _0n3)
    throw new Error("invalid n length: expected positive n, got " + n);
  if (nBitLength !== undefined && nBitLength < 1)
    throw new Error("invalid n length: expected positive bit length, got " + nBitLength);
  const bits = bitLen(n);
  if (nBitLength !== undefined && nBitLength < bits)
    throw new Error(`invalid n length: expected nBitLength (${nBitLength}) >= bitLen(n) (${bits})`);
  const _nBitLength = nBitLength !== undefined ? nBitLength : bits;
  const nByteLength = Math.ceil(_nBitLength / 8);
  return { nBitLength: _nBitLength, nByteLength };
}
var FIELD_SQRT = new WeakMap;

class _Field {
  ORDER;
  BITS;
  BYTES;
  isLE;
  ZERO = _0n3;
  ONE = _1n3;
  _lengths;
  _mod;
  constructor(ORDER, opts = {}) {
    if (ORDER <= _1n3)
      throw new Error("invalid field: expected ORDER > 1, got " + ORDER);
    let _nbitLength = undefined;
    this.isLE = false;
    if (opts != null && typeof opts === "object") {
      if (typeof opts.BITS === "number")
        _nbitLength = opts.BITS;
      if (typeof opts.sqrt === "function")
        Object.defineProperty(this, "sqrt", { value: opts.sqrt, enumerable: true });
      if (typeof opts.isLE === "boolean")
        this.isLE = opts.isLE;
      if (opts.allowedLengths)
        this._lengths = Object.freeze(opts.allowedLengths.slice());
      if (typeof opts.modFromBytes === "boolean")
        this._mod = opts.modFromBytes;
    }
    const { nBitLength, nByteLength } = nLength(ORDER, _nbitLength);
    if (nByteLength > 2048)
      throw new Error("invalid field: expected ORDER of <= 2048 bytes");
    this.ORDER = ORDER;
    this.BITS = nBitLength;
    this.BYTES = nByteLength;
    Object.freeze(this);
  }
  create(num) {
    return mod(num, this.ORDER);
  }
  isValid(num) {
    if (typeof num !== "bigint")
      throw new TypeError("invalid field element: expected bigint, got " + typeof num);
    return _0n3 <= num && num < this.ORDER;
  }
  is0(num) {
    return num === _0n3;
  }
  isValidNot0(num) {
    return !this.is0(num) && this.isValid(num);
  }
  isOdd(num) {
    return (num & _1n3) === _1n3;
  }
  neg(num) {
    return mod(-num, this.ORDER);
  }
  eql(lhs, rhs) {
    return lhs === rhs;
  }
  sqr(num) {
    return mod(num * num, this.ORDER);
  }
  add(lhs, rhs) {
    return mod(lhs + rhs, this.ORDER);
  }
  sub(lhs, rhs) {
    return mod(lhs - rhs, this.ORDER);
  }
  mul(lhs, rhs) {
    return mod(lhs * rhs, this.ORDER);
  }
  pow(num, power) {
    return pow(num, power, this.ORDER);
  }
  div(lhs, rhs) {
    return mod(lhs * invert(rhs, this.ORDER), this.ORDER);
  }
  sqrN(num) {
    return num * num;
  }
  addN(lhs, rhs) {
    return lhs + rhs;
  }
  subN(lhs, rhs) {
    return lhs - rhs;
  }
  mulN(lhs, rhs) {
    return lhs * rhs;
  }
  inv(num) {
    return invert(num, this.ORDER);
  }
  sqrt(num) {
    let sqrt = FIELD_SQRT.get(this);
    if (!sqrt)
      FIELD_SQRT.set(this, sqrt = FpSqrt(this.ORDER));
    return sqrt(this, num);
  }
  toBytes(num) {
    return this.isLE ? numberToBytesLE(num, this.BYTES) : numberToBytesBE(num, this.BYTES);
  }
  fromBytes(bytes, skipValidation = false) {
    abytes2(bytes);
    const { _lengths: allowedLengths, BYTES, isLE, ORDER, _mod: modFromBytes } = this;
    if (allowedLengths) {
      if (bytes.length < 1 || !allowedLengths.includes(bytes.length) || bytes.length > BYTES) {
        throw new Error("Field.fromBytes: expected " + allowedLengths + " bytes, got " + bytes.length);
      }
      const padded = new Uint8Array(BYTES);
      padded.set(bytes, isLE ? 0 : padded.length - bytes.length);
      bytes = padded;
    }
    if (bytes.length !== BYTES)
      throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes.length);
    let scalar = isLE ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
    if (modFromBytes)
      scalar = mod(scalar, ORDER);
    if (!skipValidation) {
      if (!this.isValid(scalar))
        throw new Error("invalid field element: outside of range 0..ORDER");
    }
    return scalar;
  }
  invertBatch(lst) {
    return FpInvertBatch(this, lst, true);
  }
  cmov(a, b, condition) {
    abool2(condition, "condition");
    return condition ? b : a;
  }
}
function Field(ORDER, opts = {}) {
  Object.freeze(_Field.prototype);
  return new _Field(ORDER, opts);
}
function getFieldBytesLength(fieldOrder) {
  if (typeof fieldOrder !== "bigint")
    throw new Error("field order must be bigint");
  if (fieldOrder <= _1n3)
    throw new Error("field order must be greater than 1");
  const bitLength = bitLen(fieldOrder - _1n3);
  return Math.ceil(bitLength / 8);
}
function getMinHashLength(fieldOrder) {
  const length = getFieldBytesLength(fieldOrder);
  return length + Math.ceil(length / 2);
}
function mapHashToField(key, fieldOrder, isLE = false) {
  abytes2(key);
  const len = key.length;
  const fieldLen = getFieldBytesLength(fieldOrder);
  const minLen = Math.max(getMinHashLength(fieldOrder), 16);
  if (len < minLen || len > 1024)
    throw new Error("expected " + minLen + "-1024 bytes of input, got " + len);
  const num = isLE ? bytesToNumberLE(key) : bytesToNumberBE(key);
  const reduced = mod(num, fieldOrder - _1n3) + _1n3;
  return isLE ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
}

// node_modules/@noble/curves/abstract/curve.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n4 = /* @__PURE__ */ BigInt(0);
var _1n4 = /* @__PURE__ */ BigInt(1);
var _4n2 = /* @__PURE__ */ BigInt(4);
var BLIND_BYTES = 16;
var BLIND_BITS = 128;
var FW_WINDOW = 5;
var TABLE_BYTES_MAX = /* @__PURE__ */ (() => 2 ** 31)();
function validatePointCons(Point) {
  const pc = Point;
  if (typeof pc !== "function")
    throw new TypeError('"Point" expected constructor, got type=' + typeof Point);
  afunction(pc.fromAffine, "Point.fromAffine");
  afunction(pc.fromBytes, "Point.fromBytes");
  afunction(pc.fromHex, "Point.fromHex");
  aobject2(pc.BASE, "Point.BASE");
  aobject2(pc.ZERO, "Point.ZERO");
  validateField(pc.Fp);
  validateField(pc.Fn);
}
function normalizeZ(c, points) {
  validatePointCons(c);
  validateMSMPoints(points, c);
  const invertedZs = FpInvertBatch(c.Fp, points.map((p) => p.Z));
  return points.map((p, i) => c.fromAffine(p.toAffine(invertedZs[i])));
}
function validateW(W, bits, min = 1) {
  if (!Number.isSafeInteger(W) || W < min || W > bits)
    throw new Error("invalid window size, expected [" + min + ".." + bits + "], got W=" + W);
}
function validateTableBytes(numPoints, fpBytes) {
  const bytes = numPoints * (4 * fpBytes + 128);
  if (bytes > TABLE_BYTES_MAX)
    throw new Error("invalid window size: table would need ~" + Math.ceil(bytes / 2 ** 20) + " MiB, max " + TABLE_BYTES_MAX / 2 ** 20 + " MiB");
}
function probeRandomBytes(randomBytes, length) {
  if (randomBytes === undefined)
    return;
  afunction(randomBytes, "randomBytes");
  try {
    const probe = randomBytes(length);
    if (!isBytes2(probe) || probe.length !== length)
      return;
  } catch {
    return;
  }
  return randomBytes;
}
function validateMSMPoints(points, c) {
  aarray(points, "points");
  points.forEach((p, i) => {
    if (!(p instanceof c))
      throw new Error("invalid point at index " + i);
  });
}
function validateMSMScalars(scalars, field, maxScalar) {
  if (!Array.isArray(scalars))
    throw new Error("array of scalars expected");
  scalars.forEach((s, i) => {
    const ok = maxScalar === undefined ? field.isValid(s) : isPosBig(s) && s < maxScalar;
    if (!ok)
      throw new Error("invalid scalar at index " + i);
  });
}
var pointWindowSizes = new WeakMap;
function getWindowSize(P) {
  return pointWindowSizes.get(P) || 1;
}
function oddMultiples(p, size) {
  const dbl = p.double();
  const t = [p];
  for (let j = 1;j < size; j++)
    t.push(t[j - 1].add(dbl));
  return t;
}
function wnafDigits(n, W) {
  const size = 2 ** W;
  const half = size / 2;
  const mask = BigInt(size - 1);
  const d = [];
  while (n > _0n4) {
    let w = 0;
    if (n & _1n4) {
      w = Number(n & mask);
      if (w >= half)
        w -= size;
      n -= BigInt(w);
    }
    d.push(w);
    n >>= _1n4;
  }
  return d;
}
function signedWindowDigits(n, W, windows) {
  const size = 2 ** W;
  const half = size / 2;
  const mask = BigInt(size - 1);
  const shiftBy = BigInt(W);
  const d = [];
  for (let w = 0;w < windows; w++) {
    let v = Number(n & mask);
    n >>= shiftBy;
    if (v > half) {
      v -= size;
      n += _1n4;
    }
    d.push(v);
  }
  if (n !== _0n4)
    throw new Error("invalid wnaf");
  return d;
}
function wnafWalk(zero, tables, digits) {
  let max = 0;
  for (const d of digits)
    max = Math.max(max, d.length);
  let acc = zero;
  for (let bit = max - 1;bit >= 0; bit--) {
    if (bit !== max - 1)
      acc = acc.double();
    for (let i = 0;i < digits.length; i++) {
      const w = digits[i][bit];
      if (w) {
        const item = tables[i][Math.abs(w) - 1 >> 1];
        acc = acc.add(w < 0 ? item.negate() : item);
      }
    }
  }
  return acc;
}

class ScalarMultiplier {
  Point;
  BASE;
  ZERO;
  randomBytes;
  wnafPrecomputes = new WeakMap;
  baseCanBeBlinded;
  bits;
  constructor(Point, randomBytes) {
    validatePointCons(Point);
    this.randomBytes = probeRandomBytes(randomBytes, BLIND_BYTES);
    this.Point = Point;
    this.BASE = Point.BASE;
    this.ZERO = Point.ZERO;
    this.bits = Point.Fn.BITS;
  }
  buildWnafTable(point, W, bits) {
    const windows = Math.ceil(bits / W) + 1;
    const half = 2 ** (W - 1);
    const comp = [];
    let base = point;
    for (let w = 0;w < windows; w++) {
      let acc = base;
      for (let i = 0;i < half; i++) {
        comp.push(acc);
        acc = acc.add(base);
      }
      base = comp[comp.length - 1].double();
    }
    return { W, bits, windows, comp };
  }
  wnafCachedCT(precomputes, n) {
    const { W, windows, comp } = precomputes;
    const half = 2 ** (W - 1);
    const digits = signedWindowDigits(n, W, windows);
    let p = this.ZERO;
    let f = this.BASE;
    for (let w = 0;w < windows; w++) {
      const digit = digits[w];
      const start = w * half;
      const idx = Math.abs(digit) - 1;
      let sel = comp[start];
      for (let i = 1;i < half; i++)
        sel = i === idx ? comp[start + i] : sel;
      const neg = sel.negate();
      if (digit === 0)
        f = f.add(comp[start]);
      else
        p = p.add(digit < 0 ? neg : sel);
    }
    return { p, f };
  }
  getWnafPrecomputes(W, point, bits, transform) {
    let entries = this.wnafPrecomputes.get(point);
    let comp = entries?.find((entry) => entry.W === W && entry.bits === bits);
    if (!comp) {
      comp = this.buildWnafTable(point, W, bits);
      if (typeof transform === "function")
        comp = { ...comp, comp: transform(comp.comp) };
      if (!entries) {
        entries = [];
        this.wnafPrecomputes.set(point, entries);
      }
      entries.push(comp);
    }
    return comp;
  }
  assertPoint(point) {
    if (!(point instanceof this.Point))
      throw new TypeError('"point" expected Point instance, got type=' + typeof point);
  }
  validateMulInput(point, scalar) {
    this.assertPoint(point);
    if (!inRange(scalar, _1n4, this.Point.Fn.ORDER))
      throw new Error("invalid scalar");
  }
  runCT(point, n, bits, transform) {
    const W = getWindowSize(point);
    if (W === 1)
      return this.fixedWindowCT(point, n, bits);
    return this.wnafCachedCT(this.getWnafPrecomputes(W, point, bits, transform), n);
  }
  mulCT(point, scalar, transform) {
    this.validateMulInput(point, scalar);
    return this.runCT(point, scalar, this.bits, transform);
  }
  mulCTBlinded(point, scalar, transform) {
    this.validateMulInput(point, scalar);
    if (this.randomBytes === undefined)
      throw new Error("randomBytes is required for scalar blinding");
    const bits = this.Point.Fn.BITS + BLIND_BITS;
    const blind = this.randomBytes(BLIND_BYTES);
    if (!isBytes2(blind) || blind.length !== BLIND_BYTES)
      throw new Error("randomBytes returned invalid byte array");
    blind[0] = blind[0] & 63 | 128;
    const n = scalar + bytesToNumberBE(blind) * this.Point.Fn.ORDER;
    return this.runCT(point, n, bits, transform);
  }
  fixedWindowCT(point, n, bits) {
    const W = FW_WINDOW;
    const size = 1 << W;
    const mask = bitMask(W);
    const table = new Array(size);
    table[0] = this.ZERO;
    for (let i = 1;i < size; i++)
      table[i] = table[i - 1].add(point);
    const windows = Math.ceil(bits / W);
    let acc = this.ZERO;
    for (let window = windows - 1;window >= 0; window--) {
      if (window !== windows - 1)
        for (let d = 0;d < W; d++)
          acc = acc.double();
      const digit = Number(n >> BigInt(window * W) & mask);
      let sel = table[0];
      for (let i = 1;i < size; i++)
        sel = i === digit ? table[i] : sel;
      acc = acc.add(sel);
    }
    return { p: acc, f: acc };
  }
  shouldBlind(point, cofactor) {
    if (this.randomBytes === undefined)
      return false;
    if (cofactor === _1n4)
      return true;
    if (point !== this.BASE)
      return false;
    if (this.baseCanBeBlinded === undefined)
      this.baseCanBeBlinded = this.mulUnsafe(this.BASE, this.Point.Fn.ORDER).is0();
    return this.baseCanBeBlinded;
  }
  mulSecret(point, scalar, cofactor, transform) {
    return this.shouldBlind(point, cofactor) ? this.mulCTBlinded(point, scalar, transform) : this.mulCT(point, scalar, transform);
  }
  mulUnsafe(point, scalar, transform) {
    this.assertPoint(point);
    if (!isPosBig(scalar))
      throw new Error("invalid scalar");
    const W = getWindowSize(point);
    if (W === 1 || scalar >= this.Point.Fn.ORDER)
      return mulAddUnsafe(this.Point, [point], [scalar], true);
    const precomputes = this.getWnafPrecomputes(W, point, this.bits, transform);
    return this.wnafCachedCT(precomputes, scalar).p;
  }
  setWindowSize(point, W) {
    this.assertPoint(point);
    validateW(W, this.bits);
    const windows = Math.ceil((this.bits + BLIND_BITS) / W) + 1;
    validateTableBytes(windows * 2 ** (W - 1), this.Point.Fp.BYTES);
    pointWindowSizes.set(point, W);
    this.wnafPrecomputes.delete(point);
  }
  hasWindowSize(point) {
    return getWindowSize(point) !== 1;
  }
}
function mulAddUnsafe(c, points, scalars, allowOversized = false) {
  validatePointCons(c);
  validateMSMPoints(points, c);
  abool2(allowOversized, "allowOversized");
  validateMSMScalars(scalars, c.Fn, allowOversized ? c.Fn.ORDER ** _4n2 : undefined);
  if (points.length !== scalars.length)
    throw new Error("arrays of points and scalars must have equal length");
  const tables = points.map((p) => oddMultiples(p, 4));
  const digits = scalars.map((n) => wnafDigits(n, 4));
  return wnafWalk(c.ZERO, tables, digits);
}
function createField(order, field, isLE) {
  if (field) {
    if (field.ORDER !== order)
      throw new Error("Field.ORDER must match order: Fp == p, Fn == n");
    validateField(field);
    return field;
  } else {
    return Field(order, { isLE });
  }
}
function createCurveFields(type, CURVE, curveOpts = {}, FpFnLE) {
  if (type !== "weierstrass" && type !== "edwards")
    throw new Error('expected curve type "weierstrass" or "edwards"');
  if (FpFnLE === undefined)
    FpFnLE = type === "edwards";
  if (!CURVE || typeof CURVE !== "object")
    throw new Error(`expected valid ${type} CURVE object`);
  validateObject(curveOpts);
  for (const p of ["p", "n", "h"]) {
    const val = CURVE[p];
    if (!(isPosBig(val) && val !== _0n4))
      throw new Error(`CURVE.${p} must be positive bigint`);
  }
  const Fp = createField(CURVE.p, curveOpts.Fp, FpFnLE);
  const Fn = createField(CURVE.n, curveOpts.Fn, FpFnLE);
  const _b = type === "weierstrass" ? "b" : "d";
  const params = ["Gx", "Gy", "a", _b];
  for (const p of params) {
    if (!Fp.isValid(CURVE[p]))
      throw new Error(`CURVE.${p} must be valid field element of CURVE.Fp`);
  }
  CURVE = Object.freeze(Object.assign({}, CURVE));
  return { CURVE, Fp, Fn };
}
function createKeygen(randomSecretKey, getPublicKey) {
  return function keygen(seed) {
    const secretKey = randomSecretKey(seed);
    return { secretKey, publicKey: getPublicKey(secretKey) };
  };
}

// node_modules/@noble/curves/abstract/edwards.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n5 = /* @__PURE__ */ BigInt(0);
var _1n5 = /* @__PURE__ */ BigInt(1);
var _2n3 = /* @__PURE__ */ BigInt(2);
var _4n3 = /* @__PURE__ */ BigInt(4);
var _8n2 = /* @__PURE__ */ BigInt(8);
function isEdValidXY(Fp, CURVE, x, y) {
  const x2 = Fp.sqr(x);
  const y2 = Fp.sqr(y);
  const left = Fp.add(Fp.mul(CURVE.a, x2), y2);
  const right = Fp.add(Fp.ONE, Fp.mul(CURVE.d, Fp.mul(x2, y2)));
  return Fp.eql(left, right);
}
function edwards(params, extraOpts = {}) {
  validateObject(extraOpts, {}, {}, "extraOpts");
  const opts = extraOpts;
  const validated = createCurveFields("edwards", params, opts, opts.FpFnLE);
  const { Fp, Fn } = validated;
  let CURVE = validated.CURVE;
  const { h: cofactor } = CURVE;
  if (FpLegendre(Fp, CURVE.a) !== 1)
    throw new Error("edwards: CURVE.a must be a square in Fp for complete addition formulas");
  if (FpLegendre(Fp, CURVE.d) !== -1)
    throw new Error("edwards: CURVE.d must be a non-square in Fp for complete addition formulas");
  validateObject(opts, {}, { uvRatio: "function", randomBytes: "function" });
  const randomBytes = opts.randomBytes === undefined ? randomBytes2 : opts.randomBytes;
  const MASK = _2n3 << BigInt(Fp.BYTES * 8) - _1n5;
  function isOdd(n) {
    if (!Fp.isOdd)
      throw new Error("Field does not have .isOdd()");
    return Fp.isOdd(n);
  }
  const uvRatio = opts.uvRatio === undefined ? (u, v) => {
    try {
      return { isValid: true, value: Fp.sqrt(Fp.div(u, v)) };
    } catch (e) {
      return { isValid: false, value: _0n5 };
    }
  } : opts.uvRatio;
  if (!isEdValidXY(Fp, CURVE, CURVE.Gx, CURVE.Gy))
    throw new Error("bad curve params: generator point");
  const mulA = Fp.eql(CURVE.a, Fp.neg(Fp.ONE)) ? (x) => Fp.neg(x) : Fp.eql(CURVE.a, Fp.ONE) ? (x) => x : (x) => Fp.mul(CURVE.a, x);
  function acoord(title, n, banZero = false) {
    const min = banZero ? _1n5 : _0n5;
    aInRange("coordinate " + title, n, min, MASK);
    return n;
  }
  function aedpoint(other) {
    if (!(other instanceof Point))
      throw new Error("EdwardsPoint expected");
  }

  class Point {
    static BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE, Fp.mul(CURVE.Gx, CURVE.Gy));
    static ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ONE, Fp.ZERO);
    static Fp = Fp;
    static Fn = Fn;
    X;
    Y;
    Z;
    T;
    constructor(X, Y, Z, T) {
      this.X = acoord("x", X);
      this.Y = acoord("y", Y);
      this.Z = acoord("z", Z, true);
      this.T = acoord("t", T);
      Object.freeze(this);
    }
    static CURVE() {
      return CURVE;
    }
    static fromAffine(p) {
      if (p instanceof Point)
        throw new Error("extended point not allowed");
      const { x, y } = p || {};
      acoord("x", x);
      acoord("y", y);
      return new Point(x, y, Fp.ONE, Fp.mul(x, y));
    }
    static fromBytes(bytes, zip215 = false) {
      const len = Fp.BYTES;
      const { a, d } = CURVE;
      bytes = copyBytes2(abytes2(bytes, len, "point"));
      abool2(zip215, "zip215");
      const normed = copyBytes2(bytes);
      const lastByte = bytes[len - 1];
      normed[len - 1] = lastByte & ~128;
      const y = bytesToNumberLE(normed);
      const max = zip215 ? MASK : Fp.ORDER;
      aInRange("point.y", y, _0n5, max);
      const y2 = Fp.sqr(y);
      const u = Fp.sub(y2, Fp.ONE);
      const v = Fp.sub(Fp.mulN(d, y2), a);
      let { isValid, value: x } = uvRatio(u, v);
      if (!isValid)
        throw new Error("bad point: invalid y coordinate");
      const isXOdd = isOdd(x);
      const isLastByteOdd = (lastByte & 128) !== 0;
      if (!zip215 && Fp.is0(x) && isLastByteOdd)
        throw new Error("bad point: x=0 and x_0=1");
      if (isLastByteOdd !== isXOdd)
        x = Fp.neg(x);
      return Point.fromAffine({ x, y });
    }
    static fromHex(hex, zip215 = false) {
      return Point.fromBytes(hexToBytes2(hex), zip215);
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    precompute(windowSize = 6, isLazy = true) {
      wnaf.setWindowSize(this, windowSize);
      if (!isLazy)
        this.multiply(_2n3);
      return this;
    }
    assertValidity() {
      const p = this;
      const { a, d } = CURVE;
      if (p.is0())
        throw new Error("bad point: ZERO");
      const { X, Y, Z, T } = p;
      const X2 = Fp.sqr(X);
      const Y2 = Fp.sqr(Y);
      const Z2 = Fp.sqr(Z);
      const Z4 = Fp.sqr(Z2);
      const aX2 = Fp.mul(X2, a);
      const left = Fp.mul(Fp.add(aX2, Y2), Z2);
      const right = Fp.add(Z4, Fp.mul(d, Fp.mul(X2, Y2)));
      if (!Fp.eql(left, right))
        throw new Error("bad point: equation left != right (1)");
      const XY = Fp.mul(X, Y);
      const ZT = Fp.mul(Z, T);
      if (!Fp.eql(XY, ZT))
        throw new Error("bad point: equation left != right (2)");
    }
    equals(other) {
      aedpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      const X1Z2 = Fp.mul(X1, Z2);
      const X2Z1 = Fp.mul(X2, Z1);
      const Y1Z2 = Fp.mul(Y1, Z2);
      const Y2Z1 = Fp.mul(Y2, Z1);
      return Fp.eql(X1Z2, X2Z1) && Fp.eql(Y1Z2, Y2Z1);
    }
    is0() {
      return this.equals(Point.ZERO);
    }
    negate() {
      return new Point(Fp.neg(this.X), this.Y, this.Z, Fp.neg(this.T));
    }
    double() {
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const A = Fp.sqr(X1);
      const B = Fp.sqr(Y1);
      const C = Fp.mul(Fp.sqr(Z1), _2n3);
      const D = mulA(A);
      const x1y1 = Fp.addN(X1, Y1);
      const E = Fp.sub(Fp.subN(Fp.sqr(x1y1), A), B);
      const G = Fp.addN(D, B);
      const F = Fp.subN(G, C);
      const H = Fp.subN(D, B);
      const X3 = Fp.mul(E, F);
      const Y3 = Fp.mul(G, H);
      const T3 = Fp.mul(E, H);
      const Z3 = Fp.mul(F, G);
      return new Point(X3, Y3, Z3, T3);
    }
    add(other) {
      aedpoint(other);
      const { d } = CURVE;
      const { X: X1, Y: Y1, Z: Z1, T: T1 } = this;
      const { X: X2, Y: Y2, Z: Z2, T: T2 } = other;
      const A = Fp.mul(X1, X2);
      const B = Fp.mul(Y1, Y2);
      const C = Fp.mul(Fp.mulN(T1, d), T2);
      const D = Fp.mul(Z1, Z2);
      const E = Fp.sub(Fp.subN(Fp.mulN(Fp.addN(X1, Y1), Fp.addN(X2, Y2)), A), B);
      const F = Fp.subN(D, C);
      const G = Fp.addN(D, C);
      const H = Fp.sub(B, mulA(A));
      const X3 = Fp.mul(E, F);
      const Y3 = Fp.mul(G, H);
      const T3 = Fp.mul(E, H);
      const Z3 = Fp.mul(F, G);
      return new Point(X3, Y3, Z3, T3);
    }
    subtract(other) {
      aedpoint(other);
      return this.add(other.negate());
    }
    multiply(scalar) {
      if (!Fn.isValidNot0(scalar))
        throw new RangeError("invalid scalar: expected 1 <= sc < curve.n");
      const { p, f } = wnaf.mulSecret(this, scalar, cofactor, normalize);
      return normalize([p, f])[0];
    }
    multiplyUnsafe(scalar) {
      if (!Fn.isValid(scalar))
        throw new RangeError("invalid scalar: expected 0 <= sc < curve.n");
      if (scalar === _0n5)
        return Point.ZERO;
      if (this.is0() || scalar === _1n5)
        return this;
      return wnaf.mulUnsafe(this, scalar, normalize);
    }
    isSmallOrder() {
      return this.clearCofactor().is0();
    }
    isTorsionFree() {
      return wnaf.mulUnsafe(this, CURVE.n).is0();
    }
    toAffine(invertedZ) {
      const p = this;
      let iz = invertedZ;
      if (iz != null && typeof iz !== "bigint")
        throw new TypeError('"invertedZ" expected bigint, got type=' + typeof iz);
      const { X, Y, Z } = p;
      const is0 = p.is0();
      if (iz == null)
        iz = is0 ? Fp.create(_8n2) : Fp.inv(Z);
      const x = Fp.mul(X, iz);
      const y = Fp.mul(Y, iz);
      const zz = Fp.mul(Z, iz);
      if (is0)
        return { x: Fp.ZERO, y: Fp.ONE };
      if (!Fp.eql(zz, Fp.ONE))
        throw new Error("invZ was invalid");
      return { x, y };
    }
    clearCofactor() {
      if (cofactor === _1n5)
        return this;
      if (cofactor === _2n3)
        return this.double();
      if (cofactor === _4n3)
        return this.double().double();
      if (cofactor === _8n2)
        return this.double().double().double();
      return this.multiplyUnsafe(cofactor);
    }
    toBytes() {
      const { x, y } = this.toAffine();
      const bytes = Fp.toBytes(y);
      bytes[bytes.length - 1] |= isOdd(x) ? 128 : 0;
      return bytes;
    }
    toHex() {
      return bytesToHex2(this.toBytes());
    }
    toString() {
      return `<Point ${this.is0() ? "ZERO" : this.toHex()}>`;
    }
  }
  const normalize = (points) => normalizeZ(Point, points);
  const wnaf = new ScalarMultiplier(Point, randomBytes);
  if (wnaf.bits >= 6)
    Point.BASE.precompute(6);
  Object.freeze(Point.prototype);
  Object.freeze(Point);
  return Point;
}
function eddsa(Point, cHash, eddsaOpts = {}) {
  validatePointCons(Point);
  if (typeof cHash !== "function")
    throw new Error('"hash" function param is required');
  const hash = cHash;
  const opts = eddsaOpts;
  validateObject(opts, {}, {
    adjustScalarBytes: "function",
    randomBytes: "function",
    domain: "function",
    prehash: "function",
    zip215: "boolean",
    mapToCurve: "function",
    toMontgomery: "function",
    toMontgomerySecret: "function"
  });
  const { prehash } = opts;
  const { BASE, Fp, Fn } = Point;
  const outputLen = hash.outputLen;
  const expectedLen = 2 * Fp.BYTES;
  if (outputLen !== undefined) {
    asafenumber(outputLen, "hash.outputLen");
    if (outputLen !== expectedLen)
      throw new Error(`hash.outputLen must be ${expectedLen}, got ${outputLen}`);
  }
  const randomBytes = opts.randomBytes === undefined ? randomBytes2 : opts.randomBytes;
  const toMontgomery = opts.toMontgomery;
  const toMontgomerySecret = opts.toMontgomerySecret;
  const adjustScalarBytes = opts.adjustScalarBytes === undefined ? (bytes) => bytes : opts.adjustScalarBytes;
  const domain = opts.domain === undefined ? (data, ctx, phflag) => {
    abool2(phflag, "phflag");
    if (ctx.length || phflag)
      throw new Error("Contexts/pre-hash are not supported");
    return data;
  } : opts.domain;
  function modN_LE(hash) {
    return Fn.create(bytesToNumberLE(hash));
  }
  function getPrivateScalar(key) {
    const len = lengths.secretKey;
    abytes2(key, lengths.secretKey, "secretKey");
    const hashed = abytes2(hash(key), 2 * len, "hashedSecretKey");
    const head = adjustScalarBytes(hashed.slice(0, len));
    const prefix = hashed.slice(len, 2 * len);
    const scalar = modN_LE(head);
    return { head, prefix, scalar };
  }
  function getExtendedPublicKey(secretKey) {
    const { head, prefix, scalar } = getPrivateScalar(secretKey);
    const point = BASE.multiply(scalar);
    const pointBytes = point.toBytes();
    return { head, prefix, scalar, point, pointBytes };
  }
  function getPublicKey(secretKey) {
    return getExtendedPublicKey(secretKey).pointBytes;
  }
  function hashDomainToScalar(context = Uint8Array.of(), ...msgs) {
    const msg = concatBytes2(...msgs);
    return modN_LE(hash(domain(msg, abytes2(context, undefined, "context"), !!prehash)));
  }
  function sign(msg, secretKey, options = {}) {
    validateObject(options, {}, {}, "options");
    msg = copyBytes2(abytes2(msg, undefined, "message"));
    if (prehash)
      msg = prehash(msg);
    const { prefix, scalar, pointBytes } = getExtendedPublicKey(secretKey);
    const r = hashDomainToScalar(options.context, prefix, msg);
    const R = BASE.multiply(r).toBytes();
    const k = hashDomainToScalar(options.context, R, pointBytes, msg);
    const s = Fn.create(r + k * scalar);
    if (!Fn.isValid(s))
      throw new Error("sign failed: invalid s");
    const rs = concatBytes2(R, Fn.toBytes(s));
    return abytes2(rs, lengths.signature, "result");
  }
  const verifyOpts = {
    zip215: opts.zip215
  };
  function verify(sig, msg, publicKey, options = verifyOpts) {
    validateObject(options);
    const { context } = options;
    const zip215 = options.zip215 === undefined ? !!verifyOpts.zip215 : options.zip215;
    const len = lengths.signature;
    sig = abytes2(sig, len, "signature");
    msg = abytes2(msg, undefined, "message");
    publicKey = abytes2(publicKey, lengths.publicKey, "publicKey");
    if (zip215 !== undefined)
      abool2(zip215, "zip215");
    if (prehash)
      msg = prehash(msg);
    const mid = len / 2;
    const r = sig.subarray(0, mid);
    const s = bytesToNumberLE(sig.subarray(mid, len));
    let A, R, SB;
    try {
      A = Point.fromBytes(publicKey, zip215);
      R = Point.fromBytes(r, zip215);
      SB = BASE.multiplyUnsafe(s);
    } catch (error) {
      return false;
    }
    if (!zip215 && A.isSmallOrder())
      return false;
    const k = hashDomainToScalar(context, r, publicKey, msg);
    const RkA = R.add(A.multiplyUnsafe(k));
    return RkA.subtract(SB).clearCofactor().is0();
  }
  const _size = Fp.BYTES;
  const lengths = {
    secretKey: _size,
    publicKey: _size,
    signature: 2 * _size,
    seed: _size
  };
  function randomSecretKey(seed) {
    seed = seed === undefined ? randomBytes(lengths.seed) : seed;
    return abytes2(seed, lengths.seed, "seed");
  }
  function isValidSecretKey(key) {
    return isBytes2(key) && key.length === lengths.secretKey;
  }
  function isValidPublicKey(key, zip215) {
    try {
      return !!Point.fromBytes(key, zip215 === undefined ? verifyOpts.zip215 : zip215);
    } catch (error) {
      return false;
    }
  }
  const utils = {
    getExtendedPublicKey,
    randomSecretKey,
    isValidSecretKey,
    isValidPublicKey,
    toMontgomery(publicKey) {
      if (toMontgomery === undefined)
        throw new Error("Montgomery conversion is not supported for this curve");
      return toMontgomery(Point.fromBytes(publicKey));
    },
    toMontgomerySecret(secretKey) {
      if (toMontgomerySecret === undefined)
        throw new Error("Montgomery conversion is not supported for this curve");
      return toMontgomerySecret(secretKey);
    }
  };
  Object.freeze(lengths);
  Object.freeze(utils);
  return Object.freeze({
    keygen: createKeygen(randomSecretKey, getPublicKey),
    getPublicKey,
    sign,
    verify,
    utils,
    Point,
    lengths
  });
}

// node_modules/@noble/curves/abstract/montgomery.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n6 = /* @__PURE__ */ BigInt(0);
var _1n6 = /* @__PURE__ */ BigInt(1);
var _2n4 = /* @__PURE__ */ BigInt(2);
function cmask(P, swap) {
  return P + swap - (swap >> _1n6 << _1n6);
}
function cswap(P) {
  const offset = BigInt(6) * P;
  return (mask, x_2, x_3) => {
    const sum = x_2 + x_3;
    const d = offset + x_3 - x_2;
    const a = (d * mask + x_2) % P;
    return { x_2: a, x_3: sum - a };
  };
}
function validateOpts(curve) {
  validateObject(curve, {
    P: "bigint",
    type: "string",
    adjustScalarBytes: "function",
    powPminus2: "function"
  }, {
    randomBytes: "function",
    scalarMultBase: "function"
  });
  return Object.freeze({ ...curve });
}
function montgomery(curveDef) {
  const CURVE = validateOpts(curveDef);
  const { P, type, adjustScalarBytes, powPminus2, randomBytes: rand } = CURVE;
  const mulBaseHook = CURVE.scalarMultBase;
  const is25519 = type === "x25519";
  if (!is25519 && type !== "x448")
    throw new Error("invalid type");
  const randomBytes_ = rand === undefined ? randomBytes2 : rand;
  const montgomeryBits = is25519 ? 255 : 448;
  const swap = cswap(P);
  const fieldLen = is25519 ? 32 : 56;
  const Gu = is25519 ? BigInt(9) : BigInt(5);
  const a24 = is25519 ? BigInt(121665) : BigInt(39081);
  const minScalar = is25519 ? _2n4 ** BigInt(254) : _2n4 ** BigInt(447);
  const maxAdded = is25519 ? BigInt(8) * (_2n4 ** BigInt(251) - _1n6) : BigInt(4) * (_2n4 ** BigInt(445) - _1n6);
  const maxScalar = minScalar + maxAdded + _1n6;
  const modP = (n) => mod(n, P);
  const GuBytes = encodeU(Gu);
  function encodeU(u) {
    return numberToBytesLE(modP(u), fieldLen);
  }
  function decodeU(u) {
    const _u = copyBytes2(abytes2(u, fieldLen, "uCoordinate"));
    if (is25519)
      _u[31] &= 127;
    return modP(bytesToNumberLE(_u));
  }
  function decodeScalar(scalar) {
    return bytesToNumberLE(adjustScalarBytes(copyBytes2(abytes2(scalar, fieldLen, "scalar"))));
  }
  const lowOrderU = new Set(is25519 ? [
    _0n6,
    _1n6,
    P - _1n6,
    BigInt("325606250916557431795983626356110631294008115727848805560023387167927233504"),
    BigInt("39382357235489614581723060781553021112529911719440698176882885853963445705823")
  ] : [_0n6, _1n6, P - _1n6]);
  function scalarMult(scalar, u) {
    const pointU = decodeU(u);
    if (lowOrderU.has(pointU))
      throw new Error("invalid private or public key received");
    const pu = montgomeryLadder(pointU, decodeScalar(scalar));
    if (pu === _0n6)
      throw new Error("invalid private or public key received");
    return encodeU(pu);
  }
  function scalarMultBase(scalar) {
    if (mulBaseHook === undefined)
      return scalarMult(scalar, GuBytes);
    const k = decodeScalar(scalar);
    aInRange("scalar", k, minScalar, maxScalar);
    const pu = modP(mulBaseHook(k));
    if (pu === _0n6)
      throw new Error("invalid private or public key received");
    return encodeU(pu);
  }
  const getPublicKey = scalarMultBase;
  const getSharedSecret = scalarMult;
  function montgomeryLadder(u, scalar) {
    aInRange("u", u, _0n6, P);
    aInRange("scalar", scalar, minScalar, maxScalar);
    const k = scalar;
    const x_1 = u;
    let x_2 = _1n6;
    let z_2 = _0n6;
    let x_3 = u;
    let z_3 = _1n6;
    const kx = k ^ k >> _1n6;
    for (let t = BigInt(montgomeryBits - 1);t >= _0n6; t--) {
      const mask = cmask(P, kx >> t);
      ({ x_2, x_3 } = swap(mask, x_2, x_3));
      ({ x_2: z_2, x_3: z_3 } = swap(mask, z_2, z_3));
      const A = x_2 + z_2;
      const AA = modP(A * A);
      const B = x_2 - z_2;
      const BB = modP(B * B);
      const E = AA - BB;
      const C = x_3 + z_3;
      const D = x_3 - z_3;
      const DA = modP(D * A);
      const CB = modP(C * B);
      const dacb = DA + CB;
      const da_cb = DA - CB;
      x_3 = modP(dacb * dacb);
      z_3 = modP(x_1 * modP(da_cb * da_cb));
      x_2 = modP(AA * BB);
      z_2 = modP(E * (AA + modP(a24 * E)));
    }
    const mask = cmask(P, k);
    ({ x_2, x_3 } = swap(mask, x_2, x_3));
    ({ x_2: z_2, x_3: z_3 } = swap(mask, z_2, z_3));
    const z2 = powPminus2(z_2);
    return modP(x_2 * z2);
  }
  const lengths = {
    secretKey: fieldLen,
    publicKey: fieldLen,
    seed: fieldLen
  };
  const randomSecretKey = (seed) => {
    seed = seed === undefined ? randomBytes_(fieldLen) : seed;
    abytes2(seed, lengths.seed, "seed");
    return seed;
  };
  const utils = { randomSecretKey };
  Object.freeze(lengths);
  Object.freeze(utils);
  return Object.freeze({
    keygen: createKeygen(randomSecretKey, getPublicKey),
    getSharedSecret,
    getPublicKey,
    scalarMult,
    scalarMultBase,
    utils,
    GuBytes: GuBytes.slice(),
    lengths
  });
}

// node_modules/@noble/curves/ed25519.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n7 = /* @__PURE__ */ BigInt(0);
var _1n7 = /* @__PURE__ */ BigInt(1);
var _2n5 = /* @__PURE__ */ BigInt(2);
var _3n2 = /* @__PURE__ */ BigInt(3);
var _5n2 = /* @__PURE__ */ BigInt(5);
var _8n3 = /* @__PURE__ */ BigInt(8);
var ed25519_CURVE_p = /* @__PURE__ */ BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffed");
var ed25519_CURVE = /* @__PURE__ */ (() => ({
  p: ed25519_CURVE_p,
  n: BigInt("0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed"),
  h: _8n3,
  a: BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffec"),
  d: BigInt("0x52036cee2b6ffe738cc740797779e89800700a4d4141d8ab75eb4dca135978a3"),
  Gx: BigInt("0x216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a"),
  Gy: BigInt("0x6666666666666666666666666666666666666666666666666666666666666658")
}))();
function ed25519_pow_2_252_3(x) {
  const _10n = BigInt(10), _20n = BigInt(20), _40n = BigInt(40), _80n = BigInt(80);
  const P = ed25519_CURVE_p;
  const x2 = x * x % P;
  const b2 = x2 * x % P;
  const b4 = pow2(b2, _2n5, P) * b2 % P;
  const b5 = pow2(b4, _1n7, P) * x % P;
  const b10 = pow2(b5, _5n2, P) * b5 % P;
  const b20 = pow2(b10, _10n, P) * b10 % P;
  const b40 = pow2(b20, _20n, P) * b20 % P;
  const b80 = pow2(b40, _40n, P) * b40 % P;
  const b160 = pow2(b80, _80n, P) * b80 % P;
  const b240 = pow2(b160, _80n, P) * b80 % P;
  const b250 = pow2(b240, _10n, P) * b10 % P;
  const pow_p_5_8 = pow2(b250, _2n5, P) * x % P;
  return { pow_p_5_8, b2 };
}
function adjustScalarBytes(bytes) {
  bytes[0] &= 248;
  bytes[31] &= 127;
  bytes[31] |= 64;
  return bytes;
}
var ED25519_SQRT_M1 = /* @__PURE__ */ BigInt("19681161376707505956807079304988542015446066515923890162744021073123829784752");
function uvRatio(u, v) {
  const P = ed25519_CURVE_p;
  const v3 = mod(v * v * v, P);
  const v7 = mod(v3 * v3 * v, P);
  const pow = ed25519_pow_2_252_3(u * v7).pow_p_5_8;
  let x = mod(u * v3 * pow, P);
  const vx2 = mod(v * x * x, P);
  const root1 = x;
  const root2 = mod(x * ED25519_SQRT_M1, P);
  const useRoot1 = vx2 === u;
  const useRoot2 = vx2 === mod(-u, P);
  const noRoot = vx2 === mod(-u * ED25519_SQRT_M1, P);
  if (useRoot1)
    x = root1;
  if (useRoot2 || noRoot)
    x = root2;
  if (isNegativeLE(x, P))
    x = mod(-x, P);
  return { isValid: useRoot1 || useRoot2, value: x };
}
var ed25519_Point = /* @__PURE__ */ edwards(ed25519_CURVE, { uvRatio });
var Fp = /* @__PURE__ */ (() => ed25519_Point.Fp)();
function toMontgomery(point) {
  const { y } = point;
  return Fp.toBytes(Fp.div(_1n7 + y, _1n7 - y));
}
function toMontgomerySecret(secretKey) {
  const size = ed25519_Point.Fp.BYTES;
  abytes(secretKey, size);
  return adjustScalarBytes(sha512(secretKey.subarray(0, size))).subarray(0, size);
}
function ed(opts) {
  return eddsa(ed25519_Point, sha512, Object.assign({ adjustScalarBytes, toMontgomery, toMontgomerySecret, zip215: true }, opts));
}
var ed25519 = /* @__PURE__ */ ed({});
var x25519 = /* @__PURE__ */ (() => {
  const P = ed25519_CURVE_p;
  const powPminus2 = (x) => {
    const { pow_p_5_8, b2 } = ed25519_pow_2_252_3(x);
    return mod(pow2(pow_p_5_8, _3n2, P) * b2, P);
  };
  return montgomery({
    P,
    type: "x25519",
    powPminus2,
    adjustScalarBytes,
    scalarMultBase: (k) => {
      const kn = mod(k, ed25519_Point.Fn.ORDER);
      if (kn === _0n7)
        return _0n7;
      const p = ed25519_Point.BASE.multiply(kn);
      return mod((p.Z + p.Y) * powPminus2(mod(p.Z - p.Y, P)), P);
    }
  });
})();

// node_modules/@noble/hashes/hmac.js
class _HMAC {
  oHash;
  iHash;
  blockLen;
  outputLen;
  canXOF = false;
  finished = false;
  destroyed = false;
  constructor(hash, key) {
    ahash(hash);
    abytes(key, undefined, "key");
    this.iHash = hash.create();
    if (typeof this.iHash.update !== "function")
      throw new Error("expected Hash instance");
    this.blockLen = this.iHash.blockLen;
    this.outputLen = this.iHash.outputLen;
    const blockLen = this.blockLen;
    const pad = new Uint8Array(blockLen);
    pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
    for (let i = 0;i < pad.length; i++)
      pad[i] ^= 54;
    this.iHash.update(pad);
    this.oHash = hash.create();
    for (let i = 0;i < pad.length; i++)
      pad[i] ^= 54 ^ 92;
    this.oHash.update(pad);
    clean(pad);
  }
  update(buf) {
    aexists(this);
    this.iHash.update(buf);
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    this.finished = true;
    const buf = out.subarray(0, this.outputLen);
    this.iHash.digestInto(buf);
    this.oHash.update(buf);
    this.oHash.digestInto(buf);
    this.destroy();
  }
  digest() {
    const out = new Uint8Array(this.oHash.outputLen);
    this.digestInto(out);
    return out;
  }
  _cloneInto(to) {
    to ||= Object.create(Object.getPrototypeOf(this), {});
    const { oHash, iHash, finished, destroyed, blockLen, outputLen, canXOF } = this;
    to = to;
    to.finished = finished;
    to.destroyed = destroyed;
    to.blockLen = blockLen;
    to.outputLen = outputLen;
    to.canXOF = canXOF;
    to.oHash = oHash._cloneInto(to.oHash);
    to.iHash = iHash._cloneInto(to.iHash);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
  destroy() {
    this.destroyed = true;
    this.oHash.destroy();
    this.iHash.destroy();
  }
}
var hmac = /* @__PURE__ */ (() => {
  const hmac_ = (hash, key, message) => new _HMAC(hash, key).update(message).digest();
  hmac_.create = (hash, key) => new _HMAC(hash, key);
  return hmac_;
})();

// node_modules/@noble/curves/abstract/der.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n8 = /* @__PURE__ */ BigInt(0);

class DERErr extends Error {
  constructor(m = "") {
    super(m);
  }
}
var _DER = {
  Err: DERErr,
  _tlv: {
    encode: (tag, data) => {
      const { Err: E } = _DER;
      asafenumber(tag, "tag");
      if (tag < 0 || tag > 255)
        throw new E("tlv.encode: wrong tag");
      astring(data, "data");
      if (data.length & 1)
        throw new E("tlv.encode: unpadded data");
      const dataLen = data.length / 2;
      const len = numberToHexUnpadded(dataLen);
      if (len.length / 2 & 128)
        throw new E("tlv.encode: long form length too big");
      const lenLen = dataLen > 127 ? numberToHexUnpadded(len.length / 2 | 128) : "";
      const t = numberToHexUnpadded(tag);
      return t + lenLen + len + data;
    },
    decode(tag, data) {
      const { Err: E } = _DER;
      data = abytes2(data, undefined, "DER data");
      let pos = 0;
      if (tag < 0 || tag > 255)
        throw new E("tlv.decode: wrong tag");
      if (data.length < 2 || data[pos++] !== tag)
        throw new E("tlv.decode: wrong tlv");
      const first = data[pos++];
      const isLong = !!(first & 128);
      let length = 0;
      if (!isLong)
        length = first;
      else {
        const lenLen = first & 127;
        if (!lenLen)
          throw new E("tlv.decode(long): indefinite length not supported");
        if (lenLen > 4)
          throw new E("tlv.decode(long): byte length is too big");
        const lengthBytes = data.subarray(pos, pos + lenLen);
        if (lengthBytes.length !== lenLen)
          throw new E("tlv.decode: length bytes not complete");
        if (lengthBytes[0] === 0)
          throw new E("tlv.decode(long): zero leftmost byte");
        for (const b of lengthBytes)
          length = length << 8 | b;
        pos += lenLen;
        if (length < 128)
          throw new E("tlv.decode(long): not minimal encoding");
      }
      const v = data.subarray(pos, pos + length);
      if (v.length !== length)
        throw new E("tlv.decode: wrong value length");
      return { v, l: data.subarray(pos + length) };
    }
  },
  _int: {
    encode(num) {
      const { Err: E } = _DER;
      abignumber(num);
      if (num < _0n8)
        throw new E("integer: negative integers are not allowed");
      let hex = numberToHexUnpadded(num);
      if (Number.parseInt(hex[0], 16) & 8)
        hex = "00" + hex;
      if (hex.length & 1)
        throw new E("unexpected DER parsing assertion: unpadded hex");
      return hex;
    },
    decode(data) {
      const { Err: E } = _DER;
      if (data.length < 1)
        throw new E("invalid signature integer: empty");
      if (data[0] & 128)
        throw new E("invalid signature integer: negative");
      if (data.length > 1 && data[0] === 0 && !(data[1] & 128))
        throw new E("invalid signature integer: unnecessary leading zero");
      return bytesToNumberBE(data);
    }
  },
  toSig(bytes, maxScalarBytes) {
    const { Err: E, _int: int, _tlv: tlv } = _DER;
    if (maxScalarBytes !== undefined) {
      asafenumber(maxScalarBytes, "maxScalarBytes");
      if (maxScalarBytes < 1)
        throw new E("invalid signature: maxScalarBytes must be positive");
    }
    const data = abytes2(bytes, undefined, "signature");
    const { v: seqBytes, l: seqLeftBytes } = tlv.decode(48, data);
    if (seqLeftBytes.length)
      throw new E("invalid signature: left bytes after parsing");
    const { v: rBytes, l: rLeftBytes } = tlv.decode(2, seqBytes);
    const { v: sBytes, l: sLeftBytes } = tlv.decode(2, rLeftBytes);
    if (sLeftBytes.length)
      throw new E("invalid signature: left bytes after parsing");
    if (maxScalarBytes !== undefined && (rBytes.length > maxScalarBytes || sBytes.length > maxScalarBytes))
      throw new E("invalid signature: integer too large");
    return { r: int.decode(rBytes), s: int.decode(sBytes) };
  },
  hexFromSig(sig) {
    const { _tlv: tlv, _int: int } = _DER;
    validateObject(sig, { r: "bigint", s: "bigint" }, {}, "sig");
    const rs = tlv.encode(2, int.encode(sig.r));
    const ss = tlv.encode(2, int.encode(sig.s));
    const seq = rs + ss;
    return tlv.encode(48, seq);
  }
};
var DER = /* @__PURE__ */ (() => {
  Object.freeze(_DER._tlv);
  Object.freeze(_DER._int);
  return Object.freeze(_DER);
})();

// node_modules/@noble/curves/abstract/weierstrass.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var divNearest = (num, den) => (num + (num >= 0 ? den : -den) / _2n6) / den;
function _splitEndoScalar(k, basis, n) {
  aInRange("scalar", k, _0n9, n);
  const [[a1, b1], [a2, b2]] = basis;
  const c1 = divNearest(b2 * k, n);
  const c2 = divNearest(-b1 * k, n);
  let k1 = k - c1 * a1 - c2 * a2;
  let k2 = -c1 * b1 - c2 * b2;
  const k1neg = k1 < _0n9;
  const k2neg = k2 < _0n9;
  if (k1neg)
    k1 = -k1;
  if (k2neg)
    k2 = -k2;
  const MAX_NUM = bitMask(Math.ceil(bitLen(n) / 2)) + _1n8;
  if (k1 < _0n9 || k1 >= MAX_NUM || k2 < _0n9 || k2 >= MAX_NUM) {
    throw new Error("splitScalar (endomorphism): failed for k");
  }
  return { k1neg, k1, k2neg, k2 };
}
function validateSigFormat(format) {
  if (!["compact", "recovered", "der"].includes(format))
    throw new Error('Signature format must be "compact", "recovered", or "der"');
  return format;
}
function validateSigOpts(opts, def) {
  validateObject(opts);
  const optsn = {};
  for (let optName of Object.keys(def)) {
    optsn[optName] = opts[optName] === undefined ? def[optName] : opts[optName];
  }
  abool2(optsn.lowS, "lowS");
  abool2(optsn.prehash, "prehash");
  if (optsn.format !== undefined)
    validateSigFormat(optsn.format);
  return optsn;
}
var _0n9 = /* @__PURE__ */ BigInt(0);
var _1n8 = /* @__PURE__ */ BigInt(1);
var _2n6 = /* @__PURE__ */ BigInt(2);
var _3n3 = /* @__PURE__ */ BigInt(3);
var _4n4 = /* @__PURE__ */ BigInt(4);
function weierstrass(params, extraOpts = {}) {
  const validated = createCurveFields("weierstrass", params, extraOpts);
  const Fp = validated.Fp;
  const Fn = validated.Fn;
  let CURVE = validated.CURVE;
  const { h: cofactor, n: CURVE_ORDER } = CURVE;
  validateObject(extraOpts, {}, {
    allowInfinityPoint: "boolean",
    clearCofactor: "function",
    isTorsionFree: "function",
    fromBytes: "function",
    toBytes: "function",
    endo: "object",
    randomBytes: "function"
  });
  const { endo: endoOpts, allowInfinityPoint, clearCofactor, isTorsionFree, fromBytes, toBytes } = extraOpts;
  const randomBytes = extraOpts.randomBytes === undefined ? randomBytes2 : extraOpts.randomBytes;
  if (endoOpts) {
    if (!Fp.is0(CURVE.a) || typeof endoOpts.beta !== "bigint" || !Array.isArray(endoOpts.basises)) {
      throw new Error('invalid endo: expected "beta": bigint and "basises": array');
    }
  }
  const endo = endoOpts ? {
    beta: endoOpts.beta,
    basises: endoOpts.basises.map((basis) => [...basis])
  } : undefined;
  const lengths = getWLengths(Fp, Fn);
  function assertCompressionIsSupported() {
    if (!Fp.isOdd)
      throw new Error("compression is not supported: Field does not have .isOdd()");
  }
  function pointToBytes(_c, point, isCompressed) {
    if (point.is0()) {
      if (!allowInfinityPoint)
        throw new Error("bad point: ZERO");
      return Uint8Array.of(0);
    }
    const { x, y } = point.toAffine();
    const bx = Fp.toBytes(x);
    abool2(isCompressed, "isCompressed");
    if (isCompressed) {
      assertCompressionIsSupported();
      const hasEvenY = !Fp.isOdd(y);
      return concatBytes2(pprefix(hasEvenY), bx);
    } else {
      return concatBytes2(Uint8Array.of(4), bx, Fp.toBytes(y));
    }
  }
  function pointFromBytes(bytes) {
    abytes2(bytes, undefined, "Point");
    const { publicKey: comp, publicKeyUncompressed: uncomp } = lengths;
    const length = bytes.length;
    const head = bytes[0];
    const tail = bytes.subarray(1);
    if (allowInfinityPoint && length === 1 && head === 0)
      return { x: Fp.ZERO, y: Fp.ZERO };
    if (length === comp && (head === 2 || head === 3)) {
      const x = Fp.fromBytes(tail);
      if (!Fp.isValid(x))
        throw new Error("bad point: is not on curve, wrong x");
      const y2 = weierstrassEquation(x);
      let y;
      try {
        y = Fp.sqrt(y2);
      } catch (sqrtError) {
        const err = sqrtError instanceof Error ? ": " + sqrtError.message : "";
        throw new Error("bad point: is not on curve, sqrt error" + err);
      }
      assertCompressionIsSupported();
      const evenY = Fp.isOdd(y);
      const evenH = (head & 1) === 1;
      if (evenH !== evenY)
        y = Fp.neg(y);
      return { x, y };
    } else if (length === uncomp && head === 4) {
      const L = Fp.BYTES;
      const x = Fp.fromBytes(tail.subarray(0, L));
      const y = Fp.fromBytes(tail.subarray(L, L * 2));
      if (!isValidXY(x, y))
        throw new Error("bad point: is not on curve");
      return { x, y };
    } else {
      throw new Error(`bad point: got length ${length}, expected compressed=${comp} or uncompressed=${uncomp}`);
    }
  }
  const encodePoint = toBytes === undefined ? pointToBytes : toBytes;
  const decodePoint = fromBytes === undefined ? pointFromBytes : fromBytes;
  const b3 = Fp.mul(CURVE.b, _3n3);
  const mulA = Fp.is0(CURVE.a) ? (_) => Fp.ZERO : (x) => Fp.mul(CURVE.a, x);
  function weierstrassEquation(x) {
    const x2 = Fp.sqr(x);
    const x3 = Fp.mul(x2, x);
    return Fp.add(Fp.add(x3, Fp.mul(x, CURVE.a)), CURVE.b);
  }
  function isValidXY(x, y) {
    const left = Fp.sqr(y);
    const right = weierstrassEquation(x);
    return Fp.eql(left, right);
  }
  if (!isValidXY(CURVE.Gx, CURVE.Gy))
    throw new Error("bad curve params: generator point");
  const _4a3 = Fp.mul(Fp.pow(CURVE.a, _3n3), _4n4);
  const _27b2 = Fp.mul(Fp.sqr(CURVE.b), BigInt(27));
  if (Fp.is0(Fp.add(_4a3, _27b2)))
    throw new Error("bad curve params: a or b");
  function acoord(title, n, banZero = false) {
    if (!Fp.isValid(n) || banZero && Fp.is0(n))
      throw new Error(`bad point coordinate ${title}`);
    return typeof n === "object" && n !== null ? Fp.create(n) : n;
  }
  function aprjpoint(other) {
    if (!(other instanceof Point))
      throw new Error("Weierstrass Point expected");
  }
  function splitEndoScalarN(k) {
    if (!endo || !endo.basises)
      throw new Error("no endo");
    return _splitEndoScalar(k, endo.basises, Fn.ORDER);
  }
  function pushWnafPair(points, scalars, p, k) {
    if (!Fn.isValid(k))
      throw new RangeError("invalid scalar: out of range");
    if (endo) {
      const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(k);
      const psi = new Point(Fp.mul(p.X, endo.beta), p.Y, p.Z);
      points.push(k1neg ? p.negate() : p, k2neg ? psi.negate() : psi);
      scalars.push(k1, k2);
    } else {
      points.push(p);
      scalars.push(k);
    }
  }
  const validityCache = new WeakSet;

  class Point {
    static BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE);
    static ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ZERO);
    static Fp = Fp;
    static Fn = Fn;
    X;
    Y;
    Z;
    constructor(X, Y, Z) {
      this.X = acoord("x", X);
      this.Y = acoord("y", Y, true);
      this.Z = acoord("z", Z);
      Object.freeze(this);
    }
    static CURVE() {
      return CURVE;
    }
    static fromAffine(p) {
      const { x, y } = p || {};
      if (!p || !Fp.isValid(x) || !Fp.isValid(y))
        throw new Error("invalid affine point");
      if (p instanceof Point)
        throw new Error("projective point not allowed");
      if (Fp.is0(x) && Fp.is0(y))
        return Point.ZERO;
      return new Point(x, y, Fp.ONE);
    }
    static fromBytes(bytes) {
      const P = Point.fromAffine(decodePoint(abytes2(bytes, undefined, "point")));
      P.assertValidity();
      return P;
    }
    static fromHex(hex) {
      return Point.fromBytes(hexToBytes2(hex));
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    precompute(windowSize = 6, isLazy = true) {
      wnaf.setWindowSize(this, windowSize);
      if (!isLazy)
        this.multiply(_3n3);
      return this;
    }
    assertValidity() {
      const p = this;
      if (p.is0()) {
        if (allowInfinityPoint && Fp.is0(p.X) && Fp.eql(p.Y, Fp.ONE) && Fp.is0(p.Z))
          return;
        throw new Error("bad point: ZERO");
      }
      if (validityCache.has(p))
        return;
      const { x, y } = p.toAffine();
      if (!Fp.isValid(x) || !Fp.isValid(y))
        throw new Error("bad point: x or y not field elements");
      if (!isValidXY(x, y))
        throw new Error("bad point: equation left != right");
      if (!p.isTorsionFree())
        throw new Error("bad point: not in prime-order subgroup");
      validityCache.add(p);
    }
    hasEvenY() {
      const { y } = this.toAffine();
      if (!Fp.isOdd)
        throw new Error("Field doesn't support isOdd");
      return !Fp.isOdd(y);
    }
    equals(other) {
      aprjpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
      const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
      return U1 && U2;
    }
    negate() {
      return new Point(this.X, Fp.neg(this.Y), this.Z);
    }
    double() {
      const { X: X1, Y: Y1, Z: Z1 } = this;
      let { ZERO: X3, ZERO: Y3, ZERO: Z3 } = Fp;
      let t0 = Fp.mul(X1, X1);
      let t1 = Fp.mul(Y1, Y1);
      let t2 = Fp.mul(Z1, Z1);
      let t3 = Fp.mul(X1, Y1);
      t3 = Fp.add(t3, t3);
      Z3 = Fp.mul(X1, Z1);
      Z3 = Fp.add(Z3, Z3);
      X3 = mulA(Z3);
      Y3 = Fp.mul(b3, t2);
      Y3 = Fp.add(X3, Y3);
      X3 = Fp.sub(t1, Y3);
      Y3 = Fp.add(t1, Y3);
      Y3 = Fp.mul(X3, Y3);
      X3 = Fp.mul(t3, X3);
      Z3 = Fp.mul(b3, Z3);
      t2 = mulA(t2);
      t3 = Fp.sub(t0, t2);
      t3 = mulA(t3);
      t3 = Fp.add(t3, Z3);
      Z3 = Fp.add(t0, t0);
      t0 = Fp.add(Z3, t0);
      t0 = Fp.add(t0, t2);
      t0 = Fp.mul(t0, t3);
      Y3 = Fp.add(Y3, t0);
      t2 = Fp.mul(Y1, Z1);
      t2 = Fp.add(t2, t2);
      t0 = Fp.mul(t2, t3);
      X3 = Fp.sub(X3, t0);
      Z3 = Fp.mul(t2, t1);
      Z3 = Fp.add(Z3, Z3);
      Z3 = Fp.add(Z3, Z3);
      return new Point(X3, Y3, Z3);
    }
    add(other) {
      aprjpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      let { ZERO: X3, ZERO: Y3, ZERO: Z3 } = Fp;
      let t0 = Fp.mul(X1, X2);
      let t1 = Fp.mul(Y1, Y2);
      let t2 = Fp.mul(Z1, Z2);
      let t3 = Fp.add(X1, Y1);
      let t4 = Fp.add(X2, Y2);
      t3 = Fp.mul(t3, t4);
      t4 = Fp.add(t0, t1);
      t3 = Fp.sub(t3, t4);
      t4 = Fp.add(X1, Z1);
      let t5 = Fp.add(X2, Z2);
      t4 = Fp.mul(t4, t5);
      t5 = Fp.add(t0, t2);
      t4 = Fp.sub(t4, t5);
      t5 = Fp.add(Y1, Z1);
      X3 = Fp.add(Y2, Z2);
      t5 = Fp.mul(t5, X3);
      X3 = Fp.add(t1, t2);
      t5 = Fp.sub(t5, X3);
      Z3 = mulA(t4);
      X3 = Fp.mul(b3, t2);
      Z3 = Fp.add(X3, Z3);
      X3 = Fp.sub(t1, Z3);
      Z3 = Fp.add(t1, Z3);
      Y3 = Fp.mul(X3, Z3);
      t1 = Fp.add(t0, t0);
      t1 = Fp.add(t1, t0);
      t2 = mulA(t2);
      t4 = Fp.mul(b3, t4);
      t1 = Fp.add(t1, t2);
      t2 = Fp.sub(t0, t2);
      t2 = mulA(t2);
      t4 = Fp.add(t4, t2);
      t0 = Fp.mul(t1, t4);
      Y3 = Fp.add(Y3, t0);
      t0 = Fp.mul(t5, t4);
      X3 = Fp.mul(t3, X3);
      X3 = Fp.sub(X3, t0);
      t0 = Fp.mul(t3, t1);
      Z3 = Fp.mul(t5, Z3);
      Z3 = Fp.add(Z3, t0);
      return new Point(X3, Y3, Z3);
    }
    subtract(other) {
      aprjpoint(other);
      return this.add(other.negate());
    }
    is0() {
      return this.equals(Point.ZERO);
    }
    multiply(scalar) {
      if (!Fn.isValidNot0(scalar))
        throw new RangeError("invalid scalar: out of range");
      const { p, f } = wnaf.mulSecret(this, scalar, cofactor, normalize);
      return normalize([p, f])[0];
    }
    multiplyUnsafe(scalar) {
      const p = this;
      const sc = scalar;
      if (!Fn.isValid(sc))
        throw new RangeError("invalid scalar: out of range");
      if (sc === _0n9 || p.is0())
        return Point.ZERO;
      if (sc === _1n8)
        return p;
      if (wnaf.hasWindowSize(this))
        return wnaf.mulUnsafe(p, sc, normalize);
      const points = [];
      const scalars = [];
      pushWnafPair(points, scalars, p, sc);
      return mulAddUnsafe(Point, points, scalars);
    }
    mulAddUnsafe(a, other, b) {
      aprjpoint(other);
      const points = [];
      const scalars = [];
      pushWnafPair(points, scalars, this, a);
      pushWnafPair(points, scalars, other, b);
      return mulAddUnsafe(Point, points, scalars);
    }
    toAffine(invertedZ) {
      const p = this;
      let iz = invertedZ;
      if (iz != null && !Fp.isValid(iz))
        throw new RangeError('"invertedZ" expected valid field element');
      const { X, Y, Z } = p;
      if (Fp.eql(Z, Fp.ONE))
        return { x: X, y: Y };
      const is0 = p.is0();
      if (iz == null)
        iz = is0 ? Fp.ONE : Fp.inv(Z);
      const x = Fp.mul(X, iz);
      const y = Fp.mul(Y, iz);
      const zz = Fp.mul(Z, iz);
      if (is0)
        return { x: Fp.ZERO, y: Fp.ZERO };
      if (!Fp.eql(zz, Fp.ONE))
        throw new Error("invZ was invalid");
      return { x, y };
    }
    isTorsionFree() {
      if (cofactor === _1n8)
        return true;
      if (isTorsionFree)
        return isTorsionFree(Point, this);
      return wnaf.mulUnsafe(this, CURVE_ORDER).is0();
    }
    clearCofactor() {
      if (cofactor === _1n8)
        return this;
      if (clearCofactor)
        return clearCofactor(Point, this);
      return this.multiplyUnsafe(cofactor);
    }
    isSmallOrder() {
      if (cofactor === _1n8)
        return this.is0();
      return this.clearCofactor().is0();
    }
    toBytes(isCompressed = true) {
      abool2(isCompressed, "isCompressed");
      this.assertValidity();
      return encodePoint(Point, this, isCompressed);
    }
    toHex(isCompressed = true) {
      return bytesToHex2(this.toBytes(isCompressed));
    }
    toString() {
      return `<Point ${this.is0() ? "ZERO" : this.toHex()}>`;
    }
  }
  const normalize = (points) => normalizeZ(Point, points);
  const wnaf = new ScalarMultiplier(Point, randomBytes);
  if (wnaf.bits >= 6)
    Point.BASE.precompute(6);
  Object.freeze(Point.prototype);
  Object.freeze(Point);
  return Point;
}
function pprefix(hasEvenY) {
  return Uint8Array.of(hasEvenY ? 2 : 3);
}
function getWLengths(Fp, Fn) {
  return {
    secretKey: Fn.BYTES,
    publicKey: 1 + Fp.BYTES,
    publicKeyUncompressed: 1 + 2 * Fp.BYTES,
    publicKeyHasPrefix: true,
    signature: 2 * Fn.BYTES
  };
}
function ecdh(Point, ecdhOpts = {}) {
  validatePointCons(Point);
  const { Fn } = Point;
  const randomBytes_ = ecdhOpts.randomBytes === undefined ? randomBytes2 : ecdhOpts.randomBytes;
  const lengths = Object.assign(getWLengths(Point.Fp, Fn), {
    seed: Math.max(getMinHashLength(Fn.ORDER), 16)
  });
  function isValidSecretKey(secretKey) {
    try {
      const num = Fn.fromBytes(secretKey);
      return Fn.isValidNot0(num);
    } catch (error) {
      return false;
    }
  }
  function isValidPublicKey(publicKey, isCompressed) {
    const { publicKey: comp, publicKeyUncompressed } = lengths;
    try {
      const l = publicKey.length;
      if (isCompressed === true && l !== comp)
        return false;
      if (isCompressed === false && l !== publicKeyUncompressed)
        return false;
      return !Point.fromBytes(publicKey).is0();
    } catch (error) {
      return false;
    }
  }
  function randomSecretKey(seed) {
    seed = seed === undefined ? randomBytes_(lengths.seed) : seed;
    return mapHashToField(abytes2(seed, lengths.seed, "seed"), Fn.ORDER);
  }
  function getPublicKey(secretKey, isCompressed = true) {
    return Point.BASE.multiply(Fn.fromBytes(secretKey)).toBytes(isCompressed);
  }
  function isProbPub(item) {
    const { secretKey, publicKey, publicKeyUncompressed } = lengths;
    const allowedLengths = Fn._lengths;
    if (!isBytes2(item))
      return;
    const l = abytes2(item, undefined, "key").length;
    const isPub = l === publicKey || l === publicKeyUncompressed;
    const isSec = l === secretKey || !!allowedLengths?.includes(l);
    if (isPub && isSec)
      return;
    return isPub;
  }
  function getSharedSecret(secretKeyA, publicKeyB, isCompressed = true) {
    if (isProbPub(secretKeyA) === true)
      throw new Error("first arg must be private key");
    if (isProbPub(publicKeyB) === false)
      throw new Error("second arg must be public key");
    const s = Fn.fromBytes(secretKeyA);
    const b = Point.fromBytes(publicKeyB);
    if (b.is0())
      throw new Error("invalid public key: point at infinity");
    return b.multiply(s).toBytes(isCompressed);
  }
  const utils = {
    isValidSecretKey,
    isValidPublicKey,
    randomSecretKey
  };
  const keygen = createKeygen(randomSecretKey, getPublicKey);
  Object.freeze(utils);
  Object.freeze(lengths);
  return Object.freeze({ getPublicKey, getSharedSecret, keygen, Point, utils, lengths });
}
function ecdsa(Point, hash, ecdsaOpts = {}) {
  validatePointCons(Point);
  const hash_ = hash;
  ahash(hash_);
  validateObject(ecdsaOpts, {}, {
    hmac: "function",
    lowS: "boolean",
    randomBytes: "function",
    bits2int: "function",
    bits2int_modN: "function"
  });
  const opts = Object.assign({}, ecdsaOpts);
  const randomBytes = opts.randomBytes === undefined ? randomBytes2 : opts.randomBytes;
  const hmac2 = opts.hmac === undefined ? (key, msg) => hmac(hash_, key, msg) : opts.hmac;
  const { Fp, Fn } = Point;
  const { ORDER: CURVE_ORDER, BITS: fnBits } = Fn;
  const blindLength = getMinHashLength(CURVE_ORDER);
  const csprng = probeRandomBytes(randomBytes, blindLength);
  const { keygen, getPublicKey, getSharedSecret, utils, lengths } = ecdh(Point, opts);
  const defaultSigOpts = {
    prehash: true,
    lowS: typeof opts.lowS === "boolean" ? opts.lowS : true,
    format: "compact",
    extraEntropy: false
  };
  const hasLargeRecoveryLifts = CURVE_ORDER * _2n6 + _1n8 < Fp.ORDER;
  function isBiggerThanHalfOrder(number) {
    const HALF = CURVE_ORDER >> _1n8;
    return number > HALF;
  }
  function validateRS(title, num) {
    if (!Fn.isValidNot0(num))
      throw new Error(`invalid signature ${title}: out of range 1..Point.Fn.ORDER`);
    return num;
  }
  function assertFieldSignIsSupported() {
    if (!Fp.isOdd)
      throw new Error("Field doesn't support isOdd");
  }
  function getRecoveryBit(x, y, r) {
    assertFieldSignIsSupported();
    return (x === r ? 0 : 2) | Number(Fp.isOdd(y));
  }
  function assertRecoverableCurve() {
    if (hasLargeRecoveryLifts)
      throw new Error('"recovered" sig type is not supported for cofactor >2 curves');
  }
  function validateSigLength(bytes, format) {
    validateSigFormat(format);
    const size = lengths.signature;
    const sizer = format === "compact" ? size : format === "recovered" ? size + 1 : undefined;
    return abytes2(bytes, sizer);
  }

  class Signature {
    r;
    s;
    recovery;
    constructor(r, s, recovery) {
      this.r = validateRS("r", r);
      this.s = validateRS("s", s);
      if (recovery != null) {
        assertRecoverableCurve();
        if (![0, 1, 2, 3].includes(recovery))
          throw new Error("invalid recovery id");
        this.recovery = recovery;
      }
      Object.freeze(this);
    }
    static fromBytes(bytes, format = defaultSigOpts.format) {
      validateSigLength(bytes, format);
      let recid;
      if (format === "der") {
        if (bytes.length > 2 * Fn.BYTES + 16)
          throw new DER.Err("invalid signature: DER signature too long");
        const { r, s } = DER.toSig(abytes2(bytes), Fn.BYTES + 1);
        return new Signature(r, s);
      }
      if (format === "recovered") {
        recid = bytes[0];
        format = "compact";
        bytes = bytes.subarray(1);
      }
      const L = lengths.signature / 2;
      const r = bytes.subarray(0, L);
      const s = bytes.subarray(L, L * 2);
      return new Signature(Fn.fromBytes(r), Fn.fromBytes(s), recid);
    }
    static fromHex(hex, format) {
      return this.fromBytes(hexToBytes2(hex), format);
    }
    assertRecovery() {
      const { recovery } = this;
      if (recovery == null)
        throw new Error("invalid recovery id: must be present");
      return recovery;
    }
    addRecoveryBit(recovery) {
      return new Signature(this.r, this.s, recovery);
    }
    recoverPublicKey(messageHash) {
      const { r, s } = this;
      const recovery = this.assertRecovery();
      const radj = recovery === 2 || recovery === 3 ? r + CURVE_ORDER : r;
      if (!Fp.isValid(radj))
        throw new Error("invalid recovery id: sig.r+curve.n != R.x");
      const x = Fp.toBytes(radj);
      const R = Point.fromBytes(concatBytes2(pprefix((recovery & 1) === 0), x));
      const ir = Fn.inv(radj);
      const h = bits2int_modN(abytes2(messageHash, undefined, "msgHash"));
      const u1 = Fn.create(-h * ir);
      const u2 = Fn.create(s * ir);
      const Q = Point.BASE.mulAddUnsafe(u1, R, u2);
      if (Q.is0())
        throw new Error("invalid recovery: point at infinify");
      Q.assertValidity();
      return Q;
    }
    hasHighS() {
      return isBiggerThanHalfOrder(this.s);
    }
    toBytes(format = defaultSigOpts.format) {
      validateSigFormat(format);
      if (format === "der")
        return hexToBytes2(DER.hexFromSig(this));
      const { r, s } = this;
      const rb = Fn.toBytes(r);
      const sb = Fn.toBytes(s);
      if (format === "recovered") {
        assertRecoverableCurve();
        return concatBytes2(Uint8Array.of(this.assertRecovery()), rb, sb);
      }
      return concatBytes2(rb, sb);
    }
    toHex(format) {
      return bytesToHex2(this.toBytes(format));
    }
  }
  Object.freeze(Signature.prototype);
  Object.freeze(Signature);
  const bits2int = opts.bits2int === undefined ? function bits2int_def(bytes) {
    if (bytes.length > 8192)
      throw new Error("input is too large");
    const num = bytesToNumberBE(bytes);
    const delta = bytes.length * 8 - fnBits;
    return delta > 0 ? num >> BigInt(delta) : num;
  } : opts.bits2int;
  const bits2int_modN = opts.bits2int_modN === undefined ? function bits2int_modN_def(bytes) {
    return Fn.create(bits2int(bytes));
  } : opts.bits2int_modN;
  const ORDER_MASK = bitMask(fnBits);
  function int2octets(num) {
    aInRange("num < 2^" + fnBits, num, _0n9, ORDER_MASK);
    return Fn.toBytes(num);
  }
  function validateMsgAndHash(message, prehash) {
    abytes2(message, undefined, "message");
    return prehash ? abytes2(hash_(message), undefined, "prehashed message") : message;
  }
  function prepSig(message, secretKey, opts) {
    const { lowS, prehash, extraEntropy } = validateSigOpts(opts, defaultSigOpts);
    message = validateMsgAndHash(message, prehash);
    const h1int = bits2int_modN(message);
    const d = Fn.fromBytes(secretKey);
    if (!Fn.isValidNot0(d))
      throw new Error("invalid private key");
    const seedArgs = [int2octets(d), int2octets(h1int)];
    if (extraEntropy != null && extraEntropy !== false) {
      const e = extraEntropy === true ? randomBytes(lengths.secretKey) : extraEntropy;
      seedArgs.push(abytes2(e, undefined, "extraEntropy"));
    }
    const seed = concatBytes2(...seedArgs);
    const m = h1int;
    function k2sig(kBytes) {
      const k = bits2int(kBytes);
      if (!Fn.isValidNot0(k))
        return;
      const q = Point.BASE.multiply(k).toAffine();
      const r = Fn.create(q.x);
      if (r === _0n9)
        return;
      let s;
      if (csprng !== undefined) {
        const b = bytesToNumberBE(mapHashToField(csprng(blindLength), CURVE_ORDER));
        const ibk = Fn.inv(Fn.mul(b, k));
        const bm = Fn.mul(b, m);
        const bd = Fn.mul(b, d);
        s = Fn.create(ibk * Fn.create(bm + bd * r));
      } else {
        const ik = invertCt(k, CURVE_ORDER);
        s = Fn.create(ik * Fn.create(m + r * d));
      }
      if (s === _0n9)
        return;
      let recovery = getRecoveryBit(q.x, q.y, r);
      let normS = s;
      if (lowS && isBiggerThanHalfOrder(s)) {
        normS = Fn.neg(s);
        recovery ^= 1;
      }
      return new Signature(r, normS, hasLargeRecoveryLifts ? undefined : recovery);
    }
    return { seed, k2sig };
  }
  function sign(message, secretKey, opts = {}) {
    const { seed, k2sig } = prepSig(message, secretKey, opts);
    const drbg = createHmacDrbg(hash_.outputLen, Fn.BYTES, hmac2);
    const sig = drbg(seed, k2sig);
    return sig.toBytes(opts.format);
  }
  function verify(signature, message, publicKey, opts = {}) {
    const { lowS, prehash, format } = validateSigOpts(opts, defaultSigOpts);
    publicKey = abytes2(publicKey, undefined, "publicKey");
    message = validateMsgAndHash(message, prehash);
    if (!isBytes2(signature)) {
      const end = signature instanceof Signature ? ", use sig.toBytes()" : "";
      throw new Error("verify expects Uint8Array signature" + end);
    }
    validateSigLength(signature, format);
    try {
      const sig = Signature.fromBytes(signature, format);
      const P = Point.fromBytes(publicKey);
      if (P.is0())
        return false;
      if (lowS && sig.hasHighS())
        return false;
      const { r, s } = sig;
      const h = bits2int_modN(message);
      const is = Fn.inv(s);
      const u1 = Fn.create(h * is);
      const u2 = Fn.create(r * is);
      const R = Point.BASE.mulAddUnsafe(u1, P, u2);
      if (R.is0())
        return false;
      const q = R.toAffine();
      const v = Fn.create(q.x);
      if (v !== r)
        return false;
      if (format === "recovered" && sig.recovery !== getRecoveryBit(q.x, q.y, r))
        return false;
      return true;
    } catch (e) {
      return false;
    }
  }
  function recoverPublicKey(signature, message, opts = {}) {
    const { prehash } = validateSigOpts(opts, defaultSigOpts);
    message = validateMsgAndHash(message, prehash);
    return Signature.fromBytes(signature, "recovered").recoverPublicKey(message).toBytes();
  }
  return Object.freeze({
    keygen,
    getPublicKey,
    getSharedSecret,
    utils,
    lengths,
    Point,
    sign,
    verify,
    recoverPublicKey,
    Signature,
    hash: hash_
  });
}

// node_modules/@noble/curves/secp256k1.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var secp256k1_CURVE = {
  p: BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f"),
  n: BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141"),
  h: BigInt(1),
  a: BigInt(0),
  b: BigInt(7),
  Gx: BigInt("0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"),
  Gy: BigInt("0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8")
};
var secp256k1_ENDO = {
  beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
  basises: [
    [BigInt("0x3086d221a7d46bcde86c90e49284eb15"), -BigInt("0xe4437ed6010e88286f547fa90abfe4c3")],
    [BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8"), BigInt("0x3086d221a7d46bcde86c90e49284eb15")]
  ]
};
var _2n7 = /* @__PURE__ */ BigInt(2);
function sqrtMod(y) {
  const P = secp256k1_CURVE.p;
  const _3n = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
  const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
  const b2 = y * y * y % P;
  const b3 = b2 * b2 * y % P;
  const b6 = pow2(b3, _3n, P) * b3 % P;
  const b9 = pow2(b6, _3n, P) * b3 % P;
  const b11 = pow2(b9, _2n7, P) * b2 % P;
  const b22 = pow2(b11, _11n, P) * b11 % P;
  const b44 = pow2(b22, _22n, P) * b22 % P;
  const b88 = pow2(b44, _44n, P) * b44 % P;
  const b176 = pow2(b88, _88n, P) * b88 % P;
  const b220 = pow2(b176, _44n, P) * b44 % P;
  const b223 = pow2(b220, _3n, P) * b3 % P;
  const t1 = pow2(b223, _23n, P) * b22 % P;
  const t2 = pow2(t1, _6n, P) * b2 % P;
  const root = pow2(t2, _2n7, P);
  if (!Fpk1.eql(Fpk1.sqr(root), y))
    throw new Error("Cannot find square root");
  return root;
}
var Fpk1 = /* @__PURE__ */ Field(secp256k1_CURVE.p, { sqrt: sqrtMod });
var Pointk1 = /* @__PURE__ */ weierstrass(secp256k1_CURVE, {
  Fp: Fpk1,
  endo: secp256k1_ENDO
});
var secp256k1 = /* @__PURE__ */ ecdsa(Pointk1, sha256);
var TAGGED_HASH_PREFIXES = Object.create(null);

// src/cesr/sigs.ts
function encodeSig(sig, algoOrTransferable = "ed25519") {
  if (typeof algoOrTransferable === "boolean") {
    const code = algoOrTransferable ? MtrDex.Ed25519_Sig : "0A";
    const matter = new Matter({ raw: sig, code });
    return { algo: "ed25519", qb64: matter.qb64, raw: sig };
  }
  const algo = algoOrTransferable;
  const code = algo === "secp256k1" ? MtrDex.ECDSA_256k1_Sig : MtrDex.Ed25519_Sig;
  const matter = new Matter({ raw: sig, code });
  return { algo, qb64: matter.qb64, raw: sig };
}
function decodeSig(qb64) {
  const matter = new Matter({ qb64 });
  if (matter.code === MtrDex.ECDSA_256k1_Sig) {
    return { algo: "secp256k1", qb64, raw: matter.raw };
  }
  if (matter.code === MtrDex.Ed25519_Sig || matter.code === "0A") {
    return { algo: "ed25519", qb64, raw: matter.raw };
  }
  throw new Error(`Unsupported sig code: ${matter.code}`);
}

// src/signature/verify.ts
function verify(publicKey, signature, data) {
  try {
    const pub = decodeKey(publicKey);
    const sig = decodeSig(signature);
    if (pub.algo !== sig.algo)
      return false;
    return verifyByAlgo(sig.algo, { sig: sig.raw, pub: pub.raw }, data);
  } catch {
    return false;
  }
}
function verifyByAlgo(algo, raw, data) {
  if (algo === "ed25519")
    return ed25519.verify(raw.sig, data, raw.pub);
  if (algo === "secp256k1")
    return secp256k1.verify(raw.sig, data, raw.pub);
  return false;
}

// src/acdc/ops.ts
function extractSaids(sources) {
  const seen = new Set;
  for (const src of sources)
    seen.add(src.acdcSaid);
  return Array.from(seen);
}
function extractUniqueRids(sources) {
  const seen = new Set;
  for (const src of sources) {
    if (src.kind === "tel-iss" || src.kind === "tel-rev") {
      seen.add(src.rid);
    }
  }
  return Array.from(seen);
}
function status(sources) {
  let hasIss = false;
  for (const src of sources) {
    if (src.kind === "tel-rev")
      return "revoked";
    if (src.kind === "tel-iss")
      hasIss = true;
  }
  return hasIss ? "issued" : "unknown";
}
function findIssSaidForRid(sources, rid) {
  for (const src of sources) {
    if (src.kind === "tel-iss" && src.rid === rid)
      return src.eventSaid;
  }
  return;
}
function evidence(sources) {
  const result = [];
  for (const src of sources) {
    if (src.kind === "tel-iss") {
      result.push({
        source: "tel",
        status: "issued",
        rid: src.rid,
        issSaid: src.eventSaid,
        issIndex: src.index
      });
    } else if (src.kind === "tel-rev") {
      const issSaid = findIssSaidForRid(sources, src.rid);
      result.push({
        source: "tel",
        status: "revoked",
        rid: src.rid,
        issSaid: issSaid ?? "",
        revSaid: src.eventSaid,
        revIndex: src.index
      });
    } else if (src.kind === "kel-anchor") {
      result.push({
        source: "kel-anchor",
        status: "anchored",
        issuer: src.issuer,
        anchorEventSaid: src.eventSaid,
        anchorEventSeqNo: src.seqNo
      });
    }
  }
  return result;
}
function verifySignature(credential, proof, publicKey) {
  const signature = proof.s;
  const surface = buildACDCCredentialSurface(credential);
  const { raw } = serializeForSigning(credential, surface);
  const valid = verify(publicKey, signature, raw);
  if (!valid) {
    return { ok: false, reason: "signature_invalid", message: "Ed25519 signature verification failed" };
  }
  return { ok: true };
}
function subjectClaims(credential) {
  return credential.a ?? {};
}
function projectClaims(credential, schema) {
  const properties = schema.s.properties;
  if (!properties)
    return {};
  const a = credential.a ?? {};
  const claims = {};
  for (const key of Object.keys(properties)) {
    if (key in a) {
      claims[key] = a[key];
    }
  }
  return claims;
}
function projectAndValidateClaims(credential, schema) {
  const claims = projectClaims(credential, schema);
  const validation = SchemaOps.validate(schema, claims);
  return { claims, validation };
}
function validateSaid2(credential) {
  const surface = buildACDCCredentialSurface(credential);
  const result = recomputeSaid(credential, surface);
  return {
    valid: result.matches,
    expected: result.recomputed,
    actual: credential.d ?? ""
  };
}
var ACDCOps = {
  status,
  evidence,
  extractSaids,
  extractUniqueRids,
  verifySignature,
  subjectClaims,
  projectClaims,
  projectAndValidateClaims,
  validateSaid: validateSaid2
};
// src/acdc/types.ts
init_esm();

// src/common/types.ts
init_esm();

// node_modules/@sinclair/typebox/build/esm/errors/errors.mjs
init_keyof2();
init_registry();
init_extends_undefined();

// node_modules/@sinclair/typebox/build/esm/errors/function.mjs
init_symbols2();
function DefaultErrorFunction(error) {
  switch (error.errorType) {
    case ValueErrorType.ArrayContains:
      return "Expected array to contain at least one matching value";
    case ValueErrorType.ArrayMaxContains:
      return `Expected array to contain no more than ${error.schema.maxContains} matching values`;
    case ValueErrorType.ArrayMinContains:
      return `Expected array to contain at least ${error.schema.minContains} matching values`;
    case ValueErrorType.ArrayMaxItems:
      return `Expected array length to be less or equal to ${error.schema.maxItems}`;
    case ValueErrorType.ArrayMinItems:
      return `Expected array length to be greater or equal to ${error.schema.minItems}`;
    case ValueErrorType.ArrayUniqueItems:
      return "Expected array elements to be unique";
    case ValueErrorType.Array:
      return "Expected array";
    case ValueErrorType.AsyncIterator:
      return "Expected AsyncIterator";
    case ValueErrorType.BigIntExclusiveMaximum:
      return `Expected bigint to be less than ${error.schema.exclusiveMaximum}`;
    case ValueErrorType.BigIntExclusiveMinimum:
      return `Expected bigint to be greater than ${error.schema.exclusiveMinimum}`;
    case ValueErrorType.BigIntMaximum:
      return `Expected bigint to be less or equal to ${error.schema.maximum}`;
    case ValueErrorType.BigIntMinimum:
      return `Expected bigint to be greater or equal to ${error.schema.minimum}`;
    case ValueErrorType.BigIntMultipleOf:
      return `Expected bigint to be a multiple of ${error.schema.multipleOf}`;
    case ValueErrorType.BigInt:
      return "Expected bigint";
    case ValueErrorType.Boolean:
      return "Expected boolean";
    case ValueErrorType.DateExclusiveMinimumTimestamp:
      return `Expected Date timestamp to be greater than ${error.schema.exclusiveMinimumTimestamp}`;
    case ValueErrorType.DateExclusiveMaximumTimestamp:
      return `Expected Date timestamp to be less than ${error.schema.exclusiveMaximumTimestamp}`;
    case ValueErrorType.DateMinimumTimestamp:
      return `Expected Date timestamp to be greater or equal to ${error.schema.minimumTimestamp}`;
    case ValueErrorType.DateMaximumTimestamp:
      return `Expected Date timestamp to be less or equal to ${error.schema.maximumTimestamp}`;
    case ValueErrorType.DateMultipleOfTimestamp:
      return `Expected Date timestamp to be a multiple of ${error.schema.multipleOfTimestamp}`;
    case ValueErrorType.Date:
      return "Expected Date";
    case ValueErrorType.Function:
      return "Expected function";
    case ValueErrorType.IntegerExclusiveMaximum:
      return `Expected integer to be less than ${error.schema.exclusiveMaximum}`;
    case ValueErrorType.IntegerExclusiveMinimum:
      return `Expected integer to be greater than ${error.schema.exclusiveMinimum}`;
    case ValueErrorType.IntegerMaximum:
      return `Expected integer to be less or equal to ${error.schema.maximum}`;
    case ValueErrorType.IntegerMinimum:
      return `Expected integer to be greater or equal to ${error.schema.minimum}`;
    case ValueErrorType.IntegerMultipleOf:
      return `Expected integer to be a multiple of ${error.schema.multipleOf}`;
    case ValueErrorType.Integer:
      return "Expected integer";
    case ValueErrorType.IntersectUnevaluatedProperties:
      return "Unexpected property";
    case ValueErrorType.Intersect:
      return "Expected all values to match";
    case ValueErrorType.Iterator:
      return "Expected Iterator";
    case ValueErrorType.Literal:
      return `Expected ${typeof error.schema.const === "string" ? `'${error.schema.const}'` : error.schema.const}`;
    case ValueErrorType.Never:
      return "Never";
    case ValueErrorType.Not:
      return "Value should not match";
    case ValueErrorType.Null:
      return "Expected null";
    case ValueErrorType.NumberExclusiveMaximum:
      return `Expected number to be less than ${error.schema.exclusiveMaximum}`;
    case ValueErrorType.NumberExclusiveMinimum:
      return `Expected number to be greater than ${error.schema.exclusiveMinimum}`;
    case ValueErrorType.NumberMaximum:
      return `Expected number to be less or equal to ${error.schema.maximum}`;
    case ValueErrorType.NumberMinimum:
      return `Expected number to be greater or equal to ${error.schema.minimum}`;
    case ValueErrorType.NumberMultipleOf:
      return `Expected number to be a multiple of ${error.schema.multipleOf}`;
    case ValueErrorType.Number:
      return "Expected number";
    case ValueErrorType.Object:
      return "Expected object";
    case ValueErrorType.ObjectAdditionalProperties:
      return "Unexpected property";
    case ValueErrorType.ObjectMaxProperties:
      return `Expected object to have no more than ${error.schema.maxProperties} properties`;
    case ValueErrorType.ObjectMinProperties:
      return `Expected object to have at least ${error.schema.minProperties} properties`;
    case ValueErrorType.ObjectRequiredProperty:
      return "Expected required property";
    case ValueErrorType.Promise:
      return "Expected Promise";
    case ValueErrorType.RegExp:
      return "Expected string to match regular expression";
    case ValueErrorType.StringFormatUnknown:
      return `Unknown format '${error.schema.format}'`;
    case ValueErrorType.StringFormat:
      return `Expected string to match '${error.schema.format}' format`;
    case ValueErrorType.StringMaxLength:
      return `Expected string length less or equal to ${error.schema.maxLength}`;
    case ValueErrorType.StringMinLength:
      return `Expected string length greater or equal to ${error.schema.minLength}`;
    case ValueErrorType.StringPattern:
      return `Expected string to match '${error.schema.pattern}'`;
    case ValueErrorType.String:
      return "Expected string";
    case ValueErrorType.Symbol:
      return "Expected symbol";
    case ValueErrorType.TupleLength:
      return `Expected tuple to have ${error.schema.maxItems || 0} elements`;
    case ValueErrorType.Tuple:
      return "Expected tuple";
    case ValueErrorType.Uint8ArrayMaxByteLength:
      return `Expected byte length less or equal to ${error.schema.maxByteLength}`;
    case ValueErrorType.Uint8ArrayMinByteLength:
      return `Expected byte length greater or equal to ${error.schema.minByteLength}`;
    case ValueErrorType.Uint8Array:
      return "Expected Uint8Array";
    case ValueErrorType.Undefined:
      return "Expected undefined";
    case ValueErrorType.Union:
      return "Expected union value";
    case ValueErrorType.Void:
      return "Expected void";
    case ValueErrorType.Kind:
      return `Expected kind '${error.schema[Kind]}'`;
    default:
      return "Unknown error type";
  }
}
var errorFunction = DefaultErrorFunction;
function GetErrorFunction() {
  return errorFunction;
}

// node_modules/@sinclair/typebox/build/esm/errors/errors.mjs
init_error2();

// node_modules/@sinclair/typebox/build/esm/value/deref/deref.mjs
init_error2();
init_symbols2();

class TypeDereferenceError extends TypeBoxError {
  constructor(schema) {
    super(`Unable to dereference schema with $id '${schema.$ref}'`);
    this.schema = schema;
  }
}
function Resolve(schema, references) {
  const target = references.find((target) => target.$id === schema.$ref);
  if (target === undefined)
    throw new TypeDereferenceError(schema);
  return Deref(target, references);
}
function Pushref(schema, references) {
  if (!IsString2(schema.$id) || references.some((target) => target.$id === schema.$id))
    return references;
  references.push(schema);
  return references;
}
function Deref(schema, references) {
  return schema[Kind] === "This" || schema[Kind] === "Ref" ? Resolve(schema, references) : schema;
}

// node_modules/@sinclair/typebox/build/esm/value/hash/hash.mjs
init_guard();
init_error2();

class ValueHashError extends TypeBoxError {
  constructor(value) {
    super(`Unable to hash value`);
    this.value = value;
  }
}
var ByteMarker;
(function(ByteMarker) {
  ByteMarker[ByteMarker["Undefined"] = 0] = "Undefined";
  ByteMarker[ByteMarker["Null"] = 1] = "Null";
  ByteMarker[ByteMarker["Boolean"] = 2] = "Boolean";
  ByteMarker[ByteMarker["Number"] = 3] = "Number";
  ByteMarker[ByteMarker["String"] = 4] = "String";
  ByteMarker[ByteMarker["Object"] = 5] = "Object";
  ByteMarker[ByteMarker["Array"] = 6] = "Array";
  ByteMarker[ByteMarker["Date"] = 7] = "Date";
  ByteMarker[ByteMarker["Uint8Array"] = 8] = "Uint8Array";
  ByteMarker[ByteMarker["Symbol"] = 9] = "Symbol";
  ByteMarker[ByteMarker["BigInt"] = 10] = "BigInt";
})(ByteMarker || (ByteMarker = {}));
var Accumulator = BigInt("14695981039346656037");
var [Prime, Size] = [BigInt("1099511628211"), BigInt("18446744073709551616")];
var Bytes = Array.from({ length: 256 }).map((_, i) => BigInt(i));
var F64 = new Float64Array(1);
var F64In = new DataView(F64.buffer);
var F64Out = new Uint8Array(F64.buffer);
function* NumberToBytes(value) {
  const byteCount = value === 0 ? 1 : Math.ceil(Math.floor(Math.log2(value) + 1) / 8);
  for (let i = 0;i < byteCount; i++) {
    yield value >> 8 * (byteCount - 1 - i) & 255;
  }
}
function ArrayType2(value) {
  FNV1A64(ByteMarker.Array);
  for (const item of value) {
    Visit4(item);
  }
}
function BooleanType(value) {
  FNV1A64(ByteMarker.Boolean);
  FNV1A64(value ? 1 : 0);
}
function BigIntType(value) {
  FNV1A64(ByteMarker.BigInt);
  F64In.setBigInt64(0, value);
  for (const byte of F64Out) {
    FNV1A64(byte);
  }
}
function DateType2(value) {
  FNV1A64(ByteMarker.Date);
  Visit4(value.getTime());
}
function NullType(value) {
  FNV1A64(ByteMarker.Null);
}
function NumberType(value) {
  FNV1A64(ByteMarker.Number);
  F64In.setFloat64(0, value);
  for (const byte of F64Out) {
    FNV1A64(byte);
  }
}
function ObjectType2(value) {
  FNV1A64(ByteMarker.Object);
  for (const key of globalThis.Object.getOwnPropertyNames(value).sort()) {
    Visit4(key);
    Visit4(value[key]);
  }
}
function StringType(value) {
  FNV1A64(ByteMarker.String);
  for (let i = 0;i < value.length; i++) {
    for (const byte of NumberToBytes(value.charCodeAt(i))) {
      FNV1A64(byte);
    }
  }
}
function SymbolType(value) {
  FNV1A64(ByteMarker.Symbol);
  Visit4(value.description);
}
function Uint8ArrayType2(value) {
  FNV1A64(ByteMarker.Uint8Array);
  for (let i = 0;i < value.length; i++) {
    FNV1A64(value[i]);
  }
}
function UndefinedType(value) {
  return FNV1A64(ByteMarker.Undefined);
}
function Visit4(value) {
  if (IsArray2(value))
    return ArrayType2(value);
  if (IsBoolean2(value))
    return BooleanType(value);
  if (IsBigInt2(value))
    return BigIntType(value);
  if (IsDate2(value))
    return DateType2(value);
  if (IsNull2(value))
    return NullType(value);
  if (IsNumber2(value))
    return NumberType(value);
  if (IsObject2(value))
    return ObjectType2(value);
  if (IsString2(value))
    return StringType(value);
  if (IsSymbol2(value))
    return SymbolType(value);
  if (IsUint8Array2(value))
    return Uint8ArrayType2(value);
  if (IsUndefined2(value))
    return UndefinedType(value);
  throw new ValueHashError(value);
}
function FNV1A64(byte) {
  Accumulator = Accumulator ^ Bytes[byte];
  Accumulator = Accumulator * Prime % Size;
}
function Hash(value) {
  Accumulator = BigInt("14695981039346656037");
  Visit4(value);
  return Accumulator;
}

// node_modules/@sinclair/typebox/build/esm/value/check/check.mjs
init_symbols2();
init_keyof2();
init_extends2();
init_registry();
init_error2();
init_never2();
init_guard();
init_kind();

class ValueCheckUnknownTypeError extends TypeBoxError {
  constructor(schema) {
    super(`Unknown type`);
    this.schema = schema;
  }
}
function IsAnyOrUnknown(schema) {
  return schema[Kind] === "Any" || schema[Kind] === "Unknown";
}
function IsDefined(value) {
  return value !== undefined;
}
function FromAny2(schema, references, value) {
  return true;
}
function FromArgument2(schema, references, value) {
  return true;
}
function FromArray7(schema, references, value) {
  if (!IsArray2(value))
    return false;
  if (IsDefined(schema.minItems) && !(value.length >= schema.minItems)) {
    return false;
  }
  if (IsDefined(schema.maxItems) && !(value.length <= schema.maxItems)) {
    return false;
  }
  for (const element of value) {
    if (!Visit5(schema.items, references, element))
      return false;
  }
  if (schema.uniqueItems === true && !function() {
    const set = new Set;
    for (const element of value) {
      const hashed = Hash(element);
      if (set.has(hashed)) {
        return false;
      } else {
        set.add(hashed);
      }
    }
    return true;
  }()) {
    return false;
  }
  if (!(IsDefined(schema.contains) || IsNumber2(schema.minContains) || IsNumber2(schema.maxContains))) {
    return true;
  }
  const containsSchema = IsDefined(schema.contains) ? schema.contains : Never();
  const containsCount = value.reduce((acc, value) => Visit5(containsSchema, references, value) ? acc + 1 : acc, 0);
  if (containsCount === 0) {
    return false;
  }
  if (IsNumber2(schema.minContains) && containsCount < schema.minContains) {
    return false;
  }
  if (IsNumber2(schema.maxContains) && containsCount > schema.maxContains) {
    return false;
  }
  return true;
}
function FromAsyncIterator4(schema, references, value) {
  return IsAsyncIterator2(value);
}
function FromBigInt2(schema, references, value) {
  if (!IsBigInt2(value))
    return false;
  if (IsDefined(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    return false;
  }
  if (IsDefined(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    return false;
  }
  if (IsDefined(schema.maximum) && !(value <= schema.maximum)) {
    return false;
  }
  if (IsDefined(schema.minimum) && !(value >= schema.minimum)) {
    return false;
  }
  if (IsDefined(schema.multipleOf) && !(value % schema.multipleOf === BigInt(0))) {
    return false;
  }
  return true;
}
function FromBoolean2(schema, references, value) {
  return IsBoolean2(value);
}
function FromConstructor4(schema, references, value) {
  return Visit5(schema.returns, references, value.prototype);
}
function FromDate2(schema, references, value) {
  if (!IsDate2(value))
    return false;
  if (IsDefined(schema.exclusiveMaximumTimestamp) && !(value.getTime() < schema.exclusiveMaximumTimestamp)) {
    return false;
  }
  if (IsDefined(schema.exclusiveMinimumTimestamp) && !(value.getTime() > schema.exclusiveMinimumTimestamp)) {
    return false;
  }
  if (IsDefined(schema.maximumTimestamp) && !(value.getTime() <= schema.maximumTimestamp)) {
    return false;
  }
  if (IsDefined(schema.minimumTimestamp) && !(value.getTime() >= schema.minimumTimestamp)) {
    return false;
  }
  if (IsDefined(schema.multipleOfTimestamp) && !(value.getTime() % schema.multipleOfTimestamp === 0)) {
    return false;
  }
  return true;
}
function FromFunction4(schema, references, value) {
  return IsFunction2(value);
}
function FromImport(schema, references, value) {
  const definitions = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  return Visit5(target, [...references, ...definitions], value);
}
function FromInteger2(schema, references, value) {
  if (!IsInteger(value)) {
    return false;
  }
  if (IsDefined(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    return false;
  }
  if (IsDefined(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    return false;
  }
  if (IsDefined(schema.maximum) && !(value <= schema.maximum)) {
    return false;
  }
  if (IsDefined(schema.minimum) && !(value >= schema.minimum)) {
    return false;
  }
  if (IsDefined(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    return false;
  }
  return true;
}
function FromIntersect9(schema, references, value) {
  const check1 = schema.allOf.every((schema) => Visit5(schema, references, value));
  if (schema.unevaluatedProperties === false) {
    const keyPattern = new RegExp(KeyOfPattern(schema));
    const check2 = Object.getOwnPropertyNames(value).every((key) => keyPattern.test(key));
    return check1 && check2;
  } else if (IsSchema(schema.unevaluatedProperties)) {
    const keyCheck = new RegExp(KeyOfPattern(schema));
    const check2 = Object.getOwnPropertyNames(value).every((key) => keyCheck.test(key) || Visit5(schema.unevaluatedProperties, references, value[key]));
    return check1 && check2;
  } else {
    return check1;
  }
}
function FromIterator4(schema, references, value) {
  return IsIterator2(value);
}
function FromLiteral3(schema, references, value) {
  return value === schema.const;
}
function FromNever2(schema, references, value) {
  return false;
}
function FromNot2(schema, references, value) {
  return !Visit5(schema.not, references, value);
}
function FromNull2(schema, references, value) {
  return IsNull2(value);
}
function FromNumber2(schema, references, value) {
  if (!TypeSystemPolicy.IsNumberLike(value))
    return false;
  if (IsDefined(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    return false;
  }
  if (IsDefined(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    return false;
  }
  if (IsDefined(schema.minimum) && !(value >= schema.minimum)) {
    return false;
  }
  if (IsDefined(schema.maximum) && !(value <= schema.maximum)) {
    return false;
  }
  if (IsDefined(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    return false;
  }
  return true;
}
function FromObject8(schema, references, value) {
  if (!TypeSystemPolicy.IsObjectLike(value))
    return false;
  if (IsDefined(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    return false;
  }
  if (IsDefined(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    return false;
  }
  const knownKeys = Object.getOwnPropertyNames(schema.properties);
  for (const knownKey of knownKeys) {
    const property = schema.properties[knownKey];
    if (schema.required && schema.required.includes(knownKey)) {
      if (!Visit5(property, references, value[knownKey])) {
        return false;
      }
      if ((ExtendsUndefinedCheck(property) || IsAnyOrUnknown(property)) && !(knownKey in value)) {
        return false;
      }
    } else {
      if (TypeSystemPolicy.IsExactOptionalProperty(value, knownKey) && !Visit5(property, references, value[knownKey])) {
        return false;
      }
    }
  }
  if (schema.additionalProperties === false) {
    const valueKeys = Object.getOwnPropertyNames(value);
    if (schema.required && schema.required.length === knownKeys.length && valueKeys.length === knownKeys.length) {
      return true;
    } else {
      return valueKeys.every((valueKey) => knownKeys.includes(valueKey));
    }
  } else if (typeof schema.additionalProperties === "object") {
    const valueKeys = Object.getOwnPropertyNames(value);
    return valueKeys.every((key) => knownKeys.includes(key) || Visit5(schema.additionalProperties, references, value[key]));
  } else {
    return true;
  }
}
function FromPromise4(schema, references, value) {
  return IsPromise(value);
}
function FromRecord4(schema, references, value) {
  if (!TypeSystemPolicy.IsRecordLike(value)) {
    return false;
  }
  if (IsDefined(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    return false;
  }
  if (IsDefined(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    return false;
  }
  const [patternKey, patternSchema] = Object.entries(schema.patternProperties)[0];
  const regex = new RegExp(patternKey);
  const check1 = Object.entries(value).every(([key, value]) => {
    return regex.test(key) ? Visit5(patternSchema, references, value) : true;
  });
  const check2 = typeof schema.additionalProperties === "object" ? Object.entries(value).every(([key, value]) => {
    return !regex.test(key) ? Visit5(schema.additionalProperties, references, value) : true;
  }) : true;
  const check3 = schema.additionalProperties === false ? Object.getOwnPropertyNames(value).every((key) => {
    return regex.test(key);
  }) : true;
  return check1 && check2 && check3;
}
function FromRef5(schema, references, value) {
  return Visit5(Deref(schema, references), references, value);
}
function FromRegExp2(schema, references, value) {
  const regex = new RegExp(schema.source, schema.flags);
  if (IsDefined(schema.minLength)) {
    if (!(value.length >= schema.minLength))
      return false;
  }
  if (IsDefined(schema.maxLength)) {
    if (!(value.length <= schema.maxLength))
      return false;
  }
  return regex.test(value);
}
function FromString2(schema, references, value) {
  if (!IsString2(value)) {
    return false;
  }
  if (IsDefined(schema.minLength)) {
    if (!(value.length >= schema.minLength))
      return false;
  }
  if (IsDefined(schema.maxLength)) {
    if (!(value.length <= schema.maxLength))
      return false;
  }
  if (IsDefined(schema.pattern)) {
    const regex = new RegExp(schema.pattern);
    if (!regex.test(value))
      return false;
  }
  if (IsDefined(schema.format)) {
    if (!Has(schema.format))
      return false;
    const func = Get(schema.format);
    return func(value);
  }
  return true;
}
function FromSymbol2(schema, references, value) {
  return IsSymbol2(value);
}
function FromTemplateLiteral4(schema, references, value) {
  return IsString2(value) && new RegExp(schema.pattern).test(value);
}
function FromThis(schema, references, value) {
  return Visit5(Deref(schema, references), references, value);
}
function FromTuple6(schema, references, value) {
  if (!IsArray2(value)) {
    return false;
  }
  if (schema.items === undefined && !(value.length === 0)) {
    return false;
  }
  if (!(value.length === schema.maxItems)) {
    return false;
  }
  if (!schema.items) {
    return true;
  }
  for (let i = 0;i < schema.items.length; i++) {
    if (!Visit5(schema.items[i], references, value[i]))
      return false;
  }
  return true;
}
function FromUndefined2(schema, references, value) {
  return IsUndefined2(value);
}
function FromUnion11(schema, references, value) {
  return schema.anyOf.some((inner) => Visit5(inner, references, value));
}
function FromUint8Array2(schema, references, value) {
  if (!IsUint8Array2(value)) {
    return false;
  }
  if (IsDefined(schema.maxByteLength) && !(value.length <= schema.maxByteLength)) {
    return false;
  }
  if (IsDefined(schema.minByteLength) && !(value.length >= schema.minByteLength)) {
    return false;
  }
  return true;
}
function FromUnknown2(schema, references, value) {
  return true;
}
function FromVoid2(schema, references, value) {
  return TypeSystemPolicy.IsVoidLike(value);
}
function FromKind(schema, references, value) {
  if (!Has2(schema[Kind]))
    return false;
  const func = Get2(schema[Kind]);
  return func(schema, value);
}
function Visit5(schema, references, value) {
  const references_ = IsDefined(schema.$id) ? Pushref(schema, references) : references;
  const schema_ = schema;
  switch (schema_[Kind]) {
    case "Any":
      return FromAny2(schema_, references_, value);
    case "Argument":
      return FromArgument2(schema_, references_, value);
    case "Array":
      return FromArray7(schema_, references_, value);
    case "AsyncIterator":
      return FromAsyncIterator4(schema_, references_, value);
    case "BigInt":
      return FromBigInt2(schema_, references_, value);
    case "Boolean":
      return FromBoolean2(schema_, references_, value);
    case "Constructor":
      return FromConstructor4(schema_, references_, value);
    case "Date":
      return FromDate2(schema_, references_, value);
    case "Function":
      return FromFunction4(schema_, references_, value);
    case "Import":
      return FromImport(schema_, references_, value);
    case "Integer":
      return FromInteger2(schema_, references_, value);
    case "Intersect":
      return FromIntersect9(schema_, references_, value);
    case "Iterator":
      return FromIterator4(schema_, references_, value);
    case "Literal":
      return FromLiteral3(schema_, references_, value);
    case "Never":
      return FromNever2(schema_, references_, value);
    case "Not":
      return FromNot2(schema_, references_, value);
    case "Null":
      return FromNull2(schema_, references_, value);
    case "Number":
      return FromNumber2(schema_, references_, value);
    case "Object":
      return FromObject8(schema_, references_, value);
    case "Promise":
      return FromPromise4(schema_, references_, value);
    case "Record":
      return FromRecord4(schema_, references_, value);
    case "Ref":
      return FromRef5(schema_, references_, value);
    case "RegExp":
      return FromRegExp2(schema_, references_, value);
    case "String":
      return FromString2(schema_, references_, value);
    case "Symbol":
      return FromSymbol2(schema_, references_, value);
    case "TemplateLiteral":
      return FromTemplateLiteral4(schema_, references_, value);
    case "This":
      return FromThis(schema_, references_, value);
    case "Tuple":
      return FromTuple6(schema_, references_, value);
    case "Undefined":
      return FromUndefined2(schema_, references_, value);
    case "Union":
      return FromUnion11(schema_, references_, value);
    case "Uint8Array":
      return FromUint8Array2(schema_, references_, value);
    case "Unknown":
      return FromUnknown2(schema_, references_, value);
    case "Void":
      return FromVoid2(schema_, references_, value);
    default:
      if (!Has2(schema_[Kind]))
        throw new ValueCheckUnknownTypeError(schema_);
      return FromKind(schema_, references_, value);
  }
}
function Check(...args) {
  return args.length === 3 ? Visit5(args[0], args[1], args[2]) : Visit5(args[0], [], args[1]);
}

// node_modules/@sinclair/typebox/build/esm/errors/errors.mjs
init_symbols2();
init_never2();
init_guard();
var ValueErrorType;
(function(ValueErrorType) {
  ValueErrorType[ValueErrorType["ArrayContains"] = 0] = "ArrayContains";
  ValueErrorType[ValueErrorType["ArrayMaxContains"] = 1] = "ArrayMaxContains";
  ValueErrorType[ValueErrorType["ArrayMaxItems"] = 2] = "ArrayMaxItems";
  ValueErrorType[ValueErrorType["ArrayMinContains"] = 3] = "ArrayMinContains";
  ValueErrorType[ValueErrorType["ArrayMinItems"] = 4] = "ArrayMinItems";
  ValueErrorType[ValueErrorType["ArrayUniqueItems"] = 5] = "ArrayUniqueItems";
  ValueErrorType[ValueErrorType["Array"] = 6] = "Array";
  ValueErrorType[ValueErrorType["AsyncIterator"] = 7] = "AsyncIterator";
  ValueErrorType[ValueErrorType["BigIntExclusiveMaximum"] = 8] = "BigIntExclusiveMaximum";
  ValueErrorType[ValueErrorType["BigIntExclusiveMinimum"] = 9] = "BigIntExclusiveMinimum";
  ValueErrorType[ValueErrorType["BigIntMaximum"] = 10] = "BigIntMaximum";
  ValueErrorType[ValueErrorType["BigIntMinimum"] = 11] = "BigIntMinimum";
  ValueErrorType[ValueErrorType["BigIntMultipleOf"] = 12] = "BigIntMultipleOf";
  ValueErrorType[ValueErrorType["BigInt"] = 13] = "BigInt";
  ValueErrorType[ValueErrorType["Boolean"] = 14] = "Boolean";
  ValueErrorType[ValueErrorType["DateExclusiveMaximumTimestamp"] = 15] = "DateExclusiveMaximumTimestamp";
  ValueErrorType[ValueErrorType["DateExclusiveMinimumTimestamp"] = 16] = "DateExclusiveMinimumTimestamp";
  ValueErrorType[ValueErrorType["DateMaximumTimestamp"] = 17] = "DateMaximumTimestamp";
  ValueErrorType[ValueErrorType["DateMinimumTimestamp"] = 18] = "DateMinimumTimestamp";
  ValueErrorType[ValueErrorType["DateMultipleOfTimestamp"] = 19] = "DateMultipleOfTimestamp";
  ValueErrorType[ValueErrorType["Date"] = 20] = "Date";
  ValueErrorType[ValueErrorType["Function"] = 21] = "Function";
  ValueErrorType[ValueErrorType["IntegerExclusiveMaximum"] = 22] = "IntegerExclusiveMaximum";
  ValueErrorType[ValueErrorType["IntegerExclusiveMinimum"] = 23] = "IntegerExclusiveMinimum";
  ValueErrorType[ValueErrorType["IntegerMaximum"] = 24] = "IntegerMaximum";
  ValueErrorType[ValueErrorType["IntegerMinimum"] = 25] = "IntegerMinimum";
  ValueErrorType[ValueErrorType["IntegerMultipleOf"] = 26] = "IntegerMultipleOf";
  ValueErrorType[ValueErrorType["Integer"] = 27] = "Integer";
  ValueErrorType[ValueErrorType["IntersectUnevaluatedProperties"] = 28] = "IntersectUnevaluatedProperties";
  ValueErrorType[ValueErrorType["Intersect"] = 29] = "Intersect";
  ValueErrorType[ValueErrorType["Iterator"] = 30] = "Iterator";
  ValueErrorType[ValueErrorType["Kind"] = 31] = "Kind";
  ValueErrorType[ValueErrorType["Literal"] = 32] = "Literal";
  ValueErrorType[ValueErrorType["Never"] = 33] = "Never";
  ValueErrorType[ValueErrorType["Not"] = 34] = "Not";
  ValueErrorType[ValueErrorType["Null"] = 35] = "Null";
  ValueErrorType[ValueErrorType["NumberExclusiveMaximum"] = 36] = "NumberExclusiveMaximum";
  ValueErrorType[ValueErrorType["NumberExclusiveMinimum"] = 37] = "NumberExclusiveMinimum";
  ValueErrorType[ValueErrorType["NumberMaximum"] = 38] = "NumberMaximum";
  ValueErrorType[ValueErrorType["NumberMinimum"] = 39] = "NumberMinimum";
  ValueErrorType[ValueErrorType["NumberMultipleOf"] = 40] = "NumberMultipleOf";
  ValueErrorType[ValueErrorType["Number"] = 41] = "Number";
  ValueErrorType[ValueErrorType["ObjectAdditionalProperties"] = 42] = "ObjectAdditionalProperties";
  ValueErrorType[ValueErrorType["ObjectMaxProperties"] = 43] = "ObjectMaxProperties";
  ValueErrorType[ValueErrorType["ObjectMinProperties"] = 44] = "ObjectMinProperties";
  ValueErrorType[ValueErrorType["ObjectRequiredProperty"] = 45] = "ObjectRequiredProperty";
  ValueErrorType[ValueErrorType["Object"] = 46] = "Object";
  ValueErrorType[ValueErrorType["Promise"] = 47] = "Promise";
  ValueErrorType[ValueErrorType["RegExp"] = 48] = "RegExp";
  ValueErrorType[ValueErrorType["StringFormatUnknown"] = 49] = "StringFormatUnknown";
  ValueErrorType[ValueErrorType["StringFormat"] = 50] = "StringFormat";
  ValueErrorType[ValueErrorType["StringMaxLength"] = 51] = "StringMaxLength";
  ValueErrorType[ValueErrorType["StringMinLength"] = 52] = "StringMinLength";
  ValueErrorType[ValueErrorType["StringPattern"] = 53] = "StringPattern";
  ValueErrorType[ValueErrorType["String"] = 54] = "String";
  ValueErrorType[ValueErrorType["Symbol"] = 55] = "Symbol";
  ValueErrorType[ValueErrorType["TupleLength"] = 56] = "TupleLength";
  ValueErrorType[ValueErrorType["Tuple"] = 57] = "Tuple";
  ValueErrorType[ValueErrorType["Uint8ArrayMaxByteLength"] = 58] = "Uint8ArrayMaxByteLength";
  ValueErrorType[ValueErrorType["Uint8ArrayMinByteLength"] = 59] = "Uint8ArrayMinByteLength";
  ValueErrorType[ValueErrorType["Uint8Array"] = 60] = "Uint8Array";
  ValueErrorType[ValueErrorType["Undefined"] = 61] = "Undefined";
  ValueErrorType[ValueErrorType["Union"] = 62] = "Union";
  ValueErrorType[ValueErrorType["Void"] = 63] = "Void";
})(ValueErrorType || (ValueErrorType = {}));

class ValueErrorsUnknownTypeError extends TypeBoxError {
  constructor(schema) {
    super("Unknown type");
    this.schema = schema;
  }
}
function EscapeKey(key) {
  return key.replace(/~/g, "~0").replace(/\//g, "~1");
}
function IsDefined2(value) {
  return value !== undefined;
}

class ValueErrorIterator {
  constructor(iterator) {
    this.iterator = iterator;
  }
  [Symbol.iterator]() {
    return this.iterator;
  }
  First() {
    const next = this.iterator.next();
    return next.done ? undefined : next.value;
  }
}
function Create(errorType, schema, path, value, errors = []) {
  return {
    type: errorType,
    schema,
    path,
    value,
    message: GetErrorFunction()({ errorType, path, schema, value, errors }),
    errors
  };
}
function* FromAny3(schema, references, path, value) {}
function* FromArgument3(schema, references, path, value) {}
function* FromArray8(schema, references, path, value) {
  if (!IsArray2(value)) {
    return yield Create(ValueErrorType.Array, schema, path, value);
  }
  if (IsDefined2(schema.minItems) && !(value.length >= schema.minItems)) {
    yield Create(ValueErrorType.ArrayMinItems, schema, path, value);
  }
  if (IsDefined2(schema.maxItems) && !(value.length <= schema.maxItems)) {
    yield Create(ValueErrorType.ArrayMaxItems, schema, path, value);
  }
  for (let i = 0;i < value.length; i++) {
    yield* Visit6(schema.items, references, `${path}/${i}`, value[i]);
  }
  if (schema.uniqueItems === true && !function() {
    const set = new Set;
    for (const element of value) {
      const hashed = Hash(element);
      if (set.has(hashed)) {
        return false;
      } else {
        set.add(hashed);
      }
    }
    return true;
  }()) {
    yield Create(ValueErrorType.ArrayUniqueItems, schema, path, value);
  }
  if (!(IsDefined2(schema.contains) || IsDefined2(schema.minContains) || IsDefined2(schema.maxContains))) {
    return;
  }
  const containsSchema = IsDefined2(schema.contains) ? schema.contains : Never();
  const containsCount = value.reduce((acc, value, index) => Visit6(containsSchema, references, `${path}${index}`, value).next().done === true ? acc + 1 : acc, 0);
  if (containsCount === 0) {
    yield Create(ValueErrorType.ArrayContains, schema, path, value);
  }
  if (IsNumber2(schema.minContains) && containsCount < schema.minContains) {
    yield Create(ValueErrorType.ArrayMinContains, schema, path, value);
  }
  if (IsNumber2(schema.maxContains) && containsCount > schema.maxContains) {
    yield Create(ValueErrorType.ArrayMaxContains, schema, path, value);
  }
}
function* FromAsyncIterator5(schema, references, path, value) {
  if (!IsAsyncIterator2(value))
    yield Create(ValueErrorType.AsyncIterator, schema, path, value);
}
function* FromBigInt3(schema, references, path, value) {
  if (!IsBigInt2(value))
    return yield Create(ValueErrorType.BigInt, schema, path, value);
  if (IsDefined2(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    yield Create(ValueErrorType.BigIntExclusiveMaximum, schema, path, value);
  }
  if (IsDefined2(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    yield Create(ValueErrorType.BigIntExclusiveMinimum, schema, path, value);
  }
  if (IsDefined2(schema.maximum) && !(value <= schema.maximum)) {
    yield Create(ValueErrorType.BigIntMaximum, schema, path, value);
  }
  if (IsDefined2(schema.minimum) && !(value >= schema.minimum)) {
    yield Create(ValueErrorType.BigIntMinimum, schema, path, value);
  }
  if (IsDefined2(schema.multipleOf) && !(value % schema.multipleOf === BigInt(0))) {
    yield Create(ValueErrorType.BigIntMultipleOf, schema, path, value);
  }
}
function* FromBoolean3(schema, references, path, value) {
  if (!IsBoolean2(value))
    yield Create(ValueErrorType.Boolean, schema, path, value);
}
function* FromConstructor5(schema, references, path, value) {
  yield* Visit6(schema.returns, references, path, value.prototype);
}
function* FromDate3(schema, references, path, value) {
  if (!IsDate2(value))
    return yield Create(ValueErrorType.Date, schema, path, value);
  if (IsDefined2(schema.exclusiveMaximumTimestamp) && !(value.getTime() < schema.exclusiveMaximumTimestamp)) {
    yield Create(ValueErrorType.DateExclusiveMaximumTimestamp, schema, path, value);
  }
  if (IsDefined2(schema.exclusiveMinimumTimestamp) && !(value.getTime() > schema.exclusiveMinimumTimestamp)) {
    yield Create(ValueErrorType.DateExclusiveMinimumTimestamp, schema, path, value);
  }
  if (IsDefined2(schema.maximumTimestamp) && !(value.getTime() <= schema.maximumTimestamp)) {
    yield Create(ValueErrorType.DateMaximumTimestamp, schema, path, value);
  }
  if (IsDefined2(schema.minimumTimestamp) && !(value.getTime() >= schema.minimumTimestamp)) {
    yield Create(ValueErrorType.DateMinimumTimestamp, schema, path, value);
  }
  if (IsDefined2(schema.multipleOfTimestamp) && !(value.getTime() % schema.multipleOfTimestamp === 0)) {
    yield Create(ValueErrorType.DateMultipleOfTimestamp, schema, path, value);
  }
}
function* FromFunction5(schema, references, path, value) {
  if (!IsFunction2(value))
    yield Create(ValueErrorType.Function, schema, path, value);
}
function* FromImport2(schema, references, path, value) {
  const definitions = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  yield* Visit6(target, [...references, ...definitions], path, value);
}
function* FromInteger3(schema, references, path, value) {
  if (!IsInteger(value))
    return yield Create(ValueErrorType.Integer, schema, path, value);
  if (IsDefined2(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    yield Create(ValueErrorType.IntegerExclusiveMaximum, schema, path, value);
  }
  if (IsDefined2(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    yield Create(ValueErrorType.IntegerExclusiveMinimum, schema, path, value);
  }
  if (IsDefined2(schema.maximum) && !(value <= schema.maximum)) {
    yield Create(ValueErrorType.IntegerMaximum, schema, path, value);
  }
  if (IsDefined2(schema.minimum) && !(value >= schema.minimum)) {
    yield Create(ValueErrorType.IntegerMinimum, schema, path, value);
  }
  if (IsDefined2(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    yield Create(ValueErrorType.IntegerMultipleOf, schema, path, value);
  }
}
function* FromIntersect10(schema, references, path, value) {
  let hasError = false;
  for (const inner of schema.allOf) {
    for (const error of Visit6(inner, references, path, value)) {
      hasError = true;
      yield error;
    }
  }
  if (hasError) {
    return yield Create(ValueErrorType.Intersect, schema, path, value);
  }
  if (schema.unevaluatedProperties === false) {
    const keyCheck = new RegExp(KeyOfPattern(schema));
    for (const valueKey of Object.getOwnPropertyNames(value)) {
      if (!keyCheck.test(valueKey)) {
        yield Create(ValueErrorType.IntersectUnevaluatedProperties, schema, `${path}/${valueKey}`, value);
      }
    }
  }
  if (typeof schema.unevaluatedProperties === "object") {
    const keyCheck = new RegExp(KeyOfPattern(schema));
    for (const valueKey of Object.getOwnPropertyNames(value)) {
      if (!keyCheck.test(valueKey)) {
        const next = Visit6(schema.unevaluatedProperties, references, `${path}/${valueKey}`, value[valueKey]).next();
        if (!next.done)
          yield next.value;
      }
    }
  }
}
function* FromIterator5(schema, references, path, value) {
  if (!IsIterator2(value))
    yield Create(ValueErrorType.Iterator, schema, path, value);
}
function* FromLiteral4(schema, references, path, value) {
  if (!(value === schema.const))
    yield Create(ValueErrorType.Literal, schema, path, value);
}
function* FromNever3(schema, references, path, value) {
  yield Create(ValueErrorType.Never, schema, path, value);
}
function* FromNot3(schema, references, path, value) {
  if (Visit6(schema.not, references, path, value).next().done === true)
    yield Create(ValueErrorType.Not, schema, path, value);
}
function* FromNull3(schema, references, path, value) {
  if (!IsNull2(value))
    yield Create(ValueErrorType.Null, schema, path, value);
}
function* FromNumber3(schema, references, path, value) {
  if (!TypeSystemPolicy.IsNumberLike(value))
    return yield Create(ValueErrorType.Number, schema, path, value);
  if (IsDefined2(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    yield Create(ValueErrorType.NumberExclusiveMaximum, schema, path, value);
  }
  if (IsDefined2(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    yield Create(ValueErrorType.NumberExclusiveMinimum, schema, path, value);
  }
  if (IsDefined2(schema.maximum) && !(value <= schema.maximum)) {
    yield Create(ValueErrorType.NumberMaximum, schema, path, value);
  }
  if (IsDefined2(schema.minimum) && !(value >= schema.minimum)) {
    yield Create(ValueErrorType.NumberMinimum, schema, path, value);
  }
  if (IsDefined2(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    yield Create(ValueErrorType.NumberMultipleOf, schema, path, value);
  }
}
function* FromObject9(schema, references, path, value) {
  if (!TypeSystemPolicy.IsObjectLike(value))
    return yield Create(ValueErrorType.Object, schema, path, value);
  if (IsDefined2(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    yield Create(ValueErrorType.ObjectMinProperties, schema, path, value);
  }
  if (IsDefined2(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    yield Create(ValueErrorType.ObjectMaxProperties, schema, path, value);
  }
  const requiredKeys = Array.isArray(schema.required) ? schema.required : [];
  const knownKeys = Object.getOwnPropertyNames(schema.properties);
  const unknownKeys = Object.getOwnPropertyNames(value);
  for (const requiredKey of requiredKeys) {
    if (unknownKeys.includes(requiredKey))
      continue;
    yield Create(ValueErrorType.ObjectRequiredProperty, schema.properties[requiredKey], `${path}/${EscapeKey(requiredKey)}`, undefined);
  }
  if (schema.additionalProperties === false) {
    for (const valueKey of unknownKeys) {
      if (!knownKeys.includes(valueKey)) {
        yield Create(ValueErrorType.ObjectAdditionalProperties, schema, `${path}/${EscapeKey(valueKey)}`, value[valueKey]);
      }
    }
  }
  if (typeof schema.additionalProperties === "object") {
    for (const valueKey of unknownKeys) {
      if (knownKeys.includes(valueKey))
        continue;
      yield* Visit6(schema.additionalProperties, references, `${path}/${EscapeKey(valueKey)}`, value[valueKey]);
    }
  }
  for (const knownKey of knownKeys) {
    const property = schema.properties[knownKey];
    if (schema.required && schema.required.includes(knownKey)) {
      yield* Visit6(property, references, `${path}/${EscapeKey(knownKey)}`, value[knownKey]);
      if (ExtendsUndefinedCheck(schema) && !(knownKey in value)) {
        yield Create(ValueErrorType.ObjectRequiredProperty, property, `${path}/${EscapeKey(knownKey)}`, undefined);
      }
    } else {
      if (TypeSystemPolicy.IsExactOptionalProperty(value, knownKey)) {
        yield* Visit6(property, references, `${path}/${EscapeKey(knownKey)}`, value[knownKey]);
      }
    }
  }
}
function* FromPromise5(schema, references, path, value) {
  if (!IsPromise(value))
    yield Create(ValueErrorType.Promise, schema, path, value);
}
function* FromRecord5(schema, references, path, value) {
  if (!TypeSystemPolicy.IsRecordLike(value))
    return yield Create(ValueErrorType.Object, schema, path, value);
  if (IsDefined2(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    yield Create(ValueErrorType.ObjectMinProperties, schema, path, value);
  }
  if (IsDefined2(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    yield Create(ValueErrorType.ObjectMaxProperties, schema, path, value);
  }
  const [patternKey, patternSchema] = Object.entries(schema.patternProperties)[0];
  const regex = new RegExp(patternKey);
  for (const [propertyKey, propertyValue] of Object.entries(value)) {
    if (regex.test(propertyKey))
      yield* Visit6(patternSchema, references, `${path}/${EscapeKey(propertyKey)}`, propertyValue);
  }
  if (typeof schema.additionalProperties === "object") {
    for (const [propertyKey, propertyValue] of Object.entries(value)) {
      if (!regex.test(propertyKey))
        yield* Visit6(schema.additionalProperties, references, `${path}/${EscapeKey(propertyKey)}`, propertyValue);
    }
  }
  if (schema.additionalProperties === false) {
    for (const [propertyKey, propertyValue] of Object.entries(value)) {
      if (regex.test(propertyKey))
        continue;
      return yield Create(ValueErrorType.ObjectAdditionalProperties, schema, `${path}/${EscapeKey(propertyKey)}`, propertyValue);
    }
  }
}
function* FromRef6(schema, references, path, value) {
  yield* Visit6(Deref(schema, references), references, path, value);
}
function* FromRegExp3(schema, references, path, value) {
  if (!IsString2(value))
    return yield Create(ValueErrorType.String, schema, path, value);
  if (IsDefined2(schema.minLength) && !(value.length >= schema.minLength)) {
    yield Create(ValueErrorType.StringMinLength, schema, path, value);
  }
  if (IsDefined2(schema.maxLength) && !(value.length <= schema.maxLength)) {
    yield Create(ValueErrorType.StringMaxLength, schema, path, value);
  }
  const regex = new RegExp(schema.source, schema.flags);
  if (!regex.test(value)) {
    return yield Create(ValueErrorType.RegExp, schema, path, value);
  }
}
function* FromString3(schema, references, path, value) {
  if (!IsString2(value))
    return yield Create(ValueErrorType.String, schema, path, value);
  if (IsDefined2(schema.minLength) && !(value.length >= schema.minLength)) {
    yield Create(ValueErrorType.StringMinLength, schema, path, value);
  }
  if (IsDefined2(schema.maxLength) && !(value.length <= schema.maxLength)) {
    yield Create(ValueErrorType.StringMaxLength, schema, path, value);
  }
  if (IsString2(schema.pattern)) {
    const regex = new RegExp(schema.pattern);
    if (!regex.test(value)) {
      yield Create(ValueErrorType.StringPattern, schema, path, value);
    }
  }
  if (IsString2(schema.format)) {
    if (!Has(schema.format)) {
      yield Create(ValueErrorType.StringFormatUnknown, schema, path, value);
    } else {
      const format = Get(schema.format);
      if (!format(value)) {
        yield Create(ValueErrorType.StringFormat, schema, path, value);
      }
    }
  }
}
function* FromSymbol3(schema, references, path, value) {
  if (!IsSymbol2(value))
    yield Create(ValueErrorType.Symbol, schema, path, value);
}
function* FromTemplateLiteral5(schema, references, path, value) {
  if (!IsString2(value))
    return yield Create(ValueErrorType.String, schema, path, value);
  const regex = new RegExp(schema.pattern);
  if (!regex.test(value)) {
    yield Create(ValueErrorType.StringPattern, schema, path, value);
  }
}
function* FromThis2(schema, references, path, value) {
  yield* Visit6(Deref(schema, references), references, path, value);
}
function* FromTuple7(schema, references, path, value) {
  if (!IsArray2(value))
    return yield Create(ValueErrorType.Tuple, schema, path, value);
  if (schema.items === undefined && !(value.length === 0)) {
    return yield Create(ValueErrorType.TupleLength, schema, path, value);
  }
  if (!(value.length === schema.maxItems)) {
    return yield Create(ValueErrorType.TupleLength, schema, path, value);
  }
  if (!schema.items) {
    return;
  }
  for (let i = 0;i < schema.items.length; i++) {
    yield* Visit6(schema.items[i], references, `${path}/${i}`, value[i]);
  }
}
function* FromUndefined3(schema, references, path, value) {
  if (!IsUndefined2(value))
    yield Create(ValueErrorType.Undefined, schema, path, value);
}
function* FromUnion12(schema, references, path, value) {
  if (Check(schema, references, value))
    return;
  const errors = schema.anyOf.map((variant) => new ValueErrorIterator(Visit6(variant, references, path, value)));
  yield Create(ValueErrorType.Union, schema, path, value, errors);
}
function* FromUint8Array3(schema, references, path, value) {
  if (!IsUint8Array2(value))
    return yield Create(ValueErrorType.Uint8Array, schema, path, value);
  if (IsDefined2(schema.maxByteLength) && !(value.length <= schema.maxByteLength)) {
    yield Create(ValueErrorType.Uint8ArrayMaxByteLength, schema, path, value);
  }
  if (IsDefined2(schema.minByteLength) && !(value.length >= schema.minByteLength)) {
    yield Create(ValueErrorType.Uint8ArrayMinByteLength, schema, path, value);
  }
}
function* FromUnknown3(schema, references, path, value) {}
function* FromVoid3(schema, references, path, value) {
  if (!TypeSystemPolicy.IsVoidLike(value))
    yield Create(ValueErrorType.Void, schema, path, value);
}
function* FromKind2(schema, references, path, value) {
  const check = Get2(schema[Kind]);
  if (!check(schema, value))
    yield Create(ValueErrorType.Kind, schema, path, value);
}
function* Visit6(schema, references, path, value) {
  const references_ = IsDefined2(schema.$id) ? [...references, schema] : references;
  const schema_ = schema;
  switch (schema_[Kind]) {
    case "Any":
      return yield* FromAny3(schema_, references_, path, value);
    case "Argument":
      return yield* FromArgument3(schema_, references_, path, value);
    case "Array":
      return yield* FromArray8(schema_, references_, path, value);
    case "AsyncIterator":
      return yield* FromAsyncIterator5(schema_, references_, path, value);
    case "BigInt":
      return yield* FromBigInt3(schema_, references_, path, value);
    case "Boolean":
      return yield* FromBoolean3(schema_, references_, path, value);
    case "Constructor":
      return yield* FromConstructor5(schema_, references_, path, value);
    case "Date":
      return yield* FromDate3(schema_, references_, path, value);
    case "Function":
      return yield* FromFunction5(schema_, references_, path, value);
    case "Import":
      return yield* FromImport2(schema_, references_, path, value);
    case "Integer":
      return yield* FromInteger3(schema_, references_, path, value);
    case "Intersect":
      return yield* FromIntersect10(schema_, references_, path, value);
    case "Iterator":
      return yield* FromIterator5(schema_, references_, path, value);
    case "Literal":
      return yield* FromLiteral4(schema_, references_, path, value);
    case "Never":
      return yield* FromNever3(schema_, references_, path, value);
    case "Not":
      return yield* FromNot3(schema_, references_, path, value);
    case "Null":
      return yield* FromNull3(schema_, references_, path, value);
    case "Number":
      return yield* FromNumber3(schema_, references_, path, value);
    case "Object":
      return yield* FromObject9(schema_, references_, path, value);
    case "Promise":
      return yield* FromPromise5(schema_, references_, path, value);
    case "Record":
      return yield* FromRecord5(schema_, references_, path, value);
    case "Ref":
      return yield* FromRef6(schema_, references_, path, value);
    case "RegExp":
      return yield* FromRegExp3(schema_, references_, path, value);
    case "String":
      return yield* FromString3(schema_, references_, path, value);
    case "Symbol":
      return yield* FromSymbol3(schema_, references_, path, value);
    case "TemplateLiteral":
      return yield* FromTemplateLiteral5(schema_, references_, path, value);
    case "This":
      return yield* FromThis2(schema_, references_, path, value);
    case "Tuple":
      return yield* FromTuple7(schema_, references_, path, value);
    case "Undefined":
      return yield* FromUndefined3(schema_, references_, path, value);
    case "Union":
      return yield* FromUnion12(schema_, references_, path, value);
    case "Uint8Array":
      return yield* FromUint8Array3(schema_, references_, path, value);
    case "Unknown":
      return yield* FromUnknown3(schema_, references_, path, value);
    case "Void":
      return yield* FromVoid3(schema_, references_, path, value);
    default:
      if (!Has2(schema_[Kind]))
        throw new ValueErrorsUnknownTypeError(schema);
      return yield* FromKind2(schema_, references_, path, value);
  }
}
function Errors(...args) {
  const iterator = args.length === 3 ? Visit6(args[0], args[1], "", args[2]) : Visit6(args[0], [], "", args[1]);
  return new ValueErrorIterator(iterator);
}

// node_modules/@sinclair/typebox/build/esm/value/index.mjs
init_guard();
// src/result.ts
function ok(value) {
  return { ok: true, value };
}
function err(error) {
  return { ok: false, error };
}

// src/common/types.ts
function isAid(input) {
  return /^E[A-Za-z0-9_-]{43}$/.test(input);
}
var Qb64Schema = Type.String({
  minLength: 4,
  title: "CESR qb64",
  description: "qb64-encoded CESR value (AID/SAID/key/digest)",
  examples: ["EicpSaid...", "DBobKey...", "Esha3Digest..."]
});
var TimestampSchema = Type.String({
  pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,3})?Z$",
  title: "Timestamp (UTC)",
  description: "UTC ISO-8601 timestamp, e.g., 2025-11-04T16:20:00Z",
  examples: ["2025-11-04T16:20:00Z"]
});
var NonEmpty = (title, description, eg) => Type.String({
  minLength: 1,
  ...title ? { title } : {},
  ...description ? { description } : {},
  ...eg ? { examples: eg } : {}
});
function CesrType(title, format) {
  return Type.String({ title, description: title, format });
}
var KeriVersionPattern = "^KERI[0-9]{2}[A-Z]{4}[0-9a-f]{6}_$";
var VersionSchema = Type.String({
  title: "KERI Version",
  description: 'KERI version string with encoding + embedded size. Example: "KERI10JSON000156_"',
  pattern: KeriVersionPattern,
  examples: ["KERI10JSON000156_"]
});
var ThresholdExpressionPattern = "^[0-9a-fA-F]+$";
var ThresholdExpressionSchema = Type.String({
  title: "Threshold Expression",
  description: 'Number of signatures required, as a hex string. Examples: "1", "2", "a" (10).',
  pattern: ThresholdExpressionPattern,
  examples: ["1", "2", "a"]
});
var WeightedThresholdSchema = Type.Array(Type.Array(Type.String()), {
  title: "Weighted Threshold",
  description: 'Weighted threshold clauses with rational fractions. Each inner array is a clause. Example: [["1/2", "1/2"], ["1", "1"]]',
  examples: [
    [["1/2", "1/2"]],
    [
      ["1/2", "1/2"],
      ["1", "1"]
    ]
  ]
});
var FlatWeightedThresholdSchema = Type.Array(Type.String(), {
  title: "Flat Weighted Threshold",
  description: 'A single weighted clause, as keripy serialises it. Example: ["1/2", "1/2"]',
  examples: [["1/2", "1/2"]]
});
var ThresholdSchema = Type.Union([ThresholdExpressionSchema, WeightedThresholdSchema, FlatWeightedThresholdSchema], {
  title: "Threshold",
  description: "A hex M-of-N threshold (string), weighted clauses (array of arrays), or one flat weighted clause."
});
var Threshold;
((Threshold) => {
  const HEX = /^[0-9a-fA-F]+$/;
  const INT = /^[0-9]+$/;
  const RATIO = /^([0-9]+)\/([0-9]+)$/;
  function fail(kind, message) {
    return err({ kind, message });
  }
  function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
  }
  function parseHex(raw, field) {
    if (raw === "") {
      return fail("empty", `${field}: empty threshold`);
    } else if (raw.includes("/")) {
      return fail("bare-fraction", `${field}: "${raw}" is a bare fraction; fractions belong only in weighted lists`);
    } else if (!HEX.test(raw)) {
      return fail("malformed", `${field}: "${raw}" is not a hex number`);
    } else {
      return ok(Number.parseInt(raw, 16));
    }
  }
  function parseWeight(w) {
    if (typeof w !== "string") {
      return fail("malformed", `weight ${JSON.stringify(w)} is not a string`);
    } else if (INT.test(w)) {
      const n = Number.parseInt(w, 10);
      return n <= 1 ? ok({ numerator: n, denominator: 1 }) : fail("out-of-range", `weight "${w}" is not within [0, 1]`);
    } else {
      const match = RATIO.exec(w);
      if (match === null) {
        return fail("malformed", `weight "${w}" is not an integer or a ratio of integers`);
      } else {
        const numerator = Number.parseInt(match[1], 10);
        const denominator = Number.parseInt(match[2], 10);
        if (denominator === 0) {
          return fail("malformed", `weight "${w}" has a zero denominator`);
        } else if (numerator > denominator) {
          return fail("out-of-range", `weight "${w}" is not within [0, 1]`);
        } else {
          const g = gcd(numerator, denominator);
          return ok({ numerator: numerator / g, denominator: denominator / g });
        }
      }
    }
  }
  function add(a, b) {
    const numerator = a.numerator * b.denominator + b.numerator * a.denominator;
    const denominator = a.denominator * b.denominator;
    const g = gcd(numerator, denominator);
    return { numerator: numerator / g, denominator: denominator / g };
  }
  function sum(weights) {
    return weights.reduce(add, { numerator: 0, denominator: 1 });
  }
  function atLeastOne(f) {
    return f.numerator >= f.denominator;
  }
  function clausesOf(raw) {
    const nested = raw.filter((x) => Array.isArray(x)).length;
    if (nested === raw.length) {
      return ok(raw);
    } else if (nested === 0) {
      return ok([[...raw]]);
    } else {
      return fail("malformed", `weighted threshold mixes weights and clauses: ${JSON.stringify(raw)}`);
    }
  }
  function parseWeighted(raw, keyCount) {
    if (raw.length === 0) {
      return fail("empty", "empty weighted threshold");
    } else {
      const clausesResult = clausesOf(raw);
      if (!clausesResult.ok) {
        return clausesResult;
      } else {
        const clauses = [];
        for (const rawClause of clausesResult.value) {
          const clause = [];
          for (const w of rawClause) {
            const weight = parseWeight(w);
            if (!weight.ok) {
              return weight;
            } else {
              clause.push(weight.value);
            }
          }
          if (!atLeastOne(sum(clause))) {
            return fail("clause-under-one", `clause ${JSON.stringify(rawClause)} weighs less than 1`);
          } else {
            clauses.push(clause);
          }
        }
        const size = clauses.reduce((n, c) => n + c.length, 0);
        if (size > keyCount) {
          return fail("size-mismatch", `weighted threshold has ${size} weights for ${keyCount} keys`);
        } else {
          return ok({ kind: "weighted", clauses });
        }
      }
    }
  }
  function parse(raw, keyCount) {
    const value = raw;
    if (typeof value === "string") {
      const m = parseHex(value, "threshold");
      if (!m.ok) {
        return m;
      } else if (m.value > keyCount) {
        return fail("out-of-range", `threshold "${value}" (${m.value}) exceeds the key count ${keyCount}`);
      } else {
        return ok({ kind: "numeric", m: m.value });
      }
    } else if (Array.isArray(value)) {
      return parseWeighted(value, keyCount);
    } else {
      return fail("malformed", `threshold ${JSON.stringify(value)} is neither a hex string nor a weighted list`);
    }
  }
  Threshold.parse = parse;
  function witness(bt, witnessCount) {
    const value = bt;
    const m = typeof value === "string" ? parseHex(value, "bt") : fail("malformed", `bt ${JSON.stringify(value)} is not a hex string`);
    if (!m.ok) {
      return m;
    } else if (witnessCount > 0 && (m.value < 1 || m.value > witnessCount)) {
      return fail("out-of-range", `witness threshold ${m.value} is not within [1, ${witnessCount}] witnesses`);
    } else if (witnessCount === 0 && m.value !== 0) {
      return fail("out-of-range", `witness threshold ${m.value} with no witnesses (must be 0)`);
    } else {
      return ok(m.value);
    }
  }
  Threshold.witness = witness;
  function size(parsed) {
    if (parsed.kind === "numeric") {
      return parsed.m;
    } else if (parsed.kind === "weighted") {
      return parsed.clauses.reduce((n, c) => n + c.length, 0);
    } else {
      const unknown = parsed;
      throw new globalThis.Error(`Unknown threshold kind: ${JSON.stringify(unknown)}`);
    }
  }
  Threshold.size = size;
  function numeric(m) {
    if (!Number.isInteger(m) || m < 0) {
      throw new globalThis.Error(`Threshold.numeric: ${m} is not a non-negative integer`);
    } else {
      return m.toString(16);
    }
  }
  Threshold.numeric = numeric;
  function weighted(clauses) {
    return clauses.length === 1 ? [...clauses[0]] : clauses.map((c) => [...c]);
  }
  Threshold.weighted = weighted;
  function weightString(f) {
    return f.numerator === 0 ? "0" : f.numerator === f.denominator ? "1" : `${f.numerator}/${f.denominator}`;
  }
  function encode(parsed) {
    if (parsed.kind === "numeric") {
      return numeric(parsed.m);
    } else if (parsed.kind === "weighted") {
      return weighted(parsed.clauses.map((c) => c.map(weightString)));
    } else {
      const unknown = parsed;
      throw new globalThis.Error(`Unknown threshold kind: ${JSON.stringify(unknown)}`);
    }
  }
  Threshold.encode = encode;
  function canonical(raw, keyCount) {
    const parsed = parse(raw, keyCount);
    return parsed.ok ? encode(parsed.value) : raw;
  }
  Threshold.canonical = canonical;
  function satisfied(parsed, signedIndices) {
    const indices = new Set(signedIndices);
    if (parsed.kind === "numeric") {
      return parsed.m > 0 && indices.size >= parsed.m;
    } else if (parsed.kind === "weighted") {
      const total = size(parsed);
      if (indices.size === 0 || [...indices].some((i) => !Number.isInteger(i) || i < 0 || i >= total)) {
        return false;
      } else {
        let offset = 0;
        return parsed.clauses.every((clause) => {
          const signed = clause.filter((_, j) => indices.has(offset + j));
          offset += clause.length;
          return atLeastOne(sum(signed));
        });
      }
    } else {
      const unknown = parsed;
      throw new globalThis.Error(`Unknown threshold kind: ${JSON.stringify(unknown)}`);
    }
  }
  Threshold.satisfied = satisfied;
})(Threshold ||= {});
var SequenceNumber;
((SequenceNumber) => {
  const HEX = /^[0-9a-fA-F]+$/;
  function parse(s) {
    const value = s;
    if (typeof value !== "string" || !HEX.test(value)) {
      return err({ kind: "malformed", message: `sequence number ${JSON.stringify(value)} is not a hex string` });
    } else {
      const n = Number.parseInt(value, 16);
      return Number.isSafeInteger(n) ? ok(n) : err({ kind: "out-of-range", message: `sequence number "${value}" exceeds ${Number.MAX_SAFE_INTEGER}` });
    }
  }
  SequenceNumber.parse = parse;
  function of(s) {
    const n = parse(s);
    if (n.ok) {
      return n.value;
    } else {
      throw new globalThis.Error(`SequenceNumber.of: ${n.error.message}`);
    }
  }
  SequenceNumber.of = of;
  function encode(n) {
    if (Number.isSafeInteger(n) && n >= 0) {
      return n.toString(16);
    } else {
      throw new globalThis.Error(`SequenceNumber.encode: ${n} is not a non-negative integer`);
    }
  }
  SequenceNumber.encode = encode;
})(SequenceNumber ||= {});
var CesrKeyTransferableSchema = CesrType("CESR Public Key (transferable)", "qb64-key-transferable");
var CesrDigestSchema = CesrType("CESR Digest", "qb64-digest");
var CesrAidSchema = CesrType("CESR AID", "qb64");
var KeriPublicKeySchema = CesrType("KERI Public Key", "qb64-key");
var KeriPrivateKeySchema = Type.String({
  title: "Private Key (qb64)",
  description: "CESR qb64-encoded private key seed/material",
  minLength: 44,
  maxLength: 88,
  pattern: "^[A-Za-z0-9_-]{43,}$",
  examples: ["0AAc4d6eF7gH8iJ9kL0mN1oP2qR3sT4uV5wX6yZ7A8B9C0D"]
});
var KeyRefSchema = Type.Object({
  aid: CesrAidSchema,
  s: Type.String({
    title: "Sequence Number",
    description: "Key event sequence number where this key was established",
    examples: ["0", "1", "2"]
  }),
  kidx: Type.Integer({
    minimum: 0,
    title: "Key Index",
    description: "Index of the key within the event (for multi-key thresholds)",
    examples: [0, 1]
  }),
  d: Type.Optional(Type.String({
    title: "Event Digest",
    description: "Optional SAID of the key event for exact pinning",
    format: "qb64-digest"
  }))
}, {
  additionalProperties: false,
  title: "Key Reference",
  description: "KERI-native reference to a specific key in a controller KEL. Used to identify which key was used for encryption, enabling decryption after key rotation."
});
function keyRef(aid, s, kidx, d) {
  if (d !== undefined) {
    return { aid, s, kidx, d };
  }
  return { aid, s, kidx };
}
function keyRefEquals(a, b) {
  return a.aid === b.aid && a.s === b.s && a.kidx === b.kidx && a.d === b.d;
}
function parseEd25519PublicQb64(qb64) {
  if (!Check(KeriPublicKeySchema, qb64)) {
    throw new Error(`Invalid Ed25519 public key QB64: ${qb64}`);
  }
  if (!qb64.startsWith("D")) {
    throw new Error(`Invalid Ed25519 public key prefix: expected 'D', got '${qb64[0]}'`);
  }
  if (qb64.length !== 44) {
    throw new Error(`Invalid Ed25519 public key length: expected 44 chars, got ${qb64.length}`);
  }
  return qb64;
}
function parseEd25519PrivateQb64(qb64) {
  if (!Check(KeriPrivateKeySchema, qb64)) {
    throw new Error(`Invalid Ed25519 private key QB64: ${qb64}`);
  }
  return qb64;
}
function asEd25519PublicRaw(raw) {
  if (raw.length !== 32) {
    throw new Error(`Invalid Ed25519 public key length: expected 32 bytes, got ${raw.length}`);
  }
  return raw;
}
function asEd25519PrivateRaw(raw) {
  if (raw.length !== 32) {
    throw new Error(`Invalid Ed25519 private key length: expected 32 bytes, got ${raw.length}`);
  }
  return raw;
}
function parseSha256Hex(hex) {
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(`Invalid SHA-256 hex: expected 64 hex chars, got ${hex.length}`);
  }
  return hex.toLowerCase();
}
function parseBlake3Qb64Digest(qb64) {
  if (!Check(CesrDigestSchema, qb64)) {
    throw new Error(`Invalid Blake3-256 QB64: ${qb64}`);
  }
  if (!qb64.startsWith("E")) {
    throw new Error(`Invalid Blake3-256 QB64 prefix: expected 'E', got '${qb64[0]}'`);
  }
  return qb64;
}
function parseBlake3Hex(hex) {
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(`Invalid Blake3 hex: expected 64 hex chars, got ${hex.length}`);
  }
  return hex.toLowerCase();
}
function parseBlake3Qb64(qb64) {
  if (!Check(CesrDigestSchema, qb64)) {
    throw new Error(`Invalid Blake3 QB64: ${qb64}`);
  }
  return qb64;
}
function parseEd25519SignatureQb64(qb64) {
  if (!Check(CesrSignatureSchema, qb64)) {
    throw new Error(`Invalid Ed25519 signature QB64: ${qb64}`);
  }
  if (!qb64.startsWith("0B")) {
    throw new Error(`Invalid Ed25519 signature prefix: expected '0B', got '${qb64.substring(0, 2)}'`);
  }
  return qb64;
}
function parseAidQb64(qb64) {
  return qb64;
}
function parseSaidQb64(qb64) {
  return qb64;
}
var KeriKeyPairSchema = Type.Object({
  publicKey: KeriPublicKeySchema,
  privateKey: KeriPrivateKeySchema,
  transferable: Type.Boolean({ default: true }),
  algo: Type.Optional(Type.Union([Type.Literal("ed25519"), Type.Literal("x25519"), Type.Literal("bls12381"), Type.Literal("secp256k1")]))
});
function toEd25519KeyPairBranded(keyPair) {
  return {
    publicKey: parseEd25519PublicQb64(keyPair.publicKey),
    privateKey: parseEd25519PrivateQb64(keyPair.privateKey),
    transferable: keyPair.transferable,
    algo: keyPair.algo
  };
}
var CesrSignatureSchema = CesrType("CESR Signature", "qb64-signature");

// src/schema/types.ts
init_esm();
var ACDCVersionPattern = "^ACDC[0-9a-f]{2}[A-Z]{4}[0-9a-f]{6}_$";
var ACDCVersionSchema = Type.String({
  title: "ACDC Version",
  pattern: ACDCVersionPattern
});
var JSONSchemaSchema = Type.Object({
  $schema: Type.String(),
  $id: Type.Optional(Type.String()),
  title: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  type: Type.String(),
  properties: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  required: Type.Optional(Type.Array(Type.String())),
  additionalProperties: Type.Optional(Type.Boolean())
}, { additionalProperties: true });
var SchemaEdgeSchema = Type.Object({
  name: Type.String(),
  type: Type.Literal("ref"),
  target: CesrDigestSchema,
  path: Type.Optional(Type.String()),
  meaning: Type.Optional(Type.String())
}, { additionalProperties: false });
var ACDCSchemaSchema = Type.Object({
  v: ACDCVersionSchema,
  t: Type.Literal("sch"),
  d: CesrDigestSchema,
  s: Type.Record(Type.String(), Type.Unknown())
}, { additionalProperties: false });
var SchemaInfoSchema = Type.Object({
  said: CesrDigestSchema,
  title: Type.Optional(Type.String()),
  createdAt: Type.Optional(TimestampSchema)
}, { additionalProperties: false });

// src/acdc/types.ts
var ACDCCredentialSchema = Type.Object({
  v: ACDCVersionSchema,
  d: CesrDigestSchema,
  u: Type.Optional(Type.String()),
  i: CesrAidSchema,
  ri: Type.Optional(CesrDigestSchema),
  rd: Type.Optional(CesrDigestSchema),
  s: CesrDigestSchema,
  a: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  A: Type.Optional(Type.Array(CesrDigestSchema)),
  e: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  r: Type.Optional(Type.Record(Type.String(), Type.Unknown()))
}, { additionalProperties: false });
var ACDCProofSchema = Type.Object({
  t: NonEmpty("Proof Type"),
  i: CesrAidSchema,
  s: NonEmpty("Signature"),
  k: Type.Optional(NonEmpty("Key Reference")),
  dt: Type.Optional(TimestampSchema)
}, { additionalProperties: false });

// src/acdc/index.ts
var Acdc = {
  ...ACDCData,
  ...ACDCOps
};
// src/acl/is-allowed.ts
function isAllowed(target, subjectKey, lookupResolved) {
  if (!target)
    return false;
  if (target.kind === "any-authenticated")
    return true;
  const resolved = lookupResolved(target.nodeId);
  if (!resolved)
    return false;
  return resolved.keys.has(subjectKey);
}
// src/acl/normalize.ts
function canonicalAclRef(ref) {
  return canonical(ref);
}
function normalizeChildren(children) {
  const seen = new Set;
  const deduped = [];
  for (const c of children) {
    const key = canonicalAclRef(c);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(c);
    }
  }
  return deduped.sort((a, b) => canonicalAclRef(a).localeCompare(canonicalAclRef(b)));
}
function normalizeKeys(keys) {
  return [...new Set(keys)].sort();
}

// src/acl/said.ts
function computeNodeSAID(node) {
  const canonical = {
    nodeId: node.nodeId,
    children: normalizeChildren(node.children),
    ...node.mutators ? { mutators: node.mutators } : {},
    d: ""
  };
  return saidOf(canonical);
}
function computeResolvedNodeSAID(nodeSAID, keys) {
  const canonical = {
    nodeSAID,
    keys: normalizeKeys(keys),
    d: ""
  };
  return saidOf(canonical);
}

// src/acl/make-node.ts
function makeAclNode(nodeId, children, mutators = { kind: "any-authenticated" }) {
  const normalized = normalizeChildren(children);
  const partial = { nodeId, children: normalized, mutators };
  return { ...partial, d: computeNodeSAID(partial) };
}
// src/acl/namespace.ts
function ownerGroupId(aid) {
  return `aid:${aid}/__owner__`;
}
// src/acl/types.ts
var DEFAULT_RESOLUTION_LIMITS = {
  maxDepth: 8,
  maxChildrenPerNode: 256,
  maxExpandedKeys: 1024,
  maxTransitiveNodes: 64
};
var MAX_CASCADE_NODES = 32;

// src/acl/resolve.ts
function resolve(node, lookupNode, lookupAidKeys, limits, _visited, _depth, _nodeCount) {
  const lim = limits ?? DEFAULT_RESOLUTION_LIMITS;
  const depth = _depth ?? 0;
  const visited = _visited ?? new Set;
  const nodeCount = _nodeCount ?? { value: 0 };
  if (depth > lim.maxDepth) {
    return err({ kind: "node-too-deep", depth });
  }
  if (node.children.length > lim.maxChildrenPerNode) {
    return err({ kind: "node-too-large", nodeId: node.nodeId, count: node.children.length });
  }
  visited.add(node.nodeId);
  const keys = new Set;
  for (const child of node.children) {
    switch (child.kind) {
      case "key":
        keys.add(child.publicKey);
        break;
      case "aid": {
        for (const k of lookupAidKeys(child.aid))
          keys.add(k);
        break;
      }
      case "node": {
        if (visited.has(child.nodeId)) {
          return err({ kind: "cycle-detected", path: [...visited, child.nodeId] });
        }
        nodeCount.value++;
        if (nodeCount.value > lim.maxTransitiveNodes) {
          return err({
            kind: "resolution-limit-exceeded",
            reason: `transitive node count exceeded limit of ${lim.maxTransitiveNodes}`
          });
        }
        const nested = lookupNode(child.nodeId);
        if (!nested) {
          return err({ kind: "node-not-found", nodeId: child.nodeId });
        }
        const result = resolve(nested, lookupNode, lookupAidKeys, lim, new Set(visited), depth + 1, nodeCount);
        if (!result.ok)
          return result;
        for (const k of result.value)
          keys.add(k);
        break;
      }
      default: {
        const _exhaustive = child;
        return err({
          kind: "resolution-limit-exceeded",
          reason: `unsupported acl ref: ${JSON.stringify(_exhaustive)}`
        });
      }
    }
  }
  if (keys.size > lim.maxExpandedKeys) {
    return err({
      kind: "resolution-limit-exceeded",
      reason: `expanded key count ${keys.size} exceeded limit of ${lim.maxExpandedKeys}`
    });
  }
  return ok(keys);
}
// src/acl/access-controls.ts
function slotKeysSaid(keys) {
  return saidOf({ keys: normalizeKeys(keys), d: "" });
}
function accessControlsTip(ac) {
  return saidOf({
    read: slotKeysSaid(ac.read.keys),
    write: slotKeysSaid(ac.write.keys),
    admin: slotKeysSaid(ac.admin.keys),
    d: ""
  });
}
function withTip(ac) {
  return { ...ac, tip: accessControlsTip(ac) };
}
function slotOf(tree, system, op, expandAid) {
  const nodeId = tree.privileges[system]?.[op];
  if (!nodeId)
    return err({ kind: "privilege-not-found", system, op });
  const node = tree.nodes[nodeId];
  if (!node)
    return err({ kind: "resolution-error", reason: `node-not-found:${nodeId}` });
  const keys = resolve(node, (id) => tree.nodes[id], expandAid);
  if (!keys.ok)
    return err({ kind: "resolution-error", reason: keys.error.kind });
  return ok({
    keys: normalizeKeys([...keys.value]),
    version: node.d
  });
}
function projectAccessControls(tree, system, expandAid = () => []) {
  const read = slotOf(tree, system, "read", expandAid);
  if (!read.ok)
    return read;
  const write = slotOf(tree, system, "write", expandAid);
  if (!write.ok)
    return write;
  const admin = slotOf(tree, system, "admin", expandAid);
  if (!admin.ok)
    return admin;
  return ok(withTip({ read: read.value, write: write.value, admin: admin.value }));
}

// src/acl/snapshot.ts
function isKeyUse(p) {
  return p === "sign" || p === "enc";
}
function validateKeys(purpose, keys) {
  const out = [];
  for (const key of keys) {
    try {
      const decoded = decodeKey(key);
      if (decoded.algo !== "ed25519") {
        return err({ kind: "invalid-key", key, reason: `unsupported algo ${decoded.algo} for ${purpose}` });
      }
      out.push(key);
    } catch (e) {
      return err({
        kind: "invalid-key",
        key,
        reason: e instanceof Error ? e.message : String(e)
      });
    }
  }
  return ok(normalizeKeys(out));
}
function computeHash(purpose, keys) {
  return saidOf({ purpose, keys, d: "" });
}
function freezeSnapshot(purpose, keys, hash) {
  return Object.freeze({
    purpose,
    keys: Object.freeze([...keys]),
    hash
  });
}
function snapshotOf(purpose, keys) {
  if (!isKeyUse(purpose)) {
    throw new Error(`invalid snapshot purpose: ${purpose}`);
  }
  const validated = validateKeys(purpose, keys);
  if (!validated.ok) {
    throw new Error(`invalid snapshot key: ${validated.error.kind} ${JSON.stringify(validated.error)}`);
  }
  const hash = computeHash(purpose, validated.value);
  return freezeSnapshot(purpose, validated.value, hash);
}
function importSnapshot(raw) {
  if (!isKeyUse(raw.purpose)) {
    return err({ kind: "invalid-purpose", purpose: raw.purpose });
  }
  const validated = validateKeys(raw.purpose, raw.keys);
  if (!validated.ok)
    return validated;
  const hash = computeHash(raw.purpose, validated.value);
  if (raw.hash !== undefined && raw.hash !== hash) {
    return err({
      kind: "snapshot-hash-mismatch",
      expected: hash,
      provided: raw.hash
    });
  }
  return ok(freezeSnapshot(raw.purpose, validated.value, hash));
}

// src/acl/acl.ts
function empty() {
  return { nodes: {}, privileges: {} };
}
function node(id, children) {
  return makeAclNode(id, children);
}
function putNode(tree, n) {
  return {
    nodes: { ...tree.nodes, [n.nodeId]: n },
    privileges: tree.privileges
  };
}
function setChildren(tree, nodeId, children) {
  return putNode(tree, makeAclNode(nodeId, children));
}
function setPrivilege(tree, system, op, nodeId) {
  const prev = tree.privileges[system] ?? {};
  return {
    nodes: tree.nodes,
    privileges: {
      ...tree.privileges,
      [system]: { ...prev, [op]: nodeId }
    }
  };
}
function resolve2(tree, nodeId, expandAid = () => []) {
  const root = tree.nodes[nodeId];
  if (!root) {
    return err({ kind: "node-not-found", nodeId });
  }
  return resolve(root, (id) => tree.nodes[id], expandAid);
}
function snapshot(tree, system, op, purpose, expandAid) {
  const nodeId = tree.privileges[system]?.[op];
  if (!nodeId) {
    return err({ kind: "privilege-not-found", system, op });
  }
  const keys = resolve2(tree, nodeId, expandAid);
  if (!keys.ok)
    return keys;
  try {
    return ok(snapshotOf(purpose, keys.value));
  } catch (e) {
    return err({
      kind: "resolution-limit-exceeded",
      reason: e instanceof Error ? e.message : String(e)
    });
  }
}

class AclOps {
  tree;
  constructor(tree) {
    this.tree = tree;
  }
  putNode(n) {
    return putNode(this.tree, n);
  }
  setChildren(nodeId, children) {
    return setChildren(this.tree, nodeId, children);
  }
  setPrivilege(system, op, nodeId) {
    return setPrivilege(this.tree, system, op, nodeId);
  }
  resolve(nodeId, expandAid = () => []) {
    return resolve2(this.tree, nodeId, expandAid);
  }
  snapshot(system, op, purpose, expandAid) {
    return snapshot(this.tree, system, op, purpose, expandAid);
  }
  accessControls(system, expandAid = () => []) {
    return projectAccessControls(this.tree, system, expandAid);
  }
}
function fromTree(tree) {
  return new AclOps(tree);
}
var Acl = {
  empty,
  node,
  fromTree,
  putNode,
  setChildren,
  setPrivilege,
  resolve: resolve2,
  snapshot
};

// node_modules/@noble/hashes/hkdf.js
var HKDF_COUNTER = /* @__PURE__ */ Uint8Array.of(0);
var EMPTY_BUFFER = /* @__PURE__ */ Uint8Array.of();
function expand(hash, prk, info, length = 32, _recycled) {
  ahash(hash);
  anumber(length, "length");
  abytes(prk, undefined, "prk");
  const olen = hash.outputLen;
  if (prk.length < olen)
    throw new Error('"prk" must be at least HashLen octets');
  if (length > 255 * olen)
    throw new Error("Length must be <= 255*HashLen");
  const blocks = Math.ceil(length / olen);
  if (info === undefined)
    info = EMPTY_BUFFER;
  else
    abytes(info, undefined, "info");
  if (!blocks) {
    if (_recycled)
      clean(prk);
    return new Uint8Array;
  }
  const okm = _recycled && blocks === 1 ? prk : new Uint8Array(blocks * olen);
  const { iHash, oHash } = hmac.create(hash, prk);
  const T = _recycled ? prk : new Uint8Array(olen);
  const worker = blocks > 1 ? _recycled?.iHash || hash.create() : undefined;
  for (let counter = 0;counter < blocks - 1; counter++) {
    HKDF_COUNTER[0] = counter + 1;
    const iWork = iHash._cloneInto(worker);
    if (counter)
      iWork.update(T);
    iWork.update(info).update(HKDF_COUNTER).digestInto(T);
    oHash._cloneInto(worker).update(T).digestInto(T);
    okm.set(T, olen * counter);
  }
  HKDF_COUNTER[0] = blocks;
  if (blocks > 1)
    iHash.update(T);
  iHash.update(info).update(HKDF_COUNTER).digestInto(T);
  oHash.update(T).digestInto(T);
  okm.set(T, olen * (blocks - 1));
  iHash.destroy();
  oHash.destroy();
  worker?.destroy();
  if (T !== okm)
    clean(T);
  clean(HKDF_COUNTER);
  if (length === okm.length)
    return okm;
  const res = okm.slice(0, length);
  clean(okm);
  return res;
}
var hkdf = (hash, ikm, salt, info, length) => {
  ahash(hash);
  if (salt === undefined)
    salt = new Uint8Array(hash.outputLen);
  const HMAC = hmac.create(hash, salt).update(ikm);
  return expand(hash, HMAC.digest(), info, length, HMAC);
};

// src/crypto/hkdf.ts
function hkdfBlake3(ikm, salt, info, length) {
  return hkdf(blake3, ikm, salt, info, length);
}

// src/crypto/x25519.ts
function ed25519ToX25519Private(ed25519PrivateKey) {
  if (ed25519PrivateKey.length !== 32) {
    throw new Error(`Invalid Ed25519 private key length: expected 32 bytes, got ${ed25519PrivateKey.length}`);
  }
  return ed25519.utils.toMontgomerySecret(ed25519PrivateKey);
}
function ed25519ToX25519Public(ed25519PublicKey) {
  if (ed25519PublicKey.length !== 32) {
    throw new Error(`Invalid Ed25519 public key length: expected 32 bytes, got ${ed25519PublicKey.length}`);
  }
  return ed25519.utils.toMontgomery(ed25519PublicKey);
}
function deriveSharedSecret(ourX25519PrivateKey, theirX25519PublicKey) {
  return x25519.getSharedSecret(ourX25519PrivateKey, theirX25519PublicKey);
}

// src/signature/key-agreement.ts
var MAX_HKDF_DERIVE_LENGTH = 64;

// src/signature/signers.ts
var Signers;
((Signers) => {
  function fromKeyPair(keypair) {
    return {
      publicKey: keypair.publicKey,
      algo: "ed25519",
      async getX25519PublicKey() {
        const publicKeyBytes = decodeKey(keypair.publicKey).raw;
        return ed25519.utils.toMontgomery(publicKeyBytes);
      },
      async deriveX25519HkdfBlake3Key(input) {
        if (input.peerPublicKey.length !== 32) {
          throw new Error(`Invalid peerPublicKey length: expected 32 bytes, got ${input.peerPublicKey.length}`);
        }
        if (input.length < 1 || input.length > MAX_HKDF_DERIVE_LENGTH) {
          throw new Error(`Invalid derive length: must be 1-${MAX_HKDF_DERIVE_LENGTH}, got ${input.length}`);
        }
        const privateKeyBytes = decodeKey(keypair.privateKey).raw;
        const x25519PrivateKey = ed25519ToX25519Private(privateKeyBytes);
        const sharedSecret = deriveSharedSecret(x25519PrivateKey, input.peerPublicKey);
        return hkdfBlake3(sharedSecret, input.salt, input.info, input.length);
      },
      async exists(publicKey) {
        return keypair.publicKey === publicKey;
      },
      async signBytes(data) {
        const privateKeyBytes = decodeKey(keypair.privateKey).raw;
        const signatureBytes = ed25519.sign(data, privateKeyBytes);
        const transferable = keypair.transferable ?? true;
        return encodeSig(signatureBytes, transferable).qb64;
      },
      async signSaid(said) {
        const saidBytes = new TextEncoder().encode(said);
        return this.signBytes(saidBytes);
      }
    };
  }
  Signers.fromKeyPair = fromKeyPair;
  function verify2(publicKey, signature, data) {
    return verify(publicKey, signature, data);
  }
  Signers.verify = verify2;
})(Signers ||= {});

// src/acl/signed-message.ts
var ACL_MSG_V1 = "kerits-acl-msg/1";
function canonicalSignedAclBytes(fields) {
  const obj = {
    aclHash: fields.aclHash,
    expiresAt: fields.expiresAt,
    messageId: fields.messageId,
    operation: fields.operation,
    payloadDigest: fields.payloadDigest,
    signerPublicKey: fields.signerPublicKey,
    system: fields.system,
    v: fields.v
  };
  if (fields.readHash !== undefined) {
    obj.readHash = fields.readHash;
  }
  return new TextEncoder().encode(canonical(obj));
}
function aclPayloadOf(accessControls) {
  return new TextEncoder().encode(canonical(accessControls));
}
function payloadDigestOf(payload) {
  return Data.digest(payload);
}
async function signAclMessage(input, payload, keyPair) {
  const signer = Signers.fromKeyPair(keyPair);
  return signAclMessageWithSigner(input, payload, {
    publicKey: input.signerPublicKey,
    signBytes: (data) => signer.signBytes(data)
  });
}
async function signAclMessageWithSigner(input, payload, signer) {
  const payloadDigest = payloadDigestOf(payload);
  const fields = {
    v: ACL_MSG_V1,
    system: input.system,
    operation: input.operation,
    aclHash: input.aclHash,
    ...input.readHash !== undefined ? { readHash: input.readHash } : {},
    payloadDigest,
    messageId: input.messageId,
    expiresAt: input.expiresAt,
    signerPublicKey: signer.publicKey
  };
  const signature = await signer.signBytes(canonicalSignedAclBytes(fields));
  return { ...fields, payload, signature };
}
function verifyAclMessageSignature(msg) {
  if (msg.v !== ACL_MSG_V1)
    return false;
  const digest = payloadDigestOf(msg.payload);
  if (digest !== msg.payloadDigest)
    return false;
  const fields = {
    v: msg.v,
    system: msg.system,
    operation: msg.operation,
    aclHash: msg.aclHash,
    ...msg.readHash !== undefined ? { readHash: msg.readHash } : {},
    payloadDigest: msg.payloadDigest,
    messageId: msg.messageId,
    expiresAt: msg.expiresAt,
    signerPublicKey: msg.signerPublicKey
  };
  return Signers.verify(msg.signerPublicKey, msg.signature, canonicalSignedAclBytes(fields));
}

// src/acl/check.ts
function verifyDigestAndSig(msg, verify) {
  if (payloadDigestOf(msg.payload) !== msg.payloadDigest) {
    return err({ kind: "digest-mismatch" });
  }
  if (!verify(msg)) {
    return err({ kind: "signature-invalid" });
  }
  return ok(undefined);
}
function checkExpiry(msg, now) {
  if (now >= msg.expiresAt)
    return err({ kind: "expired" });
  return ok(undefined);
}
function checkAgainstAccessControlInner(ac, msg, opts, verify) {
  const exp = checkExpiry(msg, opts.now);
  if (!exp.ok)
    return exp;
  const dig = verifyDigestAndSig(msg, verify);
  if (!dig.ok)
    return dig;
  if (msg.aclHash !== ac.version) {
    return err({
      kind: "acl-hash-mismatch",
      expected: ac.version,
      provided: msg.aclHash
    });
  }
  if (!ac.keys.includes(msg.signerPublicKey)) {
    return err({ kind: "signer-not-in-snapshot" });
  }
  return ok(undefined);
}
function isValid2(ac, msg, opts) {
  return checkAgainstAccessControlInner(ac, msg, opts, verifyAclMessageSignature);
}
function isValidRotation(ac, msg, next, opts) {
  return isValid2(ac, { ...msg, payload: aclPayloadOf(next) }, opts);
}
function checkAgainstAccessControl(ac, msg, opts) {
  return isValid2(ac, msg, opts);
}
function isValidWithVerify(ac, msg, opts, verify) {
  return checkAgainstAccessControlInner(ac, msg, opts, verify);
}
function checkAgainstSnapshotInner(snapshot, msg, opts, verify) {
  const exp = checkExpiry(msg, opts.now);
  if (!exp.ok)
    return exp;
  const dig = verifyDigestAndSig(msg, verify);
  if (!dig.ok)
    return dig;
  if (msg.aclHash !== snapshot.hash) {
    return err({
      kind: "acl-hash-mismatch",
      expected: snapshot.hash,
      provided: msg.aclHash
    });
  }
  if (!snapshot.keys.includes(msg.signerPublicKey)) {
    return err({ kind: "signer-not-in-snapshot" });
  }
  return ok(undefined);
}
function checkAgainstSnapshot(snapshot, msg, opts) {
  return checkAgainstSnapshotInner(snapshot, msg, opts, verifyAclMessageSignature);
}
function checkAgainstSnapshotWithVerify(snapshot, msg, opts, verify) {
  return checkAgainstSnapshotInner(snapshot, msg, opts, verify);
}
function check2(tree, msg, opts) {
  return checkWithVerify(tree, msg, opts, verifyAclMessageSignature);
}
function checkWithVerify(tree, msg, opts, verify) {
  const nodeId = tree.privileges[msg.system]?.[msg.operation];
  if (!nodeId) {
    return err({ kind: "privilege-not-found", system: msg.system, op: msg.operation });
  }
  const node = tree.nodes[nodeId];
  if (!node)
    return err({ kind: "snapshot-error", reason: `node-not-found:${nodeId}` });
  const keys = Acl.resolve(tree, nodeId);
  if (!keys.ok)
    return err({ kind: "snapshot-error", reason: keys.error.kind });
  const ac = {
    keys: [...keys.value],
    version: node.d
  };
  return isValidWithVerify(ac, msg, opts, verify);
}
function parseAdminPatch(payload) {
  try {
    const text = new TextDecoder().decode(payload);
    const json = JSON.parse(text);
    if (json === null || typeof json !== "object") {
      return err({ kind: "invalid-admin-payload", reason: "not an object" });
    }
    return ok(json);
  } catch (e) {
    return err({
      kind: "invalid-admin-payload",
      reason: e instanceof Error ? e.message : String(e)
    });
  }
}
function applyAdmin(tree, msg, opts) {
  if (msg.operation !== "admin") {
    return err({ kind: "invalid-admin-payload", reason: "operation must be admin" });
  }
  const checked = check2(tree, msg, opts);
  if (!checked.ok)
    return checked;
  const patch = parseAdminPatch(msg.payload);
  if (!patch.ok)
    return patch;
  let next = tree;
  for (const n of patch.value.putNodes ?? []) {
    next = Acl.putNode(next, Acl.node(n.nodeId, n.children));
  }
  for (const p of patch.value.privileges ?? []) {
    next = Acl.setPrivilege(next, p.system, p.op, p.nodeId);
  }
  return ok(next);
}

// src/acl/index.ts
var AclWithCheck = {
  ...Acl,
  check: check2,
  isValid: isValid2,
  isValidRotation,
  isValidWithVerify,
  checkAgainstAccessControl,
  checkAgainstSnapshot,
  checkAgainstSnapshotWithVerify,
  checkWithVerify,
  applyAdmin
};
// src/common/base64url.ts
function encodeBase64Url(bytes) {
  let binary = "";
  for (let i = 0;i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function decodeBase64Url(base64url) {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - base64.length % 4) % 4);
  const b64 = base64 + padding;
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0;i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// src/kel/event-crypto.ts
function selectSurface(ilk) {
  switch (ilk) {
    case "icp":
      return KEL_ICP_SURFACE;
    case "rot":
      return KEL_ROT_SURFACE;
    case "ixn":
      return KEL_IXN_SURFACE;
    case "dip":
      return KEL_DIP_SURFACE;
    case "drt":
      return KEL_DRT_SURFACE;
    default:
      throw new Error(`canonicalizeEvent: unknown ilk '${ilk}'`);
  }
}
function canonicalizeEvent(event) {
  const surface = selectSurface(event.t);
  const { raw } = serializeForSigning(event, surface);
  return raw;
}
function verifyEventSignature(event, publicKey, signature) {
  return verify(publicKey, signature, canonicalizeEvent(event));
}

// node_modules/cesr-ts/src/counter.ts
class CounterCodex extends Codex {
  ControllerIdxSigs = "-A";
  WitnessIdxSigs = "-B";
  NonTransReceiptCouples = "-C";
  TransReceiptQuadruples = "-D";
  FirstSeenReplayCouples = "-E";
  TransIdxSigGroups = "-F";
  SealSourceCouples = "-G";
  TransLastIdxSigGroups = "-H";
  SealSourceTriples = "-I";
  SadPathSig = "-J";
  SadPathSigGroup = "-K";
  PathedMaterialQuadlets = "-L";
  AttachedMaterialQuadlets = "-V";
  BigAttachedMaterialQuadlets = "-0V";
  KERIProtocolStack = "--AAA";
}
var CtrDex = new CounterCodex;

class Counter {
  static Sizes = new Map(Object.entries({
    "-A": new Sizage(2, 2, 4, 0),
    "-B": new Sizage(2, 2, 4, 0),
    "-C": new Sizage(2, 2, 4, 0),
    "-D": new Sizage(2, 2, 4, 0),
    "-E": new Sizage(2, 2, 4, 0),
    "-F": new Sizage(2, 2, 4, 0),
    "-G": new Sizage(2, 2, 4, 0),
    "-H": new Sizage(2, 2, 4, 0),
    "-I": new Sizage(2, 2, 4, 0),
    "-J": new Sizage(2, 2, 4, 0),
    "-K": new Sizage(2, 2, 4, 0),
    "-L": new Sizage(2, 2, 4, 0),
    "-V": new Sizage(2, 2, 4, 0),
    "-0V": new Sizage(3, 5, 8, 0),
    "--AAA": new Sizage(5, 3, 8, 0)
  }));
  static Hards = new Map([
    ["-A", 2],
    ["-B", 2],
    ["-C", 2],
    ["-D", 2],
    ["-E", 2],
    ["-F", 2],
    ["-G", 2],
    ["-H", 2],
    ["-I", 2],
    ["-J", 2],
    ["-K", 2],
    ["-L", 2],
    ["-M", 2],
    ["-N", 2],
    ["-O", 2],
    ["-P", 2],
    ["-Q", 2],
    ["-R", 2],
    ["-S", 2],
    ["-T", 2],
    ["-U", 2],
    ["-V", 2],
    ["-W", 2],
    ["-X", 2],
    ["-Y", 2],
    ["-Z", 2],
    ["-a", 2],
    ["-b", 2],
    ["-c", 2],
    ["-d", 2],
    ["-e", 2],
    ["-f", 2],
    ["-g", 2],
    ["-h", 2],
    ["-i", 2],
    ["-j", 2],
    ["-k", 2],
    ["-l", 2],
    ["-m", 2],
    ["-n", 2],
    ["-o", 2],
    ["-p", 2],
    ["-q", 2],
    ["-r", 2],
    ["-s", 2],
    ["-t", 2],
    ["-u", 2],
    ["-v", 2],
    ["-w", 2],
    ["-x", 2],
    ["-y", 2],
    ["-z", 2],
    ["-0", 3],
    ["--", 5]
  ]);
  _code = "";
  _count = -1;
  constructor({ code, count, countB64, qb64b, qb64, qb2 }) {
    if (code != null) {
      if (!Counter.Sizes.has(code)) {
        throw new Error(`"Unsupported code=${code}.`);
      }
      const sizage = Counter.Sizes.get(code);
      const cs = sizage.hs + sizage.ss;
      if (sizage.fs != cs || cs % 4 != 0) {
        throw new Error(`Whole code size not full size or not multiple of 4. cs=${cs} fs=${sizage.fs}.`);
      }
      if (count == undefined) {
        count = countB64 == undefined ? 1 : b64ToInt(countB64);
      }
      if (count < 0 || count > 64 ** sizage.ss - 1) {
        throw new Error(`Invalid count=${count} for code=${code}.`);
      }
      this._code = code;
      this._count = count;
    } else if (qb64b != null) {
      const qb64 = d(qb64b);
      this._exfil(qb64);
    } else if (qb64 != null) {
      this._exfil(qb64);
    } else if (qb2 != null) {} else {
      throw new Error(`Improper initialization need either (code and count) or qb64b or qb64 or qb2.`);
    }
  }
  get code() {
    return this._code;
  }
  get count() {
    return this._count;
  }
  get qb64() {
    return this._infil();
  }
  get qb64b() {
    return b(this.qb64);
  }
  countToB64(l) {
    if (l == undefined) {
      const sizage = Counter.Sizes.get(this.code);
      l = sizage.ss;
    }
    return intToB64(this.count, l);
  }
  static semVerToB64(version = "", major = 0, minor = 0, patch = 0) {
    let parts = [major, minor, patch];
    if (version != "") {
      const ssplits = version.split(".");
      const splits = ssplits.map((x) => {
        if (x == "")
          return 0;
        return parseInt(x);
      });
      const off = splits.length;
      const x = 3 - off;
      for (let i = 0;i < x; i++) {
        splits.push(parts[i + off]);
      }
      parts = splits;
    }
    parts.forEach((p) => {
      if (p < 0 || p > 63) {
        throw new Error(`Out of bounds semantic version. Part=${p} is < 0 or > 63.`);
      }
    });
    return parts.map((p) => {
      return intToB64(p, 1);
    }).join("");
  }
  _infil() {
    const code = this.code;
    const count = this.count;
    const sizage = Counter.Sizes.get(code);
    const cs = sizage.hs + sizage.ss;
    if (sizage.fs != cs || cs % 4 != 0) {
      throw new Error(`Whole code size not full size or not multiple of 4. cs=${cs} fs=${sizage.fs}.`);
    }
    if (count < 0 || count > 64 ** sizage.ss - 1) {
      throw new Error(`Invalid count=${count} for code=${code}.`);
    }
    const both = `${code}${intToB64(count, sizage.ss)}`;
    if (both.length % 4) {
      throw new Error(`Invalid size = ${both.length} of ${both} not a multiple of 4.`);
    }
    return both;
  }
  _exfil(qb64) {
    if (qb64.length == 0) {
      throw new Error("Empty Material");
    }
    const first = qb64.slice(0, 2);
    if (!Counter.Hards.has(first)) {
      throw new Error(`Unexpected code ${first}`);
    }
    const hs = Counter.Hards.get(first);
    if (qb64.length < hs) {
      throw new Error(`Need ${hs - qb64.length} more characters.`);
    }
    const hard = qb64.slice(0, hs);
    if (!Counter.Sizes.has(hard)) {
      throw new Error(`Unsupported code ${hard}`);
    }
    const sizage = Counter.Sizes.get(hard);
    const cs = sizage.hs + sizage.ss;
    if (qb64.length < cs) {
      throw new Error(`Need ${cs - qb64.length} more chars.`);
    }
    const scount = qb64.slice(sizage.hs, sizage.hs + sizage.ss);
    const count = b64ToInt(scount);
    this._code = hard;
    this._count = count;
  }
}

// node_modules/cesr-ts/src/indexer.ts
import { Buffer as Buffer2 } from "buffer";

class IndexerCodex {
  Ed25519_Sig = "A";
  Ed25519_Crt_Sig = "B";
  ECDSA_256k1_Sig = "C";
  ECDSA_256k1_Crt_Sig = "D";
  ECDSA_256r1_Sig = "E";
  ECDSA_256r1_Crt_Sig = "F";
  Ed448_Sig = "0A";
  Ed448_Crt_Sig = "0B";
  Ed25519_Big_Sig = "2A";
  Ed25519_Big_Crt_Sig = "2B";
  ECDSA_256k1_Big_Sig = "2C";
  ECDSA_256k1_Big_Crt_Sig = "2D";
  ECDSA_256r1_Big_Sig = "2E";
  ECDSA_256r1_Big_Crt_Sig = "2F";
  Ed448_Big_Sig = "3A";
  Ed448_Big_Crt_Sig = "3B";
}
var IdrDex = new IndexerCodex;

class IndexedSigCodex {
  Ed25519_Sig = "A";
  Ed25519_Crt_Sig = "B";
  ECDSA_256k1_Sig = "C";
  ECDSA_256k1_Crt_Sig = "D";
  ECDSA_256r1_Sig = "E";
  ECDSA_256r1_Crt_Sig = "F";
  Ed448_Sig = "0A";
  Ed448_Crt_Sig = "0B";
  Ed25519_Big_Sig = "2A";
  Ed25519_Big_Crt_Sig = "2B";
  ECDSA_256k1_Big_Sig = "2C";
  ECDSA_256k1_Big_Crt_Sig = "2D";
  ECDSA_256r1_Big_Sig = "2E";
  ECDSA_256r1_Big_Crt_Sig = "2F";
  Ed448_Big_Sig = "3A";
  Ed448_Big_Crt_Sig = "3B";
  has(prop) {
    const m = new Map(Array.from(Object.entries(this), (v) => [v[1], v[0]]));
    return m.has(prop);
  }
}
var IdxSigDex = new IndexedSigCodex;

class IndexedCurrentSigCodex {
  Ed25519_Crt_Sig = "B";
  ECDSA_256k1_Crt_Sig = "D";
  ECDSA_256r1_Crt_Sig = "F";
  Ed448_Crt_Sig = "0B";
  Ed25519_Big_Crt_Sig = "2B";
  ECDSA_256k1_Big_Crt_Sig = "2D";
  ECDSA_256r1_Big_Crt_Sig = "2F";
  Ed448_Big_Crt_Sig = "3B";
  has(prop) {
    const m = new Map(Array.from(Object.entries(this), (v) => [v[1], v[0]]));
    return m.has(prop);
  }
}
var IdxCrtSigDex = new IndexedCurrentSigCodex;

class IndexedBothSigCodex {
  Ed25519_Sig = "A";
  ECDSA_256k1_Sig = "C";
  Ed448_Sig = "0A";
  Ed25519_Big_Sig = "2A";
  ECDSA_256k1_Big_Sig = "2C";
  Ed448_Big_Sig = "3A";
  has(prop) {
    const m = new Map(Array.from(Object.entries(this), (v) => [v[1], v[0]]));
    return m.has(prop);
  }
}
var IdxBthSigDex = new IndexedBothSigCodex;

class Xizage {
  hs;
  ss;
  os;
  fs;
  ls;
  constructor(hs, ss, os, fs, ls) {
    this.hs = hs;
    this.ss = ss;
    this.os = os;
    this.fs = fs;
    this.ls = ls;
  }
}

class Indexer {
  Codex = IdrDex;
  static Hards = new Map([
    ["A", 1],
    ["B", 1],
    ["C", 1],
    ["D", 1],
    ["E", 1],
    ["F", 1],
    ["G", 1],
    ["H", 1],
    ["I", 1],
    ["J", 1],
    ["K", 1],
    ["L", 1],
    ["M", 1],
    ["N", 1],
    ["O", 1],
    ["P", 1],
    ["Q", 1],
    ["R", 1],
    ["S", 1],
    ["T", 1],
    ["U", 1],
    ["V", 1],
    ["W", 1],
    ["X", 1],
    ["Y", 1],
    ["Z", 1],
    ["a", 1],
    ["b", 1],
    ["c", 1],
    ["d", 1],
    ["e", 1],
    ["f", 1],
    ["g", 1],
    ["h", 1],
    ["i", 1],
    ["j", 1],
    ["k", 1],
    ["l", 1],
    ["m", 1],
    ["n", 1],
    ["o", 1],
    ["p", 1],
    ["q", 1],
    ["r", 1],
    ["s", 1],
    ["t", 1],
    ["u", 1],
    ["v", 1],
    ["w", 1],
    ["x", 1],
    ["y", 1],
    ["z", 1],
    ["0", 2],
    ["1", 2],
    ["2", 2],
    ["3", 2],
    ["4", 2]
  ]);
  static Sizes = new Map(Object.entries({
    A: new Xizage(1, 1, 0, 88, 0),
    B: new Xizage(1, 1, 0, 88, 0),
    C: new Xizage(1, 1, 0, 88, 0),
    D: new Xizage(1, 1, 0, 88, 0),
    E: new Xizage(1, 1, 0, 88, 0),
    F: new Xizage(1, 1, 0, 88, 0),
    "0A": new Xizage(2, 2, 1, 156, 0),
    "0B": new Xizage(2, 2, 1, 156, 0),
    "2A": new Xizage(2, 4, 2, 92, 0),
    "2B": new Xizage(2, 4, 2, 92, 0),
    "2C": new Xizage(2, 4, 2, 92, 0),
    "2D": new Xizage(2, 4, 2, 92, 0),
    "2E": new Xizage(2, 4, 2, 92, 0),
    "2F": new Xizage(2, 4, 2, 92, 0),
    "3A": new Xizage(2, 6, 3, 160, 0),
    "3B": new Xizage(2, 6, 3, 160, 0),
    "0z": new Xizage(2, 2, 0, undefined, 0),
    "1z": new Xizage(2, 2, 1, 76, 1),
    "4z": new Xizage(2, 6, 3, 80, 1)
  }));
  _code = "";
  _index = -1;
  _ondex;
  _raw = new Uint8Array(0);
  constructor({
    raw = undefined,
    code = IdrDex.Ed25519_Sig,
    index = 0,
    ondex = undefined,
    qb64b = undefined,
    qb64 = undefined,
    qb2 = undefined
  }) {
    if (raw != null) {
      if (code == undefined) {
        throw new EmptyMaterialError(`Improper initialization need either (raw and code) or qb64b or qb64 or qb2.`);
      }
      if (!Indexer.Sizes.has(code)) {
        throw new Error(`Unsupported code=${code}.`);
      }
      const xizage = Indexer.Sizes.get(code);
      const os = xizage.os;
      const fs = xizage.fs;
      const cs = xizage.hs + xizage.ss;
      const ms = xizage.ss - xizage.os;
      if (!Number.isInteger(index) || index < 0 || index > 64 ** ms - 1) {
        throw new Error(`Invalid index=${index} for code=${code}.`);
      }
      if (ondex != null && xizage.os != 0 && !(ondex >= 0 && ondex <= 64 ** os - 1)) {
        throw new Error(`Invalid ondex=${ondex} for code=${code}.`);
      }
      if (IdxCrtSigDex.has(code) && ondex != null) {
        throw new Error(`Non None ondex=${ondex} for code=${code}.`);
      }
      if (IdxBthSigDex.has(code)) {
        if (ondex == undefined) {
          ondex = index;
        } else {
          if (ondex != index && os == 0) {
            throw new Error(`Non matching ondex=${ondex} and index=${index} for code=${code}.`);
          }
        }
      }
      if (fs == undefined) {
        throw new Error("variable length unsupported");
      }
      const rawsize = Math.floor((fs - cs) * 3 / 4);
      raw = raw.slice(0, rawsize);
      if (raw.length != rawsize) {
        throw new Error(`Not enougth raw bytes for code=${code} and index=${index} ,expected ${rawsize} got ${raw.length}.`);
      }
      this._code = code;
      this._index = index;
      this._ondex = ondex;
      this._raw = raw;
    } else if (qb64b != null) {
      const qb64 = d(qb64b);
      this._exfil(qb64);
    } else if (qb64 != null) {
      this._exfil(qb64);
    } else if (qb2 != null) {
      this._bexfil(qb2);
    } else {
      throw new EmptyMaterialError(`Improper initialization need either (raw and code and index) or qb64b or qb64 or qb2.`);
    }
  }
  _bexfil(qb2) {
    throw new Error(`qb2 not yet supported: ${qb2}`);
  }
  static _rawSize(code) {
    const xizage = Indexer.Sizes.get(code);
    return Math.floor(xizage.fs - (xizage.hs + xizage.ss) * 3 / 4);
  }
  get code() {
    return this._code;
  }
  get raw() {
    return this._raw;
  }
  get index() {
    return this._index;
  }
  get ondex() {
    return this._ondex;
  }
  get qb64() {
    return this._infil();
  }
  get qb64b() {
    return b(this.qb64);
  }
  _infil() {
    const code = this.code;
    const index = this.index;
    const ondex = this.ondex;
    const raw = this.raw;
    const ps = (3 - raw.length % 3) % 3;
    const xizage = Indexer.Sizes.get(code);
    const cs = xizage.hs + xizage.ss;
    const ms = xizage.ss - xizage.os;
    if (index < 0 || index > 64 ** ms - 1) {
      throw new Error(`Invalid index=${index} for code=${code}.`);
    }
    if (ondex != null && xizage.os != 0 && !(ondex >= 0 && ondex <= 64 ** xizage.os - 1)) {
      throw new Error(`Invalid ondex=${ondex} for os=${xizage.os} and code=${code}.`);
    }
    const both = `${code}${intToB64(index, ms)}${intToB64(ondex == undefined ? 0 : ondex, xizage.os)}`;
    if (both.length != cs) {
      throw new Error(`Mismatch code size = ${cs} with table = ${both.length}.`);
    }
    if (cs % 4 != ps - xizage.ls) {
      throw new Error(`Invalid code=${both} for converted raw pad size=${ps}.`);
    }
    const bytes = new Uint8Array(ps + raw.length);
    for (let i = 0;i < ps; i++) {
      bytes[i] = 0;
    }
    for (let i = 0;i < raw.length; i++) {
      const odx = i + ps;
      bytes[odx] = raw[i];
    }
    const full = both + Buffer2.from(bytes).toString("base64url").slice(ps - xizage.ls);
    if (full.length != xizage.fs) {
      throw new Error(`Invalid code=${both} for raw size=${raw.length}.`);
    }
    return full;
  }
  _exfil(qb64) {
    if (qb64.length == 0) {
      throw new Error("Empty Material");
    }
    const first = qb64[0];
    if (!Array.from(Indexer.Hards.keys()).includes(first)) {
      throw new Error(`Unexpected code ${first}`);
    }
    const hs = Indexer.Hards.get(first);
    if (qb64.length < hs) {
      throw new Error(`Need ${hs - qb64.length} more characters.`);
    }
    const hard = qb64.slice(0, hs);
    if (!Array.from(Indexer.Sizes.keys()).includes(hard)) {
      throw new Error(`Unsupported code ${hard}`);
    }
    const xizage = Indexer.Sizes.get(hard);
    const cs = xizage.hs + xizage.ss;
    const ms = xizage.ss - xizage.os;
    if (qb64.length < cs) {
      throw new Error(`Need ${cs - qb64.length} more characters.`);
    }
    const sindex = qb64.slice(hs, hs + ms);
    const index = b64ToInt(sindex);
    const sondex = qb64.slice(hs + ms, hs + ms + xizage.os);
    let ondex;
    if (IdxCrtSigDex.has(hard)) {
      ondex = xizage.os != 0 ? b64ToInt(sondex) : undefined;
      if (ondex != 0 && ondex != null) {
        throw new Error(`Invalid ondex=${ondex} for code=${hard}.`);
      } else {
        ondex = undefined;
      }
    } else {
      ondex = xizage.os != 0 ? b64ToInt(sondex) : index;
    }
    if (xizage.fs == undefined) {
      throw new Error("variable length not supported");
    }
    if (qb64.length < xizage.fs) {
      throw new Error(`Need ${xizage.fs - qb64.length} more chars.`);
    }
    qb64 = qb64.slice(0, xizage.fs);
    const ps = cs % 4;
    const pbs = 2 * ps != 0 ? ps : xizage.ls;
    let raw;
    if (ps != 0) {
      const base = new Array(ps + 1).join("A") + qb64.slice(cs);
      const paw = Buffer2.from(base, "base64url");
      const pi = readInt(paw.slice(0, ps));
      if (pi & 2 ** pbs - 1) {
        throw new Error(`Non zeroed prepad bits = {pi & (2 ** pbs - 1 ):<06b} in {qb64b[cs:cs+1]}.`);
      }
      raw = paw.slice(ps);
    } else {
      const base = qb64.slice(cs);
      const paw = Buffer2.from(base, "base64url");
      const li = readInt(paw.slice(0, xizage.ls));
      if (li != 0) {
        if (li == 1) {
          throw new Error(`Non zeroed lead byte = 0x{li:02x}.`);
        } else {
          throw new Error(`Non zeroed lead bytes = 0x{li:04x}`);
        }
      }
      raw = paw.slice(xizage.ls);
    }
    if (raw.length != Math.floor((qb64.length - cs) * 3 / 4)) {
      throw new Error(`Improperly qualified material = ${qb64}`);
    }
    this._code = hard;
    this._index = index;
    this._ondex = ondex;
    this._raw = new Uint8Array(raw);
  }
}

// node_modules/cesr-ts/src/siger.ts
class Siger extends Indexer {
  _verfer;
  constructor({ raw, code, index, ondex, qb64, qb64b, qb2 }, verfer) {
    super({ raw, code, index, ondex, qb64, qb64b, qb2 });
    if (!IdxSigDex.has(this.code)) {
      throw new Error(`Invalid code = ${this.code} for Siger.`);
    }
    this._verfer = verfer;
  }
  get verfer() {
    return this._verfer;
  }
  set verfer(verfer) {
    this._verfer = verfer;
  }
}

// src/cesr/attachments.ts
var textEncoder = new TextEncoder;
function encodeAttachmentGroups(attachments) {
  if (attachments.length === 0)
    return new Uint8Array(0);
  const indexedSigs = [];
  const receiptCouples = [];
  const transReceiptQuads = [];
  const sealSourceCouples = [];
  for (const att of attachments) {
    if (att.kind === "sig" && att.form === "indexed") {
      indexedSigs.push(att);
    } else if (att.kind === "wig") {
      throw new Error("wig attachments are not encoded; convert to rct");
    } else if (att.kind === "rct") {
      receiptCouples.push(att);
    } else if (att.kind === "vrc") {
      transReceiptQuads.push(att);
    } else if (att.kind === "delegator-seal-source") {
      sealSourceCouples.push(att);
    } else {
      throw new Error(`Unsupported attachment type for encoding: kind=${att.kind}${"form" in att ? `, form=${att.form}` : ""}`);
    }
  }
  let result = "";
  if (indexedSigs.length > 0) {
    const counter = new Counter({
      code: CtrDex.ControllerIdxSigs,
      count: indexedSigs.length
    });
    result += counter.qb64;
    for (const att of indexedSigs) {
      result += encodeIndexedSig(att);
    }
  }
  if (receiptCouples.length > 0) {
    const counter = new Counter({
      code: CtrDex.NonTransReceiptCouples,
      count: receiptCouples.length
    });
    result += counter.qb64;
    for (const att of receiptCouples) {
      result += encodeReceiptCouple(att);
    }
  }
  if (transReceiptQuads.length > 0) {
    const counter = new Counter({
      code: CtrDex.TransReceiptQuadruples,
      count: transReceiptQuads.length
    });
    result += counter.qb64;
    for (const att of transReceiptQuads) {
      result += encodeTransReceiptQuadruple(att);
    }
  }
  if (sealSourceCouples.length > 0) {
    const counter = new Counter({
      code: CtrDex.SealSourceCouples,
      count: sealSourceCouples.length
    });
    result += counter.qb64;
    for (const att of sealSourceCouples) {
      result += encodeSealSourceCouple(att);
    }
  }
  return textEncoder.encode(result);
}
var byteChars = (bytes) => {
  let out = "";
  for (let i = 0;i < bytes.length; i += 32768)
    out += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return out;
};
var OPEN_BRACE = 123;
function decodeAttachmentGroupsFromStream(data) {
  if (data.length === 0)
    return { attachments: [], bytesConsumed: 0 };
  const nextBody = data.indexOf(OPEN_BRACE);
  const text = byteChars(nextBody === -1 ? data : data.subarray(0, nextBody));
  const attachments = [];
  let pos = 0;
  while (pos < text.length) {
    const remaining = text.slice(pos);
    if (remaining[0] !== "-")
      break;
    let counter;
    try {
      counter = new Counter({ qb64: remaining });
    } catch (e) {
      throw new Error(`Truncated or malformed CESR counter at position ${pos}: ${e instanceof Error ? e.message : String(e)}`);
    }
    const counterSize = getCounterSize(counter.code);
    pos += counterSize;
    if (counter.code === CtrDex.ControllerIdxSigs || counter.code === CtrDex.WitnessIdxSigs) {
      const isWitness = counter.code === CtrDex.WitnessIdxSigs;
      for (let i = 0;i < counter.count; i++) {
        if (pos >= text.length) {
          throw new Error(`Truncated: expected ${counter.count} indexed sigs, got ${i}`);
        }
        const { attachment, consumed } = decodeIndexedSig(text, pos, isWitness);
        attachments.push(attachment);
        pos += consumed;
      }
    } else if (counter.code === CtrDex.NonTransReceiptCouples) {
      for (let i = 0;i < counter.count; i++) {
        if (pos >= text.length) {
          throw new Error(`Truncated: expected ${counter.count} receipt couples, got ${i}`);
        }
        const { attachment, consumed } = decodeReceiptCouple(text, pos);
        attachments.push(attachment);
        pos += consumed;
      }
    } else if (counter.code === CtrDex.TransReceiptQuadruples) {
      for (let i = 0;i < counter.count; i++) {
        if (pos >= text.length) {
          throw new Error(`Truncated: expected ${counter.count} receipt quadruples, got ${i}`);
        }
        const { attachment, consumed } = decodeTransReceiptQuadruple(text, pos);
        attachments.push(attachment);
        pos += consumed;
      }
    } else if (counter.code === CtrDex.SealSourceCouples) {
      for (let i = 0;i < counter.count; i++) {
        if (pos >= text.length) {
          throw new Error(`Truncated: expected ${counter.count} seal-source couples, got ${i}`);
        }
        const { attachment, consumed } = decodeSealSourceCouple(text, pos);
        attachments.push(attachment);
        pos += consumed;
      }
    } else {
      throw new Error(`Unsupported counter code: ${counter.code}`);
    }
  }
  return { attachments, bytesConsumed: pos };
}
function decodeAttachmentGroups(data) {
  const { attachments, bytesConsumed } = decodeAttachmentGroupsFromStream(data);
  if (bytesConsumed < data.length) {
    throw new Error(`Failed to parse counter at position ${bytesConsumed}: ` + `unexpected trailing bytes (${data.length - bytesConsumed} bytes remaining)`);
  }
  return attachments;
}
function getCounterSize(code) {
  const sizage = Counter.Sizes.get(code);
  if (!sizage || sizage.fs === undefined) {
    throw new Error(`Unknown counter code: ${code}`);
  }
  return sizage.fs;
}
function decodeIndexedSig(text, pos, witness = false) {
  let siger;
  try {
    siger = new Siger({ qb64: text.slice(pos) });
  } catch (e) {
    throw new Error(`Failed to parse indexed signature at position ${pos}: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (!ED25519_SIGER_CODES.has(siger.code)) {
    throw new Error(`Unsupported indexer code: ${siger.code}. Only Ed25519 indexed signatures are supported.`);
  }
  const sigMatter = new Matter({ raw: siger.raw, code: MtrDex.Ed25519_Sig });
  const sizage = Siger.Sizes.get(siger.code);
  if (!sizage || sizage.fs === undefined) {
    throw new Error(`Cannot determine size for indexer code: ${siger.code}`);
  }
  const ondex = siger.ondex;
  const attachment = witness ? { kind: "wig", keyIndex: siger.index, sig: sigMatter.qb64 } : ondex === undefined ? { kind: "sig", form: "indexed", keyIndex: siger.index, sig: sigMatter.qb64 } : { kind: "sig", form: "indexed", keyIndex: siger.index, ondex, sig: sigMatter.qb64 };
  return {
    attachment,
    consumed: sizage.fs
  };
}
var ED25519_SIGER_CODES = new Set([
  IdrDex.Ed25519_Sig,
  IdrDex.Ed25519_Big_Sig,
  IdrDex.Ed25519_Crt_Sig,
  IdrDex.Ed25519_Big_Crt_Sig
]);
function encodeEd25519Siger(raw, index, ondex) {
  if (ondex === undefined) {
    const code = index < 64 ? IdrDex.Ed25519_Crt_Sig : IdrDex.Ed25519_Big_Crt_Sig;
    return new Siger({ raw, code, index }).qb64;
  } else if (!Number.isInteger(ondex) || ondex < 0) {
    throw new Error(`Invalid ondex: must be a non-negative integer, got ${ondex}`);
  } else if (ondex === index && index < 64) {
    return new Siger({ raw, code: IdrDex.Ed25519_Sig, index, ondex }).qb64;
  } else {
    return new Siger({ raw, code: IdrDex.Ed25519_Big_Sig, index, ondex }).qb64;
  }
}
function encodeIndexedSig(att) {
  const { keyIndex, ondex, sig } = att;
  if (keyIndex === undefined || keyIndex === null) {
    throw new Error("keyIndex is required for indexed signatures");
  }
  if (typeof keyIndex === "string") {
    throw new Error("String keyIndex (qb64-encoded) is not supported in this implementation");
  }
  if (typeof keyIndex !== "number" || !Number.isInteger(keyIndex) || keyIndex < 0) {
    throw new Error(`Invalid keyIndex: must be a non-negative integer, got ${keyIndex}`);
  }
  const matter = new Matter({ qb64: sig });
  if (matter.code !== MtrDex.Ed25519_Sig) {
    throw new Error(`Only Ed25519 signatures are supported, got Matter code: ${matter.code}`);
  }
  return encodeEd25519Siger(matter.raw, keyIndex, ondex);
}
function encodeReceiptCouple(att) {
  return att.by + att.sig;
}
function encodeTransReceiptQuadruple(att) {
  const { seal, sig, keyIndex } = att;
  const prefixQb64 = seal.i;
  const snNum = SequenceNumber.of(seal.s);
  const raw = new Uint8Array(16);
  const view = new DataView(raw.buffer);
  view.setUint32(12, snNum, false);
  const seqnerQb64 = new Matter({ raw, code: "0A" }).qb64;
  const digestQb64 = seal.d;
  const sigMatter = new Matter({ qb64: sig });
  if (sigMatter.code !== MtrDex.Ed25519_Sig) {
    throw new Error(`Only Ed25519 signatures are supported for -D quadruples, got: ${sigMatter.code}`);
  }
  const idx = keyIndex ?? 0;
  return prefixQb64 + seqnerQb64 + digestQb64 + encodeEd25519Siger(sigMatter.raw, idx, idx);
}
function decodeTransReceiptQuadruple(text, pos) {
  let totalConsumed = 0;
  const prefix = parseMatter(text, pos, "receipt quadruple prefix");
  totalConsumed += prefix.consumed;
  const seqner = parseMatter(text, pos + totalConsumed, "receipt quadruple seqner");
  totalConsumed += seqner.consumed;
  const seqnerRaw = seqner.matter.raw;
  let sn = 0;
  for (let b = 0;b < seqnerRaw.byteLength; b++) {
    sn = sn * 256 + (seqnerRaw[b] ?? 0);
  }
  const digest = parseMatter(text, pos + totalConsumed, "receipt quadruple digest");
  totalConsumed += digest.consumed;
  const sigerSlice = text.slice(pos + totalConsumed);
  const siger = new Siger({ qb64: sigerSlice });
  const sigerSizage = Siger.Sizes.get(siger.code);
  if (!sigerSizage || sigerSizage.fs === undefined) {
    throw new Error(`Cannot determine size for siger code: ${siger.code}`);
  }
  totalConsumed += sigerSizage.fs;
  const sigMatter = new Matter({ raw: siger.raw, code: MtrDex.Ed25519_Sig });
  return {
    attachment: {
      kind: "vrc",
      seal: {
        i: prefix.matter.qb64,
        s: SequenceNumber.encode(sn),
        d: digest.matter.qb64
      },
      sig: sigMatter.qb64,
      keyIndex: siger.index
    },
    consumed: totalConsumed
  };
}
function parseMatter(text, pos, label) {
  let matter;
  try {
    matter = new Matter({ qb64: text.slice(pos) });
  } catch (e) {
    throw new Error(`Failed to parse ${label} at position ${pos}: ${e instanceof Error ? e.message : String(e)}`);
  }
  const sizage = Matter.Sizes.get(matter.code);
  if (!sizage || sizage.fs === undefined) {
    throw new Error(`Cannot determine size for ${label} code: ${matter.code}`);
  }
  return { matter, consumed: sizage.fs };
}
function decodeReceiptCouple(text, pos) {
  const prefix = parseMatter(text, pos, "receipt couple prefix");
  const sig = parseMatter(text, pos + prefix.consumed, "receipt couple signature");
  return {
    attachment: {
      kind: "rct",
      by: prefix.matter.qb64,
      sig: sig.matter.qb64
    },
    consumed: prefix.consumed + sig.consumed
  };
}
function encodeSealSourceCouple(att) {
  const snNum = SequenceNumber.of(att.s);
  const raw = new Uint8Array(16);
  const view = new DataView(raw.buffer);
  view.setUint32(12, snNum, false);
  const seqnerQb64 = new Matter({ raw, code: "0A" }).qb64;
  return seqnerQb64 + att.d;
}
function decodeSealSourceCouple(text, pos) {
  const seqner = parseMatter(text, pos, "seal-source couple seqner");
  const seqnerRaw = seqner.matter.raw;
  let sn = 0;
  for (let b = 0;b < seqnerRaw.byteLength; b++) {
    sn = sn * 256 + (seqnerRaw[b] ?? 0);
  }
  const digest = parseMatter(text, pos + seqner.consumed, "seal-source couple digest");
  return {
    attachment: {
      kind: "delegator-seal-source",
      s: SequenceNumber.encode(sn),
      d: digest.matter.qb64
    },
    consumed: seqner.consumed + digest.consumed
  };
}

// src/cesr/event-codec.ts
var textDecoder = new TextDecoder;
var OPEN_BRACE2 = 123;
var CLOSE_BRACE = 125;
var QUOTE = 34;
var BACKSLASH = 92;
function encodeCesrEvent(event) {
  const bodyBytes = event.bytesB64 ? decodeBase64Url(event.bytesB64) : canonicalizeEvent(event.event);
  const attachmentBytes = encodeAttachmentGroups(event.attachments);
  if (attachmentBytes.length === 0) {
    return bodyBytes;
  }
  const combined = new Uint8Array(bodyBytes.length + attachmentBytes.length);
  combined.set(bodyBytes);
  combined.set(attachmentBytes, bodyBytes.length);
  return combined;
}
function decodeCesrEventFromStream(data) {
  if (data.length === 0) {
    throw new Error("Cannot decode empty CESR event bytes");
  }
  const bodyByteLength = findJsonObjectEnd(data);
  const bodyBytes = data.subarray(0, bodyByteLength);
  let event;
  try {
    event = JSON.parse(textDecoder.decode(bodyBytes));
  } catch (e) {
    throw new Error(`Failed to decode CESR event: ${e instanceof Error ? e.message : String(e)}`);
  }
  const bytesB64 = encodeBase64Url(bodyBytes);
  const trailingBytes = data.subarray(bodyByteLength);
  const { attachments, bytesConsumed: attachmentBytesConsumed } = decodeAttachmentGroupsFromStream(trailingBytes);
  return {
    event: { event, attachments: [...attachments], bytesB64, enc: "JSON" },
    bytesConsumed: bodyByteLength + attachmentBytesConsumed
  };
}
function decodeCesrEvent(data) {
  const { event, bytesConsumed } = decodeCesrEventFromStream(data);
  if (bytesConsumed < data.length) {
    throw new Error(`Unexpected trailing bytes: ${data.length - bytesConsumed} bytes after event`);
  }
  return event;
}
function findJsonObjectEnd(data) {
  if (data[0] !== OPEN_BRACE2) {
    throw new Error("CESR event bytes do not start with JSON object");
  }
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = 0;i < data.length; i++) {
    const b = data[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (b === BACKSLASH && inString) {
      escaped = true;
      continue;
    }
    if (b === QUOTE) {
      inString = !inString;
      continue;
    }
    if (inString)
      continue;
    if (b === OPEN_BRACE2)
      depth++;
    else if (b === CLOSE_BRACE) {
      depth--;
      if (depth === 0)
        return i + 1;
    }
  }
  return data.length;
}
function encodeCesrStream(events) {
  if (events.length === 0)
    return new Uint8Array(0);
  const chunks = [];
  let totalLength = 0;
  for (const event of events) {
    const bytes = encodeCesrEvent(event);
    chunks.push(bytes);
    totalLength += bytes.length;
  }
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
function decodeCesrStream(data) {
  if (data.length === 0)
    return [];
  const events = [];
  let pos = 0;
  while (pos < data.length) {
    const { event, bytesConsumed } = decodeCesrEventFromStream(data.subarray(pos));
    events.push(event);
    pos += bytesConsumed;
  }
  return events;
}
// src/cesr/prefix.ts
function inspect(qb64) {
  try {
    const matter = new Matter({ qb64 });
    let kind = "other";
    if (matter.code === MtrDex.Ed25519 || matter.code === MtrDex.Ed25519N || matter.code === MtrDex.X25519 || matter.code === "C") {
      kind = "key";
    } else if (matter.code === MtrDex.Ed25519_Sig || matter.code === "0A" || matter.code === MtrDex.ECDSA_256k1_Sig || matter.code === MtrDex.ECDSA_256r1_Sig) {
      kind = "sig";
    } else if (DigiDex.has(matter.code)) {
      kind = "digest";
    }
    return {
      code: matter.code,
      length: qb64.length,
      kind
    };
  } catch (_error) {
    return {
      code: qb64.slice(0, 4),
      length: qb64.length,
      kind: "other"
    };
  }
}

// src/cesr/index.ts
var Cesr = {
  ...exports_types,
  ...exports_keys,
  ...exports_prefix,
  ...exports_sigs,
  ...exports_digest,
  ...exports_attachments,
  ...exports_event_codec
};
// src/kel/anchor-targets.ts
function snOf(s) {
  const sn = SequenceNumber.parse(s);
  return sn.ok ? sn.value : undefined;
}
function validateAnchorTargets(event, referencedEvents) {
  const anchors = event.a;
  if (!anchors || anchors.length === 0) {
    return { passed: true };
  }
  for (const raw of anchors) {
    const i = raw.i;
    const s = raw.s;
    const d = raw.d;
    if (i === undefined || s === undefined || d === undefined) {
      return {
        passed: false,
        reason: "missing-referenced-event",
        anchor: { i: i ?? "", s: s ?? "", d: d ?? "" }
      };
    }
    const anchor = { i, s, d };
    const targetSn = snOf(s);
    const candidates = referencedEvents.filter((e) => e.event.i === i && targetSn !== undefined && snOf(e.event.s) === targetSn);
    if (candidates.length === 0) {
      return { passed: false, reason: "missing-referenced-event", anchor };
    }
    const match = candidates.find((e) => e.event.d === d);
    if (!match) {
      return { passed: false, reason: "said-mismatch", anchor };
    }
  }
  return { passed: true };
}

// src/kel/events.ts
var INCEPTION_ILKS = new Set(["icp", "dip"]);
function selectSurface2(ilk) {
  switch (ilk) {
    case "icp":
      return KEL_ICP_SURFACE;
    case "rot":
      return KEL_ROT_SURFACE;
    case "ixn":
      return KEL_IXN_SURFACE;
    case "dip":
      return KEL_DIP_SURFACE;
    case "drt":
      return KEL_DRT_SURFACE;
    default:
      throw new Error(`selectSurface: unknown ilk '${ilk}'`);
  }
}
var KELEvents;
((KELEvents) => {
  function buildIcp(params) {
    const unsignedEvent = {
      v: "KERI10JSON000000_",
      t: "icp",
      d: "",
      i: "",
      s: "0",
      kt: Threshold.canonical(params.signingThreshold ?? "1", params.keys.length),
      k: params.keys,
      nt: Threshold.canonical(params.nextThreshold ?? params.signingThreshold ?? "1", params.nextKeyDigests.length),
      n: params.nextKeyDigests,
      bt: params.witnessThreshold ?? "0",
      b: params.witnesses ?? [],
      c: params.config ?? [],
      a: params.anchors ?? []
    };
    return { unsignedEvent, isDelegated: false };
  }
  KELEvents.buildIcp = buildIcp;
  function buildDip(params) {
    const unsignedEvent = {
      v: "KERI10JSON000000_",
      t: "dip",
      d: "",
      i: "",
      s: "0",
      kt: Threshold.canonical(params.signingThreshold ?? "1", params.keys.length),
      k: params.keys,
      nt: Threshold.canonical(params.nextThreshold ?? params.signingThreshold ?? "1", params.nextKeyDigests.length),
      n: params.nextKeyDigests,
      bt: params.witnessThreshold ?? "0",
      b: params.witnesses ?? [],
      c: params.config ?? [],
      a: params.anchors ?? [],
      di: params.parentAid
    };
    return { unsignedEvent, isDelegated: true };
  }
  KELEvents.buildDip = buildDip;
  function buildRot(params) {
    const unsignedEvent = {
      v: "KERI10JSON000000_",
      t: "rot",
      d: "",
      i: params.aid,
      s: SequenceNumber.encode(params.sequence),
      p: params.priorEventSaid,
      kt: Threshold.canonical(params.signingThreshold, params.keys.length),
      k: params.keys,
      nt: Threshold.canonical(params.nextThreshold, params.nextKeyDigests.length),
      n: params.nextKeyDigests,
      bt: params.witnessThreshold ?? "0",
      br: params.witnessesRemoved ?? [],
      ba: params.witnessesAdded ?? [],
      ...params.config !== undefined ? { c: params.config } : {},
      a: params.anchors ?? []
    };
    return { unsignedEvent, isDelegated: false };
  }
  KELEvents.buildRot = buildRot;
  function buildDrt(params) {
    const unsignedEvent = {
      v: "KERI10JSON000000_",
      t: "drt",
      d: "",
      i: params.aid,
      s: SequenceNumber.encode(params.sequence),
      p: params.priorEventSaid,
      kt: Threshold.canonical(params.signingThreshold, params.keys.length),
      k: params.keys,
      nt: Threshold.canonical(params.nextThreshold, params.nextKeyDigests.length),
      n: params.nextKeyDigests,
      bt: params.witnessThreshold ?? "0",
      br: params.witnessesRemoved ?? [],
      ba: params.witnessesAdded ?? [],
      ...params.config !== undefined ? { c: params.config } : {},
      a: params.anchors ?? []
    };
    return { unsignedEvent, isDelegated: true };
  }
  KELEvents.buildDrt = buildDrt;
  function buildIxn(params) {
    const unsignedEvent = {
      v: "KERI10JSON000000_",
      t: "ixn",
      d: "",
      i: params.aid,
      s: SequenceNumber.encode(params.sequence),
      p: params.priorEventSaid,
      a: params.anchors ?? []
    };
    return { unsignedEvent, isDelegated: false };
  }
  KELEvents.buildIxn = buildIxn;
  function computeSaid(unsignedEvent, isInception = false) {
    const surface = selectSurface2(unsignedEvent.t);
    const ilkIsInception = INCEPTION_ILKS.has(unsignedEvent.t);
    if (isInception !== ilkIsInception) {
      throw new Error(`computeSaid: isInception=${isInception} but ilk '${unsignedEvent.t}' ` + `${ilkIsInception ? "is" : "is not"} an inception event`);
    }
    const eventForDerivation = isInception ? { ...unsignedEvent, i: SAID_PLACEHOLDER } : unsignedEvent;
    const canonUnsigned = serializeForSigning(eventForDerivation, surface);
    const { sealed, said } = deriveSaid(eventForDerivation, surface);
    const event = isInception ? { ...sealed, i: said } : sealed;
    const canonFinal = serializeForSigning(event, surface);
    return {
      event,
      canonFinal,
      canonUnsigned,
      said
    };
  }
  KELEvents.computeSaid = computeSaid;
  function finalize(unsignedEvent, isInception = false) {
    return computeSaid(unsignedEvent, isInception);
  }
  KELEvents.finalize = finalize;
  function computeWitnessDelta(priorB, desiredB) {
    const priorSet = new Set(priorB.map(String));
    const desiredSet = new Set(desiredB.map(String));
    return {
      added: desiredB.filter((w) => !priorSet.has(String(w))),
      removed: priorB.filter((w) => !desiredSet.has(String(w)))
    };
  }
  KELEvents.computeWitnessDelta = computeWitnessDelta;
  function nextSequence(priorSeq) {
    return SequenceNumber.of(priorSeq) + 1;
  }
  KELEvents.nextSequence = nextSequence;
  function eventType(event) {
    return event.t;
  }
  KELEvents.eventType = eventType;
  function eventAid(event) {
    return event.i;
  }
  KELEvents.eventAid = eventAid;
  function eventSn(event) {
    return event.s;
  }
  KELEvents.eventSn = eventSn;
  function eventSaid(event) {
    return event.d;
  }
  KELEvents.eventSaid = eventSaid;
  function eventKeys(event) {
    return event.k;
  }
  KELEvents.eventKeys = eventKeys;
  function signatureOndex(event, keyIndex, ondex) {
    if (ondex !== undefined) {
      return ondex;
    } else if (event.t === "rot" || event.t === "drt") {
      return;
    } else {
      return keyIndex;
    }
  }
  KELEvents.signatureOndex = signatureOndex;
  function assembleSignedEvent(params) {
    const attachments = params.signatures.map((s) => {
      const ondex = signatureOndex(params.event, s.keyIndex, s.ondex);
      return {
        kind: "sig",
        form: "indexed",
        keyIndex: s.keyIndex,
        ...ondex === undefined ? {} : { ondex },
        sig: s.sig
      };
    });
    return {
      event: params.event,
      attachments,
      enc: "JSON",
      ...params.bytesB64 !== undefined ? { bytesB64: params.bytesB64 } : {}
    };
  }
  KELEvents.assembleSignedEvent = assembleSignedEvent;
})(KELEvents ||= {});

// src/kel/event-signing.ts
function encodeEventBytes(event, encoding = "JSON") {
  if (encoding !== "JSON") {
    throw new Error(`Encoding ${encoding} not yet supported. Only JSON is currently implemented.`);
  }
  return canonicalizeEvent(event);
}
async function signCesrEventWithSigner(env, signer, aid, keyIndex = 0, ondex) {
  const eventBytes = encodeEventBytes(env.event, env.enc);
  const signature = await signer.signBytes(eventBytes);
  const sigOndex = KELEvents.signatureOndex(env.event, keyIndex, ondex);
  const sigAttachment = {
    kind: "sig",
    form: "indexed",
    signerAid: aid,
    keyIndex,
    ...sigOndex === undefined ? {} : { ondex: sigOndex },
    sig: signature
  };
  return {
    ...env,
    attachments: [...env.attachments, sigAttachment]
  };
}

// src/kel/kel-state.ts
function isEstablishment(event) {
  return event.t === "icp" || event.t === "rot" || event.t === "dip" || event.t === "drt";
}
function isInception(event) {
  return event.t === "icp" || event.t === "dip";
}
function tryParse(raw, keyCount) {
  if (raw === undefined) {
    return {
      threshold: { kind: "numeric", m: 1 },
      note: { code: "unparseable-threshold", message: "Missing threshold, defaulting to 1" }
    };
  } else {
    const parsed = Threshold.parse(raw, keyCount);
    if (parsed.ok) {
      return { threshold: parsed.value };
    } else {
      return {
        threshold: { kind: "numeric", m: 1 },
        note: { code: "unparseable-threshold", message: `Failed to parse threshold: ${parsed.error.message}` }
      };
    }
  }
}
function reduceKelState(events) {
  if (events.length === 0)
    return [];
  const states = [];
  let kelAid = "";
  let signingKeys = [];
  let signingThreshold = { kind: "numeric", m: 1 };
  let previousSaid;
  let lastEstablishment;
  let witnesses = new Set;
  let witnessThreshold = "0";
  let inceptionTraits = new Set;
  let nonTransferable = false;
  let delegatorAid;
  for (let i = 0;i < events.length; i++) {
    const event = events[i].event;
    const notes = [];
    if (i === 0) {
      kelAid = event.i;
      if (!isInception(event)) {
        notes.push({
          code: "unexpected-event-type",
          message: `First event is '${event.t}', expected 'icp' or 'dip'`
        });
      }
    }
    if (isEstablishment(event)) {
      signingKeys = event.k ?? [];
      const keyCount = signingKeys.length || 1;
      const { threshold, note } = tryParse(event.kt, keyCount);
      signingThreshold = threshold;
      if (note)
        notes.push(note);
      nonTransferable = Array.isArray(event.n) && event.n.length === 0;
      lastEstablishment = event;
      if (event.t === "icp" || event.t === "dip") {
        witnesses = new Set(event.b ?? []);
        witnessThreshold = event.bt ?? "0";
        inceptionTraits = new Set(event.c ?? []);
        if (event.t === "dip") {
          if (event.di) {
            delegatorAid = event.di;
          } else {
            notes.push({ code: "missing-field", message: "dip event missing di field" });
          }
        }
      } else if (event.t === "rot" || event.t === "drt") {
        const br = event.br ?? [];
        const ba = event.ba ?? [];
        const newWitnesses = new Set(witnesses);
        for (const removed of br) {
          if (!newWitnesses.has(removed)) {
            notes.push({
              code: "malformed-witnesses",
              message: `br contains '${removed}' which is not in current witness set`
            });
          }
          newWitnesses.delete(removed);
        }
        for (const added of ba) {
          if (newWitnesses.has(added)) {
            notes.push({
              code: "malformed-witnesses",
              message: `ba contains '${added}' which is already in witness set`
            });
          }
          newWitnesses.add(added);
        }
        witnesses = newWitnesses;
        witnessThreshold = event.bt ?? witnessThreshold;
      }
    }
    states.push({
      index: i,
      expectedSequence: SequenceNumber.encode(i),
      kelAid,
      signingKeys: [...signingKeys],
      signingThreshold,
      previousSaid,
      lastEstablishment,
      witnesses: new Set(witnesses),
      witnessThreshold,
      inceptionTraits,
      nonTransferable,
      delegatorAid,
      notes
    });
    previousSaid = event.d;
  }
  return states;
}

// src/kel/rotation.ts
async function resolveCurrentKeys(priorKsn, lookupKey) {
  const k = [];
  for (const digest of priorKsn.n) {
    const publicKey = await lookupKey(digest);
    if (publicKey === undefined) {
      throw new Error(`Cannot resolve next key digest: ${digest}. The public key for this committed digest was not found.`);
    }
    k.push(publicKey);
  }
  return { k, kt: priorKsn.nt };
}
function matchKeyRevelation(input) {
  const { priorN, priorNt, proposedK } = input;
  const errors = [];
  const digestSet = new Set;
  for (const digest of priorN) {
    if (digestSet.has(digest)) {
      errors.push(`Ambiguous prior n[]: duplicate digest ${digest}`);
      return { revealed: [], augmented: [], priorNtSatisfied: false, errors };
    }
    digestSet.add(digest);
  }
  const revealed = [];
  const augmented = [];
  const matchedNIndices = new Set;
  for (let kIdx = 0;kIdx < proposedK.length; kIdx++) {
    const found = priorN.findIndex((d) => verferMatchesDigest(proposedK[kIdx], d));
    const nIdx = found === -1 ? undefined : found;
    if (nIdx !== undefined && !matchedNIndices.has(nIdx)) {
      revealed.push({ kIndex: kIdx, nIndex: nIdx });
      matchedNIndices.add(nIdx);
    } else if (nIdx !== undefined && matchedNIndices.has(nIdx)) {
      errors.push(`Key at k[${kIdx}] matches n[${nIdx}] which was already matched by another key`);
    } else {
      augmented.push(kIdx);
    }
  }
  if (errors.length > 0) {
    return { revealed, augmented, priorNtSatisfied: false, errors };
  }
  const matchedIndices = revealed.map((r) => r.nIndex);
  const priorNtSatisfied = meetsThreshold(priorNt, matchedIndices, priorN.length);
  return { revealed, augmented, priorNtSatisfied, errors };
}
function assertKeyRevelation(priorKsn, proposedK) {
  const result = matchKeyRevelation({
    priorN: priorKsn.n,
    priorNt: priorKsn.nt,
    proposedK
  });
  if (result.errors.length > 0) {
    throw new Error(result.errors.join("; "));
  }
  if (!result.priorNtSatisfied) {
    throw new Error(`Prior-next threshold not satisfied: nt=${JSON.stringify(priorKsn.nt)}, revealed ${result.revealed.length} of ${priorKsn.n.length} committed keys`);
  }
}
function buildNextCommitment(nextPublicKeys, nextThreshold) {
  const n = nextPublicKeys.map((key) => digestVerfer(key));
  return { n, nt: nextThreshold };
}
function meetsThreshold(threshold, indices, total) {
  const parsed = Threshold.parse(threshold, total);
  return parsed.ok ? Threshold.satisfied(parsed.value, indices) : false;
}
function planRotation(prior, change, available) {
  const match = matchKeyRevelation({ priorN: prior.n, priorNt: prior.nt, proposedK: [...change.reveal] });
  if (match.errors.length > 0) {
    throw new Error(`planRotation: invalid prior n: ${match.errors.join("; ")}`);
  } else if (match.augmented.length > 0) {
    return err({ kind: "not-committed", key: change.reveal[match.augmented[0]] });
  }
  const k = [...change.keep ?? [], ...change.reveal, ...change.add ?? []];
  const n = [...change.carryNext ?? [], ...change.nextDigests];
  const revealOffset = change.keep?.length ?? 0;
  const ondexByKIndex = new Map(match.revealed.map((r) => [r.kIndex + revealOffset, r.nIndex]));
  const ktParsed = Threshold.parse(change.kt, k.length);
  const ntParsed = Threshold.parse(change.nt, n.length);
  if (!ktParsed.ok) {
    return err({ kind: "invalid-threshold", field: "kt", message: `kt: ${ktParsed.error.message}` });
  } else if (ktParsed.value.kind === "numeric" && ktParsed.value.m < 1) {
    return err({ kind: "invalid-threshold", field: "kt", message: 'kt: threshold "0" is less than 1' });
  } else if (!ntParsed.ok) {
    return err({ kind: "invalid-threshold", field: "nt", message: `nt: ${ntParsed.error.message}` });
  }
  const seen = new Set;
  for (const key of k) {
    if (seen.has(key)) {
      return err({ kind: "duplicate-key", key });
    } else {
      seen.add(key);
    }
  }
  const availableSet = new Set(available);
  const signers = [];
  k.forEach((key, kIndex) => {
    const ondex = ondexByKIndex.get(kIndex);
    if (!availableSet.has(key)) {} else if (ondex === undefined) {
      signers.push({ kIndex });
    } else {
      signers.push({ kIndex, ondex });
    }
  });
  const ondices = signers.flatMap((s) => s.ondex === undefined ? [] : [s.ondex]);
  if (!meetsThreshold(prior.nt, ondices, prior.n.length)) {
    return err({ kind: "prior-nt-unsatisfiable", nt: prior.nt, revealed: ondices.length });
  } else if (!meetsThreshold(change.kt, signers.map((s) => s.kIndex), k.length)) {
    return err({ kind: "kt-unsatisfiable-by", kt: change.kt, available: signers.length });
  } else {
    return ok({ k, kt: change.kt, n, nt: change.nt, signers });
  }
}

// src/kel/types.ts
init_esm();
var InceptionWitnessFields = {
  bt: ThresholdSchema,
  b: Type.Array(CesrAidSchema, {
    title: "Backer Prefixes",
    description: "Initial backer (witness) list"
  })
};
var RotationWitnessFields = {
  bt: ThresholdSchema,
  br: Type.Array(CesrAidSchema, {
    title: "Backers Removed",
    description: "Backer AIDs removed in this rotation"
  }),
  ba: Type.Array(CesrAidSchema, {
    title: "Backers Added",
    description: "Backer AIDs added in this rotation"
  })
};
var IcpEventSchema = Type.Object({
  v: VersionSchema,
  t: Type.Literal("icp", {
    title: "Event Type",
    description: "Event type identifier for inception"
  }),
  d: CesrDigestSchema,
  i: CesrAidSchema,
  s: Type.Literal("0", {
    title: "Sequence",
    description: 'Event sequence number (always "0" for inception)'
  }),
  kt: ThresholdSchema,
  k: Type.Array(CesrKeyTransferableSchema, {
    minItems: 1,
    title: "Current Keys",
    description: "Array of current signing keys (transferable qb64)",
    examples: [["DAliceKey...", "DBobKey..."]]
  }),
  nt: ThresholdSchema,
  n: Type.Array(CesrDigestSchema, {
    minItems: 1,
    title: "Next Key Digests",
    description: "Array of next-key commitments (pre-rotation digests)",
    examples: [["EcommitA...", "EcommitB..."]]
  }),
  ...InceptionWitnessFields,
  c: Type.Array(Type.String(), {
    title: "Configuration Traits",
    description: 'Flags like "EO" (Establishment-Only), "DND" (Do Not Delegate).',
    examples: [["EO"], ["EO", "DND"]]
  }),
  a: Type.Array(Type.Unknown(), {
    title: "Anchors",
    description: "External seals/anchors (opaque in this layer)"
  })
}, {
  additionalProperties: false,
  $id: "https://merits.dev/schemas/keri/kel.icp.v1.json",
  title: "KERI Inception Event",
  description: "KERI inception event establishing a new controller identifier (AID).",
  examples: [
    {
      v: "KERI10JSON000156_",
      t: "icp",
      d: "EicpSaid...",
      i: "EicpSaid...",
      s: "0",
      kt: "2",
      k: ["DAliceKey...", "DBobKey..."],
      nt: "2",
      n: ["EcommitA...", "EcommitB..."],
      bt: "0",
      b: [],
      c: ["EO"],
      a: []
    }
  ]
});
var RotEventSchema = Type.Object({
  v: VersionSchema,
  t: Type.Literal("rot"),
  d: CesrDigestSchema,
  i: CesrAidSchema,
  s: NonEmpty("Sequence", "Monotonic sequence as string", ["1", "2"]),
  p: CesrDigestSchema,
  kt: ThresholdSchema,
  k: Type.Array(CesrKeyTransferableSchema, { minItems: 1 }),
  nt: ThresholdSchema,
  n: Type.Array(CesrDigestSchema, { minItems: 1 }),
  ...RotationWitnessFields,
  c: Type.Optional(Type.Array(Type.String(), { title: "Configuration Traits", default: [] })),
  a: Type.Array(Type.Unknown(), { title: "Anchors" })
}, {
  additionalProperties: false,
  $id: "https://merits.dev/schemas/keri/kel.rot.v1.json",
  title: "KERI Rotation Event",
  description: "Rotates to next keys; proves continuity via prior SAID. Uses delta-based witness changes (br/ba)."
});
var IxnEventSchema = Type.Object({
  v: VersionSchema,
  t: Type.Literal("ixn"),
  d: CesrDigestSchema,
  i: CesrAidSchema,
  s: NonEmpty("Sequence", "Monotonic sequence as string", ["1", "2"]),
  p: CesrDigestSchema,
  a: Type.Array(Type.Unknown(), { default: [] })
}, {
  additionalProperties: false,
  $id: "https://merits.dev/schemas/keri/kel.ixn.v1.json",
  title: "KERI Interaction Event",
  description: "Interaction; attaches data seals without key changes."
});
var KSNSchema = Type.Object({
  v: VersionSchema,
  i: CesrAidSchema,
  s: Type.String({
    title: "Sequence",
    description: "Current sequence number, keripy hex (read with SequenceNumber)",
    pattern: "^[0-9a-fA-F]+$",
    examples: ["0", "a", "10"]
  }),
  p: CesrDigestSchema,
  d: CesrDigestSchema,
  et: Type.Union([Type.Literal("icp"), Type.Literal("rot"), Type.Literal("ixn"), Type.Literal("dip"), Type.Literal("drt")], { title: "Last Event Type" }),
  kt: ThresholdSchema,
  k: Type.Array(CesrKeyTransferableSchema, { minItems: 1, title: "Current Keys" }),
  nt: ThresholdSchema,
  n: Type.Array(CesrDigestSchema, { minItems: 1, title: "Next Key Digests" }),
  bt: ThresholdSchema,
  b: Type.Array(CesrAidSchema, {
    title: "Witness AIDs (current set)",
    description: "A witness does not sign your event like a controller. A witness receives your event and later issues receipts, which are signed with the witness's keys — but those signatures are delivered out-of-band, not inside your KEL event."
  }),
  wa: Type.Optional(Type.Array(CesrAidSchema, { title: "Witnesses Added (delta)" })),
  wr: Type.Optional(Type.Array(CesrAidSchema, { title: "Witnesses Removed (delta)" })),
  c: Type.Optional(Type.Array(Type.String(), { title: "Config Traits", examples: [["EO", "DND"]] })),
  ee: Type.Optional(Type.Object({
    s: NonEmpty("Establishment Seq"),
    d: CesrDigestSchema
  }, { additionalProperties: false, title: "Last Establishment Event (icp/rot) pointer" }))
}, {
  additionalProperties: false,
  $id: "https://merits.dev/schemas/keri/kel.ksn.v1.json",
  title: "Key State Notice (KSN)",
  description: "Summarizes the controller's current key state at the head of the KEL. Parent/delegation approvals are external evidence.",
  examples: [
    {
      v: "KERI10JSON000180_",
      i: "EicpSaid...",
      s: "2",
      p: "EprevSaid...",
      d: "EheadSaid...",
      et: "rot",
      kt: "2",
      k: ["DAliceKey...", "DBobKey..."],
      nt: "2",
      n: ["EnextA...", "EnextB..."],
      bt: "0",
      b: [],
      c: ["EO"],
      ee: { s: "2", d: "EheadSaid..." }
    }
  ]
});
var PublishedResourceSchema = (dataSchema) => Type.Object({
  said: CesrDigestSchema,
  data: dataSchema,
  format: Type.String({ description: "Data format: 'json' | 'cesr' | etc." }),
  signature: Type.String({ description: "Signature over SAID digest" }),
  publicKey: CesrKeyTransferableSchema,
  publisherAid: CesrAidSchema,
  publishedAt: TimestampSchema
}, {
  title: "PublishedResource",
  description: "Signed envelope for published KERI data with verification metadata"
});
var AidManifestEventSchema = Type.Object({
  sn: Type.Number({ description: "Event sequence number" }),
  said: Qb64Schema,
  path: Type.String({ description: "Canonical path" }),
  url: Type.String({ description: "Full URL" }),
  receiptsPath: Type.Optional(Type.String({ description: "Canonical receipts path" })),
  receiptsUrl: Type.Optional(Type.String({ description: "Full receipts URL" }))
}, { title: "AidManifestEvent" });
var AidManifestSchema = Type.Object({
  v: Type.Literal("kerits-aid-manifest/1"),
  aid: Qb64Schema,
  latestSn: Type.Number({ description: "Latest sequence number" }),
  ksnSaid: Qb64Schema,
  ksnPath: Type.String({ description: "Canonical KSN path" }),
  ksnUrl: Type.String({ description: "Full KSN URL" }),
  kelPath: Type.Optional(Type.String({ description: "Canonical full-KEL path" })),
  kelUrl: Type.Optional(Type.String({ description: "Full KEL URL" })),
  events: Type.Array(AidManifestEventSchema, {
    description: "Per-event index with path and URL",
    minItems: 1
  })
}, {
  title: "AidManifest",
  description: "URL-based manifest for a published KEL — mutable resource directory"
});
var KSNs;
((KSNs) => {
  function fromPublicKey(publicKey, aid) {
    const identifier = aid ?? publicKey;
    return {
      v: "KERI10JSON00011c_",
      i: identifier,
      s: "0",
      p: "",
      d: identifier,
      et: "icp",
      kt: "1",
      k: [publicKey],
      nt: "1",
      n: ["EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"],
      bt: "0",
      b: []
    };
  }
  KSNs.fromPublicKey = fromPublicKey;
  function fromKEL(aid, events) {
    if (events.length === 0) {
      return;
    }
    const lastEvent = events[events.length - 1]?.event;
    const prevEvent = events.length > 1 ? events[events.length - 2]?.event : undefined;
    if (!lastEvent) {
      return;
    }
    let currentKeys = [];
    let nextDigests = [];
    let signingThreshold = "1";
    let nextThreshold = "1";
    let witnessThreshold = "0";
    let witnesses = [];
    let config = [];
    for (const cesrEvt of events) {
      const evt = cesrEvt?.event;
      if (!evt)
        continue;
      if (evt.t === "icp" || evt.t === "dip") {
        currentKeys = evt.k;
        nextDigests = evt.n;
        signingThreshold = evt.kt;
        nextThreshold = evt.nt;
        witnessThreshold = evt.bt;
        witnesses = [...evt.b];
        config = evt.c ?? [];
      } else if (evt.t === "rot" || evt.t === "drt") {
        currentKeys = evt.k;
        nextDigests = evt.n;
        signingThreshold = evt.kt;
        nextThreshold = evt.nt;
        witnessThreshold = evt.bt;
        const rotEvt = evt;
        const removed = new Set(rotEvt.br);
        witnesses = witnesses.filter((w) => !removed.has(w));
        witnesses.push(...rotEvt.ba);
        config = rotEvt.c ?? [];
      }
    }
    const ksn = {
      v: lastEvent.v,
      i: aid,
      s: lastEvent.s,
      p: prevEvent ? prevEvent.d : lastEvent.t === "icp" ? lastEvent.d : "",
      d: lastEvent.d,
      et: lastEvent.t,
      kt: signingThreshold,
      k: currentKeys,
      nt: nextThreshold,
      n: nextDigests,
      bt: witnessThreshold,
      b: witnesses,
      ...config.length > 0 ? { c: config } : {}
    };
    return ksn;
  }
  KSNs.fromKEL = fromKEL;
  function equal(a, b) {
    return a.d === b.d;
  }
  KSNs.equal = equal;
})(KSNs ||= {});
var DipEventSchema = Type.Object({
  v: VersionSchema,
  t: Type.Literal("dip"),
  d: CesrDigestSchema,
  i: CesrAidSchema,
  s: Type.Literal("0", { title: "Sequence" }),
  kt: ThresholdSchema,
  k: Type.Array(CesrKeyTransferableSchema, { minItems: 1 }),
  nt: ThresholdSchema,
  n: Type.Array(CesrDigestSchema, { minItems: 1 }),
  ...InceptionWitnessFields,
  c: Type.Array(Type.String(), { default: [] }),
  a: Type.Array(Type.Unknown(), { default: [] }),
  di: CesrAidSchema
}, {
  additionalProperties: false,
  $id: "https://merits.dev/schemas/keri/kel.dip.v1.json",
  title: "Delegated Inception (dip)",
  description: "Inception for a delegated identifier. Parent approval/seal is external evidence."
});
var DrtEventSchema = Type.Object({
  v: VersionSchema,
  t: Type.Literal("drt"),
  d: CesrDigestSchema,
  i: CesrAidSchema,
  s: NonEmpty("Sequence", "Monotonic sequence as string", ["1", "2"]),
  p: CesrDigestSchema,
  kt: ThresholdSchema,
  k: Type.Array(CesrKeyTransferableSchema, { minItems: 1 }),
  nt: ThresholdSchema,
  n: Type.Array(CesrDigestSchema, { minItems: 1 }),
  ...RotationWitnessFields,
  c: Type.Optional(Type.Array(Type.String(), { title: "Configuration Traits", default: [] })),
  a: Type.Array(Type.Unknown(), { title: "Anchors" })
}, {
  additionalProperties: false,
  $id: "https://merits.dev/schemas/keri/kel.drt.v1.json",
  title: "Delegated Rotation (drt)",
  description: "Rotation for a delegated identifier. Uses delta-based witness changes (br/ba). Parent approval/seal is external evidence."
});
var KELEventSchema = Type.Union([IcpEventSchema, RotEventSchema, IxnEventSchema, DipEventSchema, DrtEventSchema], {
  title: "KEL Event",
  description: "Any valid KEL event (icp | rot | ixn | dip | drt)."
});
var KeyIndexSchema = Type.Union([Type.Integer({ minimum: 0 }), NonEmpty("Key Index (string)")], {
  title: "Key Index",
  description: "Signer key index (int or qb64 encoded index)"
});
var CesrAttachment_Signature = Type.Object({
  kind: Type.Literal("sig"),
  form: Type.Union([Type.Literal("indexed"), Type.Literal("nonIndexed")], {
    description: "Indexed signatures typical for transferable controllers"
  }),
  signerAid: Type.Optional(CesrAidSchema),
  keyIndex: Type.Optional(KeyIndexSchema),
  ondex: Type.Optional(Type.Integer({ minimum: 0 })),
  sig: CesrSignatureSchema
}, {
  additionalProperties: false,
  title: "Controller Signature Attachment",
  description: 'Signature over the serialized event bytes. When form="indexed", keyIndex MUST be present.'
});
var CesrAttachment_WitnessIndexedSig = Type.Object({
  kind: Type.Literal("wig"),
  keyIndex: Type.Integer({ minimum: 0 }),
  sig: CesrSignatureSchema
}, { additionalProperties: false, title: "Witness Indexed Signature (wig)" });
var CesrAttachment_WitnessReceipt = Type.Object({
  kind: Type.Literal("rct"),
  by: CesrAidSchema,
  sig: CesrSignatureSchema
}, {
  additionalProperties: false,
  title: "Witness Receipt (rct)",
  description: "Non-transferable receipt from a witness"
});
var CesrSealSchema = Type.Object({
  i: CesrAidSchema,
  s: NonEmpty("Sequence"),
  d: CesrDigestSchema
}, { additionalProperties: false, title: "CESR Seal (i,s,d)" });
var DigestSealSchema = Type.Object({
  d: CesrDigestSchema
}, { additionalProperties: false, title: "Digest Seal (d)" });
var AnySealSchema = Type.Union([CesrSealSchema, DigestSealSchema], {
  title: "KERI Seal",
  description: "Full event seal (i,s,d) or digest seal (d)"
});
var CesrAttachment_ValidatorReceipt = Type.Object({
  kind: Type.Literal("vrc"),
  cid: Type.Optional(CesrDigestSchema),
  seal: CesrSealSchema,
  sig: CesrSignatureSchema,
  keyIndex: Type.Optional(Type.Number({
    title: "Key Index",
    description: "Index into the parent establishment event key list. Defaults to 0 for backward compatibility with single-sig delegators."
  }))
}, {
  additionalProperties: false,
  title: "Validator Receipt (vrc)",
  description: "Transferable validator receipt with explicit child SAID, seal-source, and signature"
});
var CesrAttachment_DelegatorSealSource = Type.Object({
  kind: Type.Literal("delegator-seal-source"),
  s: NonEmpty("Sequence", "Sequence number of the delegator approving event"),
  d: CesrDigestSchema
}, { additionalProperties: false, title: "Delegator Seal Source Couple" });
var CesrAttachmentSchema = Type.Union([
  CesrAttachment_Signature,
  CesrAttachment_WitnessIndexedSig,
  CesrAttachment_WitnessReceipt,
  CesrAttachment_ValidatorReceipt,
  CesrAttachment_DelegatorSealSource
], {
  title: "CESR Attachment",
  description: "Signatures, receipts, and delegation seal-source couples attached to an event"
});
var KelAppendSchema = Type.Object({
  artifactId: NonEmpty("Artifact ID", "Local identifier within this plan", ["icp0", "rot1"]),
  said: Qb64Schema,
  kind: Type.Union([
    Type.Literal("kel/icp"),
    Type.Literal("kel/rot"),
    Type.Literal("kel/ixn"),
    Type.Literal("kel/dip"),
    Type.Literal("kel/drt")
  ], { description: "KEL event kind (derived from event.t)" }),
  event: KELEventSchema,
  attachments: Type.Array(CesrAttachmentSchema, {
    default: [],
    description: "CESR attachments (signatures, receipts) for this event"
  }),
  cesr: NonEmpty("CESR Event Bytes", "CESR-encoded representation of this KEL event envelope (e.g. base64 or qb64)")
}, {
  additionalProperties: false,
  $id: "https://merits.dev/schemas/kerits/kel-append.v1.json",
  title: "KEL Append",
  description: "Minimal append instruction: SAD KEL event + SAID + CESR bytes. Canonical JSON is derived from event when needed."
});
var KelAppends;
((KelAppends) => {
  function validate(append) {
    const { artifactId, said, kind, event } = append;
    if (event.d !== said) {
      throw new Error(`SAID mismatch in KelAppend[${artifactId}]: event.d=${event.d}, said=${said}`);
    }
    const expectedKind = `kel/${event.t}`;
    if (kind !== expectedKind) {
      throw new Error(`Kind mismatch in KelAppend[${artifactId}]: kind=${kind}, expected=${expectedKind}`);
    }
  }
  KelAppends.validate = validate;
  function toCESREvent(append) {
    validate(append);
    const env = {
      event: append.event,
      attachments: append.attachments || [],
      enc: "JSON",
      bytesB64: append.cesr
    };
    return env;
  }
  KelAppends.toCESREvent = toCESREvent;
  function fromCESREvent(artifactId, env) {
    if (!env.bytesB64) {
      throw new Error(`CESREvent.bytesB64 is required to build KelAppend[${artifactId}]`);
    }
    const said = env.event.d;
    return {
      artifactId,
      said,
      kind: `kel/${env.event.t}`,
      event: env.event,
      attachments: env.attachments || [],
      cesr: env.bytesB64
    };
  }
  KelAppends.fromCESREvent = fromCESREvent;
})(KelAppends ||= {});
var CESREventSchema = Type.Object({
  event: KELEventSchema,
  attachments: Type.Array(CesrAttachmentSchema, { default: [] }),
  enc: Type.Union([Type.Literal("JSON"), Type.Literal("CBOR"), Type.Literal("MGPK")], {
    title: "Encoding",
    description: "Serialization used to produce signed bytes",
    default: "JSON"
  }),
  bytesB64: Type.Optional(NonEmpty("Event Bytes (base64)", "Exact serialized event bytes for verification Optional but extremely handy for deterministic re-verification and tooling (export/import, replay tests). If omitted, reproduce bytes from event + enc."))
}, {
  additionalProperties: false,
  $id: "https://merits.dev/schemas/keri/kel.cesr-envelope.v1.json",
  title: "CESR Event Envelope",
  description: "SAD event plus CESR attachments (signatures/receipts) and serialization hints",
  examples: [
    {
      event: {
        t: "rot",
        v: "KERI10JSON000120_",
        d: "ErotSaid...",
        i: "EicpSaid...",
        s: "1",
        p: "Eprev...",
        kt: "1",
        k: ["DA..."],
        nt: "1",
        n: ["E..."],
        a: []
      },
      attachments: [
        { kind: "sig", form: "indexed", signerAid: "EicpSaid...", keyIndex: 0, sig: "AAbb..." },
        { kind: "rct", by: "EwitAid...", sig: "AA11..." }
      ],
      enc: "JSON"
    }
  ]
});

// src/kel/delegation-validation.ts
function validateDelegation(input) {
  const { childEvent, parentKel, delegatorAid } = input;
  const event = childEvent.event;
  if (event.t !== "dip" && event.t !== "drt") {
    return { passed: false, reason: "not-delegated" };
  }
  const parentAid = event.t === "dip" ? event.di : delegatorAid;
  if (!parentAid) {
    return { passed: false, reason: "missing-delegator-aid" };
  }
  const sealSource = childEvent.attachments.find((a) => a.kind === "delegator-seal-source");
  if (!sealSource || sealSource.kind !== "delegator-seal-source") {
    return { passed: false, parentAid, reason: "missing-seal-source" };
  }
  if (!parentKel || parentKel.length === 0) {
    return { passed: false, parentAid, reason: "missing-parent-kel" };
  }
  const targetSn = snOf(sealSource.s);
  const parentEvent = targetSn === undefined ? undefined : parentKel.find((e) => snOf(e.event.s) === targetSn);
  if (!parentEvent || targetSn === undefined) {
    return { passed: false, parentAid, reason: "parent-event-not-found" };
  }
  if (parentEvent.event.d !== sealSource.d) {
    return { passed: false, parentAid, reason: "parent-said-mismatch" };
  }
  if (parentEvent.event.i !== parentAid) {
    return { passed: false, parentAid, reason: "parent-aid-mismatch" };
  }
  if (!verifyParentEventSignatures(parentEvent, parentKel, targetSn)) {
    return { passed: false, parentAid, reason: "parent-signatures-invalid" };
  }
  const anchors = parentEvent.event.a ?? [];
  const childSn = snOf(event.s);
  const childSnh = childSn === undefined ? undefined : SequenceNumber.encode(childSn);
  const hasAnchor = anchors.some((anchor) => childSnh !== undefined && anchor.i === event.i && anchor.s === childSnh && anchor.d === event.d);
  if (!hasAnchor) {
    return { passed: false, parentAid, reason: "anchor-seal-missing" };
  }
  return { passed: true, parentAid };
}
function verifyParentEventSignatures(parentEvent, parentKel, targetSn) {
  const establishmentTypes = new Set(["icp", "rot", "dip", "drt"]);
  let establishment;
  for (const e of parentKel) {
    const sn = snOf(e.event.s);
    if (sn === undefined || sn > targetSn)
      break;
    if (establishmentTypes.has(e.event.t)) {
      establishment = e;
    }
  }
  if (!establishment)
    return false;
  const estEvent = establishment.event;
  const keys = estEvent.k;
  if (!keys || keys.length === 0)
    return false;
  const sigs = parentEvent.attachments.filter((a) => a.kind === "sig");
  if (sigs.length === 0)
    return false;
  const kt = Threshold.parse(estEvent.kt ?? "1", keys.length);
  const indices = sigs.map((s, i) => s.kind === "sig" && typeof s.keyIndex === "number" ? s.keyIndex : i);
  return kt.ok ? Threshold.satisfied(kt.value, indices) : false;
}

// src/kel/validation-predicates.ts
function verifyWitnessReceipt(receipt, event) {
  return verifyEventSignature(event, receipt.by, receipt.sig);
}
var FAILURE_PRECEDENCE = {
  "key-index-out-of-range": 3,
  "cid-mismatch": 2,
  "signature-invalid": 1,
  "threshold-not-met": 0
};
function verifyVrcAgainstThreshold(vrcAttachments, event, parentEstablishment) {
  const validKeyIndices = new Set;
  let highestFailure;
  function recordFailure(reason) {
    const precedence = FAILURE_PRECEDENCE[reason];
    if (!highestFailure || precedence > highestFailure.precedence) {
      highestFailure = { reason, precedence };
    }
  }
  for (const vrc of vrcAttachments) {
    const keyIndex = vrc.keyIndex ?? 0;
    if (keyIndex < 0 || keyIndex >= parentEstablishment.k.length) {
      recordFailure("key-index-out-of-range");
      continue;
    }
    if (vrc.cid !== event.d) {
      recordFailure("cid-mismatch");
      continue;
    }
    const publicKey = parentEstablishment.k[keyIndex];
    const isValid = verifyEventSignature(event, publicKey, vrc.sig);
    if (isValid) {
      validKeyIndices.add(keyIndex);
    } else {
      recordFailure("signature-invalid");
    }
  }
  const sortedIndices = Array.from(validKeyIndices).sort((a, b) => a - b);
  const kt = Threshold.parse(parentEstablishment.kt, parentEstablishment.k.length);
  const thresholdMet = kt.ok ? Threshold.satisfied(kt.value, validKeyIndices) : false;
  if (thresholdMet) {
    return { passed: true, validKeyIndices: sortedIndices };
  }
  const reason = highestFailure?.reason ?? "threshold-not-met";
  return { passed: false, reason, validKeyIndices: sortedIndices };
}
function eventContainsAnchorForSaid(event, sealedSAID) {
  const anchors = event.a;
  if (!Array.isArray(anchors))
    return false;
  return anchors.some((entry) => typeof entry === "object" && entry !== null && ("d" in entry) && entry.d === sealedSAID);
}
function isDelegationAnchor(parentEvent, delegatedEventSAID) {
  if (parentEvent.t !== "ixn" && parentEvent.t !== "rot" && parentEvent.t !== "drt") {
    return false;
  }
  return eventContainsAnchorForSaid(parentEvent, delegatedEventSAID);
}

// src/kel/validation.ts
function selectSurfaceForValidation(ilk) {
  switch (ilk) {
    case "icp":
      return KEL_ICP_SURFACE;
    case "rot":
      return KEL_ROT_SURFACE;
    case "ixn":
      return KEL_IXN_SURFACE;
    case "dip":
      return KEL_DIP_SURFACE;
    case "drt":
      return KEL_DRT_SURFACE;
    default:
      return;
  }
}
function computeEventSaid(event) {
  const surface = selectSurfaceForValidation(event.t);
  if (!surface)
    return "";
  const eventForRecompute = event.t === "icp" || event.t === "dip" ? { ...event, i: SAID_PLACEHOLDER } : event;
  const { recomputed } = recomputeSaid(eventForRecompute, surface);
  return recomputed;
}
function getRequiredFields(eventType) {
  const common = ["v", "t", "d", "i", "s"];
  switch (eventType) {
    case "icp":
      return [...common, "kt", "k", "nt", "n", "bt", "b", "c", "a"];
    case "rot":
      return [...common, "p", "kt", "k", "nt", "n", "bt", "br", "ba", "a"];
    case "ixn":
      return [...common, "p", "a"];
    case "dip":
      return [...common, "kt", "k", "nt", "n", "bt", "b", "c", "a", "di"];
    case "drt":
      return [...common, "p", "kt", "k", "nt", "n", "bt", "br", "ba", "a"];
    default:
      return common;
  }
}
function checkRequiredFields(event) {
  const requiredFields = getRequiredFields(event.t);
  const eventObj = event;
  const missing = requiredFields.filter((field) => !(field in eventObj) || eventObj[field] === undefined);
  return {
    passed: missing.length === 0,
    missing: missing.length > 0 ? missing : undefined
  };
}
function validateSignaturesWithDetails(cesrEvent, keys, signaturesVerified) {
  const event = cesrEvent.event;
  const sigAttachments = getSignatureAttachments(cesrEvent);
  const details = [];
  const dropped = [];
  const validKeyIndices = new Set;
  const ondicesByKeyIndex = new Map;
  for (const sigAtt of sigAttachments) {
    const keyIndex = typeof sigAtt.keyIndex === "number" ? sigAtt.keyIndex : parseInt(sigAtt.keyIndex, 10);
    if (!Number.isInteger(keyIndex) || keyIndex < 0 || keyIndex >= keys.length) {
      const error = `Key index ${keyIndex} out of range (0-${keys.length - 1})`;
      details.push({ keyIndex, publicKey: "unknown", valid: false, error });
      dropped.push({ keyIndex, reason: "index-out-of-range", error });
      continue;
    }
    const publicKey = keys[keyIndex];
    let isValid = false;
    let verifyError;
    try {
      isValid = signaturesVerified || verifyEventSignature(event, publicKey, sigAtt.sig);
    } catch (err) {
      verifyError = err instanceof Error ? err.message : "Signature verification failed";
    }
    details.push({
      keyIndex,
      publicKey,
      valid: isValid,
      error: isValid ? undefined : verifyError ?? "Signature verification failed"
    });
    if (isValid) {
      validKeyIndices.add(keyIndex);
      ondicesByKeyIndex.set(keyIndex, [...ondicesByKeyIndex.get(keyIndex) ?? [], sigAtt.ondex]);
    } else {
      dropped.push({
        keyIndex,
        reason: "signature-invalid",
        error: verifyError ?? "Signature verification failed"
      });
    }
  }
  return { details, dropped, validKeyIndices, ondicesByKeyIndex };
}
var fmtThreshold = (t) => typeof t === "string" ? t : JSON.stringify(t);
function establishmentThresholdError(event) {
  const kt = Threshold.parse(event.kt, event.k.length);
  const nt = Threshold.parse(event.nt, event.n.length);
  if (!kt.ok) {
    return `kt: ${kt.error.message}`;
  } else if (!nt.ok) {
    return `nt: ${nt.error.message}`;
  } else {
    return;
  }
}
function checkRotationSignatureThresholds(k, kt, ktMet, prior, ondicesByKeyIndex) {
  const ondices = [];
  const skipped = [];
  for (const [keyIndex, claims] of ondicesByKeyIndex) {
    const exposed = claims.find((o) => o !== undefined && prior.n[o] !== undefined && verferMatchesDigest(k[keyIndex], prior.n[o]));
    if (exposed !== undefined) {
      ondices.push(exposed);
    } else {
      for (const o of claims) {
        if (o === undefined) {} else {
          skipped.push({
            keyIndex,
            reason: "ondex-mismatch",
            error: `signature at k index ${keyIndex} claims prior n index ${o}, but its key digest does not match n[${o}]; not counted toward prior nt`
          });
        }
      }
    }
  }
  const kIndices = [...ondicesByKeyIndex.keys()];
  const priorNtMet = meetsThreshold(prior.nt, ondices, prior.n.length);
  const ntDetail = `prior nt ${fmtThreshold(prior.nt)} not met; revealed-key signatures at prior n indices [${ondices.join(", ")}]`;
  if (!ktMet) {
    return {
      failure: {
        code: "KT_UNMET",
        message: `KT_UNMET: kt ${fmtThreshold(kt)} not met; verified signatures at k indices [${kIndices.join(", ")}]`
      },
      skipped
    };
  } else if (!priorNtMet && skipped.length > 0) {
    return {
      failure: {
        code: "ONDEX_MISMATCH",
        message: `ONDEX_MISMATCH: ${ntDetail}; skipped mismatched ondex at k indices [${skipped.map((d) => d.keyIndex).join(", ")}]`
      },
      skipped
    };
  } else if (!priorNtMet) {
    return { failure: { code: "PRIOR_NT_UNMET", message: `PRIOR_NT_UNMET: ${ntDetail}` }, skipped };
  } else {
    return { failure: undefined, skipped };
  }
}
function validatePreviousEventLink(currentEvent, previousEvent) {
  if (currentEvent.t === "icp" || currentEvent.t === "dip") {
    return { passed: true };
  }
  if (!previousEvent) {
    return {
      passed: false,
      error: "Non-inception event has no previous event to reference",
      expectedSaid: undefined,
      actualPField: currentEvent.p
    };
  }
  const expectedSaid = previousEvent.d;
  const actualPField = currentEvent.p;
  if (!actualPField) {
    return {
      passed: false,
      error: "Event missing required p field",
      expectedSaid,
      actualPField: undefined
    };
  }
  if (actualPField !== expectedSaid) {
    return {
      passed: false,
      error: `Previous event mismatch: p field is ${actualPField}, expected ${expectedSaid}`,
      expectedSaid,
      actualPField
    };
  }
  return { passed: true, expectedSaid, actualPField };
}
function validateKeyChainWithDetails(currentEvent, previousEstablishment) {
  if (currentEvent.t !== "rot" && currentEvent.t !== "drt") {
    return { passed: true };
  }
  const rotEvent = currentEvent;
  const prevNextDigests = previousEstablishment.n;
  const currentKeys = rotEvent.k;
  const matchResult = matchKeyRevelation({
    priorN: prevNextDigests,
    priorNt: previousEstablishment.nt,
    proposedK: currentKeys
  });
  if (matchResult.errors.length > 0) {
    return {
      passed: false,
      error: `Key revelation errors: ${matchResult.errors.join("; ")}`,
      expectedDigests: [...prevNextDigests],
      actualDigests: currentKeys.map((k) => digestVerfer(k)),
      revealed: matchResult.revealed,
      augmented: matchResult.augmented
    };
  }
  if (!matchResult.priorNtSatisfied) {
    const actualDigests = currentKeys.map((k) => digestVerfer(k));
    return {
      passed: false,
      error: `Prior establishment n[] commitments not satisfied: revealed ${matchResult.revealed.length} of ${prevNextDigests.length} next-key digests (nt=${String(previousEstablishment.nt)}). Expected digests from prior n[]: ${prevNextDigests.join(", ")}. Got digests from rotation k[]: ${actualDigests.join(", ")}.`,
      expectedDigests: [...prevNextDigests],
      actualDigests,
      revealed: matchResult.revealed,
      augmented: matchResult.augmented
    };
  }
  return {
    passed: true,
    expectedDigests: [...prevNextDigests],
    actualDigests: currentKeys.map((k) => digestVerfer(k)),
    revealed: matchResult.revealed,
    augmented: matchResult.augmented
  };
}
function validateDelegationWithDetails(cesrEvent, parentKel, delegatorAid) {
  const result = validateDelegation({
    childEvent: cesrEvent,
    parentKel,
    ...delegatorAid !== undefined ? { delegatorAid } : {}
  });
  if (result.passed) {
    return { passed: true, parentAid: result.parentAid };
  }
  if (result.reason === "not-delegated") {
    return { passed: true };
  }
  const missingParentKel = result.reason === "missing-parent-kel" || result.reason === "missing-seal-source";
  return {
    passed: false,
    error: `Delegation validation failed: ${result.reason}`,
    parentAid: result.parentAid,
    missingParentKel,
    vrcFailureReason: result.reason
  };
}
function isEstablishmentEvent(event) {
  return event.t === "icp" || event.t === "rot" || event.t === "dip" || event.t === "drt";
}
function isDelegatedEvent(event) {
  return event.t === "dip" || event.t === "drt";
}
function getSignatureAttachments(cesrEvent) {
  return cesrEvent.attachments.filter((a) => a.kind === "sig");
}
function getRctAttachments(cesrEvent) {
  return cesrEvent.attachments.filter((a) => a.kind === "rct");
}
function isValidKeriEvent(event) {
  if (!event || typeof event !== "object")
    return false;
  const t = event.t;
  return t === "icp" || t === "rot" || t === "ixn" || t === "dip" || t === "drt";
}
function validateEventSaid(event) {
  const computed = computeEventSaid(event);
  return {
    valid: computed === event.d,
    expected: computed,
    actual: event.d
  };
}
function validateRequiredFields(event) {
  const result = checkRequiredFields(event);
  return {
    valid: result.passed,
    missing: result.missing ?? []
  };
}
function validateKeyChain(currentEvent, previousEstablishment) {
  const result = validateKeyChainWithDetails(currentEvent, previousEstablishment);
  return {
    valid: result.passed,
    expectedDigests: result.expectedDigests ?? [],
    actualDigests: result.actualDigests ?? []
  };
}
function checkArrayUniqueness(items) {
  const seen = new Set;
  const duplicates = [];
  for (const item of items) {
    if (seen.has(item)) {
      duplicates.push(item);
    }
    seen.add(item);
  }
  return duplicates;
}
function validateKel(events, states, options) {
  const eventDetails = [];
  let firstError;
  let overallValid = true;
  if (events.length === 0) {
    return { valid: true, eventDetails: [] };
  }
  const start = options?.startIndex ?? 0;
  const parentKel = options?.parentKel;
  let lastEstablishment;
  for (let i = 0;i < start && i < events.length; i++) {
    const event = events[i].event;
    if (isEstablishmentEvent(event)) {
      lastEstablishment = event;
    }
  }
  for (let i = start;i < events.length; i++) {
    const cesrEvent = events[i];
    const event = cesrEvent.event;
    const eventType = event.t;
    const state = states[i];
    const checks = {
      isValidKeriEvent: { passed: true },
      saidValid: { passed: true },
      requiredFieldsPresent: { passed: true },
      signaturesValid: { passed: true },
      thresholdMet: { passed: true }
    };
    const errors = [];
    const fail = (code, scope, message, missingAid) => {
      const error = {
        code,
        scope,
        severity: "error",
        message,
        eventIndex: i,
        ...missingAid === undefined ? {} : { missingAid }
      };
      errors.push(error);
      firstError ??= error;
      overallValid = false;
    };
    const priorState = i > 0 ? states[i - 1] : undefined;
    if (priorState?.nonTransferable) {
      const abandoned = lastEstablishment?.t === "rot" || lastEstablishment?.t === "drt";
      const message = abandoned ? `ABANDONED: the identifier was abandoned (nt 0, empty n); no event may follow, got ${event.t} at index ${i}` : `Non-transferable AID cannot have any event after inception at index ${i}`;
      checks.transferable = { passed: false, error: message };
      fail(abandoned ? "ABANDONED" : "NON_TRANSFERABLE_VIOLATION", "event", message);
    }
    const validTypes = ["icp", "rot", "ixn", "dip", "drt"];
    const typeValid = validTypes.includes(event.t);
    const typeError = typeValid ? undefined : `Invalid event type '${event.t}'. Must be one of: ${validTypes.join(", ")}`;
    checks.isValidKeriEvent = { passed: typeValid, error: typeError };
    if (typeError !== undefined) {
      fail("MISSING_REQUIRED_FIELD", "event", typeError);
    }
    const computedSaid = computeEventSaid(event);
    const saidMatches = computedSaid === event.d;
    checks.saidValid = {
      passed: saidMatches,
      expected: computedSaid,
      actual: event.d,
      error: saidMatches ? undefined : `SAID mismatch: expected ${computedSaid}, got ${event.d}`
    };
    if (!saidMatches) {
      fail("SAID_MISMATCH", "event", `SAID mismatch for event ${i}`);
    }
    if (saidMatches && (event.t === "icp" || event.t === "dip") && event.i !== event.d) {
      const message = `AID derivation invalid at event ${i}: i=${event.i} but d=${event.d} (must be equal for inception events)`;
      checks.aidValid = { passed: false, error: message };
      fail("AID_DERIVATION_INVALID", "event", message);
    } else {
      checks.aidValid = { passed: true };
    }
    const requiredResult = checkRequiredFields(event);
    checks.requiredFieldsPresent = {
      passed: requiredResult.passed,
      missing: requiredResult.missing,
      error: requiredResult.passed ? undefined : `Missing required fields: ${requiredResult.missing?.join(", ")}`
    };
    if (!requiredResult.passed) {
      fail("MISSING_REQUIRED_FIELD", "event", `Missing required fields in event ${i}: ${requiredResult.missing?.join(", ")}`);
    }
    const previousEvent = i > 0 ? events[i - 1]?.event : undefined;
    const prevEventResult = validatePreviousEventLink(event, previousEvent);
    checks.previousEventValid = prevEventResult;
    if (!prevEventResult.passed) {
      fail("PREVIOUS_EVENT_MISMATCH", "chain", prevEventResult.error ?? `Previous event link invalid in event ${i}`);
    }
    if (isEstablishmentEvent(event)) {
      const thresholdError = establishmentThresholdError(event);
      if (thresholdError === undefined) {
        checks.thresholdValid = { passed: true };
      } else {
        checks.thresholdValid = { passed: false, error: thresholdError };
        fail("THRESHOLD_INVALID", "event", `THRESHOLD_INVALID: ${thresholdError} (event ${i})`);
      }
    }
    let keys;
    let threshold;
    if (isEstablishmentEvent(event)) {
      keys = event.k;
      threshold = event.kt;
    } else if (lastEstablishment) {
      keys = lastEstablishment.k;
      threshold = lastEstablishment.kt;
    } else {
      keys = [];
      threshold = "0";
    }
    const sigResult = typeValid ? validateSignaturesWithDetails(cesrEvent, keys, options?.signaturesVerified === true) : {
      details: [],
      dropped: [],
      validKeyIndices: new Set,
      ondicesByKeyIndex: new Map
    };
    if (typeValid) {
      checks.signaturesValid = {
        passed: true,
        details: sigResult.details,
        dropped: sigResult.dropped
      };
    } else {
      checks.signaturesValid = {
        passed: false,
        details: [],
        error: typeError ?? "Cannot verify signatures for invalid event type"
      };
    }
    let thresholdMet = false;
    if (typeValid) {
      if (state) {
        thresholdMet = Threshold.satisfied(state.signingThreshold, sigResult.validKeyIndices);
      } else {
        thresholdMet = meetsThreshold(threshold, [...sigResult.validKeyIndices], keys.length);
      }
    }
    checks.thresholdMet = {
      passed: thresholdMet,
      required: typeof threshold === "string" ? threshold : JSON.stringify(threshold),
      validSignatureCount: sigResult.validKeyIndices.size,
      error: typeValid ? thresholdMet ? undefined : `Threshold not met: ${sigResult.validKeyIndices.size} valid signatures` : typeError ?? "Cannot verify threshold for invalid event type"
    };
    const rotation = typeValid && (event.t === "rot" || event.t === "drt") && lastEstablishment ? checkRotationSignatureThresholds(event.k, event.kt, thresholdMet, lastEstablishment, sigResult.ondicesByKeyIndex) : undefined;
    const rotationFailure = rotation?.failure;
    if (rotation && rotation.skipped.length > 0 && typeValid) {
      checks.signaturesValid = {
        ...checks.signaturesValid,
        dropped: [...checks.signaturesValid.dropped ?? [], ...rotation.skipped]
      };
    }
    if (rotationFailure) {
      checks.thresholdMet = { ...checks.thresholdMet, passed: false, error: rotationFailure.message };
      fail(rotationFailure.code, "attachment", `${rotationFailure.message} (event ${i})`);
    } else if (typeValid && !thresholdMet) {
      fail("THRESHOLD_NOT_MET", "attachment", `Threshold not met for event ${i}: ${sigResult.validKeyIndices.size} valid signatures`);
    }
    if ((event.t === "rot" || event.t === "drt") && lastEstablishment) {
      const keyChainResult = validateKeyChainWithDetails(event, lastEstablishment);
      checks.keyChainValid = keyChainResult;
      if (!keyChainResult.passed) {
        fail("NEXT_KEY_MISMATCH", "event", `Keys in event ${i} do not match previous event's next key commitments`);
      }
    }
    if (isDelegatedEvent(event)) {
      const inception = events[0]?.event;
      const delegatorAid = inception?.t === "dip" ? inception.di : undefined;
      const delegationResult = validateDelegationWithDetails(cesrEvent, parentKel, delegatorAid);
      checks.delegationValid = delegationResult;
      if (!delegationResult.passed) {
        let errorCode;
        if (delegationResult.missingParentKel) {
          errorCode = "MISSING_PARENT_KEL";
        } else {
          const REASON_TO_CODE = {
            "parent-signatures-invalid": "PARENT_SIGNATURE_INVALID",
            "parent-said-mismatch": "PARENT_SIGNATURE_INVALID",
            "parent-event-not-found": "PARENT_SIGNATURE_INVALID",
            "parent-aid-mismatch": "PARENT_SIGNATURE_INVALID",
            "anchor-seal-missing": "PARENT_SIGNATURE_INVALID",
            "missing-seal-source": "PARENT_SIGNATURE_INVALID"
          };
          const reason = delegationResult.vrcFailureReason;
          errorCode = reason && REASON_TO_CODE[reason] || "PARENT_SIGNATURE_INVALID";
        }
        fail(errorCode, "attachment", delegationResult.error ?? "Delegation validation failed", delegationResult.parentAid);
      }
    }
    if (state) {
      const sn = SequenceNumber.parse(event.s);
      if (!sn.ok || sn.value !== i) {
        const message = `Sequence number mismatch at event ${i}: expected ${state.expectedSequence}, got ${event.s}`;
        checks.sequenceValid = { passed: false, error: message };
        fail("SEQUENCE_INVALID", "event", message);
      } else {
        checks.sequenceValid = { passed: true };
      }
    }
    if (state && i > 0 && event.i !== state.kelAid) {
      const message = `AID mismatch at event ${i}: expected ${state.kelAid}, got ${event.i}`;
      checks.aidValid = checks.aidValid?.passed === false ? checks.aidValid : { passed: false, error: message };
      fail("AID_INCONSISTENT", "chain", message);
    }
    if (state && i === 0 && event.t !== "icp" && event.t !== "dip") {
      const message = `First event must be icp or dip, got ${event.t}`;
      checks.inceptionFirst = { passed: false, error: message };
      fail("FIRST_EVENT_NOT_INCEPTION", "chain", message);
    }
    const inceptionIlk = events[0]?.event.t;
    if (i > 0 && event.t === "rot" && inceptionIlk === "dip") {
      fail("ROTATION_ILK_MISMATCH", "event", `ROTATION_ILK_MISMATCH: a delegated AID must rotate with drt, got rot at index ${i}`);
    } else if (i > 0 && event.t === "drt" && inceptionIlk === "icp") {
      fail("ROTATION_ILK_MISMATCH", "event", `ROTATION_ILK_MISMATCH: a non-delegated AID must rotate with rot, got drt at index ${i}`);
    }
    if (state) {
      const removed = (event.t === "rot" || event.t === "drt") && state.inceptionTraits.size > 0 ? [...state.inceptionTraits].find((trait) => !(event.c ?? []).includes(trait)) : undefined;
      if (state.inceptionTraits.has("EO") && event.t === "ixn") {
        const message = `Establishment-only (EO) AID cannot have interaction event at ${i}`;
        checks.configTraitsValid = { passed: false, error: message };
        fail("CONFIG_TRAIT_VIOLATION", "event", message);
      } else if (removed !== undefined) {
        const message = `Rotation at event ${i} removes inception trait '${removed}'`;
        checks.configTraitsValid = { passed: false, error: message };
        fail("CONFIG_TRAIT_REMOVED", "event", message);
      } else {
        checks.configTraitsValid = { passed: true };
      }
    }
    if (isEstablishmentEvent(event)) {
      const dupKeys = checkArrayUniqueness(event.k);
      const dupNextDigests = checkArrayUniqueness(event.n);
      const keyErrors = [
        ...dupKeys.length > 0 ? [
          {
            code: "DUPLICATE_KEYS",
            message: `Duplicate signing keys at event ${i}: ${dupKeys.join(", ")}`
          }
        ] : [],
        ...dupNextDigests.length > 0 ? [
          {
            code: "DUPLICATE_NEXT_DIGESTS",
            message: `Duplicate next key digests at event ${i}: ${dupNextDigests.join(", ")}`
          }
        ] : []
      ];
      checks.uniqueKeys = keyErrors.length === 0 ? { passed: true } : { passed: false, error: keyErrors.map((e) => e.message).join("; ") };
      for (const e of keyErrors) {
        fail(e.code, "event", e.message);
      }
    }
    if (state && isEstablishmentEvent(event)) {
      const witnessCount = state.witnesses.size;
      const bt = Threshold.witness(state.witnessThreshold, witnessCount);
      const witnessNotes = state.notes.filter((n) => n.code === "malformed-witnesses");
      const witnessErrors = [
        ...bt.ok ? [] : [
          {
            code: "WITNESS_THRESHOLD_UNSATISFIABLE",
            message: `Witness threshold invalid at event ${i}: ${bt.error.message}`
          }
        ],
        ...witnessNotes.length > 0 ? [{ code: "WITNESS_DELTA_INVALID", message: witnessNotes[0].message }] : []
      ];
      checks.witnessesValid = witnessErrors.length === 0 ? { passed: true } : { passed: false, error: witnessErrors.map((e) => e.message).join("; ") };
      for (const e of witnessErrors) {
        fail(e.code, "event", e.message);
      }
    }
    if (state && options?.mode === "fully-witnessed" && isEstablishmentEvent(event)) {
      const btResult = Threshold.witness(state.witnessThreshold, state.witnesses.size);
      const bt = btResult.ok ? btResult.value : 0;
      if (bt > 0) {
        const rctAttachments = getRctAttachments(cesrEvent);
        let receiptSigInvalid = false;
        const verifiedReceipts = rctAttachments.filter((rct) => {
          if (!state.witnesses.has(rct.by))
            return false;
          const sigValid = verifyWitnessReceipt({ by: rct.by, sig: rct.sig }, event);
          if (!sigValid)
            receiptSigInvalid = true;
          return sigValid;
        });
        const receiptErrors = [
          ...receiptSigInvalid ? [
            {
              code: "WITNESS_RECEIPT_SIGNATURE_INVALID",
              message: `Witness receipt signature verification failed at event ${i}`
            }
          ] : [],
          ...verifiedReceipts.length < bt ? [
            {
              code: "WITNESS_RECEIPT_THRESHOLD_NOT_MET",
              message: `Witness receipt threshold not met at event ${i}: ${verifiedReceipts.length} verified receipts, need ${bt}`
            }
          ] : []
        ];
        checks.witnessReceiptsValid = receiptErrors.length === 0 ? { passed: true } : { passed: false, error: receiptErrors.map((e) => e.message).join("; ") };
        for (const e of receiptErrors) {
          fail(e.code, "attachment", e.message);
        }
      }
    }
    if (isEstablishmentEvent(event)) {
      lastEstablishment = event;
    }
    eventDetails.push({
      eventIndex: i,
      eventType,
      eventSaid: event.d,
      checks,
      errors
    });
    const allChecksPassed = Object.values(checks).every((check) => check === undefined || check.passed);
    if (!allChecksPassed) {
      overallValid = false;
    }
  }
  return {
    valid: overallValid,
    eventDetails,
    firstError
  };
}
function validateKelChain(events, options) {
  const states = reduceKelState(events);
  return validateKel(events, states, options);
}
function validateSignedIcp(cesr, options) {
  return validateKelChain([cesr], options);
}

// src/kel/ops.ts
function ksnToKeyState(ksn) {
  return {
    aid: ksn.i,
    seqNo: SequenceNumber.of(ksn.s),
    digest: ksn.d,
    currentKeys: ksn.k,
    threshold: ksn.kt,
    nextKeyDigests: ksn.n
  };
}
function toEventRef(env, index) {
  return {
    event: env.event,
    index,
    said: env.event.d
  };
}
function isEstablishmentType(t) {
  return t === "icp" || t === "rot" || t === "dip" || t === "drt";
}
function isCesrEvent(value) {
  if (!value || typeof value !== "object")
    return false;
  const event = value.event;
  if (!isValidKeriEvent(event))
    return false;
  const e = event;
  return typeof e.s === "string" && typeof e.d === "string";
}
var KELOps;
((KELOps) => {
  function forKEL(aid, events) {
    const refs = events.map(toEventRef);
    return {
      head() {
        return refs.length > 0 ? refs[refs.length - 1] : undefined;
      },
      inception() {
        const first = refs[0];
        if (!first)
          return;
        const t = first.event.t;
        if (t === "icp" || t === "dip") {
          return first;
        }
        return;
      },
      ksn() {
        return KSNs.fromKEL(aid, events);
      },
      eventsByType(type) {
        return refs.filter((r) => r.event.t === type);
      },
      eventAtSequence(sn) {
        return refs.find((r) => {
          const parsed = SequenceNumber.parse(r.event.s);
          return parsed.ok && parsed.value === sn;
        });
      },
      length() {
        return refs.length;
      },
      isEmpty() {
        return refs.length === 0;
      },
      lastEstablishment() {
        for (let i = refs.length - 1;i >= 0; i--) {
          const ref = refs[i];
          if (isEstablishmentType(ref.event.t)) {
            return ref;
          }
        }
        return;
      },
      currentKeySet() {
        const lastEst = this.lastEstablishment();
        if (!lastEst)
          return;
        const evt = lastEst.event;
        return {
          kt: evt.kt,
          k: evt.k,
          nt: evt.nt,
          n: evt.n,
          from: evt,
          index: lastEst.index
        };
      },
      previousNextKeyCommitment() {
        const establishments = [];
        for (const ref of refs) {
          if (isEstablishmentType(ref.event.t)) {
            establishments.push(ref);
          }
        }
        if (establishments.length < 2)
          return;
        const prev = establishments[establishments.length - 2];
        const evt = prev.event;
        return {
          threshold: evt.nt,
          digests: evt.n,
          establishment: evt,
          establishmentIndex: prev.index
        };
      },
      interactions() {
        return refs.filter((r) => r.event.t === "ixn");
      },
      bySAID(said) {
        return refs.find((r) => r.said === said);
      }
    };
  }
  KELOps.forKEL = forKEL;
  function validateAppend(existingEvents, candidate, options) {
    const allEvents = [...existingEvents, candidate];
    const startIndex = existingEvents.length;
    const result = validateKelChain(allEvents, { ...options, startIndex });
    const candidateDetail = result.eventDetails[0];
    if (!candidateDetail) {
      const error = {
        code: "MISSING_REQUIRED_FIELD",
        scope: "event",
        severity: "error",
        message: "No validation detail",
        eventIndex: startIndex
      };
      return {
        ok: false,
        errors: [error],
        validation: {
          eventIndex: startIndex,
          eventType: candidate.event.t,
          eventSaid: candidate.event.d,
          checks: {
            isValidKeriEvent: { passed: false, error: "No detail" },
            saidValid: { passed: false },
            requiredFieldsPresent: { passed: false },
            signaturesValid: { passed: false },
            thresholdMet: { passed: false }
          },
          errors: [error]
        }
      };
    }
    if (candidateDetail.errors.length > 0) {
      const lead = candidateDetail.errors.find((e) => !APPEND_PENDING_ERROR_CODES.has(e.code));
      const errors = lead === undefined ? candidateDetail.errors : [lead, ...candidateDetail.errors.filter((e) => e !== lead)];
      return { ok: false, errors, validation: candidateDetail };
    } else {
      return { ok: true, validation: candidateDetail };
    }
  }
  KELOps.validateAppend = validateAppend;
  function validateSupersede(kelUpToNminus1, existingFromN, rot) {
    const invalid = (reason) => err({ kind: "kel-invalid", reason });
    if (!isCesrEvent(rot))
      return invalid("superseding event is not a KEL event");
    if (kelUpToNminus1.length === 0 || !kelUpToNminus1.every(isCesrEvent))
      return invalid("no prior KEL to recover on");
    if (existingFromN.length === 0 || !existingFromN.every(isCesrEvent))
      return invalid("nothing to supersede");
    if (!existingFromN.every((e) => e.event.t === "ixn"))
      return invalid("only ixn events may be superseded");
    if (rot.event.s !== existingFromN[0].event.s)
      return invalid("rotation is not at the first superseded sn");
    const prior = kelUpToNminus1[kelUpToNminus1.length - 1].event.d;
    if (rot.event.p !== prior)
      return invalid(`p is not the SAID at sn N-1 (${prior})`);
    const t = rot.event.t;
    if (kelUpToNminus1[0].event.t === "dip")
      return err({ kind: "supersede-unsupported", case: "delegated" });
    if (t === "drt")
      return err({ kind: "supersede-unsupported", case: "delegated" });
    else if (t === "icp" || t === "dip" || t === "ixn")
      return invalid(`a ${t} cannot supersede`);
    else if (t !== "rot")
      return invalid(`unknown event type ${String(t)}`);
    const appended = validateAppend([...kelUpToNminus1], rot);
    if (!appended.ok)
      return invalid(appended.errors.map((e) => e.message).join("; "));
    const forged = appended.validation.checks.signaturesValid.dropped?.find((d) => d.reason === "signature-invalid");
    if (forged)
      return invalid(`signature at keyIndex ${forged.keyIndex} does not verify`);
    return ok(true);
  }
  KELOps.validateSupersede = validateSupersede;
  const APPEND_PENDING_ERROR_CODES = new Set([
    "THRESHOLD_NOT_MET",
    "KT_UNMET",
    "PRIOR_NT_UNMET",
    "ONDEX_MISMATCH",
    "MISSING_PARENT_KEL",
    "PARENT_SIGNATURE_INVALID",
    "PARENT_THRESHOLD_NOT_MET"
  ]);
  function isOnlyPendingSignatureFailures(validation) {
    return validation.errors.length > 0 && validation.errors.every((e) => APPEND_PENDING_ERROR_CODES.has(e.code));
  }
  KELOps.isOnlyPendingSignatureFailures = isOnlyPendingSignatureFailures;
  const SIGNATURE_PENDING_ERROR_CODES = new Set([
    "THRESHOLD_NOT_MET",
    "KT_UNMET",
    "PRIOR_NT_UNMET",
    "ONDEX_MISMATCH"
  ]);
  function isAwaitingSignatures(validation) {
    return validation.errors.some((e) => SIGNATURE_PENDING_ERROR_CODES.has(e.code));
  }
  KELOps.isAwaitingSignatures = isAwaitingSignatures;
  KELOps.resolveCurrentKeys = resolveCurrentKeys;
  KELOps.matchKeyRevelation = matchKeyRevelation;
  KELOps.planRotation = planRotation;
  function isDoNotDelegate(events) {
    if (events.length === 0)
      return false;
    const first = events[0].event;
    if (first.t !== "icp" && first.t !== "dip")
      return false;
    const c = first.c;
    return Array.isArray(c) && c.includes("DND");
  }
  KELOps.isDoNotDelegate = isDoNotDelegate;
  function isNonTransferable(events) {
    if (events.length === 0)
      return false;
    const first = events[0].event;
    if (first.t !== "icp" && first.t !== "dip")
      return false;
    const n = first.n;
    return Array.isArray(n) && n.length === 0;
  }
  KELOps.isNonTransferable = isNonTransferable;
  KELOps.buildNextCommitment = buildNextCommitment;
  KELOps.reduceKelState = reduceKelState;
  KELOps.validateKel = validateKel;
  KELOps.validateKelChain = validateKelChain;
  KELOps.validateSignedIcp = validateSignedIcp;
  KELOps.isValidKeriEvent = isValidKeriEvent;
  KELOps.validateEventSaid = validateEventSaid;
  KELOps.validateRequiredFields = validateRequiredFields;
  KELOps.validateKeyChain = validateKeyChain;
  KELOps.validateAnchorTargets = validateAnchorTargets;
  function eventsEqual(a, b) {
    return a.event.d === b.event.d;
  }
  KELOps.eventsEqual = eventsEqual;
  function kelEqual(a, b) {
    if (a.length !== b.length)
      return false;
    return a.every((evt, i) => eventsEqual(evt, b[i]));
  }
  KELOps.kelEqual = kelEqual;
  function extractKeyState(events) {
    if (events.length === 0) {
      return { ok: false, error: { kind: "missing-inception" } };
    }
    const validation = validateKelChain(events);
    if (!validation.valid) {
      const err = validation.firstError;
      return {
        ok: false,
        error: {
          kind: "broken-chain",
          seqNo: err?.eventIndex ?? 0,
          reason: err?.code ?? "unknown validation failure"
        }
      };
    }
    const inceptionAid = events[0].event.i;
    const ksn = KSNs.fromKEL(inceptionAid, events);
    if (!ksn) {
      return { ok: false, error: { kind: "missing-inception" } };
    }
    return { ok: true, keyState: ksnToKeyState(ksn) };
  }
  KELOps.extractKeyState = extractKeyState;
  function validateControllerSignature(event, existingSignatures, signature, signingKeys) {
    const errors = [];
    if (signature.keyIndex < 0 || signature.keyIndex >= signingKeys.length) {
      errors.push({
        code: "KEY_INDEX_OUT_OF_RANGE",
        message: `keyIndex ${signature.keyIndex} is out of range for ${signingKeys.length} signing keys`
      });
      return { ok: false, errors };
    }
    if (existingSignatures.some((s) => s.keyIndex === signature.keyIndex)) {
      errors.push({
        code: "DUPLICATE_SIGNATURE",
        message: `keyIndex ${signature.keyIndex} already has a signature`
      });
      return { ok: false, errors };
    }
    const eventBytes = encodeEventBytes(event);
    const publicKey = signingKeys[signature.keyIndex];
    const valid = verify(publicKey, signature.sig, eventBytes);
    if (!valid) {
      errors.push({
        code: "SIGNATURE_INVALID",
        message: `Signature at keyIndex ${signature.keyIndex} does not verify against signing key`
      });
      return { ok: false, errors };
    }
    return { ok: true };
  }
  KELOps.validateControllerSignature = validateControllerSignature;
})(KELOps ||= {});

// src/requirements/types.ts
init_esm();

// src/tel/types.ts
init_esm();
var VcpEventSchema = Type.Object({
  v: VersionSchema,
  t: Type.Literal("vcp"),
  d: CesrDigestSchema,
  i: CesrDigestSchema,
  ii: CesrAidSchema,
  s: Type.Literal("0"),
  c: Type.Array(Type.String(), { default: [] }),
  bt: ThresholdSchema,
  b: Type.Array(CesrAidSchema),
  n: Type.Optional(Type.String())
}, { additionalProperties: false });
var VrtEventSchema = Type.Object({
  v: VersionSchema,
  t: Type.Literal("vrt"),
  d: CesrDigestSchema,
  i: CesrDigestSchema,
  p: CesrDigestSchema,
  s: NonEmpty("Sequence Number"),
  bt: ThresholdSchema,
  br: Type.Array(CesrAidSchema),
  ba: Type.Array(CesrAidSchema)
}, { additionalProperties: false });
var IssEventSchema = Type.Object({
  v: VersionSchema,
  t: Type.Literal("iss"),
  d: CesrDigestSchema,
  i: CesrDigestSchema,
  s: NonEmpty("Sequence Number"),
  ri: CesrDigestSchema,
  dt: TimestampSchema
}, { additionalProperties: false });
var RevEventSchema = Type.Object({
  v: VersionSchema,
  t: Type.Literal("rev"),
  d: CesrDigestSchema,
  i: CesrDigestSchema,
  s: NonEmpty("Sequence Number"),
  ri: CesrDigestSchema,
  p: CesrDigestSchema,
  dt: TimestampSchema
}, { additionalProperties: false });
var BisEventSchema = Type.Object({
  v: VersionSchema,
  t: Type.Literal("bis"),
  d: CesrDigestSchema,
  i: CesrDigestSchema,
  ii: CesrAidSchema,
  s: NonEmpty("Sequence Number"),
  ra: CesrSealSchema,
  dt: TimestampSchema
}, { additionalProperties: false });
var BrvEventSchema = Type.Object({
  v: VersionSchema,
  t: Type.Literal("brv"),
  d: CesrDigestSchema,
  i: CesrDigestSchema,
  s: NonEmpty("Sequence Number"),
  p: CesrDigestSchema,
  ra: CesrSealSchema,
  dt: TimestampSchema
}, { additionalProperties: false });
var RegistryEventSchema = Type.Union([VcpEventSchema, VrtEventSchema]);
var CredentialEventSchema = Type.Union([IssEventSchema, RevEventSchema, BisEventSchema, BrvEventSchema]);
var TelEventSchema = Type.Union([RegistryEventSchema, CredentialEventSchema]);
var RSNSchema = Type.Object({
  v: VersionSchema,
  i: CesrDigestSchema,
  s: NonEmpty("Sequence Number"),
  d: CesrDigestSchema,
  et: Type.Union([
    Type.Literal("vcp"),
    Type.Literal("vrt"),
    Type.Literal("iss"),
    Type.Literal("rev"),
    Type.Literal("bis"),
    Type.Literal("brv")
  ]),
  bt: ThresholdSchema,
  b: Type.Array(CesrAidSchema),
  c: Type.Array(Type.String(), { default: [] })
}, { additionalProperties: false });

// src/requirements/field-predicate.ts
init_esm();
var OPS = [
  "eq",
  "neq",
  "contains",
  "startsWith",
  "oneOf",
  "present",
  "gt",
  "gte",
  "lt",
  "lte",
  "between",
  "after",
  "before",
  "on",
  "ageGte",
  "withinLast",
  "true",
  "false"
];
var FIELD_TYPES = ["string", "number", "boolean", "date", "email", "url", "choice", "schema", "identity"];
var FieldPredicateSchema = Type.Object({
  path: Type.String({ minLength: 1 }),
  fieldType: Type.Optional(Type.Union(FIELD_TYPES.map((t) => Type.Literal(t)))),
  op: Type.Union(OPS.map((o) => Type.Literal(o))),
  value: Type.Optional(Type.Union([Type.String(), Type.Number()])),
  value2: Type.Optional(Type.Union([Type.String(), Type.Number()])),
  values: Type.Optional(Type.Array(Type.String()))
}, { additionalProperties: false });
var OP_VALUE_KIND = {
  eq: "single",
  neq: "single",
  contains: "single",
  startsWith: "single",
  oneOf: "list",
  present: "none",
  gt: "single",
  gte: "single",
  lt: "single",
  lte: "single",
  between: "range",
  after: "single",
  before: "single",
  on: "single",
  ageGte: "single",
  withinLast: "single",
  true: "none",
  false: "none"
};
function predicateHasRequiredValues(op, value, value2, values) {
  const kind = OP_VALUE_KIND[op];
  if (!kind)
    return false;
  switch (kind) {
    case "none":
      return true;
    case "single":
      return predicateValueIsPresent(value);
    case "range":
      return predicateValueIsPresent(value) && predicateValueIsPresent(value2);
    case "list":
      return (values?.length ?? 0) > 0 || predicateValueIsPresent(value);
  }
}
function predicateValueIsPresent(value) {
  if (typeof value === "number")
    return Number.isFinite(value);
  return typeof value === "string" && value.trim().length > 0;
}
function asString(value) {
  if (value === null || value === undefined)
    return null;
  if (typeof value === "string")
    return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return null;
}
function asNumber(value) {
  if (typeof value === "number" && Number.isFinite(value))
    return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
function predicateStringValue(value) {
  return typeof value === "string" ? value : null;
}
function predicateNumberValue(value) {
  return asNumber(value);
}
function asDateMs(value) {
  const text = asString(value);
  if (!text)
    return null;
  const ms = Date.parse(text);
  return Number.isNaN(ms) ? null : ms;
}
function ageYearsFromDate(value, nowMs) {
  const ms = asDateMs(value);
  if (ms === null)
    return null;
  const diffMs = nowMs - ms;
  return diffMs / (365.25 * 24 * 60 * 60 * 1000);
}
function evaluateStringPredicate(value, predicate) {
  const target = predicateStringValue(predicate.value);
  switch (predicate.op) {
    case "present":
      return value !== null && value !== undefined && asString(value) !== "";
    case "eq":
      return target !== null && asString(value) === target;
    case "neq":
      return target !== null && asString(value) !== target;
    case "contains": {
      const text = asString(value);
      return text !== null && target !== null ? text.includes(target) : false;
    }
    case "startsWith": {
      const text = asString(value);
      return text !== null && target !== null ? text.startsWith(target) : false;
    }
    case "oneOf": {
      const text = asString(value);
      const options = predicate.values ?? (target ? target.split(",").map((value) => value.trim()) : []);
      return text !== null && options.includes(text);
    }
    default:
      return false;
  }
}
function evaluateNumberPredicate(value, predicate) {
  const n = asNumber(value);
  if (n === null)
    return false;
  const target = predicateNumberValue(predicate.value);
  const target2 = predicateNumberValue(predicate.value2);
  switch (predicate.op) {
    case "eq":
      return target !== null && n === target;
    case "neq":
      return target !== null && n !== target;
    case "gt":
      return target !== null && n > target;
    case "gte":
      return target !== null && n >= target;
    case "lt":
      return target !== null && n < target;
    case "lte":
      return target !== null && n <= target;
    case "between":
      return target !== null && target2 !== null && n >= target && n <= target2;
    default:
      return false;
  }
}
function evaluateDatePredicate(value, predicate, nowMs) {
  const ms = asDateMs(value);
  if (ms === null && predicate.op !== "present")
    return false;
  const target = asDateMs(predicate.value);
  const target2 = asDateMs(predicate.value2);
  switch (predicate.op) {
    case "after":
      return target !== null && ms !== null && ms > target;
    case "before":
      return target !== null && ms !== null && ms < target;
    case "on": {
      if (target === null || ms === null)
        return false;
      return new Date(ms).toISOString().slice(0, 10) === new Date(target).toISOString().slice(0, 10);
    }
    case "between":
      return target !== null && target2 !== null && ms !== null && ms >= target && ms <= target2;
    case "ageGte": {
      const age = ageYearsFromDate(value, nowMs);
      const minAge = predicateNumberValue(predicate.value);
      return age !== null && minAge !== null && age >= minAge;
    }
    case "withinLast": {
      const days = predicateNumberValue(predicate.value);
      if (days === null || ms === null)
        return false;
      const windowMs = days * 24 * 60 * 60 * 1000;
      return nowMs - ms <= windowMs;
    }
    default:
      return false;
  }
}
function evaluateEnumPredicate(value, predicate) {
  const text = asString(value);
  const target = predicateStringValue(predicate.value);
  const options = predicate.values ?? (target ? [target] : []);
  switch (predicate.op) {
    case "eq":
      return text !== null && target !== null && text === target;
    case "neq":
      return text !== null && target !== null && text !== target;
    case "oneOf":
      return text !== null && options.includes(text);
    default:
      return false;
  }
}
function evaluateBooleanPredicate(value, predicate) {
  const bool = typeof value === "boolean" ? value : value === "true" ? true : value === "false" ? false : null;
  if (bool === null)
    return false;
  if (predicate.op === "true")
    return bool === true;
  if (predicate.op === "false")
    return bool === false;
  return false;
}
function evaluateFieldPredicate(value, predicate, fieldType, nowMs) {
  if (!predicateHasRequiredValues(predicate.op, predicate.value, predicate.value2, predicate.values)) {
    return false;
  }
  switch (fieldType) {
    case "number":
      return evaluateNumberPredicate(value, predicate);
    case "date":
      return evaluateDatePredicate(value, predicate, nowMs);
    case "choice":
      return evaluateEnumPredicate(value, predicate);
    case "boolean":
      return evaluateBooleanPredicate(value, predicate);
    case "email":
    case "url":
    case "string":
    case "schema":
      return evaluateStringPredicate(value, predicate);
    case "identity":
      return false;
  }
}

// src/requirements/types.ts
var MAX_REQUIREMENT_DEPTH = 16;
var AidSchema = Type.Unsafe(Type.String({ minLength: 1 }));
var SaidSchema = Type.Unsafe(Type.String({ minLength: 1 }));
var MaxDepthSchema = Type.Optional(Type.Integer({ minimum: 1, maximum: MAX_REQUIREMENT_DEPTH }));
var SourcesListSchema = Type.Optional(Type.Array(Type.Union([Type.Literal("expected"), Type.Literal("oobi"), Type.Literal("in-line")]), {
  minItems: 1,
  uniqueItems: true
}));
var IsMemberSchema = Type.Object({
  type: Type.Literal("is-member"),
  parentAID: AidSchema,
  maxDepth: MaxDepthSchema,
  sources: Type.Optional(Type.Object({ lineageKels: SourcesListSchema }, { additionalProperties: false }))
}, { additionalProperties: false });
var HolderSchema = Type.Union([
  Type.Object({ type: Type.Literal("subject") }, { additionalProperties: false }),
  Type.Object({ type: Type.Literal("holder-is-member"), parentAID: AidSchema, maxDepth: MaxDepthSchema }, { additionalProperties: false }),
  Type.Object({ type: Type.Literal("member-of-holder"), parentAID: AidSchema, maxDepth: MaxDepthSchema }, { additionalProperties: false })
]);
var IssuerSchema = Type.Union([
  Type.Object({ type: Type.Literal("any-of"), aids: Type.Array(AidSchema, { minItems: 1 }) }, { additionalProperties: false }),
  Type.Object({ type: Type.Literal("any") }, { additionalProperties: false }),
  Type.Object({ type: Type.Literal("self-asserted") }, { additionalProperties: false })
]);
var DisclosureFieldSchema = Type.Object({
  path: Type.String({ minLength: 1 }),
  required: Type.Boolean(),
  purpose: Type.Optional(Type.String())
}, { additionalProperties: false });
var ACDC_ONLY_METADATA = [
  "issuerAID",
  "credentialOOBI",
  "telOOBI",
  "acdcSAID"
];
var MetadataDisclosureSchema = Type.Object({
  field: Type.Union([
    Type.Literal("issuerAID"),
    Type.Literal("holderAID"),
    Type.Literal("credentialOOBI"),
    Type.Literal("telOOBI"),
    Type.Literal("acdcSAID")
  ]),
  required: Type.Boolean(),
  purpose: Type.Optional(Type.String())
}, { additionalProperties: false });
var CredentialDisclosureSchema = Type.Object({ fields: Type.Array(DisclosureFieldSchema), metadata: Type.Array(MetadataDisclosureSchema) }, { additionalProperties: false });
var HasCredentialSchema = Type.Object({
  type: Type.Literal("has-credential"),
  issuer: IssuerSchema,
  holder: HolderSchema,
  credential: Type.Object({ schema: ACDCSchemaSchema, predicates: Type.Array(FieldPredicateSchema) }, { additionalProperties: false }),
  sources: Type.Optional(Type.Object({
    issuerKel: SourcesListSchema,
    delegatorKels: SourcesListSchema,
    registryTel: SourcesListSchema,
    credentialTel: SourcesListSchema,
    acdc: SourcesListSchema,
    lineageKels: SourcesListSchema
  }, { additionalProperties: false })),
  disclosure: CredentialDisclosureSchema
}, { additionalProperties: false });
var RequirementSchema = Type.Recursive((Self) => Type.Union([
  IsMemberSchema,
  HasCredentialSchema,
  Type.Object({ type: Type.Union([Type.Literal("and"), Type.Literal("or")]), requirements: Type.Record(Type.String(), Self) }, { additionalProperties: false })
]), { $id: "Requirement" });
var OnboardingResourceSchema = Type.Union([
  Type.Object({ type: Type.Literal("url"), url: Type.String({ minLength: 1 }) }, { additionalProperties: false }),
  Type.Object({ type: Type.Literal("email"), email: Type.String({ minLength: 1 }) }, { additionalProperties: false }),
  Type.Object({ type: Type.Literal("kerits"), aid: AidSchema }, { additionalProperties: false }),
  Type.Object({ type: Type.Literal("kerits"), user: Type.String({ minLength: 1 }) }, { additionalProperties: false })
]);
var PolicySchema = Type.Object({
  d: SaidSchema,
  purpose: Type.Optional(Type.String()),
  onboarding: Type.Optional(Type.Array(OnboardingResourceSchema, { minItems: 1 })),
  requirement: RequirementSchema
}, { additionalProperties: false });
function isOobiRef(x) {
  return typeof x === "object" && x !== null && !Array.isArray(x) && "oobi" in x && !("value" in x);
}
function isRequiredRef(x) {
  return typeof x === "object" && x !== null && !Array.isArray(x) && "oobi" in x && "value" in x;
}
var refOf = (s) => Type.Union([
  s,
  Type.Object({ oobi: Type.String({ minLength: 1 }) }, { additionalProperties: false }),
  Type.Object({ oobi: Type.String({ minLength: 1 }), value: s }, { additionalProperties: false })
]);
var KelRefSchema = refOf(Type.Array(CESREventSchema));
var SuppliedIsMemberEvidenceSchema = Type.Object({
  type: Type.Literal("is-member"),
  lineage: Type.Array(AidSchema, { minItems: 1 }),
  kels: Type.Record(Type.String(), KelRefSchema)
}, { additionalProperties: false });
var SuppliedEvidenceSchema = Type.Recursive((Self) => Type.Union([
  SuppliedIsMemberEvidenceSchema,
  Type.Object({
    type: Type.Literal("has-credential"),
    acdc: refOf(ACDCCredentialSchema),
    registryTel: refOf(Type.Array(RegistryEventSchema)),
    credentialTel: refOf(Type.Array(CredentialEventSchema)),
    kels: Type.Record(Type.String(), KelRefSchema),
    membership: Type.Optional(SuppliedIsMemberEvidenceSchema)
  }, { additionalProperties: false }),
  Type.Object({ type: Type.Literal("self-asserted"), attributes: Type.Record(Type.String(), Type.Unknown()) }, { additionalProperties: false }),
  Type.Object({ type: Type.Union([Type.Literal("and"), Type.Literal("or")]), evidence: Type.Record(Type.String(), Self) }, { additionalProperties: false })
]), { $id: "SuppliedEvidence" });

// src/requirements/kel-ancestry.ts
function delegatorOf(kel) {
  const states = reduceKelState(kel);
  return states[states.length - 1]?.delegatorAid;
}
function validAt(aid, kels, depth, seen) {
  if (depth < 1 || seen.has(aid))
    return false;
  const kel = Object.hasOwn(kels, aid) ? kels[aid] : undefined;
  if (!Array.isArray(kel) || kel.length === 0)
    return false;
  const first = kel[0]?.event;
  if (first?.i !== aid)
    return false;
  if (first.t !== "dip")
    return validateKelChain(kel).valid;
  const di = first.di;
  if (typeof di !== "string" || !validAt(di, kels, depth - 1, new Set([...seen, aid])))
    return false;
  return validateKelChain(kel, { parentKel: kels[di] }).valid;
}
function validateKelWithAncestors(aid, kels, depth = MAX_REQUIREMENT_DEPTH) {
  try {
    return validAt(aid, kels, depth, new Set);
  } catch {
    return false;
  }
}

// src/requirements/chain-freshness.ts
function diff(mine, other, said, isRotation, isInteraction) {
  const saidOrEmpty = (t) => {
    try {
      return said(t);
    } catch {
      return "";
    }
  };
  let sn = 0;
  try {
    for (;sn < Math.min(mine.length, other.length); sn++) {
      const m = mine[sn];
      const o = other[sn];
      const [ms, os] = [said(m), said(o)];
      if (ms === os)
        continue;
      if (isInteraction(m) && isRotation(o))
        return { kind: "superseded", sn, by: "other", rotation: os, superseded: ms };
      if (isRotation(m) && isInteraction(o))
        return { kind: "superseded", sn, by: "mine", rotation: ms, superseded: os };
      return { kind: "forked", sn, mine: ms, other: os };
    }
    if (mine.length === other.length)
      return { kind: "identical" };
    return { kind: "extends", longer: mine.length > other.length ? "mine" : "other", sn: sn - 1 };
  } catch {
    const at = (c) => sn < c.length ? saidOrEmpty(c[sn]) : "";
    return { kind: "forked", sn, mine: at(mine), other: at(other) };
  }
}
function choose(supplied, store, said) {
  const absent = (c) => !c || c.length === 0;
  if (absent(store))
    return absent(supplied) ? err("missing") : ok(supplied);
  if (absent(supplied))
    return ok(store);
  const d = diff(store, supplied, said, () => false, () => false);
  switch (d.kind) {
    case "identical":
      return ok(store);
    case "extends":
      return d.longer === "other" ? ok(supplied) : err("stale");
    case "superseded":
    case "forked":
      return err("forked");
    default: {
      const unknown = d;
      throw new Error(`Unsupported chain diff: ${String(unknown)}`);
    }
  }
}
var ChainFreshness = { choose, diff };
var TelFreshness = {
  choose: (supplied, store) => choose(supplied, store, (ev) => ev.d)
};

// src/requirements/kel-freshness.ts
function diff2(mine, other) {
  const d = ChainFreshness.diff(mine, other, (ev) => {
    const said = ev.event.d;
    if (typeof said !== "string")
      throw new Error("malformed KEL event: no SAID");
    return said;
  }, (ev) => ev.event.t === "rot" || ev.event.t === "drt", (ev) => ev.event.t === "ixn");
  if (d.kind !== "superseded")
    return d;
  const forked = {
    kind: "forked",
    sn: d.sn,
    mine: d.by === "mine" ? d.rotation : d.superseded,
    other: d.by === "other" ? d.rotation : d.superseded
  };
  try {
    const [withRot, withIxn] = d.by === "mine" ? [mine, other] : [other, mine];
    const v = KELOps.validateSupersede(withRot.slice(0, d.sn), withIxn.slice(d.sn), withRot[d.sn]);
    if (v.ok)
      return d;
    switch (v.error.kind) {
      case "supersede-unsupported":
        return { kind: "supersede-unsupported", sn: d.sn, by: d.by, case: v.error.case };
      case "kel-invalid":
        return forked;
      default: {
        const unknown = v.error;
        throw new Error(`Unsupported supersede error: ${String(unknown)}`);
      }
    }
  } catch {
    return forked;
  }
}
function choose2(aid, supplied, store, ancestors) {
  try {
    const validated = (kel) => validateKelWithAncestors(aid, { ...ancestors, [aid]: kel }) ? ok(kel) : err("kel-invalid");
    const absent = (c) => !c || c.length === 0;
    if (absent(store))
      return absent(supplied) ? err("kel-missing") : validated(supplied);
    if (absent(supplied))
      return ok(store);
    const d = diff2(store, supplied);
    switch (d.kind) {
      case "identical":
        return ok(store);
      case "extends":
        return d.longer === "other" ? validated(supplied) : err("kel-stale");
      case "superseded":
        return d.by === "other" ? validated(supplied) : err("kel-superseded");
      case "supersede-unsupported":
        return err("kel-supersede-unsupported");
      case "forked":
        return err("kel-forked");
      default: {
        const unknown = d;
        throw new Error(`Unsupported KEL diff: ${String(unknown)}`);
      }
    }
  } catch {
    return err("kel-invalid");
  }
}
function outcome(d, ctx) {
  const { aid } = ctx;
  const sources = ["expected", ctx.used];
  switch (d.kind) {
    case "identical":
      return { kind: "also-ingest-known" };
    case "extends":
      return d.longer === "mine" ? { kind: "also-ingest-known" } : { kind: "use-candidate" };
    case "forked":
      return {
        kind: "forked",
        fork: { kind: "kel-forked", aid, sn: d.sn, known: d.mine, candidate: d.other, sources }
      };
    case "superseded":
      if (d.by === "mine")
        return {
          kind: "forked",
          fork: { kind: "kel-superseded", aid, sn: d.sn, known: d.rotation, candidate: d.superseded, sources }
        };
      return ctx.issuerTelImported ? { kind: "not-yet-supported", case: "supersede-recovery-tel", aid, sn: d.sn } : { kind: "use-candidate" };
    case "supersede-unsupported":
      return { kind: "not-yet-supported", case: "supersede-recovery-delegated", aid, sn: d.sn };
    default: {
      const unknown = d;
      throw new Error(`Unsupported KEL diff: ${JSON.stringify(unknown)}`);
    }
  }
}
var KelFreshness = { choose: choose2, diff: diff2, outcome };

// src/challenge/challenge-ops.ts
var CHALLENGE_DOMAIN = "kerits-challenge/v2";
var AUTH_DOMAIN = "kerits-auth/1";
function signingBytes(r, domain = CHALLENGE_DOMAIN) {
  return new TextEncoder().encode(canonical({
    t: domain,
    nonce: r.nonce,
    audience: r.audience,
    aid: r.aid,
    publicKey: r.publicKey,
    subject: r.subject ?? null
  }));
}
function currentKeys(kel, ancestorKels) {
  try {
    const aid = kel[0].event.i;
    if (!validateKelWithAncestors(aid, { ...ancestorKels, [aid]: kel }))
      return;
    return KELOps.forKEL(aid, kel).ksn();
  } catch {
    return;
  }
}
function verify2(c, r, subjectKel, ancestorKels = {}, domain = CHALLENGE_DOMAIN) {
  if (r.nonce !== c.nonce)
    return err({ kind: "nonce-mismatch" });
  if (r.audience !== c.audience)
    return err({ kind: "audience-mismatch" });
  if ((r.subject ?? null) !== (c.subject ?? null))
    return err({ kind: "subject-mismatch" });
  const ksn = currentKeys(subjectKel, ancestorKels);
  if (!ksn)
    return err({ kind: "kel-invalid" });
  if (ksn.i !== r.aid)
    return err({ kind: "aid-mismatch" });
  if (!ksn.k.includes(r.publicKey))
    return err({ kind: "key-not-in-kel" });
  let valid = false;
  try {
    valid = verify(r.publicKey, r.signature, signingBytes(r, domain));
  } catch {
    valid = false;
  }
  return valid ? ok(true) : err({ kind: "signature-invalid" });
}
function chooseKel(aid, local, included, ancestorKels) {
  const local_ = { use: "local" };
  try {
    if (!included || included.length === 0)
      return local_;
    if (!validateKelWithAncestors(aid, { ...ancestorKels, [aid]: included }))
      return local_;
    if (local.length === 0)
      return { use: "included" };
    const d = KelFreshness.diff(local, included);
    switch (d.kind) {
      case "identical":
        return validateKelWithAncestors(aid, { ...ancestorKels, [aid]: local }) ? local_ : { use: "included" };
      case "extends":
        return d.longer === "other" ? { use: "included" } : local_;
      case "superseded":
        return d.by === "other" ? { use: "included" } : local_;
      case "supersede-unsupported":
        return local_;
      case "forked":
        return d.mine === "" ? local_ : { use: "forked", sn: d.sn };
      default: {
        const unknown = d;
        throw new Error(`Unsupported KEL diff: ${String(unknown)}`);
      }
    }
  } catch {
    return local_;
  }
}
function own(kels, aid) {
  const kel = Object.hasOwn(kels, aid) ? kels[aid] : undefined;
  return Array.isArray(kel) ? kel : undefined;
}
function includedKels(r) {
  return Object.fromEntries([
    ...(r.lineage ?? []).flatMap((l) => l.kel ? [[l.aid, l.kel]] : []),
    ...r.kel ? [[r.aid, r.kel]] : []
  ]);
}
function delegatorFor(aid, local, included) {
  const l = own(local, aid);
  const kel = l && l.length > 0 ? l : own(included, aid);
  try {
    return kel && kel.length > 0 ? delegatorOf(kel) : undefined;
  } catch {
    return;
  }
}
function resolveKels(aid, local, included) {
  try {
    const chain = [];
    for (let cur = aid;cur; cur = delegatorFor(cur, local, included)) {
      if (chain.includes(cur) || chain.length >= MAX_REQUIREMENT_DEPTH)
        return err({ kind: "lineage-unresolved", aid: cur });
      chain.push(cur);
    }
    const kels = {};
    const used = [];
    for (const a of chain.reverse()) {
      const choice = chooseKel(a, own(local, a) ?? [], own(included, a), kels);
      if (choice.use === "forked")
        return err({ kind: "kel-forked", aid: a, sn: choice.sn });
      const useIncluded = choice.use === "included";
      const kel = (useIncluded ? own(included, a) : own(local, a)) ?? [];
      if (a !== aid && !validateKelWithAncestors(a, { ...kels, [a]: kel }))
        return err({ kind: "lineage-unresolved", aid: a });
      if (useIncluded)
        used.push(a);
      Object.defineProperty(kels, a, { value: kel, enumerable: true, writable: true, configurable: true });
    }
    return ok({ kels, included: used });
  } catch {
    return err({ kind: "lineage-unresolved", aid });
  }
}
var ChallengeOps = { signingBytes, verify: verify2, includedKels, delegatorFor, resolveKels };

// src/challenge/types.ts
init_esm();
var ChallengeSchema = Type.Object({
  nonce: Type.String({ minLength: 32, maxLength: 128 }),
  expiresAt: Type.Optional(Type.String()),
  subject: Type.Optional(Type.Unsafe(Type.String({ minLength: 1 }))),
  includeKEL: Type.Optional(Type.Boolean()),
  includeRemotes: Type.Optional(Type.Boolean())
}, { additionalProperties: false });
var ChallengeResponseSchema = Type.Object({
  nonce: Type.String({ minLength: 32, maxLength: 128 }),
  audience: Type.String({ minLength: 1 }),
  aid: Type.Unsafe(Type.String({ minLength: 1 })),
  publicKey: Type.Unsafe(Type.String({ minLength: 1 })),
  subject: Type.Optional(Type.Unsafe(Type.String({ minLength: 1 }))),
  kel: Type.Optional(Type.Array(CESREventSchema, { maxItems: 1024 })),
  lineage: Type.Optional(Type.Array(Type.Object({
    aid: Type.Unsafe(Type.String({ minLength: 1 })),
    kel: Type.Optional(Type.Array(CESREventSchema, { maxItems: 1024 }))
  }, { additionalProperties: false }), { maxItems: 16 })),
  remotes: Type.Optional(Type.Array(Type.Object({ aid: Type.Unsafe(Type.String({ minLength: 1 })), kelUri: Type.String({ minLength: 1 }) }, { additionalProperties: false }), { maxItems: 17 })),
  signature: Type.Unsafe(Type.String({ minLength: 1 }))
}, { additionalProperties: false });
// src/common/base64.ts
var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var LOOKUP = new Uint8Array(128);
for (let i = 0;i < CHARS.length; i++)
  LOOKUP[CHARS.charCodeAt(i)] = i;
var STANDARD_BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;
function encodeBase64(bytes) {
  if (bytes.length === 0)
    return "";
  let result = "";
  const len = bytes.length;
  const remainder = len % 3;
  const mainLen = len - remainder;
  for (let i = 0;i < mainLen; i += 3) {
    const n = bytes[i] << 16 | bytes[i + 1] << 8 | bytes[i + 2];
    result += CHARS[n >> 18 & 63] + CHARS[n >> 12 & 63] + CHARS[n >> 6 & 63] + CHARS[n & 63];
  }
  if (remainder === 1) {
    const n = bytes[mainLen];
    result += `${CHARS[n >> 2 & 63]}${CHARS[n << 4 & 63]}==`;
  } else if (remainder === 2) {
    const n = bytes[mainLen] << 8 | bytes[mainLen + 1];
    result += `${CHARS[n >> 10 & 63]}${CHARS[n >> 4 & 63]}${CHARS[n << 2 & 63]}=`;
  }
  return result;
}
function decodeBase64(encoded) {
  if (encoded === "")
    return new Uint8Array(0);
  if (encoded.includes("-") || encoded.includes("_")) {
    throw new Error("decodeBase64: input contains base64url characters (- or _). Use standard base64.");
  }
  if (encoded.length % 4 !== 0) {
    throw new Error("decodeBase64: input length is not a multiple of 4 (missing padding).");
  }
  if (!STANDARD_BASE64_RE.test(encoded)) {
    throw new Error("decodeBase64: input contains invalid characters.");
  }
  const padLen = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
  const byteLen = encoded.length * 3 / 4 - padLen;
  const bytes = new Uint8Array(byteLen);
  const strLen = encoded.length - (padLen > 0 ? 4 : 0);
  let j = 0;
  let i = 0;
  for (;i < strLen; i += 4) {
    const n = LOOKUP[encoded.charCodeAt(i)] << 18 | LOOKUP[encoded.charCodeAt(i + 1)] << 12 | LOOKUP[encoded.charCodeAt(i + 2)] << 6 | LOOKUP[encoded.charCodeAt(i + 3)];
    bytes[j++] = n >> 16 & 255;
    bytes[j++] = n >> 8 & 255;
    bytes[j++] = n & 255;
  }
  if (padLen === 1) {
    const n = LOOKUP[encoded.charCodeAt(i)] << 18 | LOOKUP[encoded.charCodeAt(i + 1)] << 12 | LOOKUP[encoded.charCodeAt(i + 2)] << 6;
    bytes[j++] = n >> 16 & 255;
    bytes[j++] = n >> 8 & 255;
  } else if (padLen === 2) {
    const n = LOOKUP[encoded.charCodeAt(i)] << 18 | LOOKUP[encoded.charCodeAt(i + 1)] << 12;
    bytes[j++] = n >> 16 & 255;
  }
  return bytes;
}
// src/common/errors.ts
class CoreError extends Error {
  code;
  details;
  constructor(message, code, details) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
function warnContinued(where, error) {
  console.warn(`[kerits] continued past ${where}:`, error);
}

class ValidationError extends CoreError {
  constructor(message, details) {
    super(message, "VALIDATION_ERROR", details);
  }
}

class NotFoundError extends CoreError {
  constructor(message, details) {
    super(message, "NOT_FOUND", details);
  }
}

class ConflictError extends CoreError {
  constructor(message, details) {
    super(message, "CONFLICT", details);
  }
}

class PermissionError extends CoreError {
  constructor(message, details) {
    super(message, "PERMISSION_DENIED", details);
  }
}

class NetworkError extends CoreError {
  constructor(message, details) {
    super(message, "NETWORK_ERROR", details);
  }
}

class ThresholdError extends CoreError {
  constructor(message, details) {
    super(message, "THRESHOLD_NOT_MET", details);
  }
}

class VerificationError extends CoreError {
  constructor(message, details) {
    super(message, "VERIFICATION_FAILED", details);
  }
}

class ControllerNotFoundError extends CoreError {
  constructor(message, details) {
    super(message, "CONTROLLER_NOT_FOUND", details);
  }
}
var VaultErrorCode = {
  VAULT_APPEND_FAILED: "VAULT_APPEND_FAILED",
  VAULT_KEY_NOT_FOUND: "VAULT_KEY_NOT_FOUND",
  VAULT_CORRUPTED: "VAULT_CORRUPTED",
  VAULT_PERMISSION_DENIED: "VAULT_PERMISSION_DENIED"
};
var KelErrorCode = {
  KEL_APPEND_FAILED: "KEL_APPEND_FAILED",
  KEL_VERIFICATION_FAILED: "KEL_VERIFICATION_FAILED",
  KEL_SEQUENCE_ERROR: "KEL_SEQUENCE_ERROR",
  KEL_NOT_FOUND: "KEL_NOT_FOUND"
};
var ValidationErrorCode = {
  INVALID_THRESHOLD: "INVALID_THRESHOLD",
  INVALID_KEY_FORMAT: "INVALID_KEY_FORMAT",
  INVALID_SIGNATURE: "INVALID_SIGNATURE",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_AID: "INVALID_AID",
  INVALID_SAID: "INVALID_SAID"
};
function createStructuredValidationError(code, message, details) {
  return {
    type: "validation",
    code,
    message,
    details
  };
}
function isStructuredValidationError(error) {
  return typeof error === "object" && error !== null && "type" in error && error.type === "validation" && "code" in error && "message" in error;
}
// src/common/key-conversions.ts
function transferableKeyToPublicKey(key) {
  return key;
}
// src/crypto/envelope/aad.ts
function buildAAD(aad) {
  const clean = {
    contentType: aad.contentType,
    ownerAid: aad.ownerAid,
    path: aad.path
  };
  if (aad.version !== undefined) {
    clean.version = aad.version;
  }
  return new TextEncoder().encode(canonical(clean));
}
// node_modules/jose/dist/webapi/lib/buffer_utils.js
var encoder2 = new TextEncoder;
var decoder2 = new TextDecoder;
var strictDecoder = new TextDecoder("utf-8", { fatal: true });
var UINT32_RANGE = 2 ** 32;
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0), buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers)
    buf.set(buffer, i), i += buffer.length;
  return buf;
}
function writeUInt32BE(buf, value, offset) {
  if (value < 0 || value >= UINT32_RANGE)
    throw new RangeError(`value must be >= 0 and <= ${UINT32_RANGE - 1}. Received ${value}`);
  buf.set([value >>> 24, value >>> 16, value >>> 8, value & 255], offset);
}
function uint64be(value) {
  const high = Math.floor(value / UINT32_RANGE), low = value % UINT32_RANGE, buf = new Uint8Array(8);
  return writeUInt32BE(buf, high, 0), writeUInt32BE(buf, low, 4), buf;
}
function uint32be(value) {
  const buf = new Uint8Array(4);
  return writeUInt32BE(buf, value), buf;
}
var NON_ASCII = /[^\x00-\x7f]/;
function encode3(string) {
  if (typeof string == "string" && string.length >= 128) {
    if (NON_ASCII.test(string))
      throw new TypeError("non-ASCII string encountered in encode()");
    return encoder2.encode(string);
  }
  const bytes = new Uint8Array(string.length);
  for (let i = 0;i < string.length; i++) {
    const code = string.charCodeAt(i);
    if (code > 127)
      throw new TypeError("non-ASCII string encountered in encode()");
    bytes[i] = code;
  }
  return bytes;
}
function encodeBase642(input, url = false) {
  if (Uint8Array.prototype.toBase64)
    return input.toBase64({ alphabet: url ? "base64url" : "base64", omitPadding: url });
  const CHUNK_SIZE = 32768, arr = [];
  for (let i = 0;i < input.length; i += CHUNK_SIZE)
    arr.push(String.fromCharCode.apply(null, input.subarray(i, i + CHUNK_SIZE)));
  const encoded = btoa(arr.join(""));
  return url ? encoded.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_") : encoded;
}
function decodeBase642(encoded, url = false) {
  if (Uint8Array.fromBase64)
    return Uint8Array.fromBase64(encoded, { alphabet: url ? "base64url" : "base64" });
  if (url) {
    if (encoded.includes("+") || encoded.includes("/"))
      throw new TypeError("Invalid base64url");
    encoded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  }
  const binary = atob(encoded), bytes = new Uint8Array(binary.length);
  for (let i = 0;i < binary.length; i++)
    bytes[i] = binary.charCodeAt(i);
  return bytes;
}
async function digest(algorithm, data) {
  const subtleDigest = `SHA-${algorithm.slice(-3)}`;
  return new Uint8Array(await crypto.subtle.digest(subtleDigest, data));
}

// node_modules/jose/dist/webapi/util/errors.js
class JOSEError extends Error {
  static code = "ERR_JOSE_GENERIC";
  code = "ERR_JOSE_GENERIC";
  constructor(message, options) {
    super(message, options), this.name = this.constructor.name, Error.captureStackTrace?.(this, this.constructor);
  }
}
class JOSEAlgNotAllowed extends JOSEError {
  static code = "ERR_JOSE_ALG_NOT_ALLOWED";
  code = "ERR_JOSE_ALG_NOT_ALLOWED";
}

class JOSENotSupported extends JOSEError {
  static code = "ERR_JOSE_NOT_SUPPORTED";
  code = "ERR_JOSE_NOT_SUPPORTED";
}

class JWEDecryptionFailed extends JOSEError {
  static code = "ERR_JWE_DECRYPTION_FAILED";
  code = "ERR_JWE_DECRYPTION_FAILED";
  constructor(message = "decryption operation failed", options) {
    super(message, options);
  }
}

class JWEInvalid extends JOSEError {
  static code = "ERR_JWE_INVALID";
  code = "ERR_JWE_INVALID";
}

// node_modules/jose/dist/webapi/util/base64url.js
var invalid = "The input to be decoded is not correctly encoded.";
function decode3(input) {
  try {
    return decodeBase642(typeof input == "string" ? input : decoder2.decode(input), true);
  } catch (cause) {
    throw new TypeError(invalid, { cause });
  }
}
function encode4(input) {
  return encodeBase642(typeof input == "string" ? encoder2.encode(input) : input, true);
}

// node_modules/jose/dist/webapi/lib/validate.js
function assertUint8Array(input, label) {
  if (!(input instanceof Uint8Array))
    throw new TypeError(`${label} must be an instance of Uint8Array`);
}
function isObject(input) {
  if (typeof input != "object" || input === null || Object.prototype.toString.call(input) !== "[object Object]")
    return false;
  const prototype = Object.getPrototypeOf(input);
  return prototype === null || Object.getPrototypeOf(prototype) === null;
}
function isDisjoint(...headers) {
  const parameters = /* @__PURE__ */ new Set;
  for (const header of headers)
    if (header)
      for (const parameter of Object.keys(header)) {
        if (parameters.has(parameter))
          return false;
        parameters.add(parameter);
      }
  return true;
}
function assertNotSet(value, name) {
  if (value !== undefined)
    throw new TypeError(`${name} can only be called once`);
}
function decodeBase64url(value, label, ErrorClass) {
  try {
    return decode3(value);
  } catch (cause) {
    throw new ErrorClass(`Failed to base64url decode the ${label}`, { cause });
  }
}
function encodeAsciiMember(value, label, ErrorClass) {
  try {
    return encode3(value);
  } catch (cause) {
    throw new ErrorClass(`The ${label} is not a valid base64url string`, { cause });
  }
}
function parseJoseHeader(encodedProtectedHeader, ErrorClass, message) {
  let parsed;
  try {
    parsed = JSON.parse(strictDecoder.decode(decode3(encodedProtectedHeader)));
  } catch (cause) {
    throw new ErrorClass(message, { cause });
  }
  if (!isObject(parsed))
    throw new ErrorClass(message);
  return parsed;
}
var JWE_RECOGNIZED = { __proto__: null };
function validateAlgorithms(option, algorithms) {
  if (algorithms !== undefined && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s != "string")))
    throw new TypeError(`"${option}" option must be an array of strings`);
  return algorithms === undefined ? undefined : new Set(algorithms);
}
function validateCritDuplicates(Err, protectedHeader) {
  const { crit } = protectedHeader ?? {};
  if (Array.isArray(crit) && new Set(crit).size !== crit.length)
    throw new Err('"crit" (Critical) Header Parameter MUST NOT contain duplicate values');
}
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== undefined && protectedHeader?.crit === undefined)
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  if (!protectedHeader || protectedHeader.crit === undefined)
    return [];
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input != "string" || input.length === 0))
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  const recognized = recognizedOption === undefined ? recognizedDefault : { __proto__: null, ...recognizedOption, ...recognizedDefault };
  for (const parameter of protectedHeader.crit) {
    if (!(parameter in recognized))
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    if (!Object.hasOwn(joseHeader, parameter) || joseHeader[parameter] === undefined)
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    if (recognized[parameter] && (!Object.hasOwn(protectedHeader, parameter) || protectedHeader[parameter] === undefined))
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
  }
  return protectedHeader.crit;
}
function serializeJoseHeader(Err, header) {
  let serialized, parsed;
  try {
    serialized = JSON.stringify(header), parsed = JSON.parse(serialized);
  } catch (cause) {
    throw new Err("JOSE Header is not valid JSON", { cause });
  }
  if (!isObject(parsed))
    throw new Err("JOSE Header is not a JSON object");
  return [parsed, serialized];
}

// node_modules/jose/dist/webapi/lib/key.js
var tag = (key) => key[Symbol.toStringTag];
var jwkMatchesOp = (entry, key, usage) => {
  const { alg } = entry;
  if (key.use !== undefined) {
    const expected = usage === "sign" || usage === "verify" ? "sig" : "enc";
    if (key.use !== expected)
      throw new TypeError(`Invalid key for this operation, its "use" must be "${expected}" when present`);
  }
  if (key.alg !== undefined && key.alg !== alg)
    throw new TypeError(`Invalid key for this operation, its "alg" must be "${alg}" when present`);
  if (Array.isArray(key.key_ops)) {
    const expectedKeyOp = usage === "encrypt" || usage === "decrypt" ? entry.ops?.[usage === "encrypt" ? 0 : 1] : usage;
    if (expectedKeyOp && !key.key_ops.includes(expectedKeyOp))
      throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${expectedKeyOp}" when present`);
  }
};
async function prepareKey(entry, key, usage) {
  const { alg, secret } = entry, requiresPrivateKey = usage === "decrypt" || usage === "sign";
  if (secret && key instanceof Uint8Array)
    return key;
  let normalized, keyObject;
  if (isObject(key)) {
    if (normalized = normalizeJwk(key), typeof normalized.kty != "string")
      throw invalidKeyType(alg, key, secret);
    if (!(secret ? normalized.kty === "oct" && typeof normalized.k == "string" : normalized.kty !== "oct" && (requiresPrivateKey ? normalized.kty === "AKP" && typeof normalized.priv == "string" || typeof normalized.d == "string" : normalized.d === undefined && normalized.priv === undefined)))
      throw new TypeError(secret ? 'JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present' : `JSON Web Key for this operation must be a ${requiresPrivateKey ? "private" : "public"} JWK`);
    if (jwkMatchesOp(entry, normalized, usage), normalized.kty === "oct")
      return decode3(normalized.k);
    if (!Object.isFrozen(key)) {
      const { key_ops } = key;
      Array.isArray(key_ops) && Object.freeze(key_ops), Object.freeze(key);
    }
  } else {
    if (!isKeyLike(key))
      throw invalidKeyType(alg, key, secret);
    const expectedType = secret ? "secret" : requiresPrivateKey ? "private" : "public";
    if (key.type !== expectedType && (secret || ["secret", "public", "private"].includes(key.type)))
      throw new TypeError(`${tag(key)} instances must be of type "${expectedType}" for the ${alg} algorithm`);
    if (isCryptoKey(key))
      return key;
    if (keyObject = key, keyObject.type === "secret")
      return keyObject.export();
  }
  cache ||= /* @__PURE__ */ new WeakMap;
  const cacheKey = key;
  let cached = cache.get(cacheKey);
  if (cached?.[alg])
    return cached[alg];
  if (cached || cache.set(cacheKey, cached = {}), keyObject && typeof keyObject.toCryptoKey == "function") {
    const isPublic = keyObject.type === "public", crv = nist[keyObject.asymmetricKeyDetails?.namedCurve], params = entry.resolve?.({ crv, asymmetricKeyType: keyObject.asymmetricKeyType }) ?? entry.subtle;
    return cached[alg] = keyObject.toCryptoKey(params, isPublic, entry.usages[isPublic ? 0 : 1]);
  }
  return normalized ??= keyObject.export({ format: "jwk" }), normalized.alg = alg, cached[alg] = await jwkToKey(entry, normalized);
}
var cache;
var nist = {
  __proto__: null,
  prime256v1: "P-256",
  secp384r1: "P-384",
  secp521r1: "P-521"
};
function assertCryptoKey(key) {
  if (!isCryptoKey(key))
    throw new Error("CryptoKey instance expected");
}
var isCryptoKey = (key) => {
  if (key?.[Symbol.toStringTag] === "CryptoKey")
    return true;
  try {
    return key instanceof CryptoKey;
  } catch {
    return false;
  }
};
var isKeyObject = (key) => key?.[Symbol.toStringTag] === "KeyObject";
var isKeyLike = (key) => isCryptoKey(key) || isKeyObject(key);
function message(msg, actual, ...types) {
  if (types.length > 2) {
    const last = types.pop();
    msg += `one of type ${types.join(", ")}, or ${last}.`;
  } else
    types.length === 2 ? msg += `one of type ${types[0]} or ${types[1]}.` : msg += `of type ${types[0]}.`;
  return actual == null ? msg += ` Received ${actual}` : typeof actual == "function" && actual.name ? msg += ` Received function ${actual.name}` : typeof actual == "object" && actual != null && actual.constructor?.name && (msg += ` Received an instance of ${actual.constructor.name}`), msg;
}
var invalidKeyInput = (actual, ...types) => message("Key must be ", actual, ...types);
function invalidKeyType(alg, actual, secret) {
  const types = ["CryptoKey", "KeyObject", "JSON Web Key"];
  return secret && types.push("Uint8Array"), new TypeError(message(`Key for the ${alg} algorithm must be `, actual, ...types));
}
var unusable = (name, prop = "algorithm.name") => new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`);
function checkUsage(key, usage) {
  if (usage && !key.usages.includes(usage))
    throw new TypeError(`CryptoKey does not support this operation, its usages must include ${usage}.`);
}
function checkModulusLength(alg, key) {
  const { modulusLength } = key.algorithm;
  if (typeof modulusLength != "number" || modulusLength < 2048)
    throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
}
function checkCryptoKey(key, expected, usage) {
  const algorithm = key.algorithm;
  if (algorithm.name !== expected.name)
    throw unusable(expected.name);
  if (expected.hash && algorithm.hash?.name !== expected.hash)
    throw unusable(expected.hash, "algorithm.hash");
  if (expected.namedCurve && algorithm.namedCurve !== expected.namedCurve)
    throw unusable(expected.namedCurve, "algorithm.namedCurve");
  if (expected.length !== undefined && algorithm.length !== expected.length)
    throw unusable(expected.length, "algorithm.length");
  checkUsage(key, usage);
}
function snapshotJwk(jwk) {
  return { __proto__: null, ...jwk };
}
function normalizeJwk(jwk) {
  const normalized = snapshotJwk(jwk);
  if (normalized.ext !== undefined && typeof normalized.ext != "boolean")
    throw new TypeError('"ext" (Extractable) Parameter must be a boolean');
  if (normalized.key_ops !== undefined) {
    const value = normalized.key_ops, keyOps = Array.isArray(value) ? [...value] : undefined;
    if (!keyOps || keyOps.some((operation) => typeof operation != "string") || new Set(keyOps).size !== keyOps.length)
      throw new TypeError('"key_ops" (Key Operations) Parameter must be an array of unique strings');
    normalized.key_ops = keyOps;
  }
  return normalized;
}
function validateExtractableOption(extractable) {
  if (extractable !== undefined && typeof extractable != "boolean")
    throw new TypeError('"extractable" option must be a boolean');
  return extractable;
}
async function jwkToKey(entry, jwk, extractable) {
  if (!entry.kty.includes(jwk.kty))
    throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
  const algorithm = entry.resolve?.({ kty: jwk.kty, crv: jwk.crv }) ?? entry.subtle, isPrivate = !!(jwk.d || jwk.priv), keyData = { ...jwk, ext: extractable ?? jwk.ext };
  return keyData.kty !== "AKP" && delete keyData.alg, delete keyData.use, crypto.subtle.importKey("jwk", keyData, algorithm, keyData.ext ?? !isPrivate, jwk.key_ops ?? entry.usages[isPrivate ? 1 : 0]);
}
async function rawKey(key, expected, usage, extractable = false) {
  return key instanceof Uint8Array && (key = await crypto.subtle.importKey("raw", key, expected, extractable, [usage])), checkCryptoKey(key, expected, usage), key;
}

// node_modules/jose/dist/webapi/lib/content_encryption.js
var generateCek = (enc) => crypto.getRandomValues(new Uint8Array(enc.cekBits >> 3));
function checkCekLength(cek, expected) {
  const actual = cek.byteLength << 3;
  if (actual !== expected)
    throw new JWEInvalid(`Invalid Content Encryption Key length. Expected ${expected} bits, got ${actual} bits`);
}
var generateIv = (enc) => crypto.getRandomValues(new Uint8Array(enc.ivBits >> 3));
function checkIvLength(enc, iv) {
  if (iv.length << 3 !== enc.ivBits)
    throw new JWEInvalid("Invalid Initialization Vector length");
}
async function cbcKeySetup(enc, cek, usage) {
  if (!(cek instanceof Uint8Array))
    throw new TypeError(invalidKeyInput(cek, "Uint8Array"));
  const keyLengthBits = enc.cekBits >> 1, encKey = await crypto.subtle.importKey("raw", cek.subarray(keyLengthBits >> 3), "AES-CBC", false, [usage]), macKey = await crypto.subtle.importKey("raw", cek.subarray(0, keyLengthBits >> 3), {
    hash: `SHA-${keyLengthBits << 1}`,
    name: "HMAC"
  }, false, ["sign"]);
  return [encKey, macKey, keyLengthBits];
}
async function cbcHmacTag(macKey, macData, keyLengthBits) {
  return new Uint8Array((await crypto.subtle.sign("HMAC", macKey, macData)).slice(0, keyLengthBits >> 3));
}
async function cbcEncrypt(enc, plaintext, cek, iv, aad) {
  const [encKey, macKey, keyLengthBits] = await cbcKeySetup(enc, cek, "encrypt"), ciphertext = new Uint8Array(await crypto.subtle.encrypt({
    iv,
    name: "AES-CBC"
  }, encKey, plaintext)), al = uint64be(aad.length * 8), macData = concat(aad, iv, ciphertext, al), tag = await cbcHmacTag(macKey, macData, keyLengthBits);
  return { ciphertext, tag, iv };
}
async function timingSafeEqual(a, b) {
  const algorithm = { name: "HMAC", hash: "SHA-256" }, key = await crypto.subtle.generateKey(algorithm, false, ["sign", "verify"]), aHmac = await crypto.subtle.sign(algorithm, key, a);
  return crypto.subtle.verify(algorithm, key, aHmac, b);
}
async function cbcDecrypt(enc, cek, ciphertext, iv, tag, aad) {
  const [encKey, macKey, keyLengthBits] = await cbcKeySetup(enc, cek, "decrypt"), al = uint64be(aad.length * 8), macData = concat(aad, iv, ciphertext, al), expectedTag = await cbcHmacTag(macKey, macData, keyLengthBits);
  try {
    if (await timingSafeEqual(tag, expectedTag))
      return new Uint8Array(await crypto.subtle.decrypt({ iv, name: "AES-CBC" }, encKey, ciphertext));
  } catch {}
  throw new JWEDecryptionFailed;
}
async function encrypt(enc, plaintext, cek, iv, aad) {
  if (!isCryptoKey(cek) && !(cek instanceof Uint8Array))
    throw new TypeError(invalidKeyInput(cek, "CryptoKey", "KeyObject", "Uint8Array", "JSON Web Key"));
  if (iv ? checkIvLength(enc, iv) : iv = generateIv(enc), cek instanceof Uint8Array && checkCekLength(cek, enc.cekBits), enc.cbc)
    return cbcEncrypt(enc, plaintext, cek, iv, aad);
  const encKey = await rawKey(cek, enc.subtle, "encrypt"), encrypted = new Uint8Array(await crypto.subtle.encrypt({
    additionalData: aad,
    iv,
    name: "AES-GCM",
    tagLength: 128
  }, encKey, plaintext));
  return { ciphertext: encrypted.subarray(0, -16), tag: encrypted.subarray(-16), iv };
}
async function decrypt(enc, cek, ciphertext, iv, tag, aad) {
  if (!isCryptoKey(cek) && !(cek instanceof Uint8Array))
    throw new TypeError(invalidKeyInput(cek, "CryptoKey", "KeyObject", "Uint8Array", "JSON Web Key"));
  if (!iv)
    throw new JWEInvalid("JWE Initialization Vector missing");
  if (!tag)
    throw new JWEInvalid("JWE Authentication Tag missing");
  if (!enc.cbc && tag.length !== 16)
    throw new JWEInvalid("Invalid Authentication Tag length");
  if (checkIvLength(enc, iv), cek instanceof Uint8Array && checkCekLength(cek, enc.cekBits), enc.cbc)
    return cbcDecrypt(enc, cek, ciphertext, iv, tag, aad);
  const encKey = await rawKey(cek, enc.subtle, "decrypt");
  try {
    return new Uint8Array(await crypto.subtle.decrypt({
      additionalData: aad,
      iv,
      name: "AES-GCM",
      tagLength: 128
    }, encKey, concat(ciphertext, tag)));
  } catch {
    throw new JWEDecryptionFailed;
  }
}

// node_modules/jose/dist/webapi/lib/key_descriptor.js
function table(entries) {
  const out = { __proto__: null };
  for (const alg in entries)
    out[alg] = { ...entries[alg], alg };
  return out;
}

// node_modules/jose/dist/webapi/lib/jwe_algorithms.js
var wrap = [
  ["encrypt", "wrapKey"],
  ["decrypt", "unwrapKey"]
];
var derive = [[], ["deriveBits"]];
var none = [[], []];
function rsaes(bits) {
  return {
    kty: ["RSA"],
    mode: "key-encryption",
    subtle: { name: "RSA-OAEP", hash: `SHA-${bits}` },
    usages: wrap,
    ops: ["wrapKey", "unwrapKey"]
  };
}
function ecdh2(mode) {
  return {
    kty: ["EC", "OKP"],
    mode,
    subtle: { name: "ECDH" },
    resolve: ({ kty, crv, asymmetricKeyType }) => {
      if (crv === "X25519" || asymmetricKeyType === "x25519")
        return { name: "X25519" };
      if (kty === "OKP")
        throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      return { name: "ECDH", namedCurve: crv };
    },
    usages: derive,
    ops: [undefined, "deriveBits"]
  };
}
function aeskw(bits, gcm = false) {
  return {
    kty: ["oct"],
    mode: "key-wrapping",
    secret: true,
    subtle: { name: gcm ? "AES-GCM" : "AES-KW", length: bits },
    usages: none,
    ops: gcm ? ["encrypt", "decrypt"] : ["wrapKey", "unwrapKey"]
  };
}
function pbes2() {
  return {
    kty: ["oct"],
    mode: "key-wrapping",
    secret: true,
    subtle: { name: "PBKDF2" },
    usages: none,
    ops: ["deriveBits", "deriveBits"]
  };
}
var JWE = table({
  dir: {
    kty: ["oct"],
    mode: "direct-encryption",
    secret: true,
    subtle: { name: "AES-GCM" },
    usages: none,
    ops: ["encrypt", "decrypt"]
  },
  "RSA-OAEP": rsaes(1),
  "RSA-OAEP-256": rsaes(256),
  "RSA-OAEP-384": rsaes(384),
  "RSA-OAEP-512": rsaes(512),
  "ECDH-ES": ecdh2("direct-key-agreement"),
  "ECDH-ES+A128KW": ecdh2("key-agreement-with-key-wrapping"),
  "ECDH-ES+A192KW": ecdh2("key-agreement-with-key-wrapping"),
  "ECDH-ES+A256KW": ecdh2("key-agreement-with-key-wrapping"),
  A128KW: aeskw(128),
  A192KW: aeskw(192),
  A256KW: aeskw(256),
  A128GCMKW: aeskw(128, true),
  A192GCMKW: aeskw(192, true),
  A256GCMKW: aeskw(256, true),
  "PBES2-HS256+A128KW": pbes2(),
  "PBES2-HS384+A192KW": pbes2(),
  "PBES2-HS512+A256KW": pbes2()
});
var contentOps = ["encrypt", "decrypt"];
function contentEncryption(bits, cbc = false) {
  return {
    kty: ["oct"],
    secret: true,
    subtle: { name: cbc ? "AES-CBC" : "AES-GCM", length: bits },
    usages: none,
    ops: contentOps,
    cekBits: bits,
    ivBits: cbc ? 128 : 96,
    cbc
  };
}
var ENC = table({
  A128GCM: contentEncryption(128),
  A192GCM: contentEncryption(192),
  A256GCM: contentEncryption(256),
  "A128CBC-HS256": contentEncryption(256, true),
  "A192CBC-HS384": contentEncryption(384, true),
  "A256CBC-HS512": contentEncryption(512, true)
});
function unsupported(parameter, name) {
  throw new JOSENotSupported(`Invalid or unsupported "${parameter}" (JWE ${name}) header value`);
}
function jweAlgorithm(alg) {
  return (typeof alg == "string" ? JWE[alg] : undefined) ?? unsupported("alg", "Algorithm");
}
function isJWECEKTransport(algorithm) {
  return algorithm.mode === "key-wrapping" || algorithm.mode === "key-encryption" || algorithm.mode === "key-agreement-with-key-wrapping";
}
function jweEncryption(enc) {
  return (typeof enc == "string" ? ENC[enc] : undefined) ?? unsupported("enc", "Encryption Algorithm");
}

// node_modules/jose/dist/webapi/lib/key_management.js
function checkEcdhCryptoKey(key, usage) {
  if (key.algorithm.name !== "ECDH" && key.algorithm.name !== "X25519")
    throw new TypeError("CryptoKey does not support this operation, its algorithm.name must be ECDH or X25519");
  checkUsage(key, usage);
}
async function aeskwWrap(alg, key, cek) {
  const cryptoKey = await rawKey(key, jweAlgorithm(alg).subtle, "wrapKey", true), cryptoKeyCek = await crypto.subtle.importKey("raw", cek, { hash: "SHA-256", name: "HMAC" }, true, ["sign"]);
  return new Uint8Array(await crypto.subtle.wrapKey("raw", cryptoKeyCek, cryptoKey, "AES-KW"));
}
async function aeskwUnwrap(alg, key, encryptedKey) {
  const cryptoKey = await rawKey(key, jweAlgorithm(alg).subtle, "unwrapKey", true), cryptoKeyCek = await crypto.subtle.unwrapKey("raw", encryptedKey, cryptoKey, "AES-KW", { hash: "SHA-256", name: "HMAC" }, true, ["sign"]);
  return new Uint8Array(await crypto.subtle.exportKey("raw", cryptoKeyCek));
}
function checkRsaKey(alg, key, usage) {
  checkCryptoKey(key, jweAlgorithm(alg).subtle, usage), checkModulusLength(alg, key);
}
async function deriveKey(p2s, alg, p2c, key) {
  if (!(p2s instanceof Uint8Array) || p2s.length < 8)
    throw new JWEInvalid("PBES2 Salt Input must be 8 or more octets");
  if (!Number.isSafeInteger(p2c) || Math.sign(p2c) !== 1)
    throw new JWEInvalid("PBES2 Count Input must be a positive integer");
  const salt = concat(encode3(alg), Uint8Array.of(0), p2s), keyLengthBits = parseInt(alg.slice(13, 16), 10), subtleAlg = {
    hash: `SHA-${alg.slice(8, 11)}`,
    iterations: p2c,
    name: "PBKDF2",
    salt
  }, cryptoKey = await rawKey(key, jweAlgorithm(alg).subtle, "deriveBits");
  return new Uint8Array(await crypto.subtle.deriveBits(subtleAlg, cryptoKey, keyLengthBits));
}
function lengthAndInput(input) {
  return concat(uint32be(input.length), input);
}
async function concatKdf(Z, keyDataLength, OtherInfo) {
  const dkLen = keyDataLength >> 3, hashLen = 32, reps = Math.ceil(dkLen / hashLen), dk = new Uint8Array(reps * hashLen);
  for (let i = 1;i <= reps; i++) {
    const hashResult = await digest("sha256", concat(uint32be(i), Z, OtherInfo));
    dk.set(hashResult, (i - 1) * hashLen);
  }
  return dk.slice(0, dkLen);
}
async function ecdhesDeriveKey(publicKey, privateKey, algorithmId, keyDataLength, apu = new Uint8Array, apv = new Uint8Array) {
  checkEcdhCryptoKey(publicKey), checkEcdhCryptoKey(privateKey, "deriveBits");
  const otherInfo = concat(lengthAndInput(encode3(algorithmId)), lengthAndInput(apu), lengthAndInput(apv), uint32be(keyDataLength)), Z = new Uint8Array(await crypto.subtle.deriveBits({
    name: publicKey.algorithm.name,
    public: publicKey
  }, privateKey, publicKey.algorithm.name === "X25519" ? 256 : Math.ceil(parseInt(publicKey.algorithm.namedCurve.slice(-3), 10) / 8) << 3));
  return concatKdf(Z, keyDataLength, otherInfo);
}
function assertEcdhKey(key) {
  assertCryptoKey(key);
  const curve = key.algorithm.namedCurve;
  if (curve !== "P-256" && curve !== "P-384" && curve !== "P-521" && key.algorithm.name !== "X25519")
    throw new JOSENotSupported("ECDH with the provided key is not allowed or not supported by your javascript runtime");
}
function partyInfo(joseHeader, name) {
  const value = joseHeader[name];
  if (value !== undefined) {
    if (typeof value != "string")
      throw new JWEInvalid(`JOSE Header "${name}" (Agreement Party${name === "apu" ? "U" : "V"}Info) invalid`);
    return decodeBase64url(value, name, JWEInvalid);
  }
}
function checkPartyInfo(apu, apv) {
  if (!(apu === undefined || apv === undefined || apu.byteLength !== apv.byteLength)) {
    for (let i = 0;i < apu.byteLength; i++)
      if (apu[i] !== apv[i])
        return;
    throw new JWEInvalid('JOSE Header "apu" and "apv" values must be distinct');
  }
}
function assertEncryptedKey(encryptedKey) {
  if (encryptedKey === undefined)
    throw new JWEInvalid("JWE Encrypted Key missing");
}
function assertNoEncryptedKey(encryptedKey) {
  if (encryptedKey !== undefined)
    throw new JWEInvalid("Encountered unexpected JWE Encrypted Key");
}
function validateMaxPBES2Count(value) {
  if (value !== undefined && value !== 1 / 0 && (!Number.isSafeInteger(value) || value < 1))
    throw new TypeError("maxPBES2Count must be a positive safe integer or Infinity");
}
async function decryptKeyManagement(entry, enc, key, encryptedKey, joseHeader, maxPBES2Count) {
  const { alg } = entry, mode = entry.mode;
  if (mode === "direct-encryption")
    return assertNoEncryptedKey(encryptedKey), key;
  const direct = mode === "direct-key-agreement";
  switch (direct ? assertNoEncryptedKey(encryptedKey) : assertEncryptedKey(encryptedKey), entry.subtle.name) {
    case "ECDH": {
      const { epk } = joseHeader;
      if (!isObject(epk) || ["d", "k", "p", "q", "dp", "dq", "qi", "oth", "priv"].some((parameter) => Object.hasOwn(epk, parameter)))
        throw new JWEInvalid('JOSE Header "epk" (Ephemeral Public Key) missing or invalid');
      assertEcdhKey(key);
      const ephemeralPublicKey = await jwkToKey(entry, epk), partyUInfo = partyInfo(joseHeader, "apu"), partyVInfo = partyInfo(joseHeader, "apv");
      checkPartyInfo(partyUInfo, partyVInfo);
      const derivedKey = await ecdhesDeriveKey(ephemeralPublicKey, key, direct ? enc.alg : alg, direct ? enc.cekBits : parseInt(alg.slice(-5, -2), 10), partyUInfo, partyVInfo);
      if (direct)
        return derivedKey;
      key = derivedKey;
      break;
    }
    case "RSA-OAEP":
      return assertCryptoKey(key), checkRsaKey(alg, key, "decrypt"), new Uint8Array(await crypto.subtle.decrypt("RSA-OAEP", key, encryptedKey));
    case "PBKDF2": {
      if (typeof joseHeader.p2c != "number")
        throw new JWEInvalid('JOSE Header "p2c" (PBES2 Count) missing or invalid');
      const p2cLimit = maxPBES2Count ?? 1e4;
      if (joseHeader.p2c > p2cLimit)
        throw new JWEInvalid('JOSE Header "p2c" (PBES2 Count) out is of acceptable bounds');
      if (typeof joseHeader.p2s != "string")
        throw new JWEInvalid('JOSE Header "p2s" (PBES2 Salt) missing or invalid');
      const p2s = decodeBase64url(joseHeader.p2s, "p2s", JWEInvalid);
      key = await deriveKey(p2s, alg, joseHeader.p2c, key);
      break;
    }
    case "AES-GCM": {
      if (typeof joseHeader.iv != "string")
        throw new JWEInvalid('JOSE Header "iv" (Initialization Vector) missing or invalid');
      if (typeof joseHeader.tag != "string")
        throw new JWEInvalid('JOSE Header "tag" (Authentication Tag) missing or invalid');
      const iv = decodeBase64url(joseHeader.iv, "iv", JWEInvalid), tag = decodeBase64url(joseHeader.tag, "tag", JWEInvalid);
      if (iv.byteLength !== 12)
        throw new JWEInvalid("Invalid Initialization Vector length");
      if (tag.byteLength !== 16)
        throw new JWEInvalid("Invalid Authentication Tag length");
      return decrypt(jweEncryption(alg.slice(0, -2)), key, encryptedKey, iv, tag, new Uint8Array);
    }
  }
  return aeskwUnwrap(alg.slice(-6), key, encryptedKey);
}
async function encryptKeyManagement(entry, enc, inputKey, joseHeader, providedCek, providedParameters = {}) {
  const { alg, mode } = entry, transport = isJWECEKTransport(entry);
  if (providedCek !== undefined && !transport)
    throw new TypeError(`setContentEncryptionKey cannot be called with JWE "alg" (Algorithm) Header ${alg}`);
  let key = await prepareKey(mode === "direct-encryption" ? enc : entry, inputKey, "encrypt");
  if (mode === "direct-encryption")
    return [key, undefined, undefined];
  const cek = transport ? providedCek ?? generateCek(enc) : undefined;
  cek && checkCekLength(cek, enc.cekBits);
  let encryptedKey, parameters;
  switch (entry.subtle.name) {
    case "ECDH": {
      assertEcdhKey(key);
      const { apu: providedApu, apv: providedApv } = providedParameters;
      providedApu !== undefined && assertUint8Array(providedApu, '"apu"'), providedApv !== undefined && assertUint8Array(providedApv, '"apv"');
      const apu = providedApu ?? partyInfo(joseHeader, "apu"), apv = providedApv ?? partyInfo(joseHeader, "apv");
      checkPartyInfo(apu, apv);
      let ephemeralPrivateKey;
      providedParameters.epk !== undefined ? ephemeralPrivateKey = await prepareKey(entry, providedParameters.epk, "decrypt") : ephemeralPrivateKey = (await crypto.subtle.generateKey(key.algorithm, true, ["deriveBits"])).privateKey;
      const subtle = crypto.subtle;
      let exportableEpk = ephemeralPrivateKey;
      if (!exportableEpk.extractable) {
        if (typeof subtle.getPublicKey != "function")
          throw new TypeError('CryptoKey for "epk" must be extractable');
        exportableEpk = await subtle.getPublicKey(ephemeralPrivateKey, []);
      }
      const { x, y, crv, kty } = await subtle.exportKey("jwk", exportableEpk), direct = mode === "direct-key-agreement", derivedKey = await ecdhesDeriveKey(key, ephemeralPrivateKey, direct ? enc.alg : alg, direct ? enc.cekBits : parseInt(alg.slice(-5, -2), 10), apu, apv), epk = { x, crv, kty };
      if (kty === "EC" && (epk.y = y), parameters = { epk }, providedApu !== undefined && (parameters.apu = encode4(providedApu)), providedApv !== undefined && (parameters.apv = encode4(providedApv)), direct)
        return [derivedKey, undefined, parameters];
      key = derivedKey;
      break;
    }
    case "RSA-OAEP": {
      assertCryptoKey(key), checkRsaKey(alg, key, "encrypt"), encryptedKey = new Uint8Array(await crypto.subtle.encrypt("RSA-OAEP", key, cek));
      break;
    }
    case "PBKDF2": {
      const { p2c = 2048, p2s = crypto.getRandomValues(new Uint8Array(16)) } = providedParameters;
      key = await deriveKey(p2s, alg, p2c, key), parameters = { p2c, p2s: encode4(p2s) };
      break;
    }
    case "AES-GCM": {
      const iv = providedParameters.iv === undefined ? crypto.getRandomValues(new Uint8Array(12)) : providedParameters.iv;
      if (!(iv instanceof Uint8Array))
        throw new TypeError('"iv" must be an instance of Uint8Array');
      const wrapped = await encrypt(jweEncryption(alg.slice(0, -2)), cek, key, iv, new Uint8Array);
      encryptedKey = wrapped.ciphertext, parameters = { iv: encode4(wrapped.iv), tag: encode4(wrapped.tag) };
    }
  }
  if (encryptedKey ??= await aeskwWrap(alg.slice(-6), key, cek), !(encryptedKey instanceof Uint8Array) || !encryptedKey.byteLength)
    throw new TypeError("JWE key management algorithm did not produce an Encrypted Key");
  return [cek, encryptedKey, parameters];
}

// node_modules/jose/dist/webapi/lib/deflate.js
function validateZip(joseHeader, protectedHeader) {
  if (joseHeader.zip !== undefined && joseHeader.zip !== "DEF")
    throw new JOSENotSupported('Unsupported JWE "zip" (Compression Algorithm) Header Parameter value.');
  if (joseHeader.zip !== undefined && !protectedHeader?.zip)
    throw new JWEInvalid('JWE "zip" (Compression Algorithm) Header Parameter MUST be in a protected header.');
}
function supported(name) {
  if (typeof globalThis[name] > "u")
    throw new JOSENotSupported(`JWE "zip" (Compression Algorithm) Header Parameter requires the ${name} API.`);
}
async function transform4(stream, input, maxLength = 1 / 0) {
  const writer = stream.writable.getWriter();
  writer.write(input).catch(() => {}), writer.close().catch(() => {});
  const chunks = [];
  let length = 0;
  const reader = stream.readable.getReader();
  for (;; ) {
    const { value, done } = await reader.read();
    if (done)
      break;
    if (chunks.push(value), length += value.byteLength, maxLength !== 1 / 0 && length > maxLength)
      throw await reader.cancel().catch(() => {}), new JWEInvalid("Decompressed plaintext exceeded the configured limit");
  }
  return concat(...chunks);
}
async function compress(input) {
  return supported("CompressionStream"), transform4(new CompressionStream("deflate-raw"), input);
}
async function decompress(input, maxLength) {
  return supported("DecompressionStream"), transform4(new DecompressionStream("deflate-raw"), input, maxLength);
}

// node_modules/jose/dist/webapi/lib/jwe_decrypt.js
function snapshotSharedJWE(jwe) {
  const { aad, ciphertext, iv, protected: encodedProtected, tag, unprotected } = jwe;
  if (iv !== undefined && (typeof iv != "string" || !iv))
    throw new JWEInvalid("JWE Initialization Vector incorrect type");
  if (typeof ciphertext != "string")
    throw new JWEInvalid("JWE Ciphertext missing or incorrect type");
  if (tag !== undefined && (typeof tag != "string" || !tag))
    throw new JWEInvalid("JWE Authentication Tag incorrect type");
  if (encodedProtected !== undefined && typeof encodedProtected != "string")
    throw new JWEInvalid("JWE Protected Header incorrect type");
  if (aad !== undefined && (typeof aad != "string" || !aad))
    throw new JWEInvalid("JWE AAD incorrect type");
  if (unprotected !== undefined && !isObject(unprotected))
    throw new JWEInvalid("JWE Shared Unprotected Header incorrect type");
  return {
    aad,
    ciphertext,
    iv,
    protected: encodedProtected,
    tag,
    unprotected: unprotected === undefined ? undefined : { ...unprotected }
  };
}
function snapshotRecipientJWE(recipient) {
  let header, headerAlg;
  try {
    const { header: inputHeader } = recipient;
    if (isObject(inputHeader)) {
      headerAlg = inputHeader.alg;
      const parameters = Object.keys(inputHeader);
      parameters.includes("alg") || (headerAlg = undefined), header = Object.fromEntries(parameters.map((parameter) => [
        parameter,
        parameter === "alg" ? headerAlg : inputHeader[parameter]
      ]));
    } else
      header = inputHeader;
    const { encrypted_key: encryptedKey } = recipient;
    return [{ encrypted_key: encryptedKey, header }, headerAlg];
  } catch (error) {
    return [undefined, headerAlg, error];
  }
}
function checkRecipient(jwe) {
  const { encrypted_key: encryptedKey, header } = jwe;
  if (encryptedKey !== undefined && typeof encryptedKey != "string")
    throw new JWEInvalid("JWE Encrypted Key incorrect type");
  if (header !== undefined && !isObject(header))
    throw new JWEInvalid("JWE Per-Recipient Unprotected Header incorrect type");
  if (jwe.protected === undefined && header === undefined && jwe.unprotected === undefined)
    throw new JWEInvalid("JOSE Header missing");
}
function shareJWE(jwe) {
  const { protected: encodedProtected, ciphertext, iv, tag, aad } = jwe;
  let protectedHeader;
  return encodedProtected !== undefined && (protectedHeader = parseJoseHeader(encodedProtected, JWEInvalid, "JWE Protected Header is invalid")), [
    protectedHeader,
    decodeBase64url(ciphertext, "ciphertext", JWEInvalid),
    iv !== undefined ? decodeBase64url(iv, "iv", JWEInvalid) : undefined,
    tag !== undefined ? decodeBase64url(tag, "tag", JWEInvalid) : undefined,
    encodeAsciiMember((encodedProtected ?? "") + (aad !== undefined ? `.${aad}` : ""), "aad", JWEInvalid)
  ];
}
function prepareDecrypt(options) {
  const keyManagementAlgorithms = options && validateAlgorithms("keyManagementAlgorithms", options.keyManagementAlgorithms), contentEncryptionAlgorithms = options && validateAlgorithms("contentEncryptionAlgorithms", options.contentEncryptionAlgorithms), { crit, maxPBES2Count, maxDecompressedLength } = options ?? {};
  validateMaxPBES2Count(maxPBES2Count);
  const decompressionLimit = maxDecompressedLength ?? 250000;
  if (decompressionLimit !== 0 && decompressionLimit !== 1 / 0 && (!Number.isSafeInteger(decompressionLimit) || decompressionLimit < 1))
    throw new TypeError("maxDecompressedLength must be 0, a positive safe integer, or Infinity");
  return [
    keyManagementAlgorithms,
    contentEncryptionAlgorithms,
    crit,
    maxPBES2Count,
    maxDecompressedLength
  ];
}
async function decryptJWE(jwe, shared, key, token = shareJWE(jwe)) {
  const [protectedHeader, ciphertext, iv, tag, additionalAuthenticatedData] = token, { header, unprotected, aad } = jwe;
  let joseHeader;
  if (header !== undefined || unprotected !== undefined) {
    if (!isDisjoint(protectedHeader, header, unprotected))
      throw new JWEInvalid("JWE Protected, JWE Unprotected Header, and JWE Per-Recipient Unprotected Header Parameter names must be disjoint");
    joseHeader = { ...protectedHeader, ...header, ...unprotected };
  } else
    joseHeader = protectedHeader ?? {};
  const [keyManagementAlgorithms, contentEncryptionAlgorithms, crit, maxPBES2Count, maxDecompressedLength] = shared, { encrypted_key: encodedKey } = jwe;
  validateCrit(JWEInvalid, JWE_RECOGNIZED, crit, protectedHeader, joseHeader), validateZip(joseHeader, protectedHeader);
  const { alg, enc } = joseHeader;
  if (typeof alg != "string" || !alg)
    throw new JWEInvalid("missing JWE Algorithm (alg) in JWE Header");
  const selected = JWE[alg];
  if (encodedKey === "" && (!selected || !isJWECEKTransport(selected)))
    throw new JWEInvalid("JWE Encrypted Key incorrect type");
  const integrated = selected?.mode === "integrated-encryption";
  if (!integrated && (typeof enc != "string" || !enc))
    throw new JWEInvalid("missing JWE Encryption Algorithm (enc) in JWE Header");
  if (keyManagementAlgorithms && !keyManagementAlgorithms.has(alg) || !keyManagementAlgorithms && alg.startsWith("PBES2"))
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  let encEntry;
  if (integrated) {
    if (enc !== undefined)
      throw new JWEInvalid('JWE "enc" (Encryption Algorithm) Header Parameter must not be present for integrated encryption');
    if (iv?.byteLength)
      throw new JWEInvalid("JWE Initialization Vector must be empty for integrated encryption");
    if (tag?.byteLength)
      throw new JWEInvalid("JWE Authentication Tag must be empty for integrated encryption");
  } else {
    if (contentEncryptionAlgorithms && !contentEncryptionAlgorithms.has(enc))
      throw new JOSEAlgNotAllowed('"enc" (Encryption Algorithm) Header Parameter value not allowed');
    encEntry = jweEncryption(enc);
  }
  let encryptedKey;
  if (encodedKey !== undefined)
    try {
      encryptedKey = decodeBase64url(encodedKey, "encrypted_key", JWEInvalid);
    } catch (error) {
      if (!selected || !isJWECEKTransport(selected))
        throw error;
      encryptedKey = new Uint8Array;
    }
  let resolvedKey = false;
  typeof key == "function" && (key = await key(protectedHeader, jwe), resolvedKey = true);
  const algEntry = selected ?? jweAlgorithm(alg);
  isJWECEKTransport(algEntry) && encryptedKey === undefined && (encryptedKey = new Uint8Array);
  const k = await prepareKey(algEntry.mode === "direct-encryption" ? encEntry : algEntry, key, "decrypt");
  let plaintext;
  if (algEntry.mode === "integrated-encryption")
    plaintext = await algEntry.decrypt(k, encryptedKey, ciphertext, additionalAuthenticatedData, protectedHeader, joseHeader);
  else {
    const encryption = encEntry;
    let cek;
    try {
      cek = await decryptKeyManagement(algEntry, encryption, k, encryptedKey, joseHeader, maxPBES2Count), isJWECEKTransport(algEntry) && cek instanceof Uint8Array && cek.byteLength << 3 !== encryption.cekBits && (cek = generateCek(encryption));
    } catch (err) {
      if (err instanceof TypeError || err instanceof JWEInvalid || err instanceof JOSENotSupported)
        throw err;
      cek = generateCek(encryption);
    }
    plaintext = await decrypt(encryption, cek, ciphertext, iv, tag, additionalAuthenticatedData);
  }
  if (joseHeader.zip === "DEF") {
    const decompressionLimit = maxDecompressedLength ?? 250000;
    if (decompressionLimit === 0)
      throw new JOSENotSupported('JWE "zip" (Compression Algorithm) Header Parameter is not supported.');
    plaintext = await decompress(plaintext, decompressionLimit).catch((cause) => {
      throw cause instanceof JWEInvalid ? cause : new JWEInvalid("Failed to decompress plaintext", { cause });
    });
  }
  return {
    plaintext,
    ...protectedHeader && { protectedHeader },
    ...aad !== undefined && {
      additionalAuthenticatedData: decodeBase64url(aad, "aad", JWEInvalid)
    },
    ...unprotected && { sharedUnprotectedHeader: unprotected },
    ...header && { unprotectedHeader: header },
    ...resolvedKey && { key: k }
  };
}

// node_modules/jose/dist/webapi/jwe/general/decrypt.js
async function generalDecrypt(jwe, key, options) {
  if (!isObject(jwe))
    throw new JWEInvalid("General JWE must be an object");
  const inputRecipients = jwe.recipients;
  if (!Array.isArray(inputRecipients))
    throw new JWEInvalid("JWE Recipients missing or incorrect type");
  const recipients = Array.from(inputRecipients);
  if (!recipients.every(isObject))
    throw new JWEInvalid("JWE Recipients missing or incorrect type");
  if (!recipients.length)
    throw new JWEInvalid("JWE Recipients has no members");
  const shared = prepareDecrypt(options);
  let sharedJwe, token;
  try {
    sharedJwe = snapshotSharedJWE(jwe), token = shareJWE(sharedJwe);
  } catch {
    throw new JWEDecryptionFailed;
  }
  const recipientSnapshots = recipients.map((recipient) => snapshotRecipientJWE(recipient));
  if (recipients.length > 1)
    for (const [, headerAlg] of recipientSnapshots) {
      const alg = token[0]?.alg ?? headerAlg ?? sharedJwe.unprotected?.alg, algEntry = typeof alg == "string" ? JWE[alg] : undefined;
      if (algEntry && !isJWECEKTransport(algEntry))
        throw new JWEInvalid(`"${alg}" alg may only have a single recipient`);
    }
  for (const [recipient] of recipientSnapshots)
    if (recipient)
      try {
        const flattened = { ...sharedJwe, ...recipient };
        return checkRecipient(flattened), await decryptJWE(flattened, shared, key, token);
      } catch {}
  throw new JWEDecryptionFailed;
}

// node_modules/jose/dist/webapi/lib/jwe_encrypt.js
function checkDisjoint(protectedHeader, unprotectedHeader, sharedUnprotectedHeader) {
  if (!isDisjoint(protectedHeader, unprotectedHeader, sharedUnprotectedHeader))
    throw new JWEInvalid("JWE Protected, JWE Shared Unprotected and JWE Per-Recipient Header Parameter names must be disjoint");
}
function checkEncryptHeaders(input, options, sharedHeadersNormalized = false) {
  if (!input[1] && !input[2] && !input[3])
    throw new JWEInvalid("either setProtectedHeader, setUnprotectedHeader, or sharedUnprotectedHeader must be called before #encrypt()");
  options !== undefined && (input[8] = options?.crit);
  let [, protectedHeader, unprotectedHeader, sharedUnprotectedHeader, aad, cek, iv, keyManagementParameters, crit] = input;
  if (aad !== undefined && assertUint8Array(aad, "JWE Additional Authenticated Data"), cek !== undefined && assertUint8Array(cek, "JWE Content Encryption Key"), iv !== undefined && assertUint8Array(iv, "JWE Initialization Vector"), !sharedHeadersNormalized && protectedHeader !== undefined && (protectedHeader = serializeJoseHeader(JWEInvalid, protectedHeader)[0], input[1] = protectedHeader), unprotectedHeader !== undefined && (unprotectedHeader = serializeJoseHeader(JWEInvalid, unprotectedHeader)[0], input[2] = unprotectedHeader), !sharedHeadersNormalized && sharedUnprotectedHeader !== undefined && (sharedUnprotectedHeader = serializeJoseHeader(JWEInvalid, sharedUnprotectedHeader)[0], input[3] = sharedUnprotectedHeader), keyManagementParameters !== undefined && !isObject(keyManagementParameters))
    throw new TypeError("JWE Key Management Parameters must be an object");
  checkDisjoint(protectedHeader, unprotectedHeader, sharedUnprotectedHeader);
  const joseHeader = {
    ...protectedHeader,
    ...unprotectedHeader,
    ...sharedUnprotectedHeader
  };
  validateCritDuplicates(JWEInvalid, protectedHeader), validateCrit(JWEInvalid, JWE_RECOGNIZED, crit, protectedHeader, joseHeader), validateZip(joseHeader, protectedHeader);
  const { alg, enc } = joseHeader;
  if (typeof alg != "string" || !alg)
    throw new JWEInvalid('JWE "alg" (Algorithm) Header Parameter missing or invalid');
  const algEntry = JWE[alg];
  if (algEntry?.mode === "integrated-encryption") {
    if (enc !== undefined)
      throw new JWEInvalid('JWE "enc" (Encryption Algorithm) Header Parameter must not be present for integrated encryption');
    if (cek !== undefined)
      throw new TypeError(`setContentEncryptionKey cannot be called with JWE "alg" (Algorithm) Header ${alg}`);
    if (iv !== undefined)
      throw new TypeError(`setInitializationVector cannot be called with JWE "alg" (Algorithm) Header ${alg}`);
    return [joseHeader, undefined, algEntry];
  }
  if (typeof enc != "string" || !enc)
    throw new JWEInvalid('JWE "enc" (Encryption Algorithm) Header Parameter missing or invalid');
  return [joseHeader, jweEncryption(enc), algEntry];
}
async function encryptJWE(input, checked, key) {
  const [joseHeader, encEntry, selected] = checked, [inputPlaintext, inputProtectedHeader, inputUnprotectedHeader, sharedUnprotectedHeader, aad, providedCek, inputIv, keyManagementParameters, , unprotectedParameters] = input;
  let protectedHeader = inputProtectedHeader, unprotectedHeader = inputUnprotectedHeader;
  const algEntry = selected ?? jweAlgorithm(joseHeader.alg);
  let encryptedKey, parameters, cek;
  algEntry.mode === "integrated-encryption" ? cek = await prepareKey(algEntry, key, "encrypt") : [cek, encryptedKey, parameters] = await encryptKeyManagement(algEntry, encEntry, key, joseHeader, providedCek, keyManagementParameters), parameters && (unprotectedParameters ? unprotectedHeader = unprotectedHeader ? { ...unprotectedHeader, ...parameters } : parameters : protectedHeader = protectedHeader ? { ...protectedHeader, ...parameters } : parameters, checkDisjoint(protectedHeader, unprotectedHeader, sharedUnprotectedHeader));
  const encodedProtectedHeader = protectedHeader ? encode4(JSON.stringify(protectedHeader)) : "", encodedAad = aad?.byteLength ? encode4(aad) : undefined, additionalAuthenticatedData = encode3(encodedAad ? `${encodedProtectedHeader}.${encodedAad}` : encodedProtectedHeader);
  let plaintext = inputPlaintext;
  joseHeader.zip === "DEF" && (plaintext = await compress(plaintext).catch((cause) => {
    throw new JWEInvalid("Failed to compress plaintext", { cause });
  }));
  let ciphertext, tag, iv;
  algEntry.mode === "integrated-encryption" ? [encryptedKey, ciphertext] = await algEntry.encrypt(cek, plaintext, additionalAuthenticatedData, protectedHeader, joseHeader, keyManagementParameters) : { ciphertext, tag, iv } = await encrypt(encEntry, plaintext, cek, inputIv, additionalAuthenticatedData);
  const jwe = {
    ciphertext: encode4(ciphertext)
  };
  return iv && (jwe.iv = encode4(iv)), tag && (jwe.tag = encode4(tag)), encryptedKey?.byteLength && (jwe.encrypted_key = encode4(encryptedKey)), encodedAad && (jwe.aad = encodedAad), protectedHeader && (jwe.protected = encodedProtectedHeader), sharedUnprotectedHeader && (jwe.unprotected = sharedUnprotectedHeader), unprotectedHeader && (jwe.header = unprotectedHeader), jwe;
}

// node_modules/jose/dist/webapi/jwe/general/encrypt.js
class IndividualRecipient {
  #parent;
  state;
  constructor(enc, key, crit) {
    this.#parent = enc, this.state = [undefined, undefined, key, crit];
  }
  setUnprotectedHeader(unprotectedHeader) {
    return assertNotSet(this.state[0], "setUnprotectedHeader"), this.state[0] = unprotectedHeader, this;
  }
  setKeyManagementParameters(parameters) {
    return assertNotSet(this.state[1], "setKeyManagementParameters"), this.state[1] = parameters, this;
  }
  addRecipient(...args) {
    return this.#parent.addRecipient(...args);
  }
  encrypt(...args) {
    return this.#parent.encrypt(...args);
  }
  done() {
    return this.#parent;
  }
}

class GeneralEncrypt {
  #plaintext;
  #recipients = [];
  #protectedHeader;
  #sharedUnprotectedHeader;
  #aad;
  constructor(plaintext) {
    this.#plaintext = plaintext;
  }
  addRecipient(key, options) {
    const recipient = new IndividualRecipient(this, key, options?.crit);
    return this.#recipients.push(recipient), recipient;
  }
  setProtectedHeader(protectedHeader) {
    return assertNotSet(this.#protectedHeader, "setProtectedHeader"), this.#protectedHeader = protectedHeader, this;
  }
  setSharedUnprotectedHeader(sharedUnprotectedHeader) {
    return assertNotSet(this.#sharedUnprotectedHeader, "setSharedUnprotectedHeader"), this.#sharedUnprotectedHeader = sharedUnprotectedHeader, this;
  }
  setAdditionalAuthenticatedData(aad) {
    return this.#aad = aad, this;
  }
  async encrypt() {
    if (!this.#recipients.length)
      throw new JWEInvalid("at least one recipient must be added");
    assertUint8Array(this.#plaintext, "plaintext");
    const multiple = this.#recipients.length > 1;
    let enc, protectedHeader = this.#protectedHeader, sharedUnprotectedHeader = this.#sharedUnprotectedHeader;
    const recipients = [];
    for (const recipient of this.#recipients) {
      const [unprotectedHeader, keyManagementParameters, key, crit] = recipient.state, input = [
        this.#plaintext,
        protectedHeader,
        unprotectedHeader,
        sharedUnprotectedHeader,
        this.#aad,
        undefined,
        undefined,
        keyManagementParameters,
        crit,
        multiple
      ], headers = checkEncryptHeaders(input, undefined, recipients.length > 0);
      recipients.length || (protectedHeader = input[1], sharedUnprotectedHeader = input[3]), recipients.push([input, headers, key]);
      const [{ alg, enc: recipientEnc }, , algEntry] = headers;
      if (multiple && algEntry && !isJWECEKTransport(algEntry))
        throw new JWEInvalid(`"${alg}" alg may only have a single recipient`);
      if (!enc)
        enc = recipientEnc;
      else if (enc !== recipientEnc)
        throw new JWEInvalid('JWE "enc" (Encryption Algorithm) Header Parameter must be the same for all recipients');
    }
    for (const [, headers] of recipients)
      headers[2] ??= jweAlgorithm(headers[0].alg);
    const [firstInput, firstHeaders, firstKey] = recipients[0], cek = multiple ? generateCek(firstHeaders[1]) : undefined;
    firstInput[5] = cek;
    const { encrypted_key, header, ...shared } = await encryptJWE(firstInput, firstHeaders, firstKey), jwe = {
      ...shared,
      recipients: [{}]
    };
    encrypted_key && (jwe.recipients[0].encrypted_key = encrypted_key), header && (jwe.recipients[0].header = header);
    for (let i = 1;i < recipients.length; i++) {
      const [input, [joseHeader, encEntry, algEntry], key] = recipients[i], unprotectedHeader = input[2], [, encryptedKey, parameters] = await encryptKeyManagement(algEntry, encEntry, key, joseHeader, cek, input[7]), target = {
        encrypted_key: encode4(encryptedKey)
      };
      if (unprotectedHeader || parameters) {
        const header2 = { ...unprotectedHeader, ...parameters };
        parameters && checkDisjoint(input[1], header2, input[3]), target.header = header2;
      }
      jwe.recipients.push(target);
    }
    return jwe;
  }
}

// node_modules/jose/dist/webapi/lib/jws_algorithms.js
var sig = [["verify"], ["sign"]];
function hmac2(bits) {
  const subtle = { name: "HMAC", hash: `SHA-${bits}` };
  return { kty: ["oct"], secret: true, subtle, signing: subtle, usages: sig };
}
function rsa(bits, saltLength) {
  const subtle = { name: saltLength ? "RSA-PSS" : "RSASSA-PKCS1-v1_5", hash: `SHA-${bits}` };
  return {
    kty: ["RSA"],
    subtle,
    signing: saltLength ? { ...subtle, saltLength } : subtle,
    usages: sig,
    minRsaBits: 2048
  };
}
function ecdsa2(crv, bits) {
  return {
    kty: ["EC"],
    crv,
    subtle: { name: "ECDSA", namedCurve: crv },
    signing: { name: "ECDSA", hash: `SHA-${bits}` },
    usages: sig
  };
}
function eddsa2() {
  const subtle = { name: "Ed25519" };
  return {
    kty: ["OKP"],
    crv: "Ed25519",
    subtle,
    signing: subtle,
    usages: sig
  };
}
function mldsa(parameterSet) {
  const subtle = { name: `ML-DSA-${parameterSet}` };
  return {
    kty: ["AKP"],
    subtle,
    signing: subtle,
    usages: sig
  };
}
var JWS = table({
  HS256: hmac2(256),
  HS384: hmac2(384),
  HS512: hmac2(512),
  RS256: rsa(256),
  RS384: rsa(384),
  RS512: rsa(512),
  PS256: rsa(256, 32),
  PS384: rsa(384, 48),
  PS512: rsa(512, 64),
  ES256: ecdsa2("P-256", 256),
  ES384: ecdsa2("P-384", 384),
  ES512: ecdsa2("P-521", 512),
  EdDSA: eddsa2(),
  Ed25519: eddsa2(),
  "ML-DSA-44": mldsa(44),
  "ML-DSA-65": mldsa(65),
  "ML-DSA-87": mldsa(87)
});

// node_modules/jose/dist/webapi/lib/key_algorithm.js
function unsupportedAlg(source = 'JWK "alg" (Algorithm) Parameter') {
  throw new JOSENotSupported(`Invalid or unsupported ${source} value`);
}
function keyAlgorithm(alg, source) {
  return (typeof alg == "string" ? JWS[alg] ?? JWE[alg] : undefined) ?? unsupportedAlg(source);
}

// node_modules/jose/dist/webapi/key/import.js
async function importJWK(jwk, alg, options) {
  if (!isObject(jwk))
    throw new TypeError("JWK must be an object");
  const normalized = normalizeJwk(jwk), extractable = validateExtractableOption(options?.extractable), { alg: jwkAlg } = normalized;
  if (alg ??= jwkAlg, normalized.kty !== "oct" && !alg)
    throw new TypeError('"alg" argument is required when "jwk.alg" is not present');
  switch (normalized.kty) {
    case "oct":
      if (typeof normalized.k != "string")
        throw new TypeError('missing "k" (Key Value) Parameter value');
      return decode3(normalized.k);
    case "AKP": {
      if (typeof jwkAlg != "string" || !jwkAlg)
        throw new TypeError('missing "alg" (Algorithm) Parameter value');
      if (alg !== jwkAlg)
        throw new TypeError("JWK alg and alg option value mismatch");
      return jwkToKey(keyAlgorithm(alg), normalized, extractable);
    }
    case "RSA":
    case "EC":
    case "OKP":
      return jwkToKey(keyAlgorithm(alg), normalized, extractable);
    default:
      throw new JOSENotSupported('Unsupported "kty" (Key Type) Parameter value');
  }
}

// src/crypto/envelope/jwe.ts
function asJwe(envelope) {
  return envelope.jwe;
}
function x25519PublicToJwk(publicKey, kid) {
  return {
    kty: "OKP",
    crv: "X25519",
    x: encodeBase64Url(publicKey),
    kid
  };
}
function x25519PrivateToJwk(privateKey, publicKey, kid) {
  return {
    kty: "OKP",
    crv: "X25519",
    x: encodeBase64Url(publicKey),
    d: encodeBase64Url(privateKey),
    kid
  };
}
async function encryptEnvelope(plaintext, recipients, aad) {
  if (recipients.length === 0) {
    throw new Error("encryptEnvelope: recipients must not be empty");
  }
  if (!aad.contentType) {
    throw new Error("encryptEnvelope: contentType must not be empty");
  }
  for (const r of recipients) {
    if (r.publicKey.length !== 32) {
      throw new Error(`encryptEnvelope: publicKey for ${r.keyId} must be 32 bytes, got ${r.publicKey.length}`);
    }
  }
  const aadBytes = buildAAD(aad);
  const enc = new GeneralEncrypt(plaintext).setProtectedHeader({ enc: "A256GCM" }).setAdditionalAuthenticatedData(aadBytes);
  for (const recipient of recipients) {
    const jwk = x25519PublicToJwk(recipient.publicKey, recipient.keyId);
    const key = await importJWK(jwk, "ECDH-ES+A256KW");
    enc.addRecipient(key).setUnprotectedHeader({ kid: recipient.keyId, alg: "ECDH-ES+A256KW" });
  }
  const jwe = await enc.encrypt();
  return { _tag: "EncryptedEnvelope", jwe };
}
async function decryptEnvelope(envelope, unlock, expectedAad) {
  const jwe = asJwe(envelope);
  const expectedAadB64 = encodeBase64Url(buildAAD(expectedAad));
  if (jwe.aad !== expectedAadB64) {
    throw new Error("decryptEnvelope: AAD mismatch — envelope was not created for this path/owner/context");
  }
  const jweRecipients = jwe.recipients ?? [];
  for (const recipient of jweRecipients) {
    const kid = recipient.header?.kid;
    if (!kid)
      continue;
    const privateKeyBytes = await unlock.unlock(kid);
    if (!privateKeyBytes)
      continue;
    if (privateKeyBytes.length !== 32) {
      throw new Error(`decryptEnvelope: unlock key for ${kid} must be 32 bytes, got ${privateKeyBytes.length}`);
    }
    const localKey = new Uint8Array(privateKeyBytes);
    try {
      const publicKeyBytes = x25519.getPublicKey(localKey);
      const jwk = x25519PrivateToJwk(localKey, publicKeyBytes, kid);
      const key = await importJWK(jwk, "ECDH-ES+A256KW");
      const result = await generalDecrypt(jwe, key);
      return new Uint8Array(result.plaintext);
    } finally {
      localKey.fill(0);
    }
  }
  throw new Error("decryptEnvelope: no matching recipient key found");
}
// src/crypto/envelope/serialization.ts
function serializeEnvelope(envelope) {
  return {
    _tag: envelope._tag,
    jwe: envelope.jwe
  };
}
function deserializeEnvelope(data) {
  if (data._tag !== "EncryptedEnvelope") {
    throw new Error(`deserializeEnvelope: expected _tag 'EncryptedEnvelope', got '${String(data._tag)}'`);
  }
  const jwe = data.jwe;
  if (!jwe || typeof jwe !== "object") {
    throw new Error("deserializeEnvelope: missing or invalid jwe field");
  }
  const j = jwe;
  for (const field of ["protected", "iv", "ciphertext", "tag"]) {
    if (typeof j[field] !== "string") {
      throw new Error(`deserializeEnvelope: missing or invalid jwe.${field}`);
    }
  }
  if (!Array.isArray(j.recipients)) {
    throw new Error("deserializeEnvelope: missing or invalid jwe.recipients array");
  }
  if (typeof j.aad !== "string") {
    throw new Error("deserializeEnvelope: missing or invalid jwe.aad");
  }
  return { _tag: "EncryptedEnvelope", jwe };
}
// src/crypto/hkdf-sha256.ts
function hkdfSha256(ikm, salt, info, length) {
  return hkdf(sha256, ikm, salt, info, length);
}
// src/crypto/keypairs.ts
var KeriKeyPairs;
((KeriKeyPairs) => {
  KeriKeyPairs.forPrivateKey = (privateKey) => {
    const publicKeyRaw = ed25519.getPublicKey(privateKey);
    return {
      publicKey: encodeKey(publicKeyRaw, true).qb64,
      privateKey: encodeKey(privateKey, true).qb64,
      transferable: true,
      algo: "ed25519"
    };
  };
  function entropyToSeed(entropy) {
    const seed = new Uint8Array(32);
    const view = new DataView(seed.buffer);
    for (let i = 0;i < 32; i += 4) {
      view.setUint32(i, entropy + i, false);
    }
    return seed;
  }
  KeriKeyPairs.fromSeed = (seed) => {
    if (seed.length !== 32) {
      throw new Error(`Expected 32-byte seed, got ${seed.length} bytes`);
    }
    return KeriKeyPairs.forPrivateKey(seed);
  };
  KeriKeyPairs.fromSeedNumber = (seed) => {
    const privateKey = entropyToSeed(seed);
    return KeriKeyPairs.forPrivateKey(privateKey);
  };
  let keyGenCounter = 0;
  KeriKeyPairs.create = () => {
    const randomBytes = ed25519.utils.randomSecretKey();
    const counter = keyGenCounter++;
    const counterBytes = new Uint8Array(8);
    new DataView(counterBytes.buffer).setBigUint64(0, BigInt(counter), false);
    for (let i = 0;i < 8; i++) {
      const rb = randomBytes[24 + i];
      const cb = counterBytes[i];
      if (rb !== undefined && cb !== undefined) {
        randomBytes[24 + i] = rb ^ cb;
      }
    }
    return KeriKeyPairs.forPrivateKey(randomBytes);
  };
})(KeriKeyPairs ||= {});
// src/crypto/recovery-schedule.ts
var RECOVERY_SCHEDULE_VERSION = "kerits-recovery-v1";
var RECOVERY_EXPAND_SALT = "kerits-recovery-v1";
var ACCOUNT_RECOVERY_PATH_PREFIX = "kerits/v1/account/recovery/signing";
var textEncoder2 = new TextEncoder;
function buildAccountRecoverySigningPath(index) {
  return `${ACCOUNT_RECOVERY_PATH_PREFIX}/${index}`;
}
function buildDeviceRecoverySigningPath(deviceAid, index) {
  return `kerits/v1/device/${deviceAid}/recovery/signing/${index}`;
}
function deriveScheduledEd25519Keypair(seed, infoPath) {
  if (seed.length < 32) {
    throw new Error(`Expected 32+ byte recovery seed, got ${seed.length}`);
  }
  const info = textEncoder2.encode(infoPath);
  const salt = textEncoder2.encode(RECOVERY_EXPAND_SALT);
  const childSeed = hkdfSha256(seed, salt, info, 32);
  const privateKey = childSeed;
  const publicKey = ed25519.getPublicKey(privateKey);
  return { publicKey, privateKey };
}
function recoveryPublicKeyAt(seed, index) {
  const path = buildAccountRecoverySigningPath(index);
  return deriveScheduledEd25519Keypair(seed, path).publicKey;
}
function recoveryCommitmentAt(seed, commitmentIndex) {
  const publicKey = recoveryPublicKeyAt(seed, commitmentIndex);
  return digestVerfer(encodeKey(publicKey, true).qb64);
}
function createInitialRecoveryDerivation(saltBase64Url) {
  return {
    type: "KeritsRecoveryDerivation",
    version: RECOVERY_SCHEDULE_VERSION,
    purpose: "account-recovery",
    curve: "ed25519",
    kdf: {
      name: "argon2id",
      memoryKiB: 262144,
      iterations: 3,
      parallelism: 1,
      salt: saltBase64Url
    },
    expand: "hkdf-sha256",
    pathPrefix: ACCOUNT_RECOVERY_PATH_PREFIX,
    currentIndex: 0,
    nextIndex: 1
  };
}
function advanceRecoveryDerivation(meta) {
  return {
    ...meta,
    currentIndex: meta.currentIndex + 1,
    nextIndex: meta.nextIndex + 1
  };
}
function recoveryKeyDerivationSpec(meta, index) {
  return {
    version: meta.version,
    kdf: "argon2id",
    kdfParams: meta.kdf,
    expand: meta.expand,
    curve: meta.curve,
    path: buildAccountRecoverySigningPath(index),
    index
  };
}
// src/kel/predicates.ts
function isIcp(e) {
  return e.t === "icp";
}
function isRot(e) {
  return e.t === "rot";
}
function isIxn(e) {
  return e.t === "ixn";
}
function isDip(e) {
  return e.t === "dip";
}
function isDrt(e) {
  return e.t === "drt";
}
function isEstablishment2(e) {
  return e.t === "icp" || e.t === "rot" || e.t === "dip" || e.t === "drt";
}

// src/kel/kel-data.ts
var KELData;
((KELData) => {
  KELData.buildIcp = KELEvents.buildIcp;
  KELData.buildDip = KELEvents.buildDip;
  KELData.buildRot = KELEvents.buildRot;
  KELData.buildDrt = KELEvents.buildDrt;
  KELData.buildIxn = KELEvents.buildIxn;
  function prepareIcp(params) {
    const { unsignedEvent } = KELEvents.buildIcp(params);
    const { event, canonFinal } = KELEvents.computeSaid(unsignedEvent, true);
    return { event, bytes: canonFinal.raw };
  }
  KELData.prepareIcp = prepareIcp;
  function prepareDip(params) {
    const { unsignedEvent } = KELEvents.buildDip(params);
    const { event, canonFinal } = KELEvents.computeSaid(unsignedEvent, true);
    return { event, bytes: canonFinal.raw };
  }
  KELData.prepareDip = prepareDip;
  function prepareIxn(params) {
    const { unsignedEvent } = KELEvents.buildIxn(params);
    const { event, canonFinal } = KELEvents.computeSaid(unsignedEvent, false);
    return { event, bytes: canonFinal.raw };
  }
  KELData.prepareIxn = prepareIxn;
  function prepareDelegationAnchorIxn(input) {
    return prepareIxn({
      aid: input.parentAid,
      sequence: input.head.sn + 1,
      priorEventSaid: input.head.said,
      anchors: [{ i: input.childAid, s: input.childEventSn ?? "0", d: input.childEventSaid }]
    });
  }
  KELData.prepareDelegationAnchorIxn = prepareDelegationAnchorIxn;
})(KELData ||= {});
// src/kel/tel-kel-anchor.ts
function assessTelKelAnchor(kelEvents, telEventSaid) {
  const said = telEventSaid.trim();
  if (!said) {
    return { status: "invalid", reason: "telEventSaid is required" };
  }
  for (const event of kelEvents) {
    if (eventContainsAnchorForSaid(event, said)) {
      const kelEventSaid = typeof event.d === "string" ? event.d : "";
      if (!kelEventSaid) {
        return { status: "invalid", reason: "KEL event sealing TEL lacks SAID (d)" };
      }
      return {
        status: "anchored",
        telEventSaid: said,
        kelEventSaid
      };
    }
  }
  return { status: "missing", telEventSaid: said };
}
function assessTelKelAnchors(kelEvents, telEventSaids) {
  return telEventSaids.map((said) => assessTelKelAnchor(kelEvents, said));
}
function anchoredPrefix(events, issuerKelBodies) {
  const firstUnanchored = events.findIndex((ev) => assessTelKelAnchor(issuerKelBodies, ev.d).status !== "anchored");
  return firstUnanchored === -1 ? [...events] : events.slice(0, firstUnanchored);
}
function anchoredLane(events, issuerKelBodies) {
  const prefix = anchoredPrefix(events, issuerKelBodies);
  return prefix.length === 0 ? events.slice(0, 1) : prefix;
}
// src/kel/index.ts
var Kel = {
  ...exports_predicates,
  ...exports_validation_predicates,
  ...exports_rotation,
  ...exports_validation,
  ...exports_event_signing,
  ...KELEvents
};
// src/kel/msig-sign-validation.ts
function fail(code, reason) {
  return { ok: false, code, reason };
}
function thresholdsEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
function arraysEqual(a, b) {
  if (a === undefined && b === undefined)
    return true;
  if (a === undefined || b === undefined)
    return false;
  if (a.length !== b.length)
    return false;
  return a.every((v, i) => v === b[i]);
}
function validateInceptionSignRequest(params) {
  const {
    event,
    expectedEventSaid,
    governance,
    ownPublicKey,
    ownNextKeyDigest,
    participantKeyIndex,
    orchestratorPublicKey,
    orchestratorSignature
  } = params;
  if (event.t !== "icp") {
    return fail("invalid-event-structure", `Expected event type 'icp', got '${event.t}'`);
  }
  const icpEvent = event;
  if (!Array.isArray(icpEvent.k) || icpEvent.k.length === 0) {
    return fail("invalid-event-structure", "Event missing or empty key array (k)");
  }
  if (!Array.isArray(icpEvent.n) || icpEvent.n.length === 0) {
    return fail("invalid-event-structure", "Event missing or empty next-key digest array (n)");
  }
  const eventForDerivation = { ...icpEvent, d: SAID_PLACEHOLDER, i: SAID_PLACEHOLDER };
  const { said: recomputedSaid } = deriveSaid(eventForDerivation, KEL_ICP_SURFACE);
  if (recomputedSaid !== expectedEventSaid) {
    return fail("event-said-mismatch", `Recomputed SAID '${recomputedSaid}' does not match expected '${expectedEventSaid}'`);
  }
  if (icpEvent.k.length !== governance.keyCount) {
    return fail("key-count-mismatch", `Expected ${governance.keyCount} keys, event has ${icpEvent.k.length}`);
  }
  if (!thresholdsEqual(icpEvent.kt, governance.signingThreshold)) {
    return fail("signing-threshold-mismatch", `Event signing threshold ${JSON.stringify(icpEvent.kt)} does not match expected ${JSON.stringify(governance.signingThreshold)}`);
  }
  if (!thresholdsEqual(icpEvent.nt, governance.nextThreshold)) {
    return fail("next-threshold-mismatch", `Event next threshold ${JSON.stringify(icpEvent.nt)} does not match expected ${JSON.stringify(governance.nextThreshold)}`);
  }
  if (governance.witnesses !== undefined) {
    if (!arraysEqual(icpEvent.b, governance.witnesses)) {
      return fail("witnesses-mismatch", `Event witnesses [${icpEvent.b.join(", ")}] do not match expected [${governance.witnesses.join(", ")}]`);
    }
  }
  if (governance.witnessThreshold !== undefined) {
    if (!thresholdsEqual(icpEvent.bt, governance.witnessThreshold)) {
      return fail("witness-threshold-mismatch", `Event witness threshold ${JSON.stringify(icpEvent.bt)} does not match expected ${JSON.stringify(governance.witnessThreshold)}`);
    }
  }
  if (governance.config !== undefined) {
    if (!arraysEqual(icpEvent.c, governance.config)) {
      return fail("config-mismatch", `Event config [${icpEvent.c.join(", ")}] does not match expected [${governance.config.join(", ")}]`);
    }
  }
  if (icpEvent.k[participantKeyIndex] !== ownPublicKey) {
    return fail("own-key-mismatch", `Key at index ${participantKeyIndex} is '${icpEvent.k[participantKeyIndex]}', expected own key '${ownPublicKey}'`);
  }
  if (icpEvent.n[participantKeyIndex] !== ownNextKeyDigest) {
    return fail("own-next-digest-mismatch", `Next digest at index ${participantKeyIndex} is '${icpEvent.n[participantKeyIndex]}', expected '${ownNextKeyDigest}'`);
  }
  const finalizedEvent = { ...icpEvent, d: expectedEventSaid, i: expectedEventSaid };
  const { raw: eventBytes } = serializeForSigning(finalizedEvent, KEL_ICP_SURFACE);
  const sigValid = verify(orchestratorPublicKey, orchestratorSignature, eventBytes);
  if (!sigValid) {
    return fail("orchestrator-sig-invalid", "Orchestrator signature verification failed");
  }
  return { ok: true };
}
// src/keri/canonical-paths.ts
var KERI_PREFIX = "/.well-known/keri";
var CanonicalPaths = {
  kel: (aid) => `${KERI_PREFIX}/aid/${aid}/kel`,
  ksn: (aid) => `${KERI_PREFIX}/aid/${aid}/ksn`,
  aidManifest: (aid) => `${KERI_PREFIX}/aid/${aid}/manifest`,
  oobi: (aid) => `${KERI_PREFIX}/oobi/${aid}`,
  schema: (said) => `${KERI_PREFIX}/said/${said}/schema`,
  acdc: (said) => `${KERI_PREFIX}/said/${said}/acdc`,
  credentialPass: (said) => `${KERI_PREFIX}/said/${said}/pass`,
  tel: (rid) => `${KERI_PREFIX}/registry/${rid}/tel`,
  rsn: (rid) => `${KERI_PREFIX}/registry/${rid}/rsn`,
  event: (said) => `${KERI_PREFIX}/events/${said}/event`,
  receipts: (said) => `${KERI_PREFIX}/events/${said}/receipts`,
  telEvent: (said) => `${KERI_PREFIX}/tel/${said}/event`,
  profile: (aid) => `${KERI_PREFIX}/aid/${aid}/profile`,
  members: (aid) => `${KERI_PREFIX}/aid/${aid}/members`,
  membersAcl: (aid) => `${KERI_PREFIX}/aid/${aid}/members-acl`,
  credentialMetadata: (aid, schemaSaid) => `${KERI_PREFIX}/aid/${aid}/credential-designs/${schemaSaid}`,
  policy: (said) => `/policies/${said}`,
  policyRequirement: (said) => `/policies/${said}/requirement`,
  policyAlias: (aid, slug) => `${KERI_PREFIX}/aid/${aid}/policies/${slug}`,
  policyMetadata: (aid, policySAID) => `${KERI_PREFIX}/aid/${aid}/policies/${policySAID}/metadata`,
  aliasProfile: (alias) => `${KERI_PREFIX}/alias/${alias}/profile`,
  didDocument: (alias) => `/${alias}/did.json`,
  fullUrl: (baseUrl, path) => `${baseUrl.replace(/\/+$/, "")}${path}`,
  baseUrlFromManifest: (manifestUrl) => manifestUrl.replace(/\/\.well-known\/keri\/.*$/, ""),
  resolveAidUrls: (manifestUrl, aid) => {
    const base = manifestUrl.replace(/\/\.well-known\/keri\/.*$/, "");
    return {
      profileUrl: `${base}${CanonicalPaths.profile(aid)}`,
      kelUrl: `${base}${CanonicalPaths.kel(aid)}`,
      ksnUrl: `${base}${CanonicalPaths.ksn(aid)}`,
      oobiUrl: `${base}${CanonicalPaths.oobi(aid)}`,
      membersUrl: `${base}${CanonicalPaths.members(aid)}`
    };
  }
};
// src/keri/profile-alias.ts
var ALIAS_PATTERN = /^[a-zA-Z0-9._-]{1,64}$/;
function parseProfileAlias(raw) {
  if (!ALIAS_PATTERN.test(raw) || raw === "." || raw === "..") {
    return err({
      kind: "invalid-alias",
      message: `Profile alias must match ${ALIAS_PATTERN} and not be '.' or '..' (1-64 alphanumeric, dot, hyphen, underscore). Got: '${raw}'`
    });
  }
  return ok(raw);
}
// src/keri/profile-username.ts
function normalizeDisplayNameToProfileUsername(displayName) {
  return displayName.trim().toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9._-]/g, "").replace(/\.{2,}/g, ".").replace(/^\.+|\.+$/g, "").slice(0, 64);
}
function profileUsernameFromDisplayName(displayName) {
  const candidate = normalizeDisplayNameToProfileUsername(displayName);
  if (!candidate) {
    return err({
      kind: "invalid-username",
      message: "Enter a display name that produces a valid username (letters, numbers, . _ -).",
      candidate
    });
  }
  const parsed = parseProfileAlias(candidate);
  if (!parsed.ok) {
    return err({ kind: "invalid-username", message: parsed.error.message, candidate });
  }
  return ok(parsed.value);
}
// src/keri/usernames.ts
var Usernames;
((Usernames) => {
  Usernames.PATTERN = "^[a-z0-9][a-z0-9._]{1,30}[a-z0-9]$";
  Usernames.MIN_LEN_PAID = 3;
  Usernames.MIN_LEN_ANON = 3;
  Usernames.MAX_LEN = 32;
  const PATTERN_RE = new RegExp(Usernames.PATTERN);
  function minLengthForTier(tier) {
    if (tier === "paid")
      return Usernames.MIN_LEN_PAID;
    if (tier === "free" || tier === "anonymous")
      return Usernames.MIN_LEN_ANON;
    if (tier === "rejected")
      return Number.POSITIVE_INFINITY;
    else {
      const _exhaustive = tier;
      throw new Error(`Unsupported username tier: ${_exhaustive}`);
    }
  }
  Usernames.minLengthForTier = minLengthForTier;
  function parse(raw) {
    const candidate = raw.trim().toLowerCase();
    if (!PATTERN_RE.test(candidate) || candidate.includes("..")) {
      return err({
        kind: "invalid-username",
        message: `Username must be 3–32 chars [a-z0-9._], start and end with a letter or digit, and not contain '..'. Got: '${raw}'`,
        candidate
      });
    }
    return ok(candidate);
  }
  Usernames.parse = parse;
  function suggestFromDisplayName(displayName) {
    const candidate = displayName.trim().toLowerCase().replace(/\s+/g, ".").replace(/-/g, "_").replace(/[^a-z0-9._]/g, "").replace(/\.{2,}/g, ".").replace(/_{2,}/g, "_").replace(/^[._]+|[._]+$/g, "").slice(0, Usernames.MAX_LEN).replace(/^[._]+|[._]+$/g, "");
    if (!candidate) {
      return err({
        kind: "invalid-username",
        message: "Enter a name that produces a valid username (letters, numbers, . or _).",
        candidate
      });
    }
    return parse(candidate);
  }
  Usernames.suggestFromDisplayName = suggestFromDisplayName;
})(Usernames ||= {});
// src/signature/signer.ts
function isEd25519Signer(signer) {
  return signer.algo === "ed25519" && typeof signer.getX25519PublicKey === "function" && typeof signer.deriveX25519HkdfBlake3Key === "function";
}
function isSecp256k1Signer(signer) {
  const s = signer;
  return s?.algo === "secp256k1" && typeof s?.signDigest === "function" && s?.compressedPublicKey instanceof Uint8Array;
}

// src/keys/raw-public-key.ts
function toRawPublicKey(cesr) {
  return decodeKey(cesr).raw;
}
function toCESRPublicKey(raw) {
  const bytes = raw;
  if (bytes.length === 32) {
    return encodeKey(bytes, true, "ed25519").qb64;
  }
  if (bytes.length === 33) {
    return encodeKey(bytes, true, "secp256k1").qb64;
  }
  throw new Error(`toCESRPublicKey: unsupported key length ${bytes.length}`);
}
function asRawPublicKey(bytes) {
  if (bytes.length !== 32 && bytes.length !== 33) {
    throw new Error(`Invalid public key length: expected 32 (ed25519) or 33 (secp256k1), got ${bytes.length}`);
  }
  return bytes;
}
function publicKeyHex(pk) {
  return Array.from(pk, (b) => b.toString(16).padStart(2, "0")).join("");
}
function fromEd25519PublicRaw(raw) {
  return raw;
}
function toEd25519PublicRaw(raw) {
  if (raw.length !== 32) {
    throw new Error(`Expected 32-byte ed25519 key, got ${raw.length}`);
  }
  return raw;
}

// src/keys/fake-hsm-key-store.ts
var FakeHsmKeyStores;
((FakeHsmKeyStores) => {
  let counter = 0;
  function create() {
    const keys = new Map;
    const id = `fake-hsm:${counter++}`;
    return {
      id,
      async hasKey(publicKey) {
        return keys.has(publicKeyHex(publicKey));
      },
      async resolve(publicKey) {
        const entry = keys.get(publicKeyHex(publicKey));
        if (!entry)
          return err({ kind: "key-not-found", publicKey });
        const cesrPub = toCESRPublicKey(publicKey);
        const textEncoder = new TextEncoder;
        const signer = {
          publicKey: cesrPub,
          algo: "ed25519",
          exists: async (pk) => pk === cesrPub,
          signBytes: async (data) => {
            const rawSig = ed25519.sign(data, entry.privateKey);
            return encodeSig(rawSig, "ed25519").qb64;
          },
          signSaid: async (said) => {
            const saidBytes = textEncoder.encode(said);
            const rawSig = ed25519.sign(saidBytes, entry.privateKey);
            return encodeSig(rawSig, "ed25519").qb64;
          },
          getX25519PublicKey: async () => ed25519ToX25519Public(ed25519.getPublicKey(entry.privateKey)),
          deriveX25519HkdfBlake3Key: async (input) => {
            if (input.peerPublicKey.length !== 32) {
              throw new Error(`Invalid peerPublicKey length: expected 32, got ${input.peerPublicKey.length}`);
            }
            if (input.length < 1 || input.length > MAX_HKDF_DERIVE_LENGTH) {
              throw new Error(`Invalid derive length: must be 1-${MAX_HKDF_DERIVE_LENGTH}, got ${input.length}`);
            }
            const x25519PrivateKey = ed25519ToX25519Private(entry.privateKey);
            const sharedSecret = deriveSharedSecret(x25519PrivateKey, input.peerPublicKey);
            return hkdfBlake3(sharedSecret, input.salt, input.info, input.length);
          }
        };
        const withSignerFn = async (fn) => fn(signer);
        return ok({
          withSigner: withSignerFn,
          withEd25519Signer: async (fn) => {
            return withSignerFn(async (s) => {
              if (!isEd25519Signer(s)) {
                return err({ kind: "unexpected-algo", expected: "ed25519", actual: s.algo });
              }
              return ok(await fn(s));
            });
          }
        });
      },
      supports() {
        return new Set(["ed25519"]);
      },
      async generate(algo) {
        if (algo !== "ed25519")
          return err({ kind: "algo-not-supported", algo });
        const privateKey = ed25519.utils.randomSecretKey();
        const publicKeyRaw = ed25519.getPublicKey(privateKey);
        const publicKey = asRawPublicKey(publicKeyRaw);
        keys.set(publicKeyHex(publicKey), { privateKey, algo });
        return ok({ publicKey, algo });
      },
      async generateBatch(algo, count) {
        if (algo !== "ed25519")
          return err({ kind: "algo-not-supported", algo });
        const results = [];
        for (let i = 0;i < count; i++) {
          const privateKey = ed25519.utils.randomSecretKey();
          const publicKeyRaw = ed25519.getPublicKey(privateKey);
          const publicKey = asRawPublicKey(publicKeyRaw);
          keys.set(publicKeyHex(publicKey), { privateKey, algo });
          results.push({ publicKey, algo });
        }
        return ok(results);
      }
    };
  }
  FakeHsmKeyStores.create = create;
})(FakeHsmKeyStores ||= {});
// src/keys/in-memory-key-store.ts
function makeSigner(publicKey, entry) {
  const cesrPub = toCESRPublicKey(publicKey);
  const textEncoder = new TextEncoder;
  const algo = entry.algo;
  const signBytes = async (data) => {
    let rawSig;
    if (algo === "ed25519") {
      rawSig = ed25519.sign(data, entry.privateKey);
    } else if (algo === "secp256k1") {
      rawSig = secp256k1.sign(data, entry.privateKey);
    } else {
      throw new Error(`Unsupported algo: ${algo}`);
    }
    return encodeSig(rawSig, algo).qb64;
  };
  const signSaid = async (said) => {
    return signBytes(textEncoder.encode(said));
  };
  const exists = async (pk) => pk === cesrPub;
  if (algo === "ed25519") {
    const signer = {
      publicKey: cesrPub,
      algo: "ed25519",
      exists,
      signBytes,
      signSaid,
      getX25519PublicKey: async () => ed25519ToX25519Public(ed25519.getPublicKey(entry.privateKey)),
      deriveX25519HkdfBlake3Key: async (input) => {
        if (input.peerPublicKey.length !== 32) {
          throw new Error(`Invalid peerPublicKey length: expected 32 bytes, got ${input.peerPublicKey.length}`);
        }
        if (input.length < 1 || input.length > MAX_HKDF_DERIVE_LENGTH) {
          throw new Error(`Invalid derive length: must be 1-${MAX_HKDF_DERIVE_LENGTH}, got ${input.length}`);
        }
        const x25519PrivateKey = ed25519ToX25519Private(entry.privateKey);
        const sharedSecret = deriveSharedSecret(x25519PrivateKey, input.peerPublicKey);
        return hkdfBlake3(sharedSecret, input.salt, input.info, input.length);
      }
    };
    return signer;
  }
  if (algo === "secp256k1") {
    const signer = {
      publicKey: cesrPub,
      algo: "secp256k1",
      compressedPublicKey: publicKey,
      exists,
      signBytes,
      signSaid,
      signDigest: async (digest) => {
        return secp256k1.sign(digest, entry.privateKey, { prehash: false });
      }
    };
    return signer;
  }
  throw new Error(`Unsupported algo: ${algo}`);
}
function buildKeyStore(keys, id) {
  return {
    id,
    async hasKey(publicKey) {
      return keys.has(publicKeyHex(publicKey));
    },
    async resolve(publicKey) {
      const entry = keys.get(publicKeyHex(publicKey));
      if (!entry)
        return err({ kind: "key-not-found", publicKey });
      const withSignerFn = async (fn) => {
        return fn(makeSigner(publicKey, entry));
      };
      return ok({
        withSigner: withSignerFn,
        withEd25519Signer: async (fn) => {
          return withSignerFn(async (signer) => {
            if (!isEd25519Signer(signer)) {
              return err({ kind: "unexpected-algo", expected: "ed25519", actual: signer.algo });
            }
            return ok(await fn(signer));
          });
        }
      });
    }
  };
}
var InMemoryKeyStores;
((InMemoryKeyStores) => {
  function create() {
    const keys = new Map;
    function generateOne(algo) {
      if (algo === "ed25519") {
        const privateKey = ed25519.utils.randomSecretKey();
        const publicKeyRaw = ed25519.getPublicKey(privateKey);
        const publicKey = asRawPublicKey(publicKeyRaw);
        keys.set(publicKeyHex(publicKey), { privateKey, algo });
        return { publicKey, algo };
      } else if (algo === "secp256k1") {
        const privateKey = secp256k1.utils.randomSecretKey();
        const publicKeyRaw = secp256k1.getPublicKey(privateKey, true);
        const publicKey = asRawPublicKey(publicKeyRaw);
        keys.set(publicKeyHex(publicKey), { privateKey, algo });
        return { publicKey, algo };
      } else {
        throw new Error(`Unsupported algo: ${algo}`);
      }
    }
    const SUPPORTED = new Set(["ed25519", "secp256k1"]);
    return {
      ...buildKeyStore(keys, "in-memory"),
      supports() {
        return new Set(SUPPORTED);
      },
      async generate(algo) {
        if (!SUPPORTED.has(algo))
          return err({ kind: "algo-not-supported", algo });
        return ok(generateOne(algo));
      },
      async generateBatch(algo, count) {
        if (!SUPPORTED.has(algo))
          return err({ kind: "algo-not-supported", algo });
        const results = [];
        for (let i = 0;i < count; i++) {
          results.push(generateOne(algo));
        }
        return ok(results);
      }
    };
  }
  InMemoryKeyStores.create = create;
  function fromPrivateKey(privateKey, algo) {
    let publicKey;
    if (algo === "ed25519") {
      publicKey = asRawPublicKey(ed25519.getPublicKey(privateKey));
    } else if (algo === "secp256k1") {
      publicKey = asRawPublicKey(secp256k1.getPublicKey(privateKey, true));
    } else {
      throw new Error(`Unsupported algo: ${algo}`);
    }
    const keys = new Map([[publicKeyHex(publicKey), { privateKey, algo }]]);
    return buildKeyStore(keys, `from-private-key-${publicKeyHex(publicKey).slice(0, 8)}`);
  }
  InMemoryKeyStores.fromPrivateKey = fromPrivateKey;
})(InMemoryKeyStores ||= {});
// src/keys/keychain.ts
var Keychains;
((Keychains) => {
  function create() {
    const stores = new Map;
    const generators = new Map;
    const keyIndex = new Map;
    return {
      register(store, generator) {
        stores.set(store.id, store);
        if (generator)
          generators.set(generator.id, generator);
      },
      getStore(id) {
        return stores.get(id);
      },
      getGeneratorFor(algo) {
        return [...generators.values()].find((g) => g.supports().has(algo));
      },
      getGenerator(id) {
        return generators.get(id);
      },
      listGeneratorIds() {
        return [...generators.keys()];
      },
      async hasKey(publicKey) {
        for (const store of stores.values()) {
          if (await store.hasKey(publicKey))
            return true;
        }
        return false;
      },
      async findStoreId(publicKey) {
        const hex = publicKeyHex(publicKey);
        const indexedId = keyIndex.get(hex);
        if (indexedId && stores.has(indexedId)) {
          const store = stores.get(indexedId);
          if (await store.hasKey(publicKey))
            return indexedId;
        }
        for (const [id, store] of stores) {
          if (await store.hasKey(publicKey)) {
            keyIndex.set(hex, id);
            return id;
          }
        }
        return;
      },
      async resolve(publicKey, purpose) {
        const hex = publicKeyHex(publicKey);
        const indexedId = keyIndex.get(hex);
        if (indexedId) {
          const store = stores.get(indexedId);
          if (store)
            return store.resolve(publicKey, purpose);
        }
        for (const [id, store] of stores) {
          if (await store.hasKey(publicKey)) {
            keyIndex.set(hex, id);
            return store.resolve(publicKey, purpose);
          }
        }
        return err({ kind: "key-not-found", publicKey });
      }
    };
  }
  Keychains.create = create;
})(Keychains ||= {});
// src/keys/public-keys.ts
var PublicKeys;
((PublicKeys) => {
  function parse(qb64) {
    decodeKey(qb64);
    return qb64;
  }
  PublicKeys.parse = parse;
  function fromRaw(raw) {
    const bytes = raw;
    if (bytes.length === 32) {
      return encodeKey(bytes, true, "ed25519").qb64;
    }
    if (bytes.length === 33) {
      return encodeKey(bytes, true, "secp256k1").qb64;
    }
    throw new Error(`PublicKeys.fromRaw: unsupported key length ${bytes.length}`);
  }
  PublicKeys.fromRaw = fromRaw;
  function toRaw(key) {
    return decodeKey(key).raw;
  }
  PublicKeys.toRaw = toRaw;
  function algo(key) {
    return decodeKey(key).algo;
  }
  PublicKeys.algo = algo;
  function digest(key) {
    return digestVerfer(key);
  }
  PublicKeys.digest = digest;
})(PublicKeys ||= {});
// src/keys/test-keys.ts
var streams = new Map;
function h(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0;i < bytes.length; i++)
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}
var DEFAULT_PUBLIC_KEYS = [
  h("3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29"),
  h("cecc1507dc1ddd7295951c290888f095adb9044d1b73d696e6df065d683bd4fc"),
  h("6b79c57e6a095239282c04818e96112f3f03a4001ba97a564c23852a3f1ea5fc"),
  h("dadbd184a2d526f1ebdd5c06fdad9359b228759b4d7f79d66689fa254aad8546"),
  h("9be3287795907809407e14439ff198d5bfc7dce6f9bc743cb369146f610b4801"),
  h("f4bd46521ce7b57899ae6f4ca09eddec689327a86a2232d4a3f2a4f39ac68a9e"),
  h("34790764308e0b7b5f7cc9d5cdd29845fd82a03df53d2cffef3c0228547487c5"),
  h("a2fa2f4a355ba2e907a53009e9e37caddf7ac7e66a08ba07631f553072b3f24c"),
  h("d4c5061b81c4682b27a0cfc6459cd9d7892eb60a43f73dd1060b6c478aa7c3d8"),
  h("bb5c672482b0dcca91a21a4ed63b15afde8aa1378da72cd01b349589d6e7dd6a"),
  h("513523c8b48319b649d7d4d4e613232fd9c13f41029d4bc5f74d6eceb91afe9f"),
  h("7380a4b28d0b49b46e7ca1e4369949c8eb733ff90b69b3530d7e83f073900979"),
  h("2ebbc3db123aa602b343f36e3e16b89dc231e0310545a39ce8a7936734f8bf15"),
  h("52946d19dc2048375ace8aa02c16af4bbf74af25d927538c50708eb81c0259d1"),
  h("015743be93526e88156aa0a8349cd6b15344b28ae7f2ab3faf5e340b4a0c1ec4"),
  h("e8d8764d05e660a0228b6cb2cb05510e6786a90caa797a6b80f22336e9f9205f"),
  h("69104ef20c6676aacc9e8c291800d1b7e911e20f85b4066156ea118ace44b8d7"),
  h("66e0b858e462a609e66fe71370c816d8846ff103d5499a22a7fec37fdbc424a7"),
  h("36c6f5085341d70d0c03529fe0077810fccaa4e28f219dd572c51e785d0f211c"),
  h("40368d866508fb8c1bef7445eac4068ccf4e3fe4cefbdda6e8608fdb10f3c40a"),
  h("ccfff852fc48efcc4508341574bb62d55bde5b7538025bfb0e6f08dae1b8d307"),
  h("3e55e9643a89e218d9015c1bad3826c7e25bdedaecdbd35e28f49cffb036900c"),
  h("2eb8a0b367663669983548a2efbec9e374e12292269133ad4ff23ceca96082bf"),
  h("551918e0e5f9efcdd4c081283151cfad5cb51a02eb3bec60d252bc03d59e87b0"),
  h("f59a736de10e003f94d8666adbc9956dd4d4edec234fc3b928e1d64a1d582c5e"),
  h("a7dd374a251450d3ecb318ff253a4927fede63fc98c5adb16e6635ca1f1574a6"),
  h("2756d438412e9b5f62579f60d4958b72530a932f3a0c82321df0ef12c88dfd95"),
  h("b9fb480e83d7ef8dc9886fcb40b542fc40365a58a5bc7a52551859d884850ec1"),
  h("7f8fb14ad91cf5c45d83e48377b3a64fdb44dd87aadce8de4a422de46a547bea"),
  h("c46b9b93480bb0be3c0e2fc2ebd203f63a215bde9ac8666472b58681d419d226"),
  h("bfe35a12c9e09dcd4da128f26d7b02f913cbce54ff09a16df97295140544f225"),
  h("a07c418a770a346d49a3a7f972d94108e9f893acbea3ec34e56b42d3f5234da9"),
  h("3be533822b146a67b7649397f6fdcde0451233eda282997fe31c4dcc0a9b09fb"),
  h("c745e46b13e26a10c3c2b63f3fde24c80e69fa61b494ef2f05838922d3a72973"),
  h("a89b3a640e5e202d2a9ede77f3b4d55146284a1e302cdc0463e71dd09f0fe623"),
  h("c935c76bded59c80b25ae7dd3294ea49e9660b31134e11c5fd11547aa55e60fe"),
  h("5d9bf4c12b9a04ff35134c292258ad3ff1bef526847c891cc3bf248d755b6e29"),
  h("8fc03690fb3e677926c6b4f7e2623a5a3675bb33acbe4c1c4bd5f1a08b2e847c"),
  h("764e77c91486f0e9182eeba10dc3b28908f463ec8478b64ef8e969fbd32cbb68"),
  h("c3d0367fcec340329c620240aac2fdcffb3d14901eabacba5ef7c6ee6a7c09c7"),
  h("d8d3e9d73a5294a04c783c03fff49e24f872e52d44d5dfeba9847c39798fb971"),
  h("f916453547be8d5d8c2221737387519c5434e8f6f16ec021a1befb798fa620ca"),
  h("e1ef2fe6f211f7399a8a6a55fdc811ee92ec7f01ee125942da87ef659553499f"),
  h("1ba66c6751506850ae0787244c69476b6d45fb857a914a5a0445a24253f7b810"),
  h("f868bcc508133899cc47b612e4f7d9d5dacc90ce1f28214a97b651baa00bf6e4"),
  h("ee37d8c8e9cf42a34cfa75ff1141e2bc0ff2f37483f064dce47cb4d5e69db1d4"),
  h("264a0707979e0d6691f74b055429b5f318d39c2883bb509310b67424252e9ef2"),
  h("423f53a61e2a19302955ddc230ea82374133ed2c229de86733f57bb8481e6180"),
  h("0448bc58ab745fe9099a774f9a0ad8243a7519429d5e3103040e634d9cf25db7"),
  h("ebe80b7cadea277ac05fb85c7164fe15ebd6873c4a74b3296a462a1026fd9b0f"),
  h("50c4a5871ad3379f2879d12cef750d1211633283a9c3730238e6ddf084db4c8a"),
  h("8461a06f7c3c0cf1111ad70da871ba9b00ffb601073e7b5705dfabcfad043cd5"),
  h("97eb816a49b0475b783ff50033f8348ff7d40570aa5ab5347bb8d04bf7909870"),
  h("b0aaed00758b90d8eb5acc641f6f6ce3bcebe9e5a378b67af1b54e78335358c5"),
  h("5434f7a2bf3dac47304180e9e8a756c2c4a733d5160a911a1a2c85438eb1fd7b"),
  h("25974de26089481b49416cbfa2cb9eaa7e10c68ffa48a5ffd03985baca9a4bca"),
  h("31559d7941c3c9a82ea05cb0d5e80bc90f06ea4925dc81ef320df55d6186f0b6"),
  h("7584b83df6e968128ef701bf66fe298c8ae8eceea504bf7afd0d62347e255cb4"),
  h("e38434e4e9588fd5fb743ec39999ca38d9b3260c51f08b7a875341c303e8f4e0"),
  h("0ec39fd3a1a69a01e8eec48b82197277911b081f40856d78eb1c9bd6f15d7a22"),
  h("5fb0681d3c72487d2971db2ba11f01cc3eb022d76dd95e266cb8c0fa07fcf370"),
  h("c095e7ac75854b3f244363a1cefd66827e55d1766924ef2ed5ef597c22f140c6"),
  h("f5174b5e2388e953d701f38c8a4b0627308b17c9dcf9ee3a48b67766e87f3765"),
  h("71e9c7be0b0fef2bcd5dc79c69b252973d5b3adc4dd4d3adb5f65c9bb448f7cc"),
  h("f538cbdd2a80daa5148c7711e4de667eabdc90f61fbd1a9aedbdff4780dad5e1"),
  h("39f46305fd9225f564694469157e8896d7f72a8ce1daa70beb7e9e176568439e"),
  h("ccbc3da2c4267cc8553be0c7b5790cc75a121297528462c3d2cc679d16eb8684"),
  h("6f7e716f4d2c8f14cd26c027c167610cfffefa9c61aa045006e299be8b98487f"),
  h("e536020ed01e3f19b1944e380c7f0dae7203785d546f79df16b55efc303e79ab"),
  h("b4f05aee172965774743f4cd7de4c3621c9e36fd77af7139aafec25eb3fb3360"),
  h("42da1d19dfee0eee94d5c3dbb6312abeeea5ac9dffb301da3f5daeee81344aec"),
  h("4edaf5275f0d85ddb33f33b42a2a71b109228f92f64691373bb4cf7a2be972be"),
  h("16d3d01cb223ac47d817949be3d84aa6b2cbb833cbaf07b1fbbd647a72e37836"),
  h("324e93a07a9c768fc4fd22d4c5a6ec665af5e695b2d5ac035fa845b72cbad78b"),
  h("6745500eda4ab1ad47d2ce855c4a9f4604f89abca2a4561cf0d9ccaacb0c0700"),
  h("ec0769247912711195823944cbc3c097ea64c534c847a7993f3ea371b044df2e"),
  h("804b280f80fd41d46a54e0bde219ff3a0389d2b37083e1b79b3c49d244c8bf3f"),
  h("44e4cdcb73aa16e9cb47d55194bd86aabb71bdfedb598122b92b38923d7422a1"),
  h("e13482b97d32676a1d1a5cf2d75ba8ec3da9eb0250eebaeef27143c690e75c27"),
  h("e02e50da342a234646fc1670fdaadc8fbb3914f522a40f0eede7ea222e6df8f3"),
  h("edd9ea5fb5d9e56029339953bf9e2ff264a378ab0f75b03a46b50535401a6337"),
  h("85ba958f4c79484c41fc68119441e79079eb3a2d2d6cc75f3a8d415eb57ed39d"),
  h("41048d12a17c404084bdef649765aa5001cc268c7e9392795a23730e07952b36"),
  h("ddd125cb0f01d4f2bad7447669023fe2393b98c53f430cb091a1d68d2238396b"),
  h("b2243554d1c149d00a2419d762fa3846260dfeb00b405a773f0c8ccfb747e591"),
  h("ecf12498c9e51c180ebe649e4f0eaa1f394415571f42db76ff0c35c345feda2b"),
  h("9fd8db3ce25c826c641e96ef8b2e55337554fb55f5010a43e35a6b9911e06ec4"),
  h("f83d82c42bededa12ed3606a8cda6a7dbe130703e1c61736721c898d5524371e"),
  h("45c87e1243ad22d079d905789757ee66a5fd672b69d022e0645ee7b2b4a3182f"),
  h("4460a47d2bb9790e8986f819aec7d1bdbd6be430c04f8d5f1a86642b5d195fab"),
  h("e86f91108f91c1221bdc250cc68d0b6e8d215208ac6b65ce76e99465a634c184"),
  h("c855b9b09a6059b33c816860e16777eca2fd8ebe2168523ffcca126b3968a121"),
  h("8e50f75f9ab2d7b8bf0e997e8a7d6202689933461e7f4912a4f343ae76ee8de2"),
  h("f2c82efb63fd56545bb88cac97e2b2258d99ca82a6aec3c71e0a3a72aa22cec0"),
  h("5041e6345de057406d1334eb35ea1d554f4792a1cde0c46f0d8f6bda4f7c8951"),
  h("535712b7cbfa74cef7d7a3f756c41b636031da4964419ecdbc5d048a67956a16"),
  h("eadfc67dacbe2a13ae2e39b2a558e2173f99650f947d05d3076f57f4c4ed5df6"),
  h("6274faf5e34369168d53bb5e0d373205e7520f407f662ab1fac7a39b4c106dad"),
  h("85892b0676f3650777aff6e3660cb15df7317cdad883c3c256c07824b501f5e5"),
  h("d523845a249f6994b019cbb33057d352237858ff79a98cb2359d805ee45044d6")
];
var DEFAULT_KEYS = DEFAULT_PUBLIC_KEYS.map((publicKey, i) => {
  const privateKey = new Uint8Array(32);
  privateKey[0] = i;
  return { privateKey, publicKey };
});
var TestKeys;
((TestKeys) => {
  TestKeys.GENERATOR_ID = "test-keys";
  function iterator(name) {
    const keys = streams.get(name) ?? [];
    streams.set(name, keys);
    const at = (n) => {
      if (!Number.isInteger(n) || n < 0) {
        throw new RangeError(`TestKeys.iterator('${name}').at(${n}): index must be a non-negative integer`);
      }
      while (keys.length <= n) {
        const prior = keys[keys.length - 1];
        const seed = prior ? sha256(prior.privateKey) : sha256(new TextEncoder().encode(`kerits-test-keys/${name}`));
        const publicKey = ed25519.getPublicKey(seed);
        keys.push({ privateKey: seed, publicKey, cesr: toCESRPublicKey(asRawPublicKey(publicKey)) });
      }
      return keys[n];
    };
    return {
      name,
      at,
      *[Symbol.iterator]() {
        for (let i = 0;; i++)
          yield at(i);
      }
    };
  }
  TestKeys.iterator = iterator;
  function defaultKeys() {
    return [...DEFAULT_KEYS];
  }
  TestKeys.defaultKeys = defaultKeys;
  function get(options) {
    return create(DEFAULT_KEYS, options);
  }
  TestKeys.get = get;
  function create(keys, options) {
    const wrap = options?.wrap ?? false;
    let cursor = 0;
    const issued = new Map;
    const textEncoder = new TextEncoder;
    function buildScope(privateKey, publicKey) {
      const cesrPub = toCESRPublicKey(publicKey);
      const signer = {
        publicKey: cesrPub,
        algo: "ed25519",
        exists: async (pk) => pk === cesrPub,
        signBytes: async (data) => {
          const rawSig = ed25519.sign(data, privateKey);
          return encodeSig(rawSig, "ed25519").qb64;
        },
        signSaid: async (said) => {
          const saidBytes = textEncoder.encode(said);
          const rawSig = ed25519.sign(saidBytes, privateKey);
          return encodeSig(rawSig, "ed25519").qb64;
        },
        getX25519PublicKey: async () => ed25519ToX25519Public(ed25519.getPublicKey(privateKey)),
        deriveX25519HkdfBlake3Key: async (input) => {
          if (input.peerPublicKey.length !== 32) {
            throw new Error(`Invalid peerPublicKey length: expected 32, got ${input.peerPublicKey.length}`);
          }
          if (input.length < 1 || input.length > MAX_HKDF_DERIVE_LENGTH) {
            throw new Error(`Invalid derive length: must be 1-${MAX_HKDF_DERIVE_LENGTH}, got ${input.length}`);
          }
          const x25519PrivateKey = ed25519ToX25519Private(privateKey);
          const sharedSecret = deriveSharedSecret(x25519PrivateKey, input.peerPublicKey);
          return hkdfBlake3(sharedSecret, input.salt, input.info, input.length);
        }
      };
      const withSignerFn = async (fn) => fn(signer);
      return {
        withSigner: withSignerFn,
        withEd25519Signer: async (fn) => {
          return withSignerFn(async (s) => {
            if (!isEd25519Signer(s)) {
              return err({ kind: "unexpected-algo", expected: "ed25519", actual: s.algo });
            }
            return ok(await fn(s));
          });
        }
      };
    }
    return {
      id: TestKeys.GENERATOR_ID,
      supports() {
        return new Set(["ed25519"]);
      },
      async generate(algo) {
        if (algo !== "ed25519")
          return err({ kind: "algo-not-supported", algo });
        if (cursor >= keys.length) {
          if (!wrap)
            return err({ kind: "generation-failed", reason: `TestKeys list exhausted after ${keys.length} keys` });
          cursor = 0;
        }
        const entry = keys[cursor++];
        const publicKey = asRawPublicKey(entry.publicKey);
        issued.set(publicKeyHex(publicKey), entry.privateKey);
        return ok({ publicKey, algo });
      },
      async generateBatch(algo, count) {
        if (algo !== "ed25519")
          return err({ kind: "algo-not-supported", algo });
        if (!wrap && cursor + count > keys.length) {
          return err({
            kind: "generation-failed",
            reason: `TestKeys list exhausted: need ${count} keys but only ${keys.length - cursor} remain`
          });
        }
        const results = [];
        for (let i = 0;i < count; i++) {
          if (cursor >= keys.length)
            cursor = 0;
          const entry = keys[cursor++];
          const publicKey = asRawPublicKey(entry.publicKey);
          issued.set(publicKeyHex(publicKey), entry.privateKey);
          results.push({ publicKey, algo });
        }
        return ok(results);
      },
      async hasKey(publicKey) {
        return issued.has(publicKeyHex(publicKey));
      },
      async resolve(publicKey) {
        const hex = publicKeyHex(publicKey);
        const privateKey = issued.get(hex);
        if (!privateKey)
          return err({ kind: "key-not-found", publicKey });
        return ok(buildScope(privateKey, publicKey));
      }
    };
  }
  TestKeys.create = create;
})(TestKeys ||= {});
// src/common/algo.ts
var Algos;
((Algos) => {
  Algos.Ed25519 = "ed25519";
  Algos.Secp256k1 = "secp256k1";
})(Algos ||= {});
// src/keys/unlock-ref.ts
function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function unreachable(ref) {
  throw new Error(`Unsupported unlock mechanism: ${JSON.stringify(ref)}`);
}
var UnlockRefs;
((UnlockRefs) => {
  function passkeyPrf(credentialId) {
    return { mechanism: "passkey-prf", credentialId };
  }
  UnlockRefs.passkeyPrf = passkeyPrf;
  function passphrase(passphraseId) {
    return { mechanism: "passphrase", passphraseId };
  }
  UnlockRefs.passphrase = passphrase;
  function unused() {
    return { mechanism: "unused" };
  }
  UnlockRefs.unused = unused;
  function passphraseIdFor(secret) {
    const info = new TextEncoder().encode("kerits-passphrase-id");
    return base64url(hkdf(sha256, secret, new Uint8Array(0), info, 16));
  }
  UnlockRefs.passphraseIdFor = passphraseIdFor;
  function equals(a, b) {
    switch (a.mechanism) {
      case "passkey-prf":
        return b.mechanism === "passkey-prf" && a.credentialId === b.credentialId;
      case "passphrase":
        return b.mechanism === "passphrase" && a.passphraseId === b.passphraseId;
      case "unused":
        return b.mechanism === "unused";
      default:
        return unreachable(a);
    }
  }
  UnlockRefs.equals = equals;
  function toJSON(ref) {
    switch (ref.mechanism) {
      case "passkey-prf":
        return { mechanism: ref.mechanism, credentialId: ref.credentialId };
      case "passphrase":
        return { mechanism: ref.mechanism, passphraseId: ref.passphraseId };
      case "unused":
        return { mechanism: ref.mechanism };
      default:
        return unreachable(ref);
    }
  }
  UnlockRefs.toJSON = toJSON;
  function fromJSON(raw) {
    const invalid = err({ kind: "invalid-unlock-ref", raw });
    if (typeof raw !== "object" || raw === null)
      return invalid;
    const { mechanism, credentialId, passphraseId } = raw;
    const nonEmpty = (v) => typeof v === "string" && v.length > 0;
    if (mechanism === "passkey-prf")
      return nonEmpty(credentialId) ? ok(passkeyPrf(credentialId)) : invalid;
    if (mechanism === "passphrase")
      return nonEmpty(passphraseId) ? ok(passphrase(passphraseId)) : invalid;
    if (mechanism === "unused")
      return ok(unused());
    return invalid;
  }
  UnlockRefs.fromJSON = fromJSON;
  function describe(ref) {
    switch (ref.mechanism) {
      case "passkey-prf":
        return `passkey-prf:${ref.credentialId}`;
      case "passphrase":
        return `passphrase:${ref.passphraseId}`;
      case "unused":
        return "unused";
      default:
        return unreachable(ref);
    }
  }
  UnlockRefs.describe = describe;
})(UnlockRefs ||= {});

// src/keys/unlock-providers.ts
function fixedSecretProvider(secret) {
  const ref = UnlockRefs.passphrase(UnlockRefs.passphraseIdFor(secret));
  return {
    ref,
    withGrant(optionsOrFn, maybeFn) {
      const [options, fn] = typeof optionsOrFn === "function" ? [{}, optionsOrFn] : [optionsOrFn, maybeFn];
      return fn({ ref, secret, salt: options.salt });
    }
  };
}
var UnlockProviders;
((UnlockProviders) => {
  function passphrase(phrase) {
    const encoder = new TextEncoder;
    return fixedSecretProvider(hkdf(sha256, encoder.encode(phrase), new Uint8Array(0), encoder.encode("vault-passphrase"), 32));
  }
  UnlockProviders.passphrase = passphrase;
  function fixed(secret) {
    return fixedSecretProvider(secret);
  }
  UnlockProviders.fixed = fixed;
  function unused(message = "No unlock secret configured for this vault — open grants via Identity.withControllerGrant") {
    return {
      ref: UnlockRefs.unused(),
      withGrant(_optionsOrFn, _maybeFn) {
        return Promise.reject(new Error(message));
      }
    };
  }
  UnlockProviders.unused = unused;
})(UnlockProviders ||= {});
// src/keys/algo-plugins.ts
var AlgoPlugins;
((AlgoPlugins) => {
  function ed255192() {
    return {
      algo: "ed25519",
      publicKeyLength: 32,
      generateKeypair() {
        const privateKey = ed25519.utils.randomSecretKey();
        const publicKey = ed25519.getPublicKey(privateKey);
        return { publicKey, privateKey };
      },
      sign(data, privateKey) {
        return ed25519.sign(data, privateKey);
      }
    };
  }
  AlgoPlugins.ed25519 = ed255192;
  function secp256k12() {
    return {
      algo: "secp256k1",
      publicKeyLength: 33,
      generateKeypair() {
        const privateKey = secp256k1.utils.randomSecretKey();
        const publicKey = secp256k1.getPublicKey(privateKey, true);
        return { publicKey, privateKey };
      },
      sign(data, privateKey) {
        return secp256k1.sign(data, privateKey);
      }
    };
  }
  AlgoPlugins.secp256k1 = secp256k12;
  function create(params) {
    return {
      algo: params.algo,
      publicKeyLength: params.publicKeyLength,
      generateKeypair: params.generateKeypair,
      sign: params.sign
    };
  }
  AlgoPlugins.create = create;
})(AlgoPlugins ||= {});

// node_modules/@noble/ciphers/utils.js
/*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) */
function isBytes3(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
var atitle3 = (title) => title ? `"${title}" ` : "";
function abool3(value, title = "") {
  if (typeof value !== "boolean")
    throw new TypeError(atitle3(title) + "expected boolean, got type=" + typeof value);
  return value;
}
function anumber3(n, title = "") {
  if (typeof n !== "number")
    throw new TypeError(atitle3(title) + "expected number, got " + typeof n);
  if (!Number.isSafeInteger(n) || n < 0)
    throw new RangeError(atitle3(title) + "expected integer >= 0, got " + n);
  return n;
}
function abytes3(value, length, title = "") {
  if (isBytes3(value) && (length === undefined || value.length === length))
    return value;
  if (length !== undefined)
    anumber3(length, "length");
  const bytes = isBytes3(value);
  const ofLen = length !== undefined ? ` of length ${length}` : "";
  const got = bytes ? `length=${value.length}` : `type=${typeof value}`;
  const message = atitle3(title) + "expected Uint8Array" + ofLen + ", got " + got;
  if (!bytes)
    throw new TypeError(message);
  throw new RangeError(message);
}
function aexists2(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("hash was destroyed");
  if (checkFinished && instance.finished)
    throw new Error("digest() was already called");
}
function aoutput2(out, instance) {
  abytes3(out, undefined, "output");
  const min = instance.outputLen;
  if (!(out.length >= min)) {
    throw new RangeError('"output" expected length >= ' + min);
  }
}
function aoutput32(out, instance) {
  aoutput2(out, instance);
  if (!isAligned32(out))
    throw new Error("invalid output, must be aligned");
}
function u82(arr) {
  return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}
function u322(arr) {
  return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
function clean3(...arrays) {
  for (let i = 0;i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView2(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
var isLE2 = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
function byteSwap2(word) {
  return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
}
var swap8IfBE2 = isLE2 ? (n) => n : (n) => byteSwap2(n) >>> 0;
function byteSwap322(arr) {
  for (let i = 0;i < arr.length; i++) {
    arr[i] = byteSwap2(arr[i]);
  }
  return arr;
}
var swap32IfBE2 = isLE2 ? (u) => u : byteSwap322;
function equalBytes(a, b) {
  a = abytes3(a);
  b = abytes3(b);
  if (a.length !== b.length)
    return false;
  let diff = 0;
  for (let i = 0;i < a.length; i++)
    diff |= a[i] ^ b[i];
  return diff === 0;
}
function wrapMacConstructor(keyLen, macCons, fromMsg) {
  const mac = macCons;
  const getArgs = fromMsg || (() => []);
  const macC = (msg, key) => mac(key, ...getArgs(msg)).update(msg).digest();
  const tmp = mac(new Uint8Array(keyLen), ...getArgs(new Uint8Array(0)));
  macC.outputLen = tmp.outputLen;
  macC.blockLen = tmp.blockLen;
  macC.create = (key, ...args) => mac(key, ...args);
  return macC;
}
var wrapCipher = (params, constructor) => {
  function wrappedCipher(key, ...args) {
    abytes3(key, undefined, "key");
    if (params.nonceLength !== undefined) {
      const nonce = args[0];
      abytes3(nonce, params.varSizeNonce ? undefined : params.nonceLength, "nonce");
    }
    const tagl = params.tagLength;
    const aadStart = params.nonceLength !== undefined ? 1 : 0;
    if (!params.withAAD) {
      for (let i = aadStart;i < args.length; i++)
        if (isBytes3(args[i]))
          throw new Error("AAD not supported");
    }
    if (params.withAAD && args[aadStart] !== undefined)
      abytes3(args[aadStart], undefined, "AAD");
    const cipher = constructor(key, ...args);
    const checkOutput = (fnLength, output) => {
      if (output !== undefined) {
        if (fnLength !== 2)
          throw new Error("cipher output not supported");
        abytes3(output, undefined, "output");
      }
    };
    let called = false;
    const wrCipher = {
      encrypt(data, output) {
        if (called)
          throw new Error("cannot encrypt() twice with same key + nonce");
        called = true;
        abytes3(data, undefined, "data");
        checkOutput(cipher.encrypt.length, output);
        return cipher.encrypt(data, output);
      },
      decrypt(data, output) {
        abytes3(data, undefined, "data");
        if (tagl && data.length < tagl)
          throw new Error('"ciphertext" expected length >= tagLength=' + tagl);
        checkOutput(cipher.decrypt.length, output);
        return cipher.decrypt(data, output);
      }
    };
    return wrCipher;
  }
  Object.assign(wrappedCipher, params);
  return wrappedCipher;
};
function getOutput(expectedLength, out, onlyAligned = true) {
  if (out === undefined)
    return new Uint8Array(expectedLength);
  abytes3(out, expectedLength, "output");
  if (onlyAligned && !isAligned32(out))
    throw new Error("invalid output, must be aligned");
  return out;
}
function u64Lengths(dataLength, aadLength, isLE) {
  anumber3(dataLength);
  anumber3(aadLength);
  abool3(isLE);
  const num = new Uint8Array(16);
  const view = createView2(num);
  view.setBigUint64(0, BigInt(aadLength), isLE);
  view.setBigUint64(8, BigInt(dataLength), isLE);
  return num;
}
function isAligned32(bytes) {
  return bytes.byteOffset % 4 === 0;
}
function copyBytes3(bytes) {
  return Uint8Array.from(abytes3(bytes));
}
function randomBytes3(bytesLength = 32) {
  anumber3(bytesLength, "bytesLength");
  const cr = typeof globalThis === "object" ? globalThis.crypto : null;
  if (typeof cr?.getRandomValues !== "function")
    throw new Error("crypto.getRandomValues must be defined");
  if (bytesLength > 65536)
    throw new RangeError(`"bytesLength" expected <= 65536, got ${bytesLength}`);
  return cr.getRandomValues(new Uint8Array(bytesLength));
}

// node_modules/@noble/ciphers/_polyval.js
var BLOCK_SIZE = 16;
var ZEROS16 = /* @__PURE__ */ new Uint8Array(16);
var ZEROS32 = /* @__PURE__ */ u322(ZEROS16);
var POLY = 225;
var mul2 = (s0, s1, s2, s3) => {
  const hiBit = s3 & 1;
  return {
    s3: s2 << 31 | s3 >>> 1,
    s2: s1 << 31 | s2 >>> 1,
    s1: s0 << 31 | s1 >>> 1,
    s0: s0 >>> 1 ^ POLY << 24 & -(hiBit & 1)
  };
};
var swapLE = (n) => (n >>> 0 & 255) << 24 | (n >>> 8 & 255) << 16 | (n >>> 16 & 255) << 8 | n >>> 24 & 255 | 0;
var estimateWindow = (bytes) => {
  if (bytes > 64 * 1024)
    return 8;
  if (bytes > 1024)
    return 4;
  return 2;
};

class GHASH {
  blockLen = BLOCK_SIZE;
  outputLen = BLOCK_SIZE;
  s0 = 0;
  s1 = 0;
  s2 = 0;
  s3 = 0;
  finished = false;
  destroyed = false;
  t;
  W;
  windowSize;
  constructor(key, expectedLength) {
    abytes3(key, 16, "key");
    key = copyBytes3(key);
    const kView = createView2(key);
    let k0 = kView.getUint32(0, false);
    let k1 = kView.getUint32(4, false);
    let k2 = kView.getUint32(8, false);
    let k3 = kView.getUint32(12, false);
    const doubles = [];
    for (let i = 0;i < 128; i++) {
      doubles.push({ s0: swapLE(k0), s1: swapLE(k1), s2: swapLE(k2), s3: swapLE(k3) });
      ({ s0: k0, s1: k1, s2: k2, s3: k3 } = mul2(k0, k1, k2, k3));
    }
    const W = estimateWindow(expectedLength || 1024);
    if (![1, 2, 4, 8].includes(W))
      throw new Error("ghash: invalid window size, expected 2, 4 or 8");
    this.W = W;
    const bits = 128;
    const windows = bits / W;
    const windowSize = this.windowSize = 2 ** W;
    const items = [];
    for (let w = 0;w < windows; w++) {
      for (let byte = 0;byte < windowSize; byte++) {
        let s0 = 0, s1 = 0, s2 = 0, s3 = 0;
        for (let j = 0;j < W; j++) {
          const bit = byte >>> W - j - 1 & 1;
          if (!bit)
            continue;
          const { s0: d0, s1: d1, s2: d2, s3: d3 } = doubles[W * w + j];
          s0 ^= d0, s1 ^= d1, s2 ^= d2, s3 ^= d3;
        }
        items.push({ s0, s1, s2, s3 });
      }
    }
    this.t = items;
  }
  _updateBlock(s0, s1, s2, s3) {
    s0 ^= this.s0, s1 ^= this.s1, s2 ^= this.s2, s3 ^= this.s3;
    const { W, t, windowSize } = this;
    let o0 = 0, o1 = 0, o2 = 0, o3 = 0;
    const mask = (1 << W) - 1;
    let w = 0;
    for (const num of [s0, s1, s2, s3]) {
      for (let bytePos = 0;bytePos < 4; bytePos++) {
        const byte = num >>> 8 * bytePos & 255;
        for (let bitPos = 8 / W - 1;bitPos >= 0; bitPos--) {
          const bit = byte >>> W * bitPos & mask;
          const { s0: e0, s1: e1, s2: e2, s3: e3 } = t[w * windowSize + bit];
          o0 ^= e0, o1 ^= e1, o2 ^= e2, o3 ^= e3;
          w += 1;
        }
      }
    }
    this.s0 = o0;
    this.s1 = o1;
    this.s2 = o2;
    this.s3 = o3;
  }
  update(data) {
    aexists2(this);
    abytes3(data);
    data = copyBytes3(data);
    const b32 = u322(data);
    const blocks = Math.floor(data.length / BLOCK_SIZE);
    const left = data.length % BLOCK_SIZE;
    for (let i = 0;i < blocks; i++) {
      this._updateBlock(swap8IfBE2(b32[i * 4 + 0]), swap8IfBE2(b32[i * 4 + 1]), swap8IfBE2(b32[i * 4 + 2]), swap8IfBE2(b32[i * 4 + 3]));
    }
    if (left) {
      ZEROS16.set(data.subarray(blocks * BLOCK_SIZE));
      this._updateBlock(swap8IfBE2(ZEROS32[0]), swap8IfBE2(ZEROS32[1]), swap8IfBE2(ZEROS32[2]), swap8IfBE2(ZEROS32[3]));
      clean3(ZEROS32);
    }
    return this;
  }
  destroy() {
    this.destroyed = true;
    const { t } = this;
    for (const elm of t) {
      elm.s0 = 0, elm.s1 = 0, elm.s2 = 0, elm.s3 = 0;
    }
  }
  digestInto(out) {
    aexists2(this);
    aoutput32(out, this);
    this.finished = true;
    const { s0, s1, s2, s3 } = this;
    const o32 = u322(out);
    o32[0] = s0;
    o32[1] = s1;
    o32[2] = s2;
    o32[3] = s3;
    if (!isLE2)
      swap32IfBE2(o32.subarray(0, BLOCK_SIZE / 4));
  }
  digest() {
    const res = new Uint8Array(BLOCK_SIZE);
    this.digestInto(res);
    this.destroy();
    return res;
  }
}
var ghash = /* @__PURE__ */ wrapMacConstructor(16, (key, expectedLength) => new GHASH(key, expectedLength), (msg) => [msg.length]);

// node_modules/@noble/ciphers/aes.js
var BLOCK_SIZE2 = 16;
var BLOCK_SIZE32 = 4;
var EMPTY_BLOCK = /* @__PURE__ */ new Uint8Array(BLOCK_SIZE2);
var POLY2 = 283;
function validateKeyLength(key) {
  if (![16, 24, 32].includes(key.length))
    throw new Error('"aes key" expected Uint8Array of length 16/24/32, got length=' + key.length);
}
function mul22(n) {
  return n << 1 ^ POLY2 & -(n >> 7);
}
function mul(a, b) {
  let res = 0;
  for (;b > 0; b >>= 1) {
    res ^= a & -(b & 1);
    a = mul22(a);
  }
  return res;
}
var sbox = /* @__PURE__ */ (() => {
  const t = new Uint8Array(256);
  for (let i = 0, x = 1;i < 256; i++, x ^= mul22(x))
    t[i] = x;
  const box = new Uint8Array(256);
  box[0] = 99;
  for (let i = 0;i < 255; i++) {
    let x = t[255 - i];
    x |= x << 8;
    box[t[i]] = (x ^ x >> 4 ^ x >> 5 ^ x >> 6 ^ x >> 7 ^ 99) & 255;
  }
  clean3(t);
  return box;
})();
var rotr32_8 = (n) => n << 24 | n >>> 8;
var rotl32_8 = (n) => n << 8 | n >>> 24;
function genTtable(sbox, fn) {
  if (sbox.length !== 256)
    throw new Error("wrong sbox length");
  const T0 = new Uint32Array(256).map((_, j) => fn(sbox[j]));
  const T1 = T0.map(rotl32_8);
  const T2 = T1.map(rotl32_8);
  const T3 = T2.map(rotl32_8);
  const T01 = new Uint32Array(256 * 256);
  const T23 = new Uint32Array(256 * 256);
  const sbox2 = new Uint16Array(256 * 256);
  for (let i = 0;i < 256; i++) {
    for (let j = 0;j < 256; j++) {
      const idx = i * 256 + j;
      T01[idx] = T0[i] ^ T1[j];
      T23[idx] = T2[i] ^ T3[j];
      sbox2[idx] = sbox[i] << 8 | sbox[j];
    }
  }
  return { sbox, sbox2, T0, T1, T2, T3, T01, T23 };
}
var tableEncoding = /* @__PURE__ */ genTtable(sbox, (s) => mul(s, 3) << 24 | s << 16 | s << 8 | mul(s, 2));
var xPowers = /* @__PURE__ */ (() => {
  const p = new Uint8Array(16);
  for (let i = 0, x = 1;i < 16; i++, x = mul22(x))
    p[i] = x;
  return p;
})();
function expandKeyLE(key) {
  abytes3(key);
  const len = key.length;
  validateKeyLength(key);
  const { sbox2 } = tableEncoding;
  const toClean = [];
  if (!isLE2 || !isAligned32(key))
    toClean.push(key = copyBytes3(key));
  const k32 = swap32IfBE2(u322(key));
  const Nk = k32.length;
  const subByte = (n) => applySbox(sbox2, n, n, n, n);
  const xk = new Uint32Array(len + 28);
  xk.set(k32);
  for (let i = Nk;i < xk.length; i++) {
    let t = xk[i - 1];
    if (i % Nk === 0)
      t = subByte(rotr32_8(t)) ^ xPowers[i / Nk - 1];
    else if (Nk > 6 && i % Nk === 4)
      t = subByte(t);
    xk[i] = xk[i - Nk] ^ t;
  }
  clean3(...toClean);
  return xk;
}
function apply0123(T01, T23, s0, s1, s2, s3) {
  return T01[s0 << 8 & 65280 | s1 >>> 8 & 255] ^ T23[s2 >>> 8 & 65280 | s3 >>> 24 & 255];
}
function applySbox(sbox2, s0, s1, s2, s3) {
  return sbox2[s0 & 255 | s1 & 65280] | sbox2[s2 >>> 16 & 255 | s3 >>> 16 & 65280] << 16;
}
function encrypt2(xk, s0, s1, s2, s3) {
  const { sbox2, T01, T23 } = tableEncoding;
  let k = 0;
  s0 ^= xk[k++], s1 ^= xk[k++], s2 ^= xk[k++], s3 ^= xk[k++];
  const rounds = xk.length / 4 - 2;
  for (let i = 0;i < rounds; i++) {
    const t0 = xk[k++] ^ apply0123(T01, T23, s0, s1, s2, s3);
    const t1 = xk[k++] ^ apply0123(T01, T23, s1, s2, s3, s0);
    const t2 = xk[k++] ^ apply0123(T01, T23, s2, s3, s0, s1);
    const t3 = xk[k++] ^ apply0123(T01, T23, s3, s0, s1, s2);
    s0 = t0, s1 = t1, s2 = t2, s3 = t3;
  }
  const t0 = xk[k++] ^ applySbox(sbox2, s0, s1, s2, s3);
  const t1 = xk[k++] ^ applySbox(sbox2, s1, s2, s3, s0);
  const t2 = xk[k++] ^ applySbox(sbox2, s2, s3, s0, s1);
  const t3 = xk[k++] ^ applySbox(sbox2, s3, s0, s1, s2);
  return { s0: t0, s1: t1, s2: t2, s3: t3 };
}
function ctr32(xk, isLE, nonce, src, dst) {
  abytes3(nonce, BLOCK_SIZE2, "nonce");
  abytes3(src);
  dst = getOutput(src.length, dst);
  const ctr = nonce;
  const c32 = u322(ctr);
  const view = createView2(ctr);
  const src32 = u322(src);
  const dst32 = u322(dst);
  const ctrPos = isLE ? 0 : 12;
  const srcLen = src.length;
  let ctrNum = view.getUint32(ctrPos, isLE);
  for (let i = 0;i + 4 <= src32.length; i += 4) {
    const { s0, s1, s2, s3 } = encrypt2(xk, swap8IfBE2(c32[0]), swap8IfBE2(c32[1]), swap8IfBE2(c32[2]), swap8IfBE2(c32[3]));
    dst32[i + 0] = src32[i + 0] ^ swap8IfBE2(s0);
    dst32[i + 1] = src32[i + 1] ^ swap8IfBE2(s1);
    dst32[i + 2] = src32[i + 2] ^ swap8IfBE2(s2);
    dst32[i + 3] = src32[i + 3] ^ swap8IfBE2(s3);
    ctrNum = ctrNum + 1 >>> 0;
    view.setUint32(ctrPos, ctrNum, isLE);
  }
  const start = BLOCK_SIZE2 * Math.floor(src32.length / BLOCK_SIZE32);
  if (start < srcLen) {
    const { s0, s1, s2, s3 } = encrypt2(xk, swap8IfBE2(c32[0]), swap8IfBE2(c32[1]), swap8IfBE2(c32[2]), swap8IfBE2(c32[3]));
    const b32 = new Uint32Array([s0, s1, s2, s3]);
    swap32IfBE2(b32);
    const buf = u82(b32);
    for (let i = start, pos = 0;i < srcLen; i++, pos++)
      dst[i] = src[i] ^ buf[pos];
    clean3(b32);
  }
  return dst;
}
function computeTag(fn, isLE, key, data, AAD) {
  const aadLength = AAD ? AAD.length : 0;
  const h = fn.create(key, data.length + aadLength);
  if (AAD)
    h.update(AAD);
  const num = u64Lengths(8 * data.length, 8 * aadLength, isLE);
  h.update(data);
  h.update(num);
  const res = h.digest();
  clean3(num);
  return res;
}
var gcm = /* @__PURE__ */ wrapCipher({ blockSize: 16, nonceLength: 12, tagLength: 16, withAAD: true, varSizeNonce: true }, function aesgcm(key, nonce, AAD) {
  if (nonce.length < 8)
    throw new Error("aes/gcm: invalid nonce length");
  const tagLength = 16;
  function _computeTag(authKey, tagMask, data) {
    const tag = computeTag(ghash, false, authKey, data, AAD);
    for (let i = 0;i < tagMask.length; i++)
      tag[i] ^= tagMask[i];
    return tag;
  }
  function deriveKeys() {
    const xk = expandKeyLE(key);
    const authKey = EMPTY_BLOCK.slice();
    const counter = EMPTY_BLOCK.slice();
    ctr32(xk, false, counter, counter, authKey);
    if (nonce.length === 12) {
      counter.set(nonce);
    } else {
      const nonceLen = EMPTY_BLOCK.slice();
      const view = createView2(nonceLen);
      view.setBigUint64(8, BigInt(nonce.length * 8), false);
      const g = ghash.create(authKey).update(nonce).update(nonceLen);
      g.digestInto(counter);
      g.destroy();
    }
    const tagMask = ctr32(xk, false, counter, EMPTY_BLOCK);
    return { xk, authKey, counter, tagMask };
  }
  return {
    encrypt(plaintext) {
      const { xk, authKey, counter, tagMask } = deriveKeys();
      const out = new Uint8Array(plaintext.length + tagLength);
      const toClean = [xk, authKey, counter, tagMask];
      if (!isAligned32(plaintext))
        toClean.push(plaintext = copyBytes3(plaintext));
      ctr32(xk, false, counter, plaintext, out.subarray(0, plaintext.length));
      const tag = _computeTag(authKey, tagMask, out.subarray(0, out.length - tagLength));
      toClean.push(tag);
      out.set(tag, plaintext.length);
      clean3(...toClean);
      return out;
    },
    decrypt(ciphertext) {
      const { xk, authKey, counter, tagMask } = deriveKeys();
      const toClean = [xk, authKey, tagMask, counter];
      if (!isAligned32(ciphertext))
        toClean.push(ciphertext = copyBytes3(ciphertext));
      const data = ciphertext.subarray(0, -tagLength);
      const passedTag = ciphertext.subarray(-tagLength);
      const tag = _computeTag(authKey, tagMask, data);
      toClean.push(tag);
      if (!equalBytes(tag, passedTag)) {
        clean3(...toClean);
        throw new Error("aes-gcm: invalid tag");
      }
      const out = ctr32(xk, false, counter, data);
      clean3(...toClean);
      return out;
    }
  };
});

// src/keys/encryption-plugins.ts
var EncryptionPlugins;
((EncryptionPlugins) => {
  function xor() {
    return {
      async encrypt(secret, plaintext) {
        const ciphertext = new Uint8Array(plaintext.length);
        for (let i = 0;i < plaintext.length; i++) {
          ciphertext[i] = plaintext[i] ^ secret[i % secret.length];
        }
        return { ciphertext, iv: new Uint8Array(0) };
      },
      async decrypt(secret, ciphertext, _iv) {
        const plaintext = new Uint8Array(ciphertext.length);
        for (let i = 0;i < ciphertext.length; i++) {
          plaintext[i] = ciphertext[i] ^ secret[i % secret.length];
        }
        return plaintext;
      }
    };
  }
  EncryptionPlugins.xor = xor;
  function aesGcm() {
    return {
      async encrypt(secret, plaintext) {
        const iv = randomBytes3(12);
        const cipher = gcm(secret, iv);
        const ciphertext = cipher.encrypt(plaintext);
        return { ciphertext, iv };
      },
      async decrypt(secret, ciphertext, iv) {
        const cipher = gcm(secret, iv);
        return cipher.decrypt(ciphertext);
      }
    };
  }
  EncryptionPlugins.aesGcm = aesGcm;
})(EncryptionPlugins ||= {});

// src/keys/key-persistences.ts
var KeyPersistences;
((KeyPersistences) => {
  function inMemory() {
    const entries = new Map;
    return {
      async store(entry) {
        entries.set(publicKeyHex(entry.publicKey), entry);
      },
      async storeMany(batch) {
        for (const entry of batch)
          entries.set(publicKeyHex(entry.publicKey), entry);
      },
      async lookup(publicKey) {
        return entries.get(publicKeyHex(publicKey));
      },
      async lookupByDigest(digest) {
        for (const entry of entries.values()) {
          if (entry.publicKeyDigest === digest)
            return entry.publicKey;
        }
        return;
      },
      async list() {
        return [...entries.values()];
      }
    };
  }
  KeyPersistences.inMemory = inMemory;
})(KeyPersistences ||= {});

// src/keys/vault.ts
function computeDigest(publicKey) {
  return digestVerfer(toCESRPublicKey(publicKey));
}
var VAULT_HKDF_INFO = new TextEncoder().encode("vault-key-encryption");
function deriveEncryptionKey(grant) {
  if (!grant.salt || grant.salt.length === 0)
    return grant.secret;
  return hkdf(sha256, grant.secret, grant.salt, VAULT_HKDF_INFO, 32);
}
function refOf2(provider) {
  try {
    return provider.ref;
  } catch {
    return;
  }
}
function matchesRef(provider, ref) {
  const own = refOf2(provider);
  return own !== undefined && UnlockRefs.equals(own, ref);
}
function resolverFor(resolvers, ref) {
  switch (ref.mechanism) {
    case "passkey-prf":
      return resolvers["passkey-prf"];
    case "passphrase":
      return resolvers.passphrase;
    case "unused":
      return;
    default: {
      const unknown = ref;
      throw new Error(`Unsupported unlock mechanism: ${JSON.stringify(unknown)}`);
    }
  }
}
function createVault(config) {
  const persistence = config.persistence ?? KeyPersistences.inMemory();
  const encryption = config.encryption ?? EncryptionPlugins.aesGcm();
  const algos = new Map((config.algos ?? [AlgoPlugins.ed25519(), AlgoPlugins.secp256k1()]).map((p) => [p.algo, p]));
  const resolvers = config.resolvers ?? {};
  const providers = [...config.providers];
  if (!providers.some((p) => matchesRef(p, config.defaultProvider.ref))) {
    throw new Error(`defaultProvider '${UnlockRefs.describe(config.defaultProvider.ref)}' is not in the providers list`);
  }
  async function decryptEntry(grant, entry) {
    if (!UnlockRefs.equals(entry.ref, grant.ref)) {
      return err({ kind: "wrong-unlock", publicKey: entry.publicKey, expected: entry.ref, actual: grant.ref });
    }
    let encKey;
    try {
      encKey = deriveEncryptionKey(grant);
    } catch (cause) {
      return err({ kind: "store-error", storeId: "vault", cause });
    }
    try {
      return ok(await encryption.decrypt(encKey, entry.encryptedPrivateKey, entry.iv));
    } catch {
      return err({ kind: "wrong-secret", publicKey: entry.publicKey, ref: entry.ref });
    }
  }
  function makeSigner(publicKey, privateKey, algo) {
    const algoPlugin = algos.get(algo);
    if (!algoPlugin)
      throw new Error(`No plugin for algo '${algo}' — vault was constructed without it`);
    const cesrPub = toCESRPublicKey(publicKey);
    const textEncoder = new TextEncoder;
    const signBytes = async (data) => {
      const rawSig = await algoPlugin.sign(data, privateKey);
      return encodeSig(rawSig, algo).qb64;
    };
    const signSaid = async (said) => {
      return signBytes(textEncoder.encode(said));
    };
    const exists = async (pk) => pk === cesrPub;
    if (algo === "ed25519") {
      const signer = {
        publicKey: cesrPub,
        algo: "ed25519",
        exists,
        signBytes,
        signSaid,
        getX25519PublicKey: async () => {
          return ed25519ToX25519Public(ed25519.getPublicKey(privateKey));
        },
        deriveX25519HkdfBlake3Key: async (input) => {
          if (input.peerPublicKey.length !== 32) {
            throw new Error(`Invalid peerPublicKey length: expected 32 bytes, got ${input.peerPublicKey.length}`);
          }
          if (input.length < 1 || input.length > MAX_HKDF_DERIVE_LENGTH) {
            throw new Error(`Invalid derive length: must be 1-${MAX_HKDF_DERIVE_LENGTH}, got ${input.length}`);
          }
          const x25519PrivateKey = ed25519ToX25519Private(privateKey);
          const sharedSecret = deriveSharedSecret(x25519PrivateKey, input.peerPublicKey);
          return hkdfBlake3(sharedSecret, input.salt, input.info, input.length);
        }
      };
      return signer;
    }
    if (algo === "secp256k1") {
      const signer = {
        publicKey: cesrPub,
        algo: "secp256k1",
        compressedPublicKey: publicKey,
        exists,
        signBytes,
        signSaid,
        signDigest: async (digest) => {
          return secp256k1.sign(digest, privateKey, { prehash: false });
        }
      };
      return signer;
    }
    return { publicKey: cesrPub, algo, exists, signBytes, signSaid };
  }
  function makeKeyStore(grant) {
    return {
      id: "vault",
      async hasKey(publicKey) {
        return await persistence.lookup(publicKey) !== undefined;
      },
      async resolve(publicKey) {
        const entry = await persistence.lookup(publicKey);
        if (!entry)
          return err({ kind: "key-not-found", publicKey });
        const decrypted = await decryptEntry(grant, entry);
        if (!decrypted.ok)
          return decrypted;
        const privateKey = decrypted.value;
        const withSignerFn = async (fn) => {
          try {
            return await fn(makeSigner(publicKey, privateKey, entry.algo));
          } finally {
            privateKey.fill(0);
          }
        };
        return ok({
          withSigner: withSignerFn,
          withEd25519Signer: async (fn) => {
            return withSignerFn(async (signer) => {
              if (!isEd25519Signer(signer)) {
                return err({ kind: "unexpected-algo", expected: "ed25519", actual: signer.algo });
              }
              return ok(await fn(signer));
            });
          }
        });
      },
      async exportKeyPair(publicKey) {
        const entry = await persistence.lookup(publicKey);
        if (!entry)
          return err({ kind: "key-not-found", publicKey });
        const decrypted = await decryptEntry(grant, entry);
        if (!decrypted.ok)
          return decrypted;
        const privateKey = decrypted.value;
        try {
          const pair = {
            publicKey: encodeKey(publicKey, true, entry.algo === "secp256k1" ? "secp256k1" : "ed25519").qb64,
            privateKey: encodeKey(privateKey, true).qb64,
            transferable: true,
            algo: entry.algo
          };
          return ok(pair);
        } catch (cause) {
          return err({ kind: "store-error", storeId: "vault", cause });
        }
      }
    };
  }
  function makeGenerator(grant) {
    const supportedAlgos = () => new Set(algos.keys());
    async function generate(algo) {
      const plugin = algos.get(algo);
      if (!plugin)
        return err({ kind: "algo-not-supported", algo });
      const { publicKey: pubBytes, privateKey } = plugin.generateKeypair();
      return storeEncryptedKey(grant, asRawPublicKey(pubBytes), privateKey, algo);
    }
    return {
      id: "vault",
      supports() {
        return supportedAlgos();
      },
      generate,
      async generateBatch(algo, count) {
        const plugin = algos.get(algo);
        if (!plugin)
          return err({ kind: "algo-not-supported", algo });
        if (count === 0)
          return ok([]);
        const pairs = [];
        for (let i = 0;i < count; i++) {
          const { publicKey, privateKey } = plugin.generateKeypair();
          pairs.push({ publicKey: asRawPublicKey(publicKey), privateKey, algo });
        }
        return storeEncryptedKeys(grant, pairs);
      }
    };
  }
  async function storeEncryptedKey(grant, publicKey, privateKey, algo) {
    const stored = await storeEncryptedKeys(grant, [{ publicKey, privateKey, algo }]);
    if (!stored.ok)
      return stored;
    return ok(stored.value[0]);
  }
  async function storeEncryptedKeys(grant, pairs) {
    const fresh = [];
    const out = [];
    const encKey = pairs.length > 0 ? deriveEncryptionKey(grant) : undefined;
    for (const pair of pairs) {
      const existing = await persistence.lookup(pair.publicKey);
      if (existing) {
        out.push({ publicKey: pair.publicKey, algo: pair.algo });
        continue;
      }
      const { ciphertext, iv } = await encryption.encrypt(encKey, pair.privateKey);
      fresh.push({
        publicKey: pair.publicKey,
        algo: pair.algo,
        encryptedPrivateKey: ciphertext,
        iv,
        ref: grant.ref,
        publicKeyDigest: computeDigest(pair.publicKey),
        createdAt: new Date().toISOString()
      });
      out.push({ publicKey: pair.publicKey, algo: pair.algo });
    }
    if (fresh.length > 0)
      await persistence.storeMany(fresh);
    return ok(out);
  }
  async function importKey(grant, privateKey, algo) {
    const plugin = algos.get(algo);
    if (!plugin)
      return err({ kind: "algo-not-supported", algo });
    let pubBytes;
    if (algo === "ed25519") {
      pubBytes = ed25519.getPublicKey(privateKey);
    } else if (algo === "secp256k1") {
      pubBytes = secp256k1.getPublicKey(privateKey, true);
    } else {
      return err({ kind: "algo-not-supported", algo });
    }
    return storeEncryptedKey(grant, asRawPublicKey(pubBytes), privateKey, algo);
  }
  return {
    defaultProvider: config.defaultProvider,
    async hasKey(publicKey) {
      return await persistence.lookup(publicKey) !== undefined;
    },
    async getProviderForKey(publicKey) {
      const entry = await persistence.lookup(publicKey);
      if (!entry)
        return;
      return providers.find((p) => matchesRef(p, entry.ref));
    },
    async resolveProviderForKey(publicKey, context) {
      const entry = await persistence.lookup(publicKey);
      if (!entry)
        return err({ kind: "key-not-found" });
      const resolver = resolverFor(resolvers, entry.ref);
      if (!resolver)
        return err({ kind: "no-resolver", mechanism: entry.ref.mechanism });
      const provider = await resolver(entry.ref, context);
      return provider ? ok(provider) : err({ kind: "resolver-declined", ref: entry.ref });
    },
    async describeKey(publicKey) {
      const entry = await persistence.lookup(publicKey);
      if (!entry)
        return;
      return {
        ref: entry.ref,
        algo: entry.algo,
        publicKeyDigest: entry.publicKeyDigest
      };
    },
    registerProvider(provider) {
      const ref = refOf2(provider);
      const i = ref === undefined ? -1 : providers.findIndex((p) => matchesRef(p, ref));
      if (i >= 0)
        providers[i] = provider;
      else
        providers.push(provider);
    },
    async lookupByDigest(digest) {
      return persistence.lookupByDigest(digest);
    },
    keyStore(grant) {
      return makeKeyStore(grant);
    },
    generator(grant) {
      return makeGenerator(grant);
    },
    importKey
  };
}
var Vaults;
((Vaults) => {
  function create(config) {
    return createVault(config);
  }
  Vaults.create = create;
  function withDefaults(provider) {
    return createVault({
      providers: [provider],
      defaultProvider: provider
    });
  }
  Vaults.withDefaults = withDefaults;
  function withPersistence(provider, persistence) {
    return createVault({
      providers: [provider],
      defaultProvider: provider,
      persistence
    });
  }
  Vaults.withPersistence = withPersistence;
})(Vaults ||= {});
// src/oobi/oobi-allow-list.ts
var LOCAL_HOSTNAMES = ["localhost", "127.0.0.1"];
var OobiAllowList = {
  check(url, hosts) {
    let u;
    try {
      u = new URL(url);
    } catch {
      return err("oobi-invalid");
    }
    if (u.protocol !== "https:" && u.protocol !== "http:")
      return err("oobi-invalid");
    if (u.protocol === "http:" && !LOCAL_HOSTNAMES.includes(u.hostname))
      return err("oobi-host-not-allowed");
    return hosts.some((h) => h.toLowerCase() === u.host) ? ok(u) : err("oobi-host-not-allowed");
  }
};
// src/policy/presentation-definition.ts
function presentationDefinitionSaid(pd) {
  return Data.digestFor(pd);
}
// src/remote/kel-manifest-data.ts
init_esm();

// src/remote/kel-resource-types.ts
function resourceKey(resource) {
  return `${resource.kind}:${resource.url}`;
}
function mergeRemoteRecords(existing, incoming) {
  const map = new Map;
  for (const record of existing) {
    map.set(resourceKey(record.resource), record);
  }
  for (const record of incoming) {
    const key = resourceKey(record.resource);
    const prior = map.get(key);
    if (!prior || recordSortKey(record) >= recordSortKey(prior)) {
      map.set(key, record);
    }
  }
  return [...map.values()];
}
function recordSortKey(record) {
  return `${record.at}\x00${String(record.seqNo).padStart(12, "0")}`;
}
function manifestUrlFromRecords(records) {
  return records.find((r) => r.resource.kind === "kel.manifest")?.resource.url;
}
function remoteRecordsFromAidManifest(manifest, seqNo, at, manifestUrl) {
  const records = [{ seqNo, at, resource: { kind: "ksn", url: manifest.ksnUrl } }];
  for (const entry of manifest.events) {
    records.push({ seqNo, at, resource: { kind: "kel.event", url: entry.url } });
    if (entry.receiptsUrl) {
      records.push({ seqNo, at, resource: { kind: "kel.receipts", url: entry.receiptsUrl } });
    }
  }
  records.push({ seqNo, at, resource: { kind: "kel.manifest", url: manifestUrl } });
  return mergeRemoteRecords([], records);
}

// src/remote/kel-manifest-data.ts
var RemoteMetadataSchema = Type.Object({
  publishedAt: Type.String(),
  sn: Type.Number()
}, { additionalProperties: false });
var KELPublishedResourceSchema = Type.Union([
  Type.Object({ kind: Type.Literal("ksn"), url: Type.String() }, { additionalProperties: false }),
  Type.Object({ kind: Type.Literal("kel.event"), url: Type.String() }, { additionalProperties: false }),
  Type.Object({ kind: Type.Literal("kel.receipts"), url: Type.String() }, { additionalProperties: false }),
  Type.Object({ kind: Type.Literal("kel.full"), url: Type.String() }, { additionalProperties: false }),
  Type.Object({ kind: Type.Literal("kel.manifest"), url: Type.String() }, { additionalProperties: false }),
  Type.Object({ kind: Type.Literal("tel.event"), url: Type.String() }, { additionalProperties: false }),
  Type.Object({ kind: Type.Literal("tel.full"), url: Type.String() }, { additionalProperties: false }),
  Type.Object({ kind: Type.Literal("tel.rsn"), url: Type.String() }, { additionalProperties: false })
]);
var KELManifestEntrySchema = Type.Object({
  resource: KELPublishedResourceSchema,
  metadata: RemoteMetadataSchema
}, { additionalProperties: false });
var PublishedCredentialSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  registry: CesrDigestSchema,
  schemas: Type.Array(CesrDigestSchema, { minItems: 1 }),
  url: Type.String()
}, { additionalProperties: false });
function validatePublishedCredential(cred) {
  const errors = [];
  try {
    new URL(cred.url);
  } catch {
    errors.push("url must be a valid URI");
  }
  if (new Set(cred.schemas).size !== cred.schemas.length) {
    errors.push("schemas must not contain duplicates");
  }
  return errors;
}
var KELManifestDataSchema = Type.Object({
  v: Type.Literal("kerits-aid-manifest/2"),
  aid: Qb64Schema,
  entries: Type.Array(KELManifestEntrySchema, { minItems: 1 }),
  credentials: Type.Array(PublishedCredentialSchema)
}, { additionalProperties: false });
function latestSnFromKelManifestData(data) {
  const eventSns = data.entries.filter((e) => e.resource.kind === "kel.event").map((e) => e.metadata.sn);
  if (eventSns.length === 0)
    return -1;
  return Math.max(...eventSns);
}
function aidManifestToKelManifestData(manifest, publishedAt) {
  const entries = [
    {
      resource: { kind: "ksn", url: manifest.ksnUrl },
      metadata: { publishedAt, sn: manifest.latestSn }
    }
  ];
  for (const event of manifest.events) {
    entries.push({
      resource: { kind: "kel.event", url: event.url },
      metadata: { publishedAt, sn: event.sn }
    });
    if (event.receiptsUrl) {
      entries.push({
        resource: { kind: "kel.receipts", url: event.receiptsUrl },
        metadata: { publishedAt, sn: event.sn }
      });
    }
  }
  if (manifest.kelUrl) {
    entries.push({
      resource: { kind: "kel.full", url: manifest.kelUrl },
      metadata: { publishedAt, sn: manifest.latestSn }
    });
  }
  return { v: "kerits-aid-manifest/2", aid: manifest.aid, entries, credentials: [] };
}
function saidFromEventUrl(url) {
  const match = url.match(/\/events\/([^/]+)\/event/);
  return match?.[1];
}
function pathFromUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.pathname;
  } catch {
    return url;
  }
}
function kelManifestDataToAidManifest(data, ksnSaid) {
  const ksnEntry = data.entries.find((e) => e.resource.kind === "ksn");
  if (!ksnEntry) {
    throw new Error("KELManifestData missing ksn entry");
  }
  const receiptsBySn = new Map;
  for (const entry of data.entries) {
    if (entry.resource.kind === "kel.receipts") {
      receiptsBySn.set(entry.metadata.sn, { url: entry.resource.url, path: pathFromUrl(entry.resource.url) });
    }
  }
  const events = [];
  for (const entry of data.entries) {
    if (entry.resource.kind !== "kel.event")
      continue;
    const said = saidFromEventUrl(entry.resource.url);
    if (!said) {
      throw new Error(`Cannot derive SAID from event URL: ${entry.resource.url}`);
    }
    const receipts = receiptsBySn.get(entry.metadata.sn);
    events.push({
      sn: entry.metadata.sn,
      said,
      path: pathFromUrl(entry.resource.url),
      url: entry.resource.url,
      receiptsPath: receipts?.path,
      receiptsUrl: receipts?.url
    });
  }
  events.sort((a, b) => a.sn - b.sn);
  const latestSn = latestSnFromKelManifestData(data);
  const kelFull = data.entries.find((e) => e.resource.kind === "kel.full");
  return {
    v: "kerits-aid-manifest/1",
    aid: data.aid,
    latestSn,
    ksnSaid,
    ksnPath: pathFromUrl(ksnEntry.resource.url),
    ksnUrl: ksnEntry.resource.url,
    kelPath: kelFull ? pathFromUrl(kelFull.resource.url) : undefined,
    kelUrl: kelFull?.resource.url,
    events
  };
}
function remoteRecordsFromKelManifestData(data, at, manifestUrl) {
  const headSn = latestSnFromKelManifestData(data);
  const records = data.entries.map((entry) => ({
    seqNo: headSn,
    at,
    resource: entry.resource
  }));
  if (!records.some((r) => r.resource.kind === "kel.manifest")) {
    records.push({ seqNo: headSn, at, resource: { kind: "kel.manifest", url: manifestUrl } });
  }
  return mergeRemoteRecords([], records);
}
function parseKelManifestWire(value) {
  if (typeof value !== "object" || value === null)
    return;
  const v = value.v;
  if (v === "kerits-aid-manifest/2") {
    if (!Check(KELManifestDataSchema, value))
      return;
    return { version: 2, data: value };
  }
  if (v === "kerits-aid-manifest/1") {
    if (!Check(AidManifestSchema, value))
      return;
    return { version: 1, manifest: value };
  }
  return;
}
function manifestUrlFromKelManifestData(data) {
  return data.entries.find((e) => e.resource.kind === "kel.manifest")?.resource.url;
}
// src/remote/membership-directory.ts
init_esm();
var MemberDirectoryEntrySchema = Type.Object({
  aid: Type.String(),
  contributingKey: Type.Optional(Type.String())
}, { additionalProperties: false });
function memberRole(entry) {
  return entry.contributingKey !== undefined ? "admin" : "member";
}
var PublishedMembershipDirectorySchema = Type.Object({
  v: Type.Literal("kerits-members/1"),
  subjectAid: Type.String(),
  members: Type.Array(MemberDirectoryEntrySchema, { minItems: 1 }),
  kelSequenceNumber: Type.Integer({ minimum: 0 }),
  updatedAt: Type.String()
}, { additionalProperties: false });
function buildPublishedMembershipDirectory(input) {
  return {
    v: "kerits-members/1",
    subjectAid: input.subjectAid,
    members: input.members.map((m) => m.contributingKey === undefined ? { aid: m.aid } : { aid: m.aid, contributingKey: m.contributingKey }),
    kelSequenceNumber: input.kelSequenceNumber,
    updatedAt: new Date().toISOString()
  };
}
// src/remote/typed-remote.ts
function createTypedRemote(store, codec, resolvePath) {
  return {
    async publish(key, value) {
      const payloadFormat = codec.payloadFormat ?? "json";
      return store.publish(resolvePath(key), codec.encode(value), { payloadFormat });
    },
    async fetch(key) {
      const data = await store.fetch(resolvePath(key));
      return data === undefined ? undefined : codec.decode(data);
    }
  };
}
// src/requirements/auth-types.ts
init_esm();
var AidSchema2 = Type.Unsafe(Type.String({ minLength: 1 }));
var SaidSchema2 = Type.Unsafe(Type.String({ minLength: 1 }));
var ProofNonceSchema = Type.String({ minLength: 32, maxLength: 128 });
var PolicyRefSchema = Type.Union([SaidSchema2, PolicySchema]);
function isPolicySaid(ref) {
  return typeof ref === "string";
}
function isInlinePolicy(ref) {
  return typeof ref === "object" && ref !== null && "d" in ref && "requirement" in ref;
}
var ALIAS_PATTERN2 = "^[a-z][a-z0-9_-]{0,31}$";
var AliasSchema = Type.String({ pattern: ALIAS_PATTERN2 });
var RequestEntrySchema = Type.Object({
  policy: PolicyRefSchema,
  as: AliasSchema,
  need: Type.Union([Type.Literal("required"), Type.Literal("optional")]),
  purpose: Type.String(),
  audienceFrom: Type.Optional(Type.String({ minLength: 1 })),
  audience: Type.Optional(Type.String({ minLength: 1 })),
  audienceIncludes: Type.Optional(Type.Array(AliasSchema))
}, { additionalProperties: false });
var AuthRequestSchema = Type.Object({
  entries: Type.Array(RequestEntrySchema, { minItems: 1 }),
  nonce: ProofNonceSchema,
  audience: Type.String({ minLength: 1 }),
  createdAt: TimestampSchema,
  expiresAt: TimestampSchema,
  allowTargetAid: Type.Boolean(),
  targetAidDescription: Type.Optional(Type.String({ minLength: 1 }))
}, { additionalProperties: false });
var AuthResponseSlotSchema = Type.Object({
  policySaid: SaidSchema2,
  policy: Type.Optional(PolicySchema),
  subject: AidSchema2,
  evidence: SuppliedEvidenceSchema
}, { additionalProperties: false });
var AuthResponseSchema = Type.Object({
  requestNonce: ProofNonceSchema,
  target: Type.Optional(AidSchema2),
  slots: Type.Record(Type.String(), AuthResponseSlotSchema),
  controls: Type.Record(Type.String(), ChallengeResponseSchema)
}, { additionalProperties: false });
var isAuthRequest = (value) => Check(AuthRequestSchema, value);
var isAuthResponse = (value) => Check(AuthResponseSchema, value);

// src/requirements/requirement-ops.ts
init_esm();

// src/requirements/field-path.ts
var ESCAPED_CHARACTERS = new Set(["\\", ".", "[", "]", "/", "~"]);
function escapeFieldPathProperty(property) {
  let escaped = "";
  for (const character of property) {
    escaped += ESCAPED_CHARACTERS.has(character) ? `\\${character}` : character;
  }
  return escaped;
}
function formatFieldPath(segments) {
  if (segments.length === 0)
    throw new Error("Field path must contain at least one segment");
  return segments.map(({ property, array }) => {
    if (!property)
      throw new Error("Field path properties must not be empty");
    return `${escapeFieldPathProperty(property)}${array ? "[]" : ""}`;
  }).join(".");
}
function parseFieldPath(path) {
  if (!path)
    throw new Error("Field path must not be empty");
  const segments = [];
  let property = "";
  let array = false;
  const finishSegment = () => {
    if (!property)
      throw new Error("Field path segments must not be empty");
    segments.push({ property, array });
    property = "";
    array = false;
  };
  for (let index = 0;index < path.length; index += 1) {
    const character = path[index];
    if (character === "\\") {
      const escaped = path[index + 1];
      if (!escaped)
        throw new Error("Field path must not end with an escape");
      if (!ESCAPED_CHARACTERS.has(escaped)) {
        throw new Error(`Invalid field path escape: \\${escaped}`);
      }
      property += escaped;
      index += 1;
      continue;
    }
    if (character === ".") {
      finishSegment();
      continue;
    }
    if (character === "[" && path[index + 1] === "]") {
      if (!property || array)
        throw new Error("Invalid field path array marker");
      const following = path[index + 2];
      if (following !== undefined && following !== ".") {
        throw new Error("Field path array marker must terminate its segment");
      }
      array = true;
      index += 1;
      continue;
    }
    if (ESCAPED_CHARACTERS.has(character)) {
      throw new Error(`Reserved field path character must be escaped: ${character}`);
    }
    property += character;
  }
  finishSegment();
  return segments;
}
function readValueAtSegments(value, segments) {
  if (segments.length === 0)
    return [value];
  const [head, ...rest] = segments;
  if (!head)
    return [value];
  if (value === null || value === undefined || typeof value !== "object")
    return [];
  const record = value;
  if (!Object.hasOwn(record, head.property))
    return [];
  const resolved = record[head.property];
  if (!head.array)
    return readValueAtSegments(resolved, rest);
  if (!Array.isArray(resolved))
    return [];
  return resolved.flatMap((item) => readValueAtSegments(item, rest));
}
function resolveFieldPath(attributes, path) {
  if (!attributes || typeof attributes !== "object")
    return [];
  const segments = parseFieldPath(path);
  return readValueAtSegments(attributes, segments);
}
function pathIncludesArray(path) {
  return parseFieldPath(path).some((segment) => segment.array);
}
function fieldPathToJsonPath(path) {
  const jsonPath = parseFieldPath(path).map(({ property, array }) => {
    const accessor = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(property) ? `.${property}` : `[${JSON.stringify(property)}]`;
    return `${accessor}${array ? "[*]" : ""}`;
  }).join("");
  return `$.credentialSubject${jsonPath}`;
}

// src/requirements/disclosure-ops.ts
function validatePath(path) {
  if (path === ".")
    return ok(true);
  try {
    parseFieldPath(path);
    return ok(true);
  } catch (e) {
    return err({ kind: "invalid-path", detail: e instanceof Error ? e.message : path });
  }
}
function subjectAttrs(a) {
  if (typeof a !== "object" || a === null || Array.isArray(a))
    return {};
  const out = {};
  for (const [k, v] of Object.entries(a)) {
    if (k === "d" || k === "i")
      continue;
    if (v !== undefined && v !== null)
      put(out, k, v);
  }
  return out;
}
function put(obj, key, value) {
  Object.defineProperty(obj, key, { value, enumerable: true, writable: true, configurable: true });
}
function objectAt(claims, segments) {
  let cur = claims;
  for (const seg of segments) {
    const next = Object.hasOwn(cur, seg) ? cur[seg] : undefined;
    if (typeof next !== "object" || next === null || Array.isArray(next))
      put(cur, seg, {});
    cur = cur[seg];
  }
  return cur;
}
function valueAtPath(attrs, path) {
  if (path === ".")
    return attrs;
  const values = resolveFieldPath(attrs, path);
  return values.length > 0 && values[0] !== undefined && values[0] !== null ? values[0] : undefined;
}
function holderOf(a) {
  return typeof a === "object" && a !== null && Object.hasOwn(a, "i") ? a.i : undefined;
}
function leafOf(e, subject, published) {
  switch (e.type) {
    case "has-credential": {
      const holder = holderOf(e.acdc.a);
      const said = String(e.acdc.d);
      const oobis = Object.hasOwn(published, said) ? published[said] : undefined;
      return {
        attrs: subjectAttrs(e.acdc.a),
        metadata: {
          issuerAID: String(e.acdc.i),
          ...typeof holder === "string" ? { holderAID: holder } : {},
          acdcSAID: said,
          ...oobis?.credentialOOBI ? { credentialOOBI: oobis.credentialOOBI } : {},
          ...oobis?.telOOBI ? { telOOBI: oobis.telOOBI } : {}
        }
      };
    }
    case "self-asserted":
      return { attrs: subjectAttrs(e.attributes), metadata: { holderAID: subject } };
    case "is-member":
    case "and":
    case "or":
      return;
    default: {
      const _exhaustive = e;
      throw new Error(`Unsupported evidence: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
function projectLeaf(d, leaf, prefix, out) {
  const missing = (path) => out.missingRequired.push([...prefix, path].join("."));
  const data = {};
  for (const f of d.fields) {
    const value = valueAtPath(leaf.attrs, f.path);
    if (value === undefined) {
      if (f.required)
        missing(`data.${f.path}`);
    } else if (f.path === ".") {
      for (const [k, v] of Object.entries(value))
        put(data, k, v);
    } else {
      const segs = parseFieldPath(f.path).map((s) => s.property);
      put(objectAt(data, segs.slice(0, -1)), segs.at(-1), value);
    }
  }
  const meta = {};
  for (const m of d.metadata) {
    const value = leaf.metadata[m.field];
    if (value !== undefined)
      meta[m.field] = value;
    else if (m.required)
      missing(`credential.${m.field}`);
  }
  if (Object.keys(data).length === 0 && Object.keys(meta).length === 0)
    return;
  const target = objectAt(out.claims, prefix);
  if (Object.keys(data).length > 0)
    put(target, "data", data);
  if (Object.keys(meta).length > 0)
    put(target, "credential", meta);
}
function walk(r, e, input, prefix, out) {
  switch (r.type) {
    case "is-member":
      return;
    case "has-credential": {
      const leaf = leafOf(e, input.subject, input.published ?? {});
      if (leaf)
        projectLeaf(r.disclosure, leaf, prefix, out);
      return;
    }
    case "and":
    case "or": {
      if (e.type !== r.type)
        return;
      for (const [name, child] of Object.entries(r.requirements)) {
        if (Object.hasOwn(e.evidence, name))
          walk(child, e.evidence[name], input, [...prefix, name], out);
      }
      return;
    }
    default: {
      const _exhaustive = r;
      throw new Error(`Unsupported requirement: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
var DisclosureOps = {
  empty() {
    return { fields: [], metadata: [] };
  },
  validate(d) {
    if (!Check(CredentialDisclosureSchema, d)) {
      return err({ kind: "invalid-shape" });
    }
    const seen = new Set;
    for (const f of d.fields) {
      const v = validatePath(f.path);
      if (!v.ok)
        return v;
      if (seen.has(f.path))
        return err({ kind: "duplicate-path", detail: f.path });
      seen.add(f.path);
    }
    const metaSeen = new Set;
    for (const m of d.metadata) {
      if (metaSeen.has(m.field))
        return err({ kind: "duplicate-path", detail: m.field });
      metaSeen.add(m.field);
    }
    return ok(d);
  },
  project(input) {
    const out = { claims: {}, missingRequired: [] };
    walk(input.requirement, input.evidence, input, [], out);
    return out;
  }
};

// src/requirements/requirement-data.ts
function normalized(value) {
  return JSON.parse(JSON.stringify(value));
}
function said2(r) {
  return Data.digestFor(normalized(r));
}
function isMember(parentAID, opts = {}) {
  return opts.maxDepth === undefined ? { type: "is-member", parentAID } : { type: "is-member", parentAID, maxDepth: opts.maxDepth };
}
function hasCredential(input) {
  return normalized({ type: "has-credential", ...input, disclosure: input.disclosure ?? { fields: [], metadata: [] } });
}
var RequirementData = {
  said: said2,
  isMember,
  hasCredential,
  and: (requirements) => ({ type: "and", requirements }),
  or: (requirements) => ({ type: "or", requirements })
};
function policyDigest(requirement, purpose, onboarding) {
  return Data.digestFor(normalized({
    ...purpose !== undefined ? { purpose } : {},
    ...onboarding !== undefined && onboarding.length > 0 ? { onboarding: [...onboarding] } : {},
    requirement
  }));
}
var PolicyData = {
  create: (requirement, purpose, onboarding) => {
    const p = purpose === "" ? undefined : purpose;
    const list = onboarding !== undefined && onboarding.length > 0 ? [...onboarding] : undefined;
    return normalized({ d: policyDigest(requirement, p, list), purpose: p, onboarding: list, requirement });
  },
  digest: policyDigest
};

// src/requirements/requirement-ops.ts
for (const f of ["qb64", "qb64-key", "qb64-digest", "qb64-signature", "qb64-key-transferable"]) {
  if (!Has(f))
    Set2(f, () => true);
}
var NAME_RE = new RegExp(ALIAS_PATTERN2);
var RESERVED_NAMES = new Set(["data", "credential"]);
function fail2(kind, path, detail) {
  return err(detail === undefined ? { kind, path } : { kind, path, detail });
}
function validateIssuer(r, path) {
  switch (r.issuer.type) {
    case "any-of":
    case "any":
      return ok(true);
    case "self-asserted":
      return r.holder.type === "subject" ? ok(true) : fail2("invalid-shape", path, "self-asserted requires holder subject");
    default: {
      const unknownIssuer = r.issuer;
      return fail2("invalid-shape", path, `unknown issuer: ${JSON.stringify(unknownIssuer)}`);
    }
  }
}
function validateDisclosure(r, path) {
  const d = DisclosureOps.validate(r.disclosure);
  if (!d.ok)
    return fail2(d.error.kind === "duplicate-path" ? "duplicate-path" : "invalid-shape", path, d.error.detail);
  if (r.issuer.type === "self-asserted") {
    const acdcOnly = r.disclosure.metadata.find((m) => ACDC_ONLY_METADATA.includes(m.field));
    if (acdcOnly)
      return fail2("metadata-unsatisfiable", path, acdcOnly.field);
  }
  return ok(true);
}
function validateTree(r, path, depth) {
  switch (r.type) {
    case "is-member":
      return ok(r);
    case "has-credential": {
      const issuer = validateIssuer(r, path);
      if (!issuer.ok)
        return issuer;
      const disclosure = validateDisclosure(r, path);
      if (!disclosure.ok)
        return disclosure;
      if (r.issuer.type === "self-asserted" && r.sources !== undefined)
        return fail2("invalid-shape", path, "self-asserted may not carry sources");
      if (!SchemaOps.verifySaid(r.credential.schema))
        return fail2("schema-said-invalid", path);
      for (const p of r.credential.predicates) {
        if (!predicateHasRequiredValues(p.op, p.value, p.value2, p.values))
          return fail2("predicate-invalid", path, p.path);
      }
      return ok(r);
    }
    case "and":
    case "or": {
      if (depth > MAX_REQUIREMENT_DEPTH)
        return fail2("too-deep", path);
      const entries = Object.entries(r.requirements);
      if (entries.length === 0)
        return fail2("empty-expression", path);
      for (const [key, child] of entries) {
        if (!NAME_RE.test(key))
          return fail2("reserved-name", [...path, key], `name must match ${ALIAS_PATTERN2}`);
        if (RESERVED_NAMES.has(key))
          return fail2("reserved-name", [...path, key], `name ${key} is reserved`);
        const v = validateTree(child, [...path, key], depth + 1);
        if (!v.ok)
          return v;
      }
      return ok(r);
    }
    default: {
      const unknownType = r;
      return fail2("invalid-shape", path, `unknown requirement: ${JSON.stringify(unknownType)}`);
    }
  }
}
function validate2(r) {
  if (!Check(RequirementSchema, r)) {
    const first = Errors(RequirementSchema, r).First();
    return fail2("invalid-shape", [], first ? `${first.path}: ${first.message}` : undefined);
  }
  return validateTree(r, [], 1);
}
function expectedHolder(r, subject) {
  switch (r.holder.type) {
    case "subject":
    case "holder-is-member":
      return subject;
    case "member-of-holder":
      return r.holder.parentAID;
    default: {
      const unknownHolder = r.holder;
      throw new Error(`Unsupported holder: ${JSON.stringify(unknownHolder)}`);
    }
  }
}
var push = (out, kind, detail) => out.push(detail === undefined ? { path: [], kind } : { path: [], kind, detail });
function isRecord(a) {
  return typeof a === "object" && a !== null && !Array.isArray(a);
}
function predicateFailures(r, attrs, now) {
  const out = [];
  for (const p of r.credential.predicates) {
    let passed = false;
    try {
      passed = attrs !== undefined && resolveFieldPath(attrs, p.path).some((v) => evaluateFieldPredicate(v, p, p.fieldType ?? "string", now.getTime()));
    } catch {
      passed = false;
    }
    if (!passed)
      push(out, "predicate-failed", p.path);
  }
  return out;
}
function matchCredential(r, acdc, subject, now) {
  const failures = [];
  const f = (kind, detail) => push(failures, kind, detail);
  if (acdc.s !== r.credential.schema.d)
    f("schema-mismatch", String(acdc.s));
  switch (r.issuer.type) {
    case "any-of":
      if (!r.issuer.aids.includes(acdc.i))
        f("issuer-not-allowed", String(acdc.i));
      break;
    case "any":
      break;
    case "self-asserted":
      f("type-mismatch", "self-asserted requirement cannot be met by an ACDC");
      break;
    default: {
      const unknownIssuer = r.issuer;
      f("type-mismatch", `unknown issuer ${JSON.stringify(unknownIssuer)}`);
    }
  }
  const attrs = isRecord(acdc.a) ? acdc.a : undefined;
  if (!attrs || !ACDCOps.projectAndValidateClaims(acdc, r.credential.schema).validation.valid)
    f("claims-invalid");
  failures.push(...predicateFailures(r, attrs, now));
  const holder = expectedHolder(r, subject);
  if (attrs?.i !== holder)
    f("holder-mismatch", `expected ${holder}`);
  return failures.length === 0 ? ok(true) : err(failures);
}
function matchSelfAsserted(r, attributes, now) {
  const failures = [];
  const attrs = isRecord(attributes) ? attributes : undefined;
  if (!attrs || !SchemaOps.validate(r.credential.schema, attrs).valid)
    push(failures, "claims-invalid");
  failures.push(...predicateFailures(r, attrs, now));
  if (r.holder.type !== "subject")
    push(failures, "holder-mismatch", "self-asserted requires holder subject");
  return failures.length === 0 ? ok(true) : err(failures);
}
function leaves(r, path = []) {
  switch (r.type) {
    case "is-member":
    case "has-credential":
      return [{ path, leaf: r }];
    case "and":
    case "or":
      return Object.entries(r.requirements).flatMap(([key, child]) => leaves(child, [...path, key]));
    default: {
      const unknownRequirement = r;
      throw new Error(`Unsupported requirement: ${JSON.stringify(unknownRequirement)}`);
    }
  }
}
var RequirementOps = { validate: validate2, matchCredential, matchSelfAsserted, leaves };
var PolicyOps = {
  validate(p) {
    if (!Check(PolicySchema, p))
      return fail2("invalid-shape", []);
    const v = validate2(p.requirement);
    if (!v.ok)
      return v;
    return p.d === PolicyData.digest(p.requirement, p.purpose, p.onboarding) ? ok(p) : fail2("said-mismatch", ["d"]);
  }
};

// src/requirements/auth-ops.ts
function resolve3(ref, fetch) {
  const policy = isPolicySaid(ref) ? fetch?.(ref) : isInlinePolicy(ref) ? ref : null;
  if (policy === null)
    return err({ kind: "invalid" });
  if (!policy)
    return err({ kind: "not-found" });
  const valid = PolicyOps.validate(policy);
  if (!valid.ok)
    return err({ kind: valid.error.kind === "said-mismatch" ? "said-mismatch" : "invalid" });
  return isPolicySaid(ref) && policy.d !== ref ? err({ kind: "said-mismatch" }) : ok(policy);
}
var PolicyRefOps = { resolve: resolve3 };
var RESERVED_ALIASES = new Set(["v", "policySAIDs"]);
function isAllowedAudience(value) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}
var ALIAS_RE = new RegExp(ALIAS_PATTERN2);
function validateRequest(r) {
  const aliases = new Set(r.entries.map((e) => e.as));
  const seen = new Set;
  const errors = [];
  for (const e of r.entries) {
    const fail = (kind) => errors.push({ kind, as: e.as });
    if (seen.has(e.as))
      fail("duplicate-alias");
    else if (RESERVED_ALIASES.has(e.as))
      fail("reserved-alias");
    else if (!ALIAS_RE.test(e.as))
      fail("bad-alias");
    seen.add(e.as);
    const includes = e.audienceIncludes ?? [];
    if (e.audience !== undefined && e.audienceFrom !== undefined)
      fail("audience-and-audience-from");
    else if (e.audience !== undefined && !isAllowedAudience(e.audience))
      fail("audience-invalid");
    else if (includes.length > 0 && !e.audience && !e.audienceFrom)
      fail("includes-without-audience");
    else if (includes.includes(e.as))
      fail("self-include");
    else if (includes.some((a) => !aliases.has(a)))
      fail("unknown-include");
  }
  return errors.length > 0 ? err(errors) : ok(r);
}
function own2(rec, key) {
  return rec && Object.hasOwn(rec, key) ? rec[key] : undefined;
}
function resolveSlotPolicy(ref, slot, fetchPolicy) {
  const refSaid = isPolicySaid(ref) ? ref : isInlinePolicy(ref) ? ref.d : undefined;
  return resolve3(slot.policy && slot.policy.d === refSaid ? slot.policy : ref, fetchPolicy);
}
function checkShape(request, response, fetchPolicy) {
  if (response.requestNonce !== request.nonce)
    return err([{ kind: "nonce-mismatch" }]);
  if (response.target && !request.allowTargetAid)
    return err([{ kind: "target-not-allowed" }]);
  const requested = new Set(request.entries.map((e) => e.as));
  const failures = Object.keys(response.slots).filter((as) => !requested.has(as)).map((as) => ({ kind: "unknown-alias", as }));
  const shaped = [];
  for (const entry of request.entries) {
    const { as } = entry;
    const slot = own2(response.slots, as);
    if (!slot) {
      if (entry.need === "required")
        failures.push({ kind: "required-missing", as });
      continue;
    }
    const resolved = resolveSlotPolicy(entry.policy, slot, fetchPolicy);
    if (!resolved.ok)
      failures.push({ kind: "policy-unresolved", as, reason: resolved.error.kind });
    else if (slot.policySaid !== resolved.value.d)
      failures.push({ kind: "policy-said-mismatch", as });
    else
      shaped.push({ entry, slot, policy: resolved.value });
  }
  return failures.length > 0 ? err(failures) : ok(shaped);
}
function controlAids(request, response) {
  const aliasesOf = new Map;
  for (const { as } of request.entries) {
    const slot = own2(response.slots, as);
    if (slot)
      aliasesOf.set(slot.subject, [...aliasesOf.get(slot.subject) ?? [], as]);
  }
  if (response.target && !aliasesOf.has(response.target))
    aliasesOf.set(response.target, []);
  return aliasesOf;
}
function verifyControl(request, aid, control, kels) {
  if (control.aid !== aid)
    return err("aid-mismatch");
  const kel = own2(kels, aid);
  if (!kel || kel.length === 0)
    return err("kel-missing");
  const r = ChallengeOps.verify({ nonce: request.nonce, audience: request.audience }, control, kel, kels, AUTH_DOMAIN);
  return r.ok ? ok(control.publicKey) : err(r.error.kind);
}
function signingBytes2(r) {
  return ChallengeOps.signingBytes(r, AUTH_DOMAIN);
}
var AuthOps = { validateRequest, checkShape, controlAids, verifyControl, signingBytes: signingBytes2 };

// src/requirements/credential-eligibility.ts
var CredentialEligibility = {
  forSelfAsserted(r) {
    const required = r.disclosure.metadata.filter((m) => m.required && ACDC_ONLY_METADATA.includes(m.field)).map((m) => m.field);
    return required.length === 0 ? { ok: true } : { ok: false, required };
  }
};

// src/requirements/evidence-data.ts
function unwrap(ref) {
  if (isOobiRef(ref))
    return { ok: false, oobi: ref.oobi };
  if (isRequiredRef(ref))
    return { ok: true, value: ref.value };
  return { ok: true, value: ref };
}
function refUrl(ref) {
  return typeof ref === "object" && ref !== null && !Array.isArray(ref) && Object.hasOwn(ref, "oobi") ? String(ref.oobi) : undefined;
}
function refs(e) {
  switch (e.type) {
    case "is-member":
      return Object.values(e.kels).flatMap((k) => refUrl(k) ?? []);
    case "has-credential":
      return [
        refUrl(e.acdc),
        refUrl(e.registryTel),
        refUrl(e.credentialTel),
        ...Object.values(e.kels).map(refUrl),
        ...e.membership ? refs(e.membership) : []
      ].filter((u) => u !== undefined);
    case "self-asserted":
      return [];
    case "and":
    case "or":
      return Object.values(e.evidence).flatMap(refs);
    default: {
      const unknownEvidence = e;
      throw new Error(`Unsupported evidence: ${JSON.stringify(unknownEvidence)}`);
    }
  }
}
function inlineKels(kels, missing) {
  const out = {};
  for (const [aid, ref] of Object.entries(kels)) {
    const u = unwrap(ref);
    if (u.ok)
      out[aid] = u.value;
    else
      missing.push(u.oobi);
  }
  return out;
}
function inlineMembership(e, missing) {
  return { type: "is-member", lineage: e.lineage, kels: inlineKels(e.kels, missing) };
}
function inline(e, missing) {
  switch (e.type) {
    case "is-member":
      return inlineMembership(e, missing);
    case "has-credential": {
      const acdc = unwrap(e.acdc);
      const registryTel = unwrap(e.registryTel);
      const credentialTel = unwrap(e.credentialTel);
      for (const u of [acdc, registryTel, credentialTel])
        if (!u.ok)
          missing.push(u.oobi);
      const kels = inlineKels(e.kels, missing);
      const membership = e.membership ? inlineMembership(e.membership, missing) : undefined;
      if (!acdc.ok || !registryTel.ok || !credentialTel.ok)
        return;
      return {
        type: "has-credential",
        acdc: acdc.value,
        registryTel: registryTel.value,
        credentialTel: credentialTel.value,
        kels,
        ...membership ? { membership } : {}
      };
    }
    case "self-asserted":
      return { type: "self-asserted", attributes: e.attributes };
    case "and":
    case "or": {
      const children = Object.entries(e.evidence).map(([k, v]) => [k, inline(v, missing)]);
      if (children.some(([, v]) => v === undefined))
        return;
      return { type: e.type, evidence: Object.fromEntries(children) };
    }
    default: {
      const unknownEvidence = e;
      throw new Error(`Unsupported evidence: ${JSON.stringify(unknownEvidence)}`);
    }
  }
}
function at(e, path) {
  let cur = e;
  for (const name of path) {
    if (cur?.type !== "and" && cur?.type !== "or")
      return;
    const children = cur.evidence;
    cur = Object.hasOwn(children, name) ? children[name] : undefined;
  }
  return cur;
}
var EvidenceData = {
  refs,
  at,
  parseSupplied(raw) {
    if (Check(SuppliedEvidenceSchema, raw))
      return ok(raw);
    const first = Errors(SuppliedEvidenceSchema, raw).First();
    return err(first ? `${first.path || "/"}: ${first.message}` : "invalid evidence");
  },
  fromInline(e) {
    const missing = [];
    const value = inline(e, missing);
    return value !== undefined && missing.length === 0 ? ok(value) : err({ refs: missing });
  }
};

// src/tel/events.ts
function selectSurface3(ilk, hasNonce) {
  switch (ilk) {
    case "vcp":
      return hasNonce ? TEL_VCP_WITH_NONCE_SURFACE : TEL_VCP_SURFACE;
    case "vrt":
      return TEL_VRT_SURFACE;
    case "iss":
      return TEL_ISS_SURFACE;
    case "rev":
      return TEL_REV_SURFACE;
    case "bis":
      return TEL_BIS_SURFACE;
    case "brv":
      return TEL_BRV_SURFACE;
    default:
      throw new Error(`selectSurface: unknown TEL ilk '${ilk}'`);
  }
}
var TELEvents;
((TELEvents) => {
  function buildVcp(params) {
    const unsignedEvent = {
      v: "KERI10JSON000000_",
      t: "vcp",
      d: "",
      i: "",
      ii: params.issuerAid,
      s: "0",
      c: params.config ?? [],
      bt: params.backerThreshold ?? "0",
      b: params.backers
    };
    if (params.nonce !== undefined) {
      unsignedEvent.n = params.nonce;
    }
    return { unsignedEvent };
  }
  TELEvents.buildVcp = buildVcp;
  function buildVrt(params) {
    const unsignedEvent = {
      v: "KERI10JSON000000_",
      t: "vrt",
      d: "",
      i: params.registryId,
      p: params.priorEventSaid,
      s: SequenceNumber.encode(params.sequence),
      bt: params.backerThreshold,
      br: params.backersRemoved,
      ba: params.backersAdded
    };
    return { unsignedEvent };
  }
  TELEvents.buildVrt = buildVrt;
  function buildIss(params) {
    const unsignedEvent = {
      v: "KERI10JSON000000_",
      t: "iss",
      d: "",
      i: params.credentialSaid,
      s: SequenceNumber.encode(params.sequence),
      ri: params.registryId,
      dt: params.datetime
    };
    return { unsignedEvent };
  }
  TELEvents.buildIss = buildIss;
  function buildRev(params) {
    const unsignedEvent = {
      v: "KERI10JSON000000_",
      t: "rev",
      d: "",
      i: params.credentialSaid,
      s: SequenceNumber.encode(params.sequence),
      ri: params.registryId,
      p: params.priorEventSaid,
      dt: params.datetime
    };
    return { unsignedEvent };
  }
  TELEvents.buildRev = buildRev;
  function buildBis(params) {
    const unsignedEvent = {
      v: "KERI10JSON000000_",
      t: "bis",
      d: "",
      i: params.credentialSaid,
      ii: params.issuerAid,
      s: SequenceNumber.encode(params.sequence),
      ra: params.registrySeal,
      dt: params.datetime
    };
    return { unsignedEvent };
  }
  TELEvents.buildBis = buildBis;
  function buildBrv(params) {
    const unsignedEvent = {
      v: "KERI10JSON000000_",
      t: "brv",
      d: "",
      i: params.credentialSaid,
      s: SequenceNumber.encode(params.sequence),
      p: params.priorEventSaid,
      ra: params.registrySeal,
      dt: params.datetime
    };
    return { unsignedEvent };
  }
  TELEvents.buildBrv = buildBrv;
  function computeSaid(unsignedEvent, isInception = false) {
    const hasNonce = "n" in unsignedEvent && unsignedEvent.n !== undefined;
    const surface = selectSurface3(unsignedEvent.t, hasNonce);
    const eventForDerivation = isInception ? { ...unsignedEvent, i: SAID_PLACEHOLDER } : unsignedEvent;
    const canonUnsigned = serializeForSigning(eventForDerivation, surface);
    const { sealed, said } = deriveSaid(eventForDerivation, surface);
    const event = isInception ? { ...sealed, i: said } : sealed;
    const canonFinal = serializeForSigning(event, surface);
    return {
      event,
      canonFinal,
      canonUnsigned,
      said
    };
  }
  TELEvents.computeSaid = computeSaid;
  function nextSequence(priorSeq) {
    return SequenceNumber.of(priorSeq) + 1;
  }
  TELEvents.nextSequence = nextSequence;
})(TELEvents ||= {});

// src/tel/tel-data.ts
function isVcp(e) {
  return e.t === "vcp";
}
function isVrt(e) {
  return e.t === "vrt";
}
function isIss(e) {
  return e.t === "iss";
}
function isRev(e) {
  return e.t === "rev";
}
function isBis(e) {
  return e.t === "bis";
}
function isBrv(e) {
  return e.t === "brv";
}
function isEstablishment3(e) {
  return isVcp(e) || isVrt(e);
}
function backerList(event, rsn) {
  if (isVcp(event))
    return event.b;
  if (rsn)
    return rsn.b;
  return [];
}
function backerThreshold(event, rsn) {
  const raw = isVcp(event) || isVrt(event) ? event.bt : rsn?.bt;
  const bt = raw === undefined ? undefined : Threshold.witness(raw, Number.POSITIVE_INFINITY);
  return bt?.ok ? bt.value : 0;
}
function priorSaid(event) {
  if (isVrt(event) || isRev(event) || isBrv(event))
    return event.p;
  return;
}
function credentialId(event) {
  if (isIss(event) || isRev(event) || isBis(event) || isBrv(event))
    return event.i;
  return;
}
function registryId(event) {
  if (isVcp(event) || isVrt(event))
    return event.i;
  if (isIss(event) || isRev(event))
    return event.ri;
  if (isBis(event) || isBrv(event))
    return event.ra.i;
  return event.i;
}
function sequenceNumber(event) {
  return SequenceNumber.of(event.s);
}
function fromTEL(rid, entries) {
  if (entries.length === 0)
    return;
  const first = entries[0];
  if (!first || !isVcp(first) || first.i !== rid)
    return;
  let bt = "1";
  let b = [];
  let c = [];
  let _headSaid = "";
  let headSeq = "0";
  let headEt = "vcp";
  for (const evt of entries) {
    _headSaid = evt.d;
    headEt = evt.t;
    if ("s" in evt && typeof evt.s === "string") {
      headSeq = evt.s;
    }
    if (isVcp(evt)) {
      bt = evt.bt;
      b = [...evt.b];
      c = evt.c ?? [];
    } else if (isVrt(evt)) {
      bt = evt.bt;
      const removeSet = new Set(evt.br);
      b = b.filter((aid) => !removeSet.has(aid));
      for (const aid of evt.ba) {
        if (!b.includes(aid)) {
          b.push(aid);
        }
      }
    }
  }
  const rsnBody = {
    v: "",
    i: rid,
    s: headSeq,
    d: "",
    et: headEt,
    bt,
    b,
    c
  };
  const RSN_SURFACE = {
    saidField: "d",
    derivedFieldsInOrder: ["v", "i", "s", "d", "et", "bt", "b", "c"],
    hasVersionString: true,
    versionStringField: "v",
    protocol: "KERI"
  };
  const { sealed } = deriveSaid(rsnBody, RSN_SURFACE);
  return sealed;
}
var TELData = {
  isVcp,
  isVrt,
  isIss,
  isRev,
  isBis,
  isBrv,
  isEstablishment: isEstablishment3,
  backerList,
  backerThreshold,
  priorSaid,
  credentialId,
  registryId,
  sequenceNumber,
  fromTEL
};

// src/tel/ops.ts
function head(entries) {
  return entries.length > 0 ? entries[entries.length - 1] : undefined;
}
function issuerId(entries) {
  if (entries.length === 0)
    return;
  const first = entries[0];
  if (first && TELData.isVcp(first) && first.s === "0") {
    return first.ii;
  }
  return;
}
function credentialStatus(entries, credSaid) {
  let status = "unknown";
  for (const evt of entries) {
    if ((TELData.isIss(evt) || TELData.isBis(evt)) && evt.i === credSaid) {
      status = "issued";
    } else if ((TELData.isRev(evt) || TELData.isBrv(evt)) && evt.i === credSaid) {
      status = "revoked";
    }
  }
  return status;
}
var schemaByType = {
  vcp: VcpEventSchema,
  vrt: VrtEventSchema,
  iss: IssEventSchema,
  rev: RevEventSchema,
  bis: BisEventSchema,
  brv: BrvEventSchema
};
function validateEvent(event) {
  const errors = [];
  const schema = schemaByType[event.t];
  if (!schema) {
    errors.push({ field: "t", message: `unknown event type: ${event.t}` });
    return { ok: false, errors };
  }
  const typeboxErrors = [...Errors(schema, event)].filter((e) => !e.message.startsWith("Unknown format"));
  if (typeboxErrors.length > 0) {
    for (const err of typeboxErrors) {
      errors.push({ field: err.path.replace(/^\//, "") || err.path, message: err.message });
    }
    return { ok: false, errors };
  }
  if (!event.d) {
    errors.push({ field: "d", message: "missing or empty SAID" });
  }
  if (!event.i) {
    errors.push({ field: "i", message: "missing or empty identifier" });
  }
  const sn = SequenceNumber.parse(event.s);
  if (!sn.ok) {
    errors.push({ field: "s", message: `sequence must be a hex string: ${sn.error.message}` });
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
function validateAppend(existing, candidate, scope = "registry") {
  const errors = [];
  const structural = validateEvent(candidate);
  if (!structural.ok)
    return structural;
  const expectedSeq = existing.length;
  const candidateSeq = SequenceNumber.of(candidate.s);
  if (candidateSeq !== expectedSeq) {
    errors.push({
      field: "s",
      message: `expected sequence ${expectedSeq}, got ${candidateSeq}`
    });
  }
  if (scope === "registry") {
    if (TELData.isVcp(candidate) && expectedSeq !== 0) {
      errors.push({ field: "t", message: "VCP is only valid at sequence 0" });
    }
    if (!TELData.isVcp(candidate) && existing.length === 0) {
      errors.push({ field: "t", message: "first event must be VCP" });
    }
    if (TELData.isVrt(candidate)) {
      const hasVcp = existing.some((e) => TELData.isVcp(e));
      if (!hasVcp) {
        errors.push({ field: "t", message: "VRT requires a prior VCP in the chain" });
      }
    }
  } else if (scope === "credential") {
    if (!TELData.isIss(candidate) && !TELData.isRev(candidate)) {
      errors.push({ field: "t", message: `event type '${candidate.t}' is not allowed in a credential TEL` });
    }
    if (!TELData.isIss(candidate) && existing.length === 0) {
      errors.push({ field: "t", message: "first event in a credential TEL must be ISS" });
    }
    if (existing.some((e) => TELData.isRev(e))) {
      errors.push({ field: "t", message: "credential TEL is terminal: REV has already been appended" });
    }
  } else {
    const _exhaustive = scope;
    throw new Error(`Unsupported TELScope: ${_exhaustive}`);
  }
  const prior = existing.length > 0 ? existing[existing.length - 1] : undefined;
  if (prior && (TELData.isVrt(candidate) || TELData.isRev(candidate) || TELData.isBrv(candidate))) {
    if (candidate.p !== prior.d) {
      errors.push({
        field: "p",
        message: `prior SAID mismatch: expected ${prior.d}, got ${candidate.p}`
      });
    }
  }
  if ((TELData.isIss(candidate) || TELData.isRev(candidate)) && !candidate.ri) {
    errors.push({ field: "ri", message: "ISS/REV require a non-empty ri field" });
  }
  if (existing.length > 0) {
    const anchorRegistryId = TELData.registryId(existing[0]);
    const candidateRegistryId = TELData.registryId(candidate);
    if (candidateRegistryId !== anchorRegistryId) {
      errors.push({
        field: "i",
        message: `registry ID mismatch: expected ${anchorRegistryId}, got ${candidateRegistryId}`
      });
    }
  }
  const existingSaids = new Set(existing.map((e) => e.d));
  if (existingSaids.has(candidate.d)) {
    errors.push({ field: "d", message: `duplicate SAID: ${candidate.d}` });
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
function validateChain(entries, scope = "registry") {
  for (let i = 0;i < entries.length; i++) {
    const existing = entries.slice(0, i);
    const candidate = entries[i];
    const result = validateAppend(existing, candidate, scope);
    if (!result.ok)
      return result;
  }
  return { ok: true };
}
function partitionByScope(entries) {
  const registry = [];
  const byCredential = new Map;
  for (const event of entries) {
    if (TELData.isVcp(event) || TELData.isVrt(event)) {
      registry.push(event);
      continue;
    }
    const credSaid = TELData.credentialId(event);
    if (!credSaid)
      continue;
    const list = byCredential.get(credSaid) ?? [];
    list.push(event);
    byCredential.set(credSaid, list);
  }
  return { registry, byCredential };
}
function lane(entries, l) {
  switch (l.kind) {
    case "registry":
      return entries.filter((e) => (TELData.isVcp(e) || TELData.isVrt(e)) && e.i === l.ri);
    case "credential":
      return entries.filter((e) => !TELData.isVcp(e) && !TELData.isVrt(e) && TELData.credentialId(e) === l.said);
    default: {
      const unknownLane = l;
      throw new Error(`Unsupported TEL lane: ${JSON.stringify(unknownLane)}`);
    }
  }
}
var TELOps = {
  head,
  issuerId,
  credentialStatus,
  validateEvent,
  validateAppend,
  validateChain,
  partitionByScope,
  lane
};

// src/requirements/evidence-ops.ts
var failure = (path, kind, detail) => detail === undefined ? { path, kind } : { path, kind, detail };
function verifyMembership(parentAID, maxDepth, subject, e, path) {
  const { lineage, kels } = e;
  const out = [];
  if (lineage.length < 2 || lineage[0] !== parentAID || new Set(lineage).size !== lineage.length) {
    out.push(failure(path, "lineage-mismatch"));
  }
  if (lineage[lineage.length - 1] !== subject)
    out.push(failure(path, "subject-mismatch"));
  if (lineage.length - 1 > maxDepth)
    out.push(failure(path, "max-depth-exceeded", `${lineage.length - 1} > ${maxDepth}`));
  if (out.length > 0)
    return out;
  for (const aid of lineage) {
    const kel = Object.hasOwn(kels, aid) ? kels[aid] : undefined;
    if (!Array.isArray(kel) || kel.length === 0)
      out.push(failure(path, "kel-missing", aid));
  }
  if (out.length > 0)
    return out;
  for (const aid of lineage) {
    const actual = kels[aid][0]?.event?.i;
    if (actual !== aid)
      return [failure(path, "kel-invalid", `${aid}: KEL belongs to ${String(actual)}`)];
  }
  try {
    return verifyLineageKels(lineage, kels, path);
  } catch (error) {
    return [failure(path, "kel-invalid", error instanceof Error ? error.message : String(error))];
  }
}
function verifyLineageKels(lineage, kels, path) {
  const out = [];
  if (!validateKelWithAncestors(lineage[0], kels))
    return [failure(path, "kel-invalid", lineage[0])];
  for (let i = 1;i < lineage.length; i++) {
    const parent = lineage[i - 1];
    const child = lineage[i];
    const childKel = kels[child];
    const parentKel = kels[parent];
    if (delegatorOf(childKel) !== parent) {
      out.push(failure(path, "lineage-mismatch", `${child} is not delegated by ${parent}`));
      continue;
    }
    const sealed = childKel.every((ev) => {
      const t = ev.event.t;
      return t !== "dip" && t !== "drt" || validateDelegation({ childEvent: ev, parentKel, delegatorAid: parent }).passed;
    });
    if (!sealed)
      out.push(failure(path, "delegation-unsealed", child));
    else if (!validateKelChain(childKel, { parentKel }).valid)
      out.push(failure(path, "kel-invalid", child));
  }
  return out;
}
var msg = (error) => error instanceof Error ? error.message : String(error);
function issuerKelOf(e, issuerAid, path) {
  const kel = Object.hasOwn(e.kels, issuerAid) ? e.kels[issuerAid] : undefined;
  if (!Array.isArray(kel) || kel.length === 0)
    return { failures: [failure(path, "kel-missing", issuerAid)] };
  const actual = kel[0]?.event?.i;
  if (actual !== issuerAid)
    return { failures: [failure(path, "kel-invalid", `${issuerAid}: KEL belongs to ${String(actual)}`)] };
  return validateKelWithAncestors(issuerAid, e.kels) ? { kel } : { failures: [failure(path, "kel-invalid", issuerAid)] };
}
function telSaidHolds(ev, isInception) {
  return TELEvents.computeSaid({ ...ev }, isInception).said === ev.d;
}
function verifyTelLinkage(acdc, registryTel, credentialTel, path) {
  try {
    const registry = registryTel[0];
    const iss = credentialTel[0];
    if (registry.t !== "vcp" || iss.t !== "iss")
      return [failure(path, "tel-mismatch", "TEL must start with vcp (registry) and iss (credential)")];
    const linked = iss.i === acdc.d && iss.ri === registry.i && registry.i === acdc.ri && registry.ii === acdc.i;
    if (!linked)
      return [failure(path, "tel-mismatch")];
    const saidsHold = registryTel.every((ev) => telSaidHolds(ev, ev.t === "vcp") && (ev.t !== "vcp" || ev.i === ev.d)) && credentialTel.every((ev) => telSaidHolds(ev, false));
    return saidsHold ? [] : [failure(path, "tel-mismatch", "TEL event SAID does not match its body")];
  } catch (error) {
    return [failure(path, "tel-mismatch", msg(error))];
  }
}
var isBacked = (ev) => ev.t === "bis" || ev.t === "brv";
function verifyTels(acdc, registryTel, credentialTel, path) {
  if (!Array.isArray(registryTel) || registryTel.length === 0 || !Array.isArray(credentialTel) || credentialTel.length === 0)
    return [failure(path, "tel-mismatch", "registryTel and credentialTel must be non-empty arrays")];
  if ([...registryTel, ...credentialTel].some(isBacked))
    return [failure(path, "backers-unsupported", "TODO - backers not supported")];
  for (const [events, scope] of [
    [registryTel, "registry"],
    [credentialTel, "credential"]
  ]) {
    const chain = TELOps.validateChain(events, scope);
    if (!chain.ok)
      return [
        failure(path, "tel-mismatch", `${scope} TEL: ${chain.errors.map((e) => `${e.field}: ${e.message}`).join("; ")}`)
      ];
  }
  return verifyTelLinkage(acdc, registryTel, credentialTel, path);
}
function sealsOf(ev) {
  const a = ev.a;
  return Array.isArray(a) ? a.filter((x) => typeof x === "object" && x !== null) : [];
}
function verifyCredential(r, subject, e, now, path) {
  const { acdc } = e;
  const issuerAid = acdc.i;
  const issuerKel = issuerKelOf(e, issuerAid, path);
  if ("failures" in issuerKel)
    return issuerKel.failures;
  const out = [];
  try {
    if (!ACDCOps.validateSaid(acdc).valid)
      out.push(failure(path, "acdc-said-invalid"));
  } catch (error) {
    out.push(failure(path, "acdc-said-invalid", msg(error)));
  }
  const match = RequirementOps.matchCredential(r, acdc, subject, now);
  if (!match.ok)
    out.push(...match.error.map((f) => ({ ...f, path })));
  const telFailures = verifyTels(acdc, e.registryTel, e.credentialTel, path);
  out.push(...telFailures);
  if (telFailures.length === 0) {
    const bodies = issuerKel.kel.map((ev) => ev.event);
    for (const { d: telSaid } of [...e.registryTel, ...e.credentialTel]) {
      if (assessTelKelAnchor(bodies, telSaid).status !== "anchored")
        out.push(failure(path, "tel-unanchored", telSaid));
    }
    if (TELOps.credentialStatus(anchoredPrefix(e.credentialTel, bodies), acdc.d) === "revoked")
      out.push(failure(path, "revoked"));
    const inTel = new Set(e.credentialTel.map((ev) => ev.d));
    const dropped = bodies.flatMap(sealsOf).find((seal) => seal.i === acdc.d && !inTel.has(seal.d));
    if (dropped)
      out.push(failure(path, "revoked", `${dropped.d} sealed in issuer KEL, absent from credentialTel`));
  }
  switch (r.holder.type) {
    case "subject":
      break;
    case "holder-is-member":
    case "member-of-holder":
      if (!e.membership)
        out.push(failure(path, "membership-missing"));
      else
        out.push(...verifyMembership(r.holder.parentAID, r.holder.maxDepth ?? MAX_REQUIREMENT_DEPTH, subject, e.membership, path));
      break;
    default: {
      const unknownHolder = r.holder;
      out.push(failure(path, "type-mismatch", `unknown holder ${JSON.stringify(unknownHolder)}`));
    }
  }
  return out;
}
function verifySelfAsserted(r, attributes, now, path) {
  const match = RequirementOps.matchSelfAsserted(r, attributes, now);
  const out = match.ok ? [] : match.error.map((f) => ({ ...f, path }));
  const eligible = CredentialEligibility.forSelfAsserted(r);
  if (!eligible.ok)
    out.push(...eligible.required.map((field) => failure(path, "metadata-unavailable", field)));
  return out;
}
function verifyHasCredential(r, subject, e, now, path) {
  const issuer = r.issuer.type;
  switch (issuer) {
    case "any-of":
      if (e.type === "has-credential")
        return verifyCredential(r, subject, e, now, path);
      if (e.type === "self-asserted")
        return [failure(path, "self-asserted-not-allowed")];
      return [failure(path, "type-mismatch", `expected has-credential, got ${e.type}`)];
    case "any":
      if (e.type === "has-credential")
        return verifyCredential(r, subject, e, now, path);
      if (e.type === "self-asserted")
        return verifySelfAsserted(r, e.attributes, now, path);
      return [failure(path, "type-mismatch", `expected has-credential or self-asserted, got ${e.type}`)];
    case "self-asserted":
      if (e.type !== "self-asserted")
        return [failure(path, "type-mismatch", `expected self-asserted, got ${e.type}`)];
      return verifySelfAsserted(r, e.attributes, now, path);
    default: {
      const unknownIssuer = issuer;
      return [failure(path, "type-mismatch", `unknown issuer ${JSON.stringify(unknownIssuer)}`)];
    }
  }
}
function verifyExpression(r, subject, e, now, path, depth) {
  const out = [];
  const required = Object.keys(r.requirements);
  const supplied = Object.keys(e.evidence);
  const isChild = (k) => Object.hasOwn(r.requirements, k);
  for (const key of supplied) {
    if (!isChild(key))
      out.push(failure([...path, key], "unexpected-evidence"));
  }
  if (r.type === "and") {
    const missing = required.filter((k) => !Object.hasOwn(e.evidence, k));
    if (missing.length > 0)
      out.push(failure(path, "and-incomplete", missing.join(",")));
  } else if (!supplied.some(isChild)) {
    out.push(failure(path, "or-empty"));
  }
  for (const key of supplied.filter(isChild)) {
    out.push(...verifyAt(r.requirements[key], subject, e.evidence[key], now, [...path, key], depth + 1));
  }
  return out;
}
function verifyAt(r, subject, e, now, path, depth) {
  if (depth > MAX_REQUIREMENT_DEPTH)
    return [failure(path, "type-mismatch", "too deep")];
  switch (r.type) {
    case "is-member":
      return e.type === "is-member" ? verifyMembership(r.parentAID, r.maxDepth ?? MAX_REQUIREMENT_DEPTH, subject, e, path) : [failure(path, "type-mismatch", `expected is-member, got ${e.type}`)];
    case "has-credential":
      return verifyHasCredential(r, subject, e, now, path);
    case "and":
    case "or":
      return e.type === r.type ? verifyExpression(r, subject, e, now, path, depth) : [failure(path, "type-mismatch", `expected ${r.type}, got ${e.type}`)];
    default: {
      const unknownRequirement = r;
      return [failure(path, "type-mismatch", `unknown requirement ${JSON.stringify(unknownRequirement)}`)];
    }
  }
}
var EvidenceOps = {
  verify(r, subject, e, now) {
    try {
      const failures = verifyAt(r, subject, e, now, [], 1);
      return failures.length === 0 ? ok(true) : err(failures);
    } catch (error) {
      return err([failure([], "type-mismatch", `malformed evidence: ${msg(error)}`)]);
    }
  }
};
var ProofBundleOps = {
  verify(b, now) {
    const policy = PolicyOps.validate(b.policy);
    if (!policy.ok)
      return err([
        failure(policy.error.path, policy.error.kind === "said-mismatch" ? "said-mismatch" : "type-mismatch", policy.error.detail)
      ]);
    return EvidenceOps.verify(b.policy.requirement, b.subject, b.evidence, now);
  }
};

// src/requirements/kerits-claims-ops.ts
var OIDC_KEYS = ["email", "email_verified", "name", "preferred_username"];
function liftsToTopLevel(policy) {
  const r = policy.requirement;
  if (r.type !== "has-credential")
    return false;
  switch (r.issuer.type) {
    case "any-of":
      return true;
    case "any":
    case "self-asserted":
      return false;
    default: {
      const _x = r.issuer;
      throw new Error(`Unsupported issuer: ${JSON.stringify(_x)}`);
    }
  }
}
function liftedKeys(policy) {
  return liftsToTopLevel(policy) ? OIDC_KEYS.map((k) => `data.${k}`) : [];
}
function ownObject(obj, key) {
  const v = Object.hasOwn(obj, key) ? obj[key] : undefined;
  return typeof v === "object" && v !== null && !Array.isArray(v) ? v : undefined;
}
function getPath(obj, path) {
  let cur = obj;
  for (const seg of path.split(".")) {
    if (typeof cur !== "object" || cur === null || !Object.hasOwn(cur, seg))
      return;
    cur = cur[seg];
  }
  return cur;
}
function originOf(value) {
  if (typeof value !== "string")
    return;
  try {
    return new URL(value).origin;
  } catch {
    return;
  }
}
function pickSub(verified) {
  if (verified.target)
    return ok(verified.target);
  const subjects = new Set(verified.entries.map((e) => e.subject));
  if (subjects.size === 0)
    return err({ kind: "missing-sub" });
  if (subjects.size > 1)
    return err({ kind: "ambiguous-subject" });
  return ok([...subjects][0]);
}
function project2(request, verified, published) {
  const failures = [];
  const sub = pickSub(verified);
  if (!sub.ok)
    failures.push(sub.error);
  const topLevel = {};
  const kerits = { v: 2, policySAIDs: verified.entries.map((e) => e.policySaid) };
  const projected = new Map;
  for (const entry of verified.entries) {
    const { claims, missingRequired } = DisclosureOps.project({
      requirement: entry.policy.requirement,
      evidence: entry.evidence,
      subject: entry.subject,
      published
    });
    for (const path of missingRequired)
      failures.push({ kind: "disclosure-missing", as: entry.as, path });
    const fields = { ...claims };
    const data = ownObject(fields, "data");
    if (data && liftsToTopLevel(entry.policy)) {
      for (const k of OIDC_KEYS) {
        if (Object.hasOwn(data, k)) {
          if (k in topLevel)
            failures.push({ kind: "oidc-conflict", as: entry.as });
          topLevel[k] = data[k];
          delete data[k];
        }
      }
      if (Object.keys(data).length === 0)
        delete fields.data;
    }
    const { policySAID: _p, ...safe } = fields;
    projected.set(entry.as, { entry, fields: safe });
    kerits[entry.as] = { policySAID: entry.policySaid, ...safe };
  }
  const resources = [];
  for (const re of request.entries) {
    const p = projected.get(re.as);
    if (!(re.audience || re.audienceFrom) || !p)
      continue;
    let origin;
    if (re.audience) {
      origin = originOf(re.audience);
    } else {
      const value = getPath(p.fields, re.audienceFrom);
      origin = originOf(value);
      if (origin === undefined) {
        failures.push({ kind: "audience-invalid", as: re.as, reason: value === undefined ? "missing" : "not-a-url" });
        continue;
      }
    }
    if (origin === undefined)
      continue;
    const included = (re.audienceIncludes ?? []).filter((a) => projected.has(a));
    resources.push({ origin, aliases: [re.as, ...included] });
  }
  if (failures.length > 0 || !sub.ok)
    return err(failures);
  return ok({ sub: sub.value, topLevel, kerits, resources });
}
function base(grant) {
  return { v: 2, policySAIDs: grant.kerits.policySAIDs };
}
function forResource(grant, resource) {
  const origin = originOf(resource);
  const matches = grant.resources.filter((r) => r.origin === origin);
  if (origin === undefined || matches.length !== 1)
    return err("invalid_target");
  const out = base(grant);
  for (const a of matches[0].aliases)
    out[a] = grant.kerits[a];
  return ok(out);
}
var KeritsClaimsOps = { project: project2, forResource, base, liftedKeys };

// src/requirements/source-plan-ops.ts
var FALLBACK_ORDER = ["expected", "oobi", "in-line"];
function isAvailable(s, a) {
  switch (s) {
    case "expected":
      return a.expected;
    case "oobi":
      return a.oobi;
    case "in-line":
      return a.inLine;
    default: {
      const unknownSource = s;
      throw new Error(`Unsupported source: ${JSON.stringify(unknownSource)}`);
    }
  }
}
function leafAt(r, path) {
  let node = r;
  for (const key of path) {
    if (node === undefined || node.type !== "and" && node.type !== "or")
      return;
    node = Object.hasOwn(node.requirements, key) ? node.requirements[key] : undefined;
  }
  return node;
}
var SourcePlanOps = {
  plan(allowed, available) {
    return (allowed ?? FALLBACK_ORDER).filter((s) => isAvailable(s, available));
  },
  intersect(directives) {
    const restricting = directives.filter((d) => d !== undefined);
    const [first, ...rest] = restricting;
    return first?.filter((s) => rest.every((d) => d.includes(s)));
  },
  allowedAt(r, path, artifact) {
    const leaf = leafAt(r, path);
    if (leaf === undefined)
      return;
    switch (leaf.type) {
      case "and":
      case "or":
        return;
      case "is-member":
        switch (artifact) {
          case "lineageKels":
            return leaf.sources?.lineageKels;
          case "issuerKel":
          case "delegatorKels":
          case "registryTel":
          case "credentialTel":
          case "acdc":
            return;
          default: {
            const unknownArtifact = artifact;
            throw new Error(`Unsupported artifact: ${JSON.stringify(unknownArtifact)}`);
          }
        }
      case "has-credential":
        switch (artifact) {
          case "issuerKel":
          case "delegatorKels":
          case "registryTel":
          case "credentialTel":
          case "acdc":
          case "lineageKels":
            return leaf.sources?.[artifact];
          default: {
            const unknownArtifact = artifact;
            throw new Error(`Unsupported artifact: ${JSON.stringify(unknownArtifact)}`);
          }
        }
      default: {
        const unknownRequirement = leaf;
        throw new Error(`Unsupported requirement: ${JSON.stringify(unknownRequirement)}`);
      }
    }
  }
};
// src/said/next-key-digest.ts
function nextKeyDigestQb64FromPublicKeyQb64(pubKeyQb64) {
  return digestVerfer(pubKeyQb64);
}

// node_modules/cesr-ts/node_modules/@noble/hashes/esm/utils.js
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function isBytes4(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function anumber4(n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("positive integer expected, got " + n);
}
function abytes4(b, ...lengths) {
  if (!isBytes4(b))
    throw new Error("Uint8Array expected");
  if (lengths.length > 0 && !lengths.includes(b.length))
    throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
}
function aexists3(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput3(out, instance) {
  abytes4(out);
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error("digestInto() expects output buffer of length at least " + min);
  }
}
function u83(arr) {
  return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}
function u323(arr) {
  return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
function clean4(...arrays) {
  for (let i = 0;i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function rotr2(word, shift) {
  return word << 32 - shift | word >>> shift;
}
var isLE3 = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
function byteSwap3(word) {
  return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
}
var swap8IfBE3 = isLE3 ? (n) => n : (n) => byteSwap3(n);
function byteSwap323(arr) {
  for (let i = 0;i < arr.length; i++) {
    arr[i] = byteSwap3(arr[i]);
  }
  return arr;
}
var swap32IfBE3 = isLE3 ? (u) => u : byteSwap323;
function utf8ToBytes(str) {
  if (typeof str !== "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(str));
}
function toBytes(data) {
  if (typeof data === "string")
    data = utf8ToBytes(data);
  abytes4(data);
  return data;
}
class Hash2 {
}
function createXOFer(hashCons) {
  const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
  const tmp = hashCons({});
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = (opts) => hashCons(opts);
  return hashC;
}

// node_modules/cesr-ts/node_modules/@noble/hashes/esm/_md.js
var SHA256_IV2 = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);

// node_modules/cesr-ts/node_modules/@noble/hashes/esm/_u64.js
var U32_MASK642 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
var _32n2 = /* @__PURE__ */ BigInt(32);
function fromBig2(n, le = false) {
  if (le)
    return { h: Number(n & U32_MASK642), l: Number(n >> _32n2 & U32_MASK642) };
  return { h: Number(n >> _32n2 & U32_MASK642) | 0, l: Number(n & U32_MASK642) | 0 };
}

// node_modules/cesr-ts/node_modules/@noble/hashes/esm/_blake.js
function G1s2(a, b, c, d, x) {
  a = a + b + x | 0;
  d = rotr2(d ^ a, 16);
  c = c + d | 0;
  b = rotr2(b ^ c, 12);
  return { a, b, c, d };
}
function G2s2(a, b, c, d, x) {
  a = a + b + x | 0;
  d = rotr2(d ^ a, 8);
  c = c + d | 0;
  b = rotr2(b ^ c, 7);
  return { a, b, c, d };
}

// node_modules/cesr-ts/node_modules/@noble/hashes/esm/blake2.js
class BLAKE2 extends Hash2 {
  constructor(blockLen, outputLen) {
    super();
    this.finished = false;
    this.destroyed = false;
    this.length = 0;
    this.pos = 0;
    anumber4(blockLen);
    anumber4(outputLen);
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.buffer = new Uint8Array(blockLen);
    this.buffer32 = u323(this.buffer);
  }
  update(data) {
    aexists3(this);
    data = toBytes(data);
    abytes4(data);
    const { blockLen, buffer, buffer32 } = this;
    const len = data.length;
    const offset = data.byteOffset;
    const buf = data.buffer;
    for (let pos = 0;pos < len; ) {
      if (this.pos === blockLen) {
        swap32IfBE3(buffer32);
        this.compress(buffer32, 0, false);
        swap32IfBE3(buffer32);
        this.pos = 0;
      }
      const take = Math.min(blockLen - this.pos, len - pos);
      const dataOffset = offset + pos;
      if (take === blockLen && !(dataOffset % 4) && pos + take < len) {
        const data32 = new Uint32Array(buf, dataOffset, Math.floor((len - pos) / 4));
        swap32IfBE3(data32);
        for (let pos32 = 0;pos + blockLen < len; pos32 += buffer32.length, pos += blockLen) {
          this.length += blockLen;
          this.compress(data32, pos32, false);
        }
        swap32IfBE3(data32);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      this.length += take;
      pos += take;
    }
    return this;
  }
  digestInto(out) {
    aexists3(this);
    aoutput3(out, this);
    const { pos, buffer32 } = this;
    this.finished = true;
    clean4(this.buffer.subarray(pos));
    swap32IfBE3(buffer32);
    this.compress(buffer32, 0, true);
    swap32IfBE3(buffer32);
    const out32 = u323(out);
    this.get().forEach((v, i) => out32[i] = swap8IfBE3(v));
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    const { buffer, length, finished, destroyed, outputLen, pos } = this;
    to || (to = new this.constructor({ dkLen: outputLen }));
    to.set(...this.get());
    to.buffer.set(buffer);
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    to.outputLen = outputLen;
    return to;
  }
  clone() {
    return this._cloneInto();
  }
}
function compress2(s, offset, msg, rounds, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15) {
  let j = 0;
  for (let i = 0;i < rounds; i++) {
    ({ a: v0, b: v4, c: v8, d: v12 } = G1s2(v0, v4, v8, v12, msg[offset + s[j++]]));
    ({ a: v0, b: v4, c: v8, d: v12 } = G2s2(v0, v4, v8, v12, msg[offset + s[j++]]));
    ({ a: v1, b: v5, c: v9, d: v13 } = G1s2(v1, v5, v9, v13, msg[offset + s[j++]]));
    ({ a: v1, b: v5, c: v9, d: v13 } = G2s2(v1, v5, v9, v13, msg[offset + s[j++]]));
    ({ a: v2, b: v6, c: v10, d: v14 } = G1s2(v2, v6, v10, v14, msg[offset + s[j++]]));
    ({ a: v2, b: v6, c: v10, d: v14 } = G2s2(v2, v6, v10, v14, msg[offset + s[j++]]));
    ({ a: v3, b: v7, c: v11, d: v15 } = G1s2(v3, v7, v11, v15, msg[offset + s[j++]]));
    ({ a: v3, b: v7, c: v11, d: v15 } = G2s2(v3, v7, v11, v15, msg[offset + s[j++]]));
    ({ a: v0, b: v5, c: v10, d: v15 } = G1s2(v0, v5, v10, v15, msg[offset + s[j++]]));
    ({ a: v0, b: v5, c: v10, d: v15 } = G2s2(v0, v5, v10, v15, msg[offset + s[j++]]));
    ({ a: v1, b: v6, c: v11, d: v12 } = G1s2(v1, v6, v11, v12, msg[offset + s[j++]]));
    ({ a: v1, b: v6, c: v11, d: v12 } = G2s2(v1, v6, v11, v12, msg[offset + s[j++]]));
    ({ a: v2, b: v7, c: v8, d: v13 } = G1s2(v2, v7, v8, v13, msg[offset + s[j++]]));
    ({ a: v2, b: v7, c: v8, d: v13 } = G2s2(v2, v7, v8, v13, msg[offset + s[j++]]));
    ({ a: v3, b: v4, c: v9, d: v14 } = G1s2(v3, v4, v9, v14, msg[offset + s[j++]]));
    ({ a: v3, b: v4, c: v9, d: v14 } = G2s2(v3, v4, v9, v14, msg[offset + s[j++]]));
  }
  return { v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15 };
}

// node_modules/cesr-ts/node_modules/@noble/hashes/esm/blake3.js
var B3_Flags2 = {
  CHUNK_START: 1,
  CHUNK_END: 2,
  PARENT: 4,
  ROOT: 8,
  KEYED_HASH: 16,
  DERIVE_KEY_CONTEXT: 32,
  DERIVE_KEY_MATERIAL: 64
};
var B3_IV2 = SHA256_IV2.slice();
var B3_SIGMA2 = /* @__PURE__ */ (() => {
  const Id = Array.from({ length: 16 }, (_, i) => i);
  const permute = (arr) => [2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8].map((i) => arr[i]);
  const res = [];
  for (let i = 0, v = Id;i < 7; i++, v = permute(v))
    res.push(...v);
  return Uint8Array.from(res);
})();

class BLAKE3 extends BLAKE2 {
  constructor(opts = {}, flags = 0) {
    super(64, opts.dkLen === undefined ? 32 : opts.dkLen);
    this.chunkPos = 0;
    this.chunksDone = 0;
    this.flags = 0 | 0;
    this.stack = [];
    this.posOut = 0;
    this.bufferOut32 = new Uint32Array(16);
    this.chunkOut = 0;
    this.enableXOF = true;
    const { key, context } = opts;
    const hasContext = context !== undefined;
    if (key !== undefined) {
      if (hasContext)
        throw new Error('Only "key" or "context" can be specified at same time');
      const k = toBytes(key).slice();
      abytes4(k, 32);
      this.IV = u323(k);
      swap32IfBE3(this.IV);
      this.flags = flags | B3_Flags2.KEYED_HASH;
    } else if (hasContext) {
      const ctx = toBytes(context);
      const contextKey = new BLAKE3({ dkLen: 32 }, B3_Flags2.DERIVE_KEY_CONTEXT).update(ctx).digest();
      this.IV = u323(contextKey);
      swap32IfBE3(this.IV);
      this.flags = flags | B3_Flags2.DERIVE_KEY_MATERIAL;
    } else {
      this.IV = B3_IV2.slice();
      this.flags = flags;
    }
    this.state = this.IV.slice();
    this.bufferOut = u83(this.bufferOut32);
  }
  get() {
    return [];
  }
  set() {}
  b2Compress(counter, flags, buf, bufPos = 0) {
    const { state: s, pos } = this;
    const { h, l } = fromBig2(BigInt(counter), true);
    const { v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15 } = compress2(B3_SIGMA2, bufPos, buf, 7, s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], B3_IV2[0], B3_IV2[1], B3_IV2[2], B3_IV2[3], h, l, pos, flags);
    s[0] = v0 ^ v8;
    s[1] = v1 ^ v9;
    s[2] = v2 ^ v10;
    s[3] = v3 ^ v11;
    s[4] = v4 ^ v12;
    s[5] = v5 ^ v13;
    s[6] = v6 ^ v14;
    s[7] = v7 ^ v15;
  }
  compress(buf, bufPos = 0, isLast = false) {
    let flags = this.flags;
    if (!this.chunkPos)
      flags |= B3_Flags2.CHUNK_START;
    if (this.chunkPos === 15 || isLast)
      flags |= B3_Flags2.CHUNK_END;
    if (!isLast)
      this.pos = this.blockLen;
    this.b2Compress(this.chunksDone, flags, buf, bufPos);
    this.chunkPos += 1;
    if (this.chunkPos === 16 || isLast) {
      let chunk = this.state;
      this.state = this.IV.slice();
      for (let last, chunks = this.chunksDone + 1;isLast || !(chunks & 1); chunks >>= 1) {
        if (!(last = this.stack.pop()))
          break;
        this.buffer32.set(last, 0);
        this.buffer32.set(chunk, 8);
        this.pos = this.blockLen;
        this.b2Compress(0, this.flags | B3_Flags2.PARENT, this.buffer32, 0);
        chunk = this.state;
        this.state = this.IV.slice();
      }
      this.chunksDone++;
      this.chunkPos = 0;
      this.stack.push(chunk);
    }
    this.pos = 0;
  }
  _cloneInto(to) {
    to = super._cloneInto(to);
    const { IV, flags, state, chunkPos, posOut, chunkOut, stack, chunksDone } = this;
    to.state.set(state.slice());
    to.stack = stack.map((i) => Uint32Array.from(i));
    to.IV.set(IV);
    to.flags = flags;
    to.chunkPos = chunkPos;
    to.chunksDone = chunksDone;
    to.posOut = posOut;
    to.chunkOut = chunkOut;
    to.enableXOF = this.enableXOF;
    to.bufferOut32.set(this.bufferOut32);
    return to;
  }
  destroy() {
    this.destroyed = true;
    clean4(this.state, this.buffer32, this.IV, this.bufferOut32);
    clean4(...this.stack);
  }
  b2CompressOut() {
    const { state: s, pos, flags, buffer32, bufferOut32: out32 } = this;
    const { h, l } = fromBig2(BigInt(this.chunkOut++));
    swap32IfBE3(buffer32);
    const { v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15 } = compress2(B3_SIGMA2, 0, buffer32, 7, s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], B3_IV2[0], B3_IV2[1], B3_IV2[2], B3_IV2[3], l, h, pos, flags);
    out32[0] = v0 ^ v8;
    out32[1] = v1 ^ v9;
    out32[2] = v2 ^ v10;
    out32[3] = v3 ^ v11;
    out32[4] = v4 ^ v12;
    out32[5] = v5 ^ v13;
    out32[6] = v6 ^ v14;
    out32[7] = v7 ^ v15;
    out32[8] = s[0] ^ v8;
    out32[9] = s[1] ^ v9;
    out32[10] = s[2] ^ v10;
    out32[11] = s[3] ^ v11;
    out32[12] = s[4] ^ v12;
    out32[13] = s[5] ^ v13;
    out32[14] = s[6] ^ v14;
    out32[15] = s[7] ^ v15;
    swap32IfBE3(buffer32);
    swap32IfBE3(out32);
    this.posOut = 0;
  }
  finish() {
    if (this.finished)
      return;
    this.finished = true;
    clean4(this.buffer.subarray(this.pos));
    let flags = this.flags | B3_Flags2.ROOT;
    if (this.stack.length) {
      flags |= B3_Flags2.PARENT;
      swap32IfBE3(this.buffer32);
      this.compress(this.buffer32, 0, true);
      swap32IfBE3(this.buffer32);
      this.chunksDone = 0;
      this.pos = this.blockLen;
    } else {
      flags |= (!this.chunkPos ? B3_Flags2.CHUNK_START : 0) | B3_Flags2.CHUNK_END;
    }
    this.flags = flags;
    this.b2CompressOut();
  }
  writeInto(out) {
    aexists3(this, false);
    abytes4(out);
    this.finish();
    const { blockLen, bufferOut } = this;
    for (let pos = 0, len = out.length;pos < len; ) {
      if (this.posOut >= blockLen)
        this.b2CompressOut();
      const take = Math.min(blockLen - this.posOut, len - pos);
      out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
      this.posOut += take;
      pos += take;
    }
    return out;
  }
  xofInto(out) {
    if (!this.enableXOF)
      throw new Error("XOF is not possible after digest call");
    return this.writeInto(out);
  }
  xof(bytes) {
    anumber4(bytes);
    return this.xofInto(new Uint8Array(bytes));
  }
  digestInto(out) {
    aoutput3(out, this);
    if (this.finished)
      throw new Error("digest() was already called");
    this.enableXOF = false;
    this.writeInto(out);
    this.destroy();
    return out;
  }
  digest() {
    return this.digestInto(new Uint8Array(this.outputLen));
  }
}
var blake32 = /* @__PURE__ */ createXOFer((opts) => new BLAKE3(opts));

// node_modules/cesr-ts/src/serder.ts
function dumps(ked, kind) {
  if (kind == "JSON" /* JSON */) {
    return JSON.stringify(ked);
  } else {
    throw new Error("unsupported event encoding");
  }
}
function sizeify(ked, kind) {
  if (!("v" in ked)) {
    throw new Error("Missing or empty version string");
  }
  const [ident, knd, version] = deversify(ked["v"]);
  if (version != Versionage) {
    throw new Error(`unsupported version ${version.toString()}`);
  }
  if (kind == undefined) {
    kind = knd;
  }
  let raw = dumps(ked, kind);
  const size = raw.length;
  ked["v"] = versify(ident, version, kind, size);
  raw = dumps(ked, kind);
  return [raw, ident, kind, ked, version];
}

// node_modules/cesr-ts/src/saider.ts
var Dummy = "#";
class Digestage {
  klas = undefined;
  size = 0;
  length = 0;
  constructor(klas, size, length) {
    this.klas = klas;
    this.size = size;
    this.length = length;
  }
}

class Saider extends Matter {
  static Digests = new Map([
    [
      MtrDex.Blake3_256,
      new Digestage(Saider._derive_blake3_256, undefined, undefined)
    ]
  ]);
  constructor({ raw, code, qb64b, qb64, qb2 }, sad, kind, label = "d" /* d */) {
    try {
      super({ raw, code, qb64b, qb64, qb2 });
    } catch (e) {
      if (e instanceof EmptyMaterialError) {
        if (sad == undefined || !(label in sad)) {
          throw e;
        }
        if (code == undefined) {
          if (sad[label] != "") {
            super({ qb64: sad[label], code });
            code = this.code;
          } else {
            code = MtrDex.Blake3_256;
          }
        }
        if (!DigiDex.has(code)) {
          throw new Error(`Unsupported digest code = ${code}`);
        }
        [raw] = Saider._derive({ ...sad }, code, kind, label);
        super({ raw, code });
      } else {
        throw e;
      }
    }
    if (!this.digestive) {
      throw new Error(`Unsupported digest code = ${this.code}.`);
    }
  }
  static _derive_blake3_256(ser, _digest_size, _length) {
    return blake32.create({}).update(ser).digest();
  }
  static _derive(sad, code, kind, label) {
    if (!DigiDex.has(code) || !Saider.Digests.has(code)) {
      throw new Error(`Unsupported digest code = ${code}.`);
    }
    sad = { ...sad };
    sad[label] = "".padStart(Matter.Sizes.get(code).fs, Dummy);
    if ("v" in sad) {
      [, , kind, sad] = sizeify(sad, kind);
    }
    const ser = { ...sad };
    const digestage = Saider.Digests.get(code);
    const cpa = Saider._serialze(ser, kind);
    const args = [];
    if (digestage.size != null) {
      args.push(digestage.size);
    }
    if (digestage.length != null) {
      args.push(digestage.length);
    }
    return [digestage.klas(cpa, ...args), sad];
  }
  derive(sad, code, kind, label) {
    code = code != null ? code : this.code;
    return Saider._derive(sad, code, kind, label);
  }
  verify(sad, prefixed = false, versioned = false, kind, label = "d" /* d */) {
    try {
      const [raw, dsad] = Saider._derive(sad, this.code, kind, label);
      const saider = new Saider({ raw, code: this.code });
      if (this.qb64 != saider.qb64) {
        return false;
      }
      if ("v" in sad && versioned) {
        if (sad["v"] != dsad["v"]) {
          return false;
        }
      }
      if (prefixed && sad[label] != this.qb64) {
        return false;
      }
    } catch (e) {
      return false;
    }
    return true;
  }
  static _serialze(sad, kind) {
    let knd = "JSON" /* JSON */;
    if ("v" in sad) {
      [, knd] = deversify(sad["v"]);
    }
    if (kind == undefined) {
      kind = knd;
    }
    return dumps(sad, kind);
  }
  static saidify(sad, code = MtrDex.Blake3_256, kind = "JSON" /* JSON */, label = "d" /* d */) {
    if (!(label in sad)) {
      throw new Error(`Missing id field labeled=${label} in sad.`);
    }
    let raw;
    [raw, sad] = Saider._derive(sad, code, kind, label);
    const saider = new Saider({ raw, code }, undefined, kind, label);
    sad[label] = saider.qb64;
    return [saider, sad];
  }
}

// src/said/said.ts
function encodeSAID(value, algo = "blake3-256", label = "d") {
  const code = algo === "blake3-256" ? MtrDex.Blake3_256 : MtrDex.Blake3_256;
  const [saider, _] = Saider.saidify(value, code, "JSON" /* JSON */, label);
  return saider.qb64;
}
function validateSAID(said, value, algo = "blake3-256", label = "d") {
  try {
    const _code = algo === "blake3-256" ? MtrDex.Blake3_256 : MtrDex.Blake3_256;
    const saider = new Saider({ qb64: said });
    const valueCopy = { ...value, [label]: said };
    return saider.verify(valueCopy, false);
  } catch {
    return false;
  }
}
function saidFromJson(obj) {
  const canon = Data.fromJson(obj).canonicalize();
  return Data.digest(canon.raw);
}

// src/said/index.ts
var Said = {
  ...exports_said,
  ...exports_next_key_digest,
  surfaces: exports_surfaces
};
// src/schema/index.ts
var Schema = {
  ...SchemaData,
  ...SchemaOps
};
// src/signature/hashing.ts
function hash2(data, algorithm = "blake3") {
  switch (algorithm) {
    case "blake3":
      return blake3(data, { dkLen: 32 });
    default: {
      const exhaustiveCheck = algorithm;
      throw new Error(`Unknown hash algorithm: ${exhaustiveCheck}`);
    }
  }
}
function hashHex(data, algorithm = "blake3") {
  const hashBytes = hash2(data, algorithm);
  return Array.from(hashBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function hashBase64Url(data, algorithm = "blake3") {
  const hashBytes = hash2(data, algorithm);
  return encodeBase64Url2(hashBytes);
}
function encodeBase64Url2(bytes) {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function hashObject(obj, algorithm = "blake3") {
  const canonicalText = canonical(obj);
  const canonicalBytes = new TextEncoder().encode(canonicalText);
  return hashBase64Url(canonicalBytes, algorithm);
}

// src/signature/primitives.ts
var import_json_canonicalize2 = __toESM(require_index_umd(), 1);
function generateKeyPair() {
  const privateKey = randomBytes4(32);
  const publicKey = ed25519.getPublicKey(privateKey);
  return { publicKey, privateKey };
}
function getPublicKey(secretSeed) {
  return ed25519.getPublicKey(secretSeed);
}
function sign(data, secretSeed) {
  return ed25519.sign(data, secretSeed);
}
function verify3(signature, data, publicKey) {
  return ed25519.verify(signature, data, publicKey);
}
function sha2562(data) {
  return sha256(data);
}
function sha256Hex(data) {
  return bytesToHex3(sha256(data));
}
function sha5122(data) {
  return sha512(data);
}
function sha512Hex(data) {
  return bytesToHex3(sha512(data));
}
function canonicalizeToBytes(obj) {
  const text = import_json_canonicalize2.canonicalize(obj);
  return new TextEncoder().encode(text);
}
function randomBytes4(length) {
  const bytes = new Uint8Array(length);
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    throw new Error("crypto.getRandomValues not available");
  }
  return bytes;
}
function hexToBytes3(hex) {
  if (hex.length % 2 !== 0) {
    throw new Error("Hex string must have even length");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0;i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}
function bytesToHex3(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// src/signature/index.ts
var Signature = {
  ...exports_primitives,
  ...exports_hashing,
  verify
};
// src/tel/index.ts
var Tel = {
  ...TELData,
  ...TELOps,
  ...TELEvents
};
// src/version.ts
var VERSION = "0.5.37";
var GIT_SHA = "5514d5a47652c00c153e022ce10dda9599e75942";
var export_canonicalize = import_json_canonicalize2.canonicalize;

export {
  ACCOUNT_RECOVERY_PATH_PREFIX,
  ACDCData,
  ACDCOps,
  ACDC_CREDENTIAL_SURFACE,
  ACDC_ONLY_METADATA,
  ACDC_SCHEMA_SURFACE,
  ACL_MSG_V1,
  ALIAS_PATTERN2 as ALIAS_PATTERN,
  AUTH_DOMAIN,
  Acdc,
  AclWithCheck as Acl,
  AidManifestEventSchema,
  AidManifestSchema,
  Algos,
  AnySealSchema,
  AuthOps,
  AuthRequestSchema,
  AuthResponseSchema,
  AuthResponseSlotSchema,
  BisEventSchema,
  CESREventSchema,
  CanonicalPaths,
  Cesr,
  CesrAidSchema,
  CesrAttachmentSchema,
  CesrAttachment_Signature,
  CesrAttachment_ValidatorReceipt,
  CesrAttachment_WitnessReceipt,
  CesrDigestSchema,
  CesrKeyTransferableSchema,
  CesrSealSchema,
  CesrSignatureSchema,
  CesrType,
  ChainFreshness,
  ChallengeOps,
  ChallengeResponseSchema,
  ChallengeSchema,
  ConflictError,
  ControllerNotFoundError,
  CoreError,
  CredentialDisclosureSchema,
  CredentialEligibility,
  DEFAULT_RESOLUTION_LIMITS,
  Data,
  DigestSealSchema,
  DipEventSchema,
  DisclosureFieldSchema,
  DisclosureOps,
  DrtEventSchema,
  EvidenceData,
  EvidenceOps,
  FakeHsmKeyStores,
  FieldPredicateSchema,
  FlatWeightedThresholdSchema,
  GIT_SHA,
  HasCredentialSchema,
  HolderSchema,
  IcpEventSchema,
  InMemoryKeyStores,
  IsMemberSchema,
  IssEventSchema,
  IssuerSchema,
  IxnEventSchema,
  KELData,
  KELEventSchema,
  KELEvents,
  KELManifestDataSchema,
  KELOps,
  KEL_DIP_SURFACE,
  KEL_DRT_SURFACE,
  KEL_ICP_SURFACE,
  KEL_IXN_SURFACE,
  KEL_ROT_SURFACE,
  KERI_PREFIX,
  KSNSchema,
  KSNs,
  Kel,
  KelAppendSchema,
  KelAppends,
  KelErrorCode,
  KelFreshness,
  KeriKeyPairSchema,
  KeriKeyPairs,
  KeriPrivateKeySchema,
  KeriPublicKeySchema,
  KeriVersionPattern,
  KeritsClaimsOps,
  KeyIndexSchema,
  KeyRefSchema,
  Keychains,
  MAX_CASCADE_NODES,
  MAX_HKDF_DERIVE_LENGTH,
  MAX_REQUIREMENT_DEPTH,
  MemberDirectoryEntrySchema,
  MetadataDisclosureSchema,
  NetworkError,
  NonEmpty,
  NotFoundError,
  OnboardingResourceSchema,
  OobiAllowList,
  PermissionError,
  PolicyData,
  PolicyOps,
  PolicyRefOps,
  PolicyRefSchema,
  PolicySchema,
  ProofBundleOps,
  PublicKeys,
  PublishedCredentialSchema,
  PublishedMembershipDirectorySchema,
  PublishedResourceSchema,
  Qb64Schema,
  RECOVERY_EXPAND_SALT,
  RECOVERY_SCHEDULE_VERSION,
  RequestEntrySchema,
  RequirementData,
  RequirementOps,
  RequirementSchema,
  RotEventSchema,
  SAID_PLACEHOLDER,
  Said,
  Schema,
  SchemaData,
  SchemaOps,
  SequenceNumber,
  Signature as SignatureOps,
  Signers,
  SourcePlanOps,
  SuppliedEvidenceSchema,
  SuppliedIsMemberEvidenceSchema,
  TELData,
  TELEvents,
  TELOps,
  TEL_BIS_SURFACE,
  TEL_BRV_SURFACE,
  TEL_ISS_SURFACE,
  TEL_REV_SURFACE,
  TEL_VCP_SURFACE,
  TEL_VCP_WITH_NONCE_SURFACE,
  TEL_VRT_SURFACE,
  Tel,
  TelFreshness,
  TestKeys,
  Threshold,
  ThresholdError,
  ThresholdExpressionPattern,
  ThresholdExpressionSchema,
  ThresholdSchema,
  TimestampSchema,
  UnlockProviders,
  UnlockRefs,
  Usernames,
  VERSION,
  ValidationError,
  ValidationErrorCode,
  VaultErrorCode,
  Vaults,
  VerificationError,
  VersionSchema,
  WeightedThresholdSchema,
  isAllowed as aclIsAllowed,
  advanceRecoveryDerivation,
  aidManifestToKelManifestData,
  anchoredLane,
  anchoredPrefix,
  applyAdmin,
  asEd25519PrivateRaw,
  asEd25519PublicRaw,
  asRawPublicKey,
  assessTelKelAnchor,
  assessTelKelAnchors,
  buildAAD,
  buildACDCCredentialSurface,
  buildAccountRecoverySigningPath,
  buildDeviceRecoverySigningPath,
  buildPublishedMembershipDirectory,
  bytesToHex3 as bytesToHex,
  canonical,
  canonicalAclRef,
  export_canonicalize as canonicalize,
  canonicalizeEvent,
  canonicalizeToBytes,
  check2 as check,
  checkAgainstSnapshot,
  computeNodeSAID,
  computeResolvedNodeSAID,
  createInitialRecoveryDerivation,
  createSaidMessageType,
  createStructuredValidationError,
  createTypedRemote,
  decode,
  decodeBase64,
  decodeBase64Url,
  decodeCesrEvent,
  decodeCesrEventFromStream,
  decodeCesrStream,
  decodeDigest,
  decodeKey,
  decodeSig as decodeSignature,
  decryptEnvelope,
  delegatorOf,
  deriveSaid,
  deriveScheduledEd25519Keypair,
  deriveSharedSecret,
  deserializeEnvelope,
  digestVerfer,
  ed25519ToX25519Private,
  ed25519ToX25519Public,
  encode,
  encodeBase64,
  encodeBase64Url,
  encodeCesrEvent,
  encodeCesrStream,
  encodeDigest,
  encodeEventBytes,
  encodeKey,
  encodeSAID,
  encodeSig as encodeSignature,
  encryptEnvelope,
  err,
  escapeFieldPathProperty,
  evaluateFieldPredicate,
  eventContainsAnchorForSaid,
  expectedHolder,
  fieldPathToJsonPath,
  formatFieldPath,
  fromEd25519PublicRaw,
  generateKeyPair,
  getCodeMeta,
  getPublicKey,
  hexToBytes3 as hexToBytes,
  hkdfBlake3,
  hkdfSha256,
  importSnapshot,
  inferSchema,
  inspect,
  isAid,
  isAuthRequest,
  isAuthResponse,
  isEd25519Signer,
  isInlinePolicy,
  isOobiRef,
  isPolicySaid,
  isRequiredRef,
  isSecp256k1Signer,
  isStructuredValidationError,
  isValidKeriEvent,
  kelManifestDataToAidManifest,
  keyRef,
  keyRefEquals,
  latestSnFromKelManifestData,
  makeAclNode,
  manifestUrlFromKelManifestData,
  manifestUrlFromRecords,
  memberRole,
  mergeRemoteRecords,
  nextKeyDigestQb64FromPublicKeyQb64,
  normalizeChildren,
  normalizeDisplayNameToProfileUsername,
  normalizeKeys,
  ok,
  ownerGroupId,
  parseAidQb64,
  parseBlake3Hex,
  parseBlake3Qb64,
  parseBlake3Qb64Digest,
  parseEd25519PrivateQb64,
  parseEd25519PublicQb64,
  parseEd25519SignatureQb64,
  parseFieldPath,
  parseKelManifestWire,
  parseProfileAlias,
  parseSaidQb64,
  parseSha256Hex,
  pathIncludesArray,
  predicateHasRequiredValues,
  presentationDefinitionSaid,
  profileUsernameFromDisplayName,
  publicKeyHex,
  randomBytes4 as randomBytes,
  recomputeSaid,
  recoveryCommitmentAt,
  recoveryKeyDerivationSpec,
  recoveryPublicKeyAt,
  reduceKelState,
  remoteRecordsFromAidManifest,
  remoteRecordsFromKelManifestData,
  resolve as resolveAclNode,
  resolveFieldPath,
  resourceKey,
  saidOf,
  schemaSaidOf,
  serializeEnvelope,
  serializeForSigning,
  sha2562 as sha256,
  sha256Hex,
  sha5122 as sha512,
  sha512Hex,
  sign,
  signAclMessage,
  snapshotOf,
  toCESRPublicKey,
  toEd25519KeyPairBranded,
  toEd25519PublicRaw,
  toRawPublicKey,
  transferableKeyToPublicKey,
  validateEventSaid,
  validateInceptionSignRequest,
  validateKel,
  validateKelChain,
  validateKelWithAncestors,
  validateKeyChain,
  validatePublishedCredential,
  validateRequiredFields,
  validateSAID,
  validateSignedIcp,
  verify3 as verify,
  verifyAclMessageSignature,
  verifyAt,
  verifyMembership,
  verifyWitnessReceipt,
  warnContinued
};
