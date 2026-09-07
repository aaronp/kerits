var __defProp = Object.defineProperty;
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

// src/cesr/digest.ts
var exports_digest = {};
__export(exports_digest, {
  decode: () => decode,
  decodeDigest: () => decodeDigest,
  digestVerfer: () => digestVerfer,
  encode: () => encode,
  encodeDigest: () => encodeDigest,
  getCodeMeta: () => getCodeMeta
});

// node_modules/cesr-ts/node_modules/@noble/hashes/esm/utils.js
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function isBytes2(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function anumber2(n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("positive integer expected, got " + n);
}
function abytes2(b, ...lengths) {
  if (!isBytes2(b))
    throw new Error("Uint8Array expected");
  if (lengths.length > 0 && !lengths.includes(b.length))
    throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
}
function aexists2(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput2(out, instance) {
  abytes2(out);
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error("digestInto() expects output buffer of length at least " + min);
  }
}
function u82(arr) {
  return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}
function u322(arr) {
  return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
function clean2(...arrays) {
  for (let i = 0;i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function rotr2(word, shift) {
  return word << 32 - shift | word >>> shift;
}
var isLE2 = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
function byteSwap2(word) {
  return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
}
var swap8IfBE2 = isLE2 ? (n) => n : (n) => byteSwap2(n);
function byteSwap322(arr) {
  for (let i = 0;i < arr.length; i++) {
    arr[i] = byteSwap2(arr[i]);
  }
  return arr;
}
var swap32IfBE2 = isLE2 ? (u) => u : byteSwap322;
function utf8ToBytes(str) {
  if (typeof str !== "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(str));
}
function toBytes(data) {
  if (typeof data === "string")
    data = utf8ToBytes(data);
  abytes2(data);
  return data;
}
class Hash {
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
class BLAKE2 extends Hash {
  constructor(blockLen, outputLen) {
    super();
    this.finished = false;
    this.destroyed = false;
    this.length = 0;
    this.pos = 0;
    anumber2(blockLen);
    anumber2(outputLen);
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.buffer = new Uint8Array(blockLen);
    this.buffer32 = u322(this.buffer);
  }
  update(data) {
    aexists2(this);
    data = toBytes(data);
    abytes2(data);
    const { blockLen, buffer, buffer32 } = this;
    const len = data.length;
    const offset = data.byteOffset;
    const buf = data.buffer;
    for (let pos = 0;pos < len; ) {
      if (this.pos === blockLen) {
        swap32IfBE2(buffer32);
        this.compress(buffer32, 0, false);
        swap32IfBE2(buffer32);
        this.pos = 0;
      }
      const take = Math.min(blockLen - this.pos, len - pos);
      const dataOffset = offset + pos;
      if (take === blockLen && !(dataOffset % 4) && pos + take < len) {
        const data32 = new Uint32Array(buf, dataOffset, Math.floor((len - pos) / 4));
        swap32IfBE2(data32);
        for (let pos32 = 0;pos + blockLen < len; pos32 += buffer32.length, pos += blockLen) {
          this.length += blockLen;
          this.compress(data32, pos32, false);
        }
        swap32IfBE2(data32);
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
    aexists2(this);
    aoutput2(out, this);
    const { pos, buffer32 } = this;
    this.finished = true;
    clean2(this.buffer.subarray(pos));
    swap32IfBE2(buffer32);
    this.compress(buffer32, 0, true);
    swap32IfBE2(buffer32);
    const out32 = u322(out);
    this.get().forEach((v, i) => out32[i] = swap8IfBE2(v));
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
function compress(s, offset, msg, rounds, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15) {
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
      abytes2(k, 32);
      this.IV = u322(k);
      swap32IfBE2(this.IV);
      this.flags = flags | B3_Flags2.KEYED_HASH;
    } else if (hasContext) {
      const ctx = toBytes(context);
      const contextKey = new BLAKE3({ dkLen: 32 }, B3_Flags2.DERIVE_KEY_CONTEXT).update(ctx).digest();
      this.IV = u322(contextKey);
      swap32IfBE2(this.IV);
      this.flags = flags | B3_Flags2.DERIVE_KEY_MATERIAL;
    } else {
      this.IV = B3_IV2.slice();
      this.flags = flags;
    }
    this.state = this.IV.slice();
    this.bufferOut = u82(this.bufferOut32);
  }
  get() {
    return [];
  }
  set() {}
  b2Compress(counter, flags, buf, bufPos = 0) {
    const { state: s, pos } = this;
    const { h, l } = fromBig2(BigInt(counter), true);
    const { v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15 } = compress(B3_SIGMA2, bufPos, buf, 7, s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], B3_IV2[0], B3_IV2[1], B3_IV2[2], B3_IV2[3], h, l, pos, flags);
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
    clean2(this.state, this.buffer32, this.IV, this.bufferOut32);
    clean2(...this.stack);
  }
  b2CompressOut() {
    const { state: s, pos, flags, buffer32, bufferOut32: out32 } = this;
    const { h, l } = fromBig2(BigInt(this.chunkOut++));
    swap32IfBE2(buffer32);
    const { v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15 } = compress(B3_SIGMA2, 0, buffer32, 7, s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], B3_IV2[0], B3_IV2[1], B3_IV2[2], B3_IV2[3], l, h, pos, flags);
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
    swap32IfBE2(buffer32);
    swap32IfBE2(out32);
    this.posOut = 0;
  }
  finish() {
    if (this.finished)
      return;
    this.finished = true;
    clean2(this.buffer.subarray(this.pos));
    let flags = this.flags | B3_Flags2.ROOT;
    if (this.stack.length) {
      flags |= B3_Flags2.PARENT;
      swap32IfBE2(this.buffer32);
      this.compress(this.buffer32, 0, true);
      swap32IfBE2(this.buffer32);
      this.chunksDone = 0;
      this.pos = this.blockLen;
    } else {
      flags |= (!this.chunkPos ? B3_Flags2.CHUNK_START : 0) | B3_Flags2.CHUNK_END;
    }
    this.flags = flags;
    this.b2CompressOut();
  }
  writeInto(out) {
    aexists2(this, false);
    abytes2(out);
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
    anumber2(bytes);
    return this.xofInto(new Uint8Array(bytes));
  }
  digestInto(out) {
    aoutput2(out, this);
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

// node:buffer
var lookup = [];
var revLookup = [];
var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
for (i = 0, len = code.length;i < len; ++i)
  lookup[i] = code[i], revLookup[code.charCodeAt(i)] = i;
var i;
var len;
revLookup[45] = 62;
revLookup[95] = 63;
function getLens(b64) {
  var len2 = b64.length;
  if (len2 % 4 > 0)
    throw Error("Invalid string. Length must be a multiple of 4");
  var validLen = b64.indexOf("=");
  if (validLen === -1)
    validLen = len2;
  var placeHoldersLen = validLen === len2 ? 0 : 4 - validLen % 4;
  return [validLen, placeHoldersLen];
}
function _byteLength(validLen, placeHoldersLen) {
  return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
}
function toByteArray(b64) {
  var tmp, lens = getLens(b64), validLen = lens[0], placeHoldersLen = lens[1], arr = new Uint8Array(_byteLength(validLen, placeHoldersLen)), curByte = 0, len2 = placeHoldersLen > 0 ? validLen - 4 : validLen, i2;
  for (i2 = 0;i2 < len2; i2 += 4)
    tmp = revLookup[b64.charCodeAt(i2)] << 18 | revLookup[b64.charCodeAt(i2 + 1)] << 12 | revLookup[b64.charCodeAt(i2 + 2)] << 6 | revLookup[b64.charCodeAt(i2 + 3)], arr[curByte++] = tmp >> 16 & 255, arr[curByte++] = tmp >> 8 & 255, arr[curByte++] = tmp & 255;
  if (placeHoldersLen === 2)
    tmp = revLookup[b64.charCodeAt(i2)] << 2 | revLookup[b64.charCodeAt(i2 + 1)] >> 4, arr[curByte++] = tmp & 255;
  if (placeHoldersLen === 1)
    tmp = revLookup[b64.charCodeAt(i2)] << 10 | revLookup[b64.charCodeAt(i2 + 1)] << 4 | revLookup[b64.charCodeAt(i2 + 2)] >> 2, arr[curByte++] = tmp >> 8 & 255, arr[curByte++] = tmp & 255;
  return arr;
}
function tripletToBase64(num) {
  return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
}
function encodeChunk(uint8, start, end) {
  var tmp, output = [];
  for (var i2 = start;i2 < end; i2 += 3)
    tmp = (uint8[i2] << 16 & 16711680) + (uint8[i2 + 1] << 8 & 65280) + (uint8[i2 + 2] & 255), output.push(tripletToBase64(tmp));
  return output.join("");
}
function fromByteArray(uint8) {
  var tmp, len2 = uint8.length, extraBytes = len2 % 3, parts = [], maxChunkLength = 16383;
  for (var i2 = 0, len22 = len2 - extraBytes;i2 < len22; i2 += maxChunkLength)
    parts.push(encodeChunk(uint8, i2, i2 + maxChunkLength > len22 ? len22 : i2 + maxChunkLength));
  if (extraBytes === 1)
    tmp = uint8[len2 - 1], parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "==");
  else if (extraBytes === 2)
    tmp = (uint8[len2 - 2] << 8) + uint8[len2 - 1], parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "=");
  return parts.join("");
}
function read(buffer, offset, isLE, mLen, nBytes) {
  var e, m, eLen = nBytes * 8 - mLen - 1, eMax = (1 << eLen) - 1, eBias = eMax >> 1, nBits = -7, i2 = isLE ? nBytes - 1 : 0, d = isLE ? -1 : 1, s = buffer[offset + i2];
  i2 += d, e = s & (1 << -nBits) - 1, s >>= -nBits, nBits += eLen;
  for (;nBits > 0; e = e * 256 + buffer[offset + i2], i2 += d, nBits -= 8)
    ;
  m = e & (1 << -nBits) - 1, e >>= -nBits, nBits += mLen;
  for (;nBits > 0; m = m * 256 + buffer[offset + i2], i2 += d, nBits -= 8)
    ;
  if (e === 0)
    e = 1 - eBias;
  else if (e === eMax)
    return m ? NaN : (s ? -1 : 1) * (1 / 0);
  else
    m = m + Math.pow(2, mLen), e = e - eBias;
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
}
function write(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c, eLen = nBytes * 8 - mLen - 1, eMax = (1 << eLen) - 1, eBias = eMax >> 1, rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, i2 = isLE ? 0 : nBytes - 1, d = isLE ? 1 : -1, s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
  if (value = Math.abs(value), isNaN(value) || value === 1 / 0)
    m = isNaN(value) ? 1 : 0, e = eMax;
  else {
    if (e = Math.floor(Math.log(value) / Math.LN2), value * (c = Math.pow(2, -e)) < 1)
      e--, c *= 2;
    if (e + eBias >= 1)
      value += rt / c;
    else
      value += rt * Math.pow(2, 1 - eBias);
    if (value * c >= 2)
      e++, c /= 2;
    if (e + eBias >= eMax)
      m = 0, e = eMax;
    else if (e + eBias >= 1)
      m = (value * c - 1) * Math.pow(2, mLen), e = e + eBias;
    else
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen), e = 0;
  }
  for (;mLen >= 8; buffer[offset + i2] = m & 255, i2 += d, m /= 256, mLen -= 8)
    ;
  e = e << mLen | m, eLen += mLen;
  for (;eLen > 0; buffer[offset + i2] = e & 255, i2 += d, e /= 256, eLen -= 8)
    ;
  buffer[offset + i2 - d] |= s * 128;
}
var customInspectSymbol = typeof Symbol === "function" && typeof Symbol.for === "function" ? Symbol.for("nodejs.util.inspect.custom") : null;
var INSPECT_MAX_BYTES = 50;
var kMaxLength = 2147483647;
var btoa2 = globalThis.btoa;
var atob2 = globalThis.atob;
var File = globalThis.File;
var Blob = globalThis.Blob;
function createBuffer(length) {
  if (length > kMaxLength)
    throw RangeError('The value "' + length + '" is invalid for option "size"');
  let buf = new Uint8Array(length);
  return Object.setPrototypeOf(buf, Buffer.prototype), buf;
}
function E(sym, getMessage, Base) {
  return class extends Base {
    constructor() {
      super();
      Object.defineProperty(this, "message", { value: getMessage.apply(this, arguments), writable: true, configurable: true }), this.name = `${this.name} [${sym}]`, this.stack, delete this.name;
    }
    get code() {
      return sym;
    }
    set code(value) {
      Object.defineProperty(this, "code", { configurable: true, enumerable: true, value, writable: true });
    }
    toString() {
      return `${this.name} [${sym}]: ${this.message}`;
    }
  };
}
var ERR_BUFFER_OUT_OF_BOUNDS = E("ERR_BUFFER_OUT_OF_BOUNDS", function(name) {
  if (name)
    return `${name} is outside of buffer bounds`;
  return "Attempt to access memory outside buffer bounds";
}, RangeError);
var ERR_INVALID_ARG_TYPE = E("ERR_INVALID_ARG_TYPE", function(name, actual) {
  return `The "${name}" argument must be of type number. Received type ${typeof actual}`;
}, TypeError);
var ERR_OUT_OF_RANGE = E("ERR_OUT_OF_RANGE", function(str, range, input) {
  let msg = `The value of "${str}" is out of range.`, received = input;
  if (Number.isInteger(input) && Math.abs(input) > 4294967296)
    received = addNumericalSeparator(String(input));
  else if (typeof input === "bigint") {
    if (received = String(input), input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32)))
      received = addNumericalSeparator(received);
    received += "n";
  }
  return msg += ` It must be ${range}. Received ${received}`, msg;
}, RangeError);
function Buffer(arg, encodingOrOffset, length) {
  if (typeof arg === "number") {
    if (typeof encodingOrOffset === "string")
      throw TypeError('The "string" argument must be of type string. Received type number');
    return allocUnsafe(arg);
  }
  return from(arg, encodingOrOffset, length);
}
Object.defineProperty(Buffer.prototype, "parent", { enumerable: true, get: function() {
  if (!Buffer.isBuffer(this))
    return;
  return this.buffer;
} });
Object.defineProperty(Buffer.prototype, "offset", { enumerable: true, get: function() {
  if (!Buffer.isBuffer(this))
    return;
  return this.byteOffset;
} });
Buffer.poolSize = 8192;
function from(value, encodingOrOffset, length) {
  if (typeof value === "string")
    return fromString(value, encodingOrOffset);
  if (ArrayBuffer.isView(value))
    return fromArrayView(value);
  if (value == null)
    throw TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value);
  if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer))
    return fromArrayBuffer(value, encodingOrOffset, length);
  if (typeof SharedArrayBuffer < "u" && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer)))
    return fromArrayBuffer(value, encodingOrOffset, length);
  if (typeof value === "number")
    throw TypeError('The "value" argument must not be of type number. Received type number');
  let valueOf = value.valueOf && value.valueOf();
  if (valueOf != null && valueOf !== value)
    return Buffer.from(valueOf, encodingOrOffset, length);
  let b = fromObject(value);
  if (b)
    return b;
  if (typeof Symbol < "u" && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === "function")
    return Buffer.from(value[Symbol.toPrimitive]("string"), encodingOrOffset, length);
  throw TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value);
}
Buffer.from = function(value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length);
};
Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype);
Object.setPrototypeOf(Buffer, Uint8Array);
function assertSize(size) {
  if (typeof size !== "number")
    throw TypeError('"size" argument must be of type number');
  else if (size < 0)
    throw RangeError('The value "' + size + '" is invalid for option "size"');
}
function alloc(size, fill, encoding) {
  if (assertSize(size), size <= 0)
    return createBuffer(size);
  if (fill !== undefined)
    return typeof encoding === "string" ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
  return createBuffer(size);
}
Buffer.alloc = function(size, fill, encoding) {
  return alloc(size, fill, encoding);
};
function allocUnsafe(size) {
  return assertSize(size), createBuffer(size < 0 ? 0 : checked(size) | 0);
}
Buffer.allocUnsafe = function(size) {
  return allocUnsafe(size);
};
Buffer.allocUnsafeSlow = function(size) {
  return allocUnsafe(size);
};
function fromString(string, encoding) {
  if (typeof encoding !== "string" || encoding === "")
    encoding = "utf8";
  if (!Buffer.isEncoding(encoding))
    throw TypeError("Unknown encoding: " + encoding);
  let length = byteLength(string, encoding) | 0, buf = createBuffer(length), actual = buf.write(string, encoding);
  if (actual !== length)
    buf = buf.slice(0, actual);
  return buf;
}
function fromArrayLike(array) {
  let length = array.length < 0 ? 0 : checked(array.length) | 0, buf = createBuffer(length);
  for (let i2 = 0;i2 < length; i2 += 1)
    buf[i2] = array[i2] & 255;
  return buf;
}
function fromArrayView(arrayView) {
  if (isInstance(arrayView, Uint8Array)) {
    let copy = new Uint8Array(arrayView);
    return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
  }
  return fromArrayLike(arrayView);
}
function fromArrayBuffer(array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset)
    throw RangeError('"offset" is outside of buffer bounds');
  if (array.byteLength < byteOffset + (length || 0))
    throw RangeError('"length" is outside of buffer bounds');
  let buf;
  if (byteOffset === undefined && length === undefined)
    buf = new Uint8Array(array);
  else if (length === undefined)
    buf = new Uint8Array(array, byteOffset);
  else
    buf = new Uint8Array(array, byteOffset, length);
  return Object.setPrototypeOf(buf, Buffer.prototype), buf;
}
function fromObject(obj) {
  if (Buffer.isBuffer(obj)) {
    let len2 = checked(obj.length) | 0, buf = createBuffer(len2);
    if (buf.length === 0)
      return buf;
    return obj.copy(buf, 0, 0, len2), buf;
  }
  if (obj.length !== undefined) {
    if (typeof obj.length !== "number" || Number.isNaN(obj.length))
      return createBuffer(0);
    return fromArrayLike(obj);
  }
  if (obj.type === "Buffer" && Array.isArray(obj.data))
    return fromArrayLike(obj.data);
}
function checked(length) {
  if (length >= kMaxLength)
    throw RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + kMaxLength.toString(16) + " bytes");
  return length | 0;
}
Buffer.isBuffer = function(b) {
  return b != null && b._isBuffer === true && b !== Buffer.prototype;
};
Buffer.compare = function(a, b) {
  if (isInstance(a, Uint8Array))
    a = Buffer.from(a, a.offset, a.byteLength);
  if (isInstance(b, Uint8Array))
    b = Buffer.from(b, b.offset, b.byteLength);
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b))
    throw TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
  if (a === b)
    return 0;
  let x = a.length, y = b.length;
  for (let i2 = 0, len2 = Math.min(x, y);i2 < len2; ++i2)
    if (a[i2] !== b[i2]) {
      x = a[i2], y = b[i2];
      break;
    }
  if (x < y)
    return -1;
  if (y < x)
    return 1;
  return 0;
};
Buffer.isEncoding = function(encoding) {
  switch (String(encoding).toLowerCase()) {
    case "hex":
    case "utf8":
    case "utf-8":
    case "ascii":
    case "latin1":
    case "binary":
    case "base64":
    case "ucs2":
    case "ucs-2":
    case "utf16le":
    case "utf-16le":
      return true;
    default:
      return false;
  }
};
Buffer.concat = function(list, length) {
  if (!Array.isArray(list))
    throw TypeError('"list" argument must be an Array of Buffers');
  if (list.length === 0)
    return Buffer.alloc(0);
  let i2;
  if (length === undefined) {
    length = 0;
    for (i2 = 0;i2 < list.length; ++i2)
      length += list[i2].length;
  }
  let buffer = Buffer.allocUnsafe(length), pos = 0;
  for (i2 = 0;i2 < list.length; ++i2) {
    let buf = list[i2];
    if (isInstance(buf, Uint8Array))
      if (pos + buf.length > buffer.length) {
        if (!Buffer.isBuffer(buf))
          buf = Buffer.from(buf);
        buf.copy(buffer, pos);
      } else
        Uint8Array.prototype.set.call(buffer, buf, pos);
    else if (!Buffer.isBuffer(buf))
      throw TypeError('"list" argument must be an Array of Buffers');
    else
      buf.copy(buffer, pos);
    pos += buf.length;
  }
  return buffer;
};
function byteLength(string, encoding) {
  if (Buffer.isBuffer(string))
    return string.length;
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer))
    return string.byteLength;
  if (typeof string !== "string")
    throw TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof string);
  let len2 = string.length, mustMatch = arguments.length > 2 && arguments[2] === true;
  if (!mustMatch && len2 === 0)
    return 0;
  let loweredCase = false;
  for (;; )
    switch (encoding) {
      case "ascii":
      case "latin1":
      case "binary":
        return len2;
      case "utf8":
      case "utf-8":
        return utf8ToBytes2(string).length;
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return len2 * 2;
      case "hex":
        return len2 >>> 1;
      case "base64":
        return base64ToBytes(string).length;
      default:
        if (loweredCase)
          return mustMatch ? -1 : utf8ToBytes2(string).length;
        encoding = ("" + encoding).toLowerCase(), loweredCase = true;
    }
}
Buffer.byteLength = byteLength;
function slowToString(encoding, start, end) {
  let loweredCase = false;
  if (start === undefined || start < 0)
    start = 0;
  if (start > this.length)
    return "";
  if (end === undefined || end > this.length)
    end = this.length;
  if (end <= 0)
    return "";
  if (end >>>= 0, start >>>= 0, end <= start)
    return "";
  if (!encoding)
    encoding = "utf8";
  while (true)
    switch (encoding) {
      case "hex":
        return hexSlice(this, start, end);
      case "utf8":
      case "utf-8":
        return utf8Slice(this, start, end);
      case "ascii":
        return asciiSlice(this, start, end);
      case "latin1":
      case "binary":
        return latin1Slice(this, start, end);
      case "base64":
        return base64Slice(this, start, end);
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return utf16leSlice(this, start, end);
      default:
        if (loweredCase)
          throw TypeError("Unknown encoding: " + encoding);
        encoding = (encoding + "").toLowerCase(), loweredCase = true;
    }
}
Buffer.prototype._isBuffer = true;
function swap(b, n, m) {
  let i2 = b[n];
  b[n] = b[m], b[m] = i2;
}
Buffer.prototype.swap16 = function() {
  let len2 = this.length;
  if (len2 % 2 !== 0)
    throw RangeError("Buffer size must be a multiple of 16-bits");
  for (let i2 = 0;i2 < len2; i2 += 2)
    swap(this, i2, i2 + 1);
  return this;
};
Buffer.prototype.swap32 = function() {
  let len2 = this.length;
  if (len2 % 4 !== 0)
    throw RangeError("Buffer size must be a multiple of 32-bits");
  for (let i2 = 0;i2 < len2; i2 += 4)
    swap(this, i2, i2 + 3), swap(this, i2 + 1, i2 + 2);
  return this;
};
Buffer.prototype.swap64 = function() {
  let len2 = this.length;
  if (len2 % 8 !== 0)
    throw RangeError("Buffer size must be a multiple of 64-bits");
  for (let i2 = 0;i2 < len2; i2 += 8)
    swap(this, i2, i2 + 7), swap(this, i2 + 1, i2 + 6), swap(this, i2 + 2, i2 + 5), swap(this, i2 + 3, i2 + 4);
  return this;
};
Buffer.prototype.toString = function() {
  let length = this.length;
  if (length === 0)
    return "";
  if (arguments.length === 0)
    return utf8Slice(this, 0, length);
  return slowToString.apply(this, arguments);
};
Buffer.prototype.toLocaleString = Buffer.prototype.toString;
Buffer.prototype.equals = function(b) {
  if (!Buffer.isBuffer(b))
    throw TypeError("Argument must be a Buffer");
  if (this === b)
    return true;
  return Buffer.compare(this, b) === 0;
};
Buffer.prototype.inspect = function() {
  let str = "", max = INSPECT_MAX_BYTES;
  if (str = this.toString("hex", 0, max).replace(/(.{2})/g, "$1 ").trim(), this.length > max)
    str += " ... ";
  return "<Buffer " + str + ">";
};
if (customInspectSymbol)
  Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect;
Buffer.prototype.compare = function(target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array))
    target = Buffer.from(target, target.offset, target.byteLength);
  if (!Buffer.isBuffer(target))
    throw TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof target);
  if (start === undefined)
    start = 0;
  if (end === undefined)
    end = target ? target.length : 0;
  if (thisStart === undefined)
    thisStart = 0;
  if (thisEnd === undefined)
    thisEnd = this.length;
  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length)
    throw RangeError("out of range index");
  if (thisStart >= thisEnd && start >= end)
    return 0;
  if (thisStart >= thisEnd)
    return -1;
  if (start >= end)
    return 1;
  if (start >>>= 0, end >>>= 0, thisStart >>>= 0, thisEnd >>>= 0, this === target)
    return 0;
  let x = thisEnd - thisStart, y = end - start, len2 = Math.min(x, y), thisCopy = this.slice(thisStart, thisEnd), targetCopy = target.slice(start, end);
  for (let i2 = 0;i2 < len2; ++i2)
    if (thisCopy[i2] !== targetCopy[i2]) {
      x = thisCopy[i2], y = targetCopy[i2];
      break;
    }
  if (x < y)
    return -1;
  if (y < x)
    return 1;
  return 0;
};
function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
  if (buffer.length === 0)
    return -1;
  if (typeof byteOffset === "string")
    encoding = byteOffset, byteOffset = 0;
  else if (byteOffset > 2147483647)
    byteOffset = 2147483647;
  else if (byteOffset < -2147483648)
    byteOffset = -2147483648;
  if (byteOffset = +byteOffset, Number.isNaN(byteOffset))
    byteOffset = dir ? 0 : buffer.length - 1;
  if (byteOffset < 0)
    byteOffset = buffer.length + byteOffset;
  if (byteOffset >= buffer.length)
    if (dir)
      return -1;
    else
      byteOffset = buffer.length - 1;
  else if (byteOffset < 0)
    if (dir)
      byteOffset = 0;
    else
      return -1;
  if (typeof val === "string")
    val = Buffer.from(val, encoding);
  if (Buffer.isBuffer(val)) {
    if (val.length === 0)
      return -1;
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
  } else if (typeof val === "number") {
    if (val = val & 255, typeof Uint8Array.prototype.indexOf === "function")
      if (dir)
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
      else
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
  }
  throw TypeError("val must be string, number or Buffer");
}
function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
  let indexSize = 1, arrLength = arr.length, valLength = val.length;
  if (encoding !== undefined) {
    if (encoding = String(encoding).toLowerCase(), encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
      if (arr.length < 2 || val.length < 2)
        return -1;
      indexSize = 2, arrLength /= 2, valLength /= 2, byteOffset /= 2;
    }
  }
  function read2(buf, i3) {
    if (indexSize === 1)
      return buf[i3];
    else
      return buf.readUInt16BE(i3 * indexSize);
  }
  let i2;
  if (dir) {
    let foundIndex = -1;
    for (i2 = byteOffset;i2 < arrLength; i2++)
      if (read2(arr, i2) === read2(val, foundIndex === -1 ? 0 : i2 - foundIndex)) {
        if (foundIndex === -1)
          foundIndex = i2;
        if (i2 - foundIndex + 1 === valLength)
          return foundIndex * indexSize;
      } else {
        if (foundIndex !== -1)
          i2 -= i2 - foundIndex;
        foundIndex = -1;
      }
  } else {
    if (byteOffset + valLength > arrLength)
      byteOffset = arrLength - valLength;
    for (i2 = byteOffset;i2 >= 0; i2--) {
      let found = true;
      for (let j = 0;j < valLength; j++)
        if (read2(arr, i2 + j) !== read2(val, j)) {
          found = false;
          break;
        }
      if (found)
        return i2;
    }
  }
  return -1;
}
Buffer.prototype.includes = function(val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1;
};
Buffer.prototype.indexOf = function(val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
};
Buffer.prototype.lastIndexOf = function(val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
};
function hexWrite(buf, string, offset, length) {
  offset = Number(offset) || 0;
  let remaining = buf.length - offset;
  if (!length)
    length = remaining;
  else if (length = Number(length), length > remaining)
    length = remaining;
  let strLen = string.length;
  if (length > strLen / 2)
    length = strLen / 2;
  let i2;
  for (i2 = 0;i2 < length; ++i2) {
    let parsed = parseInt(string.substr(i2 * 2, 2), 16);
    if (Number.isNaN(parsed))
      return i2;
    buf[offset + i2] = parsed;
  }
  return i2;
}
function utf8Write(buf, string, offset, length) {
  return blitBuffer(utf8ToBytes2(string, buf.length - offset), buf, offset, length);
}
function asciiWrite(buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length);
}
function base64Write(buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length);
}
function ucs2Write(buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
}
Buffer.prototype.write = function(string, offset, length, encoding) {
  if (offset === undefined)
    encoding = "utf8", length = this.length, offset = 0;
  else if (length === undefined && typeof offset === "string")
    encoding = offset, length = this.length, offset = 0;
  else if (isFinite(offset))
    if (offset = offset >>> 0, isFinite(length)) {
      if (length = length >>> 0, encoding === undefined)
        encoding = "utf8";
    } else
      encoding = length, length = undefined;
  else
    throw Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
  let remaining = this.length - offset;
  if (length === undefined || length > remaining)
    length = remaining;
  if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length)
    throw RangeError("Attempt to write outside buffer bounds");
  if (!encoding)
    encoding = "utf8";
  let loweredCase = false;
  for (;; )
    switch (encoding) {
      case "hex":
        return hexWrite(this, string, offset, length);
      case "utf8":
      case "utf-8":
        return utf8Write(this, string, offset, length);
      case "ascii":
      case "latin1":
      case "binary":
        return asciiWrite(this, string, offset, length);
      case "base64":
        return base64Write(this, string, offset, length);
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return ucs2Write(this, string, offset, length);
      default:
        if (loweredCase)
          throw TypeError("Unknown encoding: " + encoding);
        encoding = ("" + encoding).toLowerCase(), loweredCase = true;
    }
};
Buffer.prototype.toJSON = function() {
  return { type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0) };
};
function base64Slice(buf, start, end) {
  if (start === 0 && end === buf.length)
    return fromByteArray(buf);
  else
    return fromByteArray(buf.slice(start, end));
}
function utf8Slice(buf, start, end) {
  end = Math.min(buf.length, end);
  let res = [], i2 = start;
  while (i2 < end) {
    let firstByte = buf[i2], codePoint = null, bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
    if (i2 + bytesPerSequence <= end) {
      let secondByte, thirdByte, fourthByte, tempCodePoint;
      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 128)
            codePoint = firstByte;
          break;
        case 2:
          if (secondByte = buf[i2 + 1], (secondByte & 192) === 128) {
            if (tempCodePoint = (firstByte & 31) << 6 | secondByte & 63, tempCodePoint > 127)
              codePoint = tempCodePoint;
          }
          break;
        case 3:
          if (secondByte = buf[i2 + 1], thirdByte = buf[i2 + 2], (secondByte & 192) === 128 && (thirdByte & 192) === 128) {
            if (tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63, tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343))
              codePoint = tempCodePoint;
          }
          break;
        case 4:
          if (secondByte = buf[i2 + 1], thirdByte = buf[i2 + 2], fourthByte = buf[i2 + 3], (secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
            if (tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63, tempCodePoint > 65535 && tempCodePoint < 1114112)
              codePoint = tempCodePoint;
          }
      }
    }
    if (codePoint === null)
      codePoint = 65533, bytesPerSequence = 1;
    else if (codePoint > 65535)
      codePoint -= 65536, res.push(codePoint >>> 10 & 1023 | 55296), codePoint = 56320 | codePoint & 1023;
    res.push(codePoint), i2 += bytesPerSequence;
  }
  return decodeCodePointsArray(res);
}
var MAX_ARGUMENTS_LENGTH = 4096;
function decodeCodePointsArray(codePoints) {
  let len2 = codePoints.length;
  if (len2 <= MAX_ARGUMENTS_LENGTH)
    return String.fromCharCode.apply(String, codePoints);
  let res = "", i2 = 0;
  while (i2 < len2)
    res += String.fromCharCode.apply(String, codePoints.slice(i2, i2 += MAX_ARGUMENTS_LENGTH));
  return res;
}
function asciiSlice(buf, start, end) {
  let ret = "";
  end = Math.min(buf.length, end);
  for (let i2 = start;i2 < end; ++i2)
    ret += String.fromCharCode(buf[i2] & 127);
  return ret;
}
function latin1Slice(buf, start, end) {
  let ret = "";
  end = Math.min(buf.length, end);
  for (let i2 = start;i2 < end; ++i2)
    ret += String.fromCharCode(buf[i2]);
  return ret;
}
function hexSlice(buf, start, end) {
  let len2 = buf.length;
  if (!start || start < 0)
    start = 0;
  if (!end || end < 0 || end > len2)
    end = len2;
  let out = "";
  for (let i2 = start;i2 < end; ++i2)
    out += hexSliceLookupTable[buf[i2]];
  return out;
}
function utf16leSlice(buf, start, end) {
  let bytes = buf.slice(start, end), res = "";
  for (let i2 = 0;i2 < bytes.length - 1; i2 += 2)
    res += String.fromCharCode(bytes[i2] + bytes[i2 + 1] * 256);
  return res;
}
Buffer.prototype.slice = function(start, end) {
  let len2 = this.length;
  if (start = ~~start, end = end === undefined ? len2 : ~~end, start < 0) {
    if (start += len2, start < 0)
      start = 0;
  } else if (start > len2)
    start = len2;
  if (end < 0) {
    if (end += len2, end < 0)
      end = 0;
  } else if (end > len2)
    end = len2;
  if (end < start)
    end = start;
  let newBuf = this.subarray(start, end);
  return Object.setPrototypeOf(newBuf, Buffer.prototype), newBuf;
};
function checkOffset(offset, ext, length) {
  if (offset % 1 !== 0 || offset < 0)
    throw RangeError("offset is not uint");
  if (offset + ext > length)
    throw RangeError("Trying to access beyond buffer length");
}
Buffer.prototype.readUintLE = Buffer.prototype.readUIntLE = function(offset, byteLength2, noAssert) {
  if (offset = offset >>> 0, byteLength2 = byteLength2 >>> 0, !noAssert)
    checkOffset(offset, byteLength2, this.length);
  let val = this[offset], mul = 1, i2 = 0;
  while (++i2 < byteLength2 && (mul *= 256))
    val += this[offset + i2] * mul;
  return val;
};
Buffer.prototype.readUintBE = Buffer.prototype.readUIntBE = function(offset, byteLength2, noAssert) {
  if (offset = offset >>> 0, byteLength2 = byteLength2 >>> 0, !noAssert)
    checkOffset(offset, byteLength2, this.length);
  let val = this[offset + --byteLength2], mul = 1;
  while (byteLength2 > 0 && (mul *= 256))
    val += this[offset + --byteLength2] * mul;
  return val;
};
Buffer.prototype.readUint8 = Buffer.prototype.readUInt8 = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 1, this.length);
  return this[offset];
};
Buffer.prototype.readUint16LE = Buffer.prototype.readUInt16LE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 2, this.length);
  return this[offset] | this[offset + 1] << 8;
};
Buffer.prototype.readUint16BE = Buffer.prototype.readUInt16BE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 2, this.length);
  return this[offset] << 8 | this[offset + 1];
};
Buffer.prototype.readUint32LE = Buffer.prototype.readUInt32LE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 4, this.length);
  return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
};
Buffer.prototype.readUint32BE = Buffer.prototype.readUInt32BE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 4, this.length);
  return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
};
Buffer.prototype.readBigUInt64LE = defineBigIntMethod(function(offset) {
  offset = offset >>> 0, validateNumber(offset, "offset");
  let first = this[offset], last = this[offset + 7];
  if (first === undefined || last === undefined)
    boundsError(offset, this.length - 8);
  let lo = first + this[++offset] * 256 + this[++offset] * 65536 + this[++offset] * 16777216, hi = this[++offset] + this[++offset] * 256 + this[++offset] * 65536 + last * 16777216;
  return BigInt(lo) + (BigInt(hi) << BigInt(32));
});
Buffer.prototype.readBigUInt64BE = defineBigIntMethod(function(offset) {
  offset = offset >>> 0, validateNumber(offset, "offset");
  let first = this[offset], last = this[offset + 7];
  if (first === undefined || last === undefined)
    boundsError(offset, this.length - 8);
  let hi = first * 16777216 + this[++offset] * 65536 + this[++offset] * 256 + this[++offset], lo = this[++offset] * 16777216 + this[++offset] * 65536 + this[++offset] * 256 + last;
  return (BigInt(hi) << BigInt(32)) + BigInt(lo);
});
Buffer.prototype.readIntLE = function(offset, byteLength2, noAssert) {
  if (offset = offset >>> 0, byteLength2 = byteLength2 >>> 0, !noAssert)
    checkOffset(offset, byteLength2, this.length);
  let val = this[offset], mul = 1, i2 = 0;
  while (++i2 < byteLength2 && (mul *= 256))
    val += this[offset + i2] * mul;
  if (mul *= 128, val >= mul)
    val -= Math.pow(2, 8 * byteLength2);
  return val;
};
Buffer.prototype.readIntBE = function(offset, byteLength2, noAssert) {
  if (offset = offset >>> 0, byteLength2 = byteLength2 >>> 0, !noAssert)
    checkOffset(offset, byteLength2, this.length);
  let i2 = byteLength2, mul = 1, val = this[offset + --i2];
  while (i2 > 0 && (mul *= 256))
    val += this[offset + --i2] * mul;
  if (mul *= 128, val >= mul)
    val -= Math.pow(2, 8 * byteLength2);
  return val;
};
Buffer.prototype.readInt8 = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 1, this.length);
  if (!(this[offset] & 128))
    return this[offset];
  return (255 - this[offset] + 1) * -1;
};
Buffer.prototype.readInt16LE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 2, this.length);
  let val = this[offset] | this[offset + 1] << 8;
  return val & 32768 ? val | 4294901760 : val;
};
Buffer.prototype.readInt16BE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 2, this.length);
  let val = this[offset + 1] | this[offset] << 8;
  return val & 32768 ? val | 4294901760 : val;
};
Buffer.prototype.readInt32LE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 4, this.length);
  return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
};
Buffer.prototype.readInt32BE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 4, this.length);
  return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
};
Buffer.prototype.readBigInt64LE = defineBigIntMethod(function(offset) {
  offset = offset >>> 0, validateNumber(offset, "offset");
  let first = this[offset], last = this[offset + 7];
  if (first === undefined || last === undefined)
    boundsError(offset, this.length - 8);
  let val = this[offset + 4] + this[offset + 5] * 256 + this[offset + 6] * 65536 + (last << 24);
  return (BigInt(val) << BigInt(32)) + BigInt(first + this[++offset] * 256 + this[++offset] * 65536 + this[++offset] * 16777216);
});
Buffer.prototype.readBigInt64BE = defineBigIntMethod(function(offset) {
  offset = offset >>> 0, validateNumber(offset, "offset");
  let first = this[offset], last = this[offset + 7];
  if (first === undefined || last === undefined)
    boundsError(offset, this.length - 8);
  let val = (first << 24) + this[++offset] * 65536 + this[++offset] * 256 + this[++offset];
  return (BigInt(val) << BigInt(32)) + BigInt(this[++offset] * 16777216 + this[++offset] * 65536 + this[++offset] * 256 + last);
});
Buffer.prototype.readFloatLE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 4, this.length);
  return read(this, offset, true, 23, 4);
};
Buffer.prototype.readFloatBE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 4, this.length);
  return read(this, offset, false, 23, 4);
};
Buffer.prototype.readDoubleLE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 8, this.length);
  return read(this, offset, true, 52, 8);
};
Buffer.prototype.readDoubleBE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 8, this.length);
  return read(this, offset, false, 52, 8);
};
function checkInt(buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf))
    throw TypeError('"buffer" argument must be a Buffer instance');
  if (value > max || value < min)
    throw RangeError('"value" argument is out of bounds');
  if (offset + ext > buf.length)
    throw RangeError("Index out of range");
}
Buffer.prototype.writeUintLE = Buffer.prototype.writeUIntLE = function(value, offset, byteLength2, noAssert) {
  if (value = +value, offset = offset >>> 0, byteLength2 = byteLength2 >>> 0, !noAssert) {
    let maxBytes = Math.pow(2, 8 * byteLength2) - 1;
    checkInt(this, value, offset, byteLength2, maxBytes, 0);
  }
  let mul = 1, i2 = 0;
  this[offset] = value & 255;
  while (++i2 < byteLength2 && (mul *= 256))
    this[offset + i2] = value / mul & 255;
  return offset + byteLength2;
};
Buffer.prototype.writeUintBE = Buffer.prototype.writeUIntBE = function(value, offset, byteLength2, noAssert) {
  if (value = +value, offset = offset >>> 0, byteLength2 = byteLength2 >>> 0, !noAssert) {
    let maxBytes = Math.pow(2, 8 * byteLength2) - 1;
    checkInt(this, value, offset, byteLength2, maxBytes, 0);
  }
  let i2 = byteLength2 - 1, mul = 1;
  this[offset + i2] = value & 255;
  while (--i2 >= 0 && (mul *= 256))
    this[offset + i2] = value / mul & 255;
  return offset + byteLength2;
};
Buffer.prototype.writeUint8 = Buffer.prototype.writeUInt8 = function(value, offset, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkInt(this, value, offset, 1, 255, 0);
  return this[offset] = value & 255, offset + 1;
};
Buffer.prototype.writeUint16LE = Buffer.prototype.writeUInt16LE = function(value, offset, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkInt(this, value, offset, 2, 65535, 0);
  return this[offset] = value & 255, this[offset + 1] = value >>> 8, offset + 2;
};
Buffer.prototype.writeUint16BE = Buffer.prototype.writeUInt16BE = function(value, offset, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkInt(this, value, offset, 2, 65535, 0);
  return this[offset] = value >>> 8, this[offset + 1] = value & 255, offset + 2;
};
Buffer.prototype.writeUint32LE = Buffer.prototype.writeUInt32LE = function(value, offset, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkInt(this, value, offset, 4, 4294967295, 0);
  return this[offset + 3] = value >>> 24, this[offset + 2] = value >>> 16, this[offset + 1] = value >>> 8, this[offset] = value & 255, offset + 4;
};
Buffer.prototype.writeUint32BE = Buffer.prototype.writeUInt32BE = function(value, offset, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkInt(this, value, offset, 4, 4294967295, 0);
  return this[offset] = value >>> 24, this[offset + 1] = value >>> 16, this[offset + 2] = value >>> 8, this[offset + 3] = value & 255, offset + 4;
};
function wrtBigUInt64LE(buf, value, offset, min, max) {
  checkIntBI(value, min, max, buf, offset, 7);
  let lo = Number(value & BigInt(4294967295));
  buf[offset++] = lo, lo = lo >> 8, buf[offset++] = lo, lo = lo >> 8, buf[offset++] = lo, lo = lo >> 8, buf[offset++] = lo;
  let hi = Number(value >> BigInt(32) & BigInt(4294967295));
  return buf[offset++] = hi, hi = hi >> 8, buf[offset++] = hi, hi = hi >> 8, buf[offset++] = hi, hi = hi >> 8, buf[offset++] = hi, offset;
}
function wrtBigUInt64BE(buf, value, offset, min, max) {
  checkIntBI(value, min, max, buf, offset, 7);
  let lo = Number(value & BigInt(4294967295));
  buf[offset + 7] = lo, lo = lo >> 8, buf[offset + 6] = lo, lo = lo >> 8, buf[offset + 5] = lo, lo = lo >> 8, buf[offset + 4] = lo;
  let hi = Number(value >> BigInt(32) & BigInt(4294967295));
  return buf[offset + 3] = hi, hi = hi >> 8, buf[offset + 2] = hi, hi = hi >> 8, buf[offset + 1] = hi, hi = hi >> 8, buf[offset] = hi, offset + 8;
}
Buffer.prototype.writeBigUInt64LE = defineBigIntMethod(function(value, offset = 0) {
  return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
});
Buffer.prototype.writeBigUInt64BE = defineBigIntMethod(function(value, offset = 0) {
  return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
});
Buffer.prototype.writeIntLE = function(value, offset, byteLength2, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert) {
    let limit = Math.pow(2, 8 * byteLength2 - 1);
    checkInt(this, value, offset, byteLength2, limit - 1, -limit);
  }
  let i2 = 0, mul = 1, sub = 0;
  this[offset] = value & 255;
  while (++i2 < byteLength2 && (mul *= 256)) {
    if (value < 0 && sub === 0 && this[offset + i2 - 1] !== 0)
      sub = 1;
    this[offset + i2] = (value / mul >> 0) - sub & 255;
  }
  return offset + byteLength2;
};
Buffer.prototype.writeIntBE = function(value, offset, byteLength2, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert) {
    let limit = Math.pow(2, 8 * byteLength2 - 1);
    checkInt(this, value, offset, byteLength2, limit - 1, -limit);
  }
  let i2 = byteLength2 - 1, mul = 1, sub = 0;
  this[offset + i2] = value & 255;
  while (--i2 >= 0 && (mul *= 256)) {
    if (value < 0 && sub === 0 && this[offset + i2 + 1] !== 0)
      sub = 1;
    this[offset + i2] = (value / mul >> 0) - sub & 255;
  }
  return offset + byteLength2;
};
Buffer.prototype.writeInt8 = function(value, offset, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkInt(this, value, offset, 1, 127, -128);
  if (value < 0)
    value = 255 + value + 1;
  return this[offset] = value & 255, offset + 1;
};
Buffer.prototype.writeInt16LE = function(value, offset, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkInt(this, value, offset, 2, 32767, -32768);
  return this[offset] = value & 255, this[offset + 1] = value >>> 8, offset + 2;
};
Buffer.prototype.writeInt16BE = function(value, offset, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkInt(this, value, offset, 2, 32767, -32768);
  return this[offset] = value >>> 8, this[offset + 1] = value & 255, offset + 2;
};
Buffer.prototype.writeInt32LE = function(value, offset, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkInt(this, value, offset, 4, 2147483647, -2147483648);
  return this[offset] = value & 255, this[offset + 1] = value >>> 8, this[offset + 2] = value >>> 16, this[offset + 3] = value >>> 24, offset + 4;
};
Buffer.prototype.writeInt32BE = function(value, offset, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkInt(this, value, offset, 4, 2147483647, -2147483648);
  if (value < 0)
    value = 4294967295 + value + 1;
  return this[offset] = value >>> 24, this[offset + 1] = value >>> 16, this[offset + 2] = value >>> 8, this[offset + 3] = value & 255, offset + 4;
};
Buffer.prototype.writeBigInt64LE = defineBigIntMethod(function(value, offset = 0) {
  return wrtBigUInt64LE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
});
Buffer.prototype.writeBigInt64BE = defineBigIntMethod(function(value, offset = 0) {
  return wrtBigUInt64BE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
});
function checkIEEE754(buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length)
    throw RangeError("Index out of range");
  if (offset < 0)
    throw RangeError("Index out of range");
}
function writeFloat(buf, value, offset, littleEndian, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkIEEE754(buf, value, offset, 4, 340282346638528860000000000000000000000, -340282346638528860000000000000000000000);
  return write(buf, value, offset, littleEndian, 23, 4), offset + 4;
}
Buffer.prototype.writeFloatLE = function(value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert);
};
Buffer.prototype.writeFloatBE = function(value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert);
};
function writeDouble(buf, value, offset, littleEndian, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkIEEE754(buf, value, offset, 8, 179769313486231570000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000, -179769313486231570000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000);
  return write(buf, value, offset, littleEndian, 52, 8), offset + 8;
}
Buffer.prototype.writeDoubleLE = function(value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert);
};
Buffer.prototype.writeDoubleBE = function(value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert);
};
Buffer.prototype.copy = function(target, targetStart, start, end) {
  if (!Buffer.isBuffer(target))
    throw TypeError("argument should be a Buffer");
  if (!start)
    start = 0;
  if (!end && end !== 0)
    end = this.length;
  if (targetStart >= target.length)
    targetStart = target.length;
  if (!targetStart)
    targetStart = 0;
  if (end > 0 && end < start)
    end = start;
  if (end === start)
    return 0;
  if (target.length === 0 || this.length === 0)
    return 0;
  if (targetStart < 0)
    throw RangeError("targetStart out of bounds");
  if (start < 0 || start >= this.length)
    throw RangeError("Index out of range");
  if (end < 0)
    throw RangeError("sourceEnd out of bounds");
  if (end > this.length)
    end = this.length;
  if (target.length - targetStart < end - start)
    end = target.length - targetStart + start;
  let len2 = end - start;
  if (this === target && typeof Uint8Array.prototype.copyWithin === "function")
    this.copyWithin(targetStart, start, end);
  else
    Uint8Array.prototype.set.call(target, this.subarray(start, end), targetStart);
  return len2;
};
Buffer.prototype.fill = function(val, start, end, encoding) {
  if (typeof val === "string") {
    if (typeof start === "string")
      encoding = start, start = 0, end = this.length;
    else if (typeof end === "string")
      encoding = end, end = this.length;
    if (encoding !== undefined && typeof encoding !== "string")
      throw TypeError("encoding must be a string");
    if (typeof encoding === "string" && !Buffer.isEncoding(encoding))
      throw TypeError("Unknown encoding: " + encoding);
    if (val.length === 1) {
      let code2 = val.charCodeAt(0);
      if (encoding === "utf8" && code2 < 128 || encoding === "latin1")
        val = code2;
    }
  } else if (typeof val === "number")
    val = val & 255;
  else if (typeof val === "boolean")
    val = Number(val);
  if (start < 0 || this.length < start || this.length < end)
    throw RangeError("Out of range index");
  if (end <= start)
    return this;
  if (start = start >>> 0, end = end === undefined ? this.length : end >>> 0, !val)
    val = 0;
  let i2;
  if (typeof val === "number")
    for (i2 = start;i2 < end; ++i2)
      this[i2] = val;
  else {
    let bytes = Buffer.isBuffer(val) ? val : Buffer.from(val, encoding), len2 = bytes.length;
    if (len2 === 0)
      throw TypeError('The value "' + val + '" is invalid for argument "value"');
    for (i2 = 0;i2 < end - start; ++i2)
      this[i2 + start] = bytes[i2 % len2];
  }
  return this;
};
function addNumericalSeparator(val) {
  let res = "", i2 = val.length, start = val[0] === "-" ? 1 : 0;
  for (;i2 >= start + 4; i2 -= 3)
    res = `_${val.slice(i2 - 3, i2)}${res}`;
  return `${val.slice(0, i2)}${res}`;
}
function checkBounds(buf, offset, byteLength2) {
  if (validateNumber(offset, "offset"), buf[offset] === undefined || buf[offset + byteLength2] === undefined)
    boundsError(offset, buf.length - (byteLength2 + 1));
}
function checkIntBI(value, min, max, buf, offset, byteLength2) {
  if (value > max || value < min) {
    let n = typeof min === "bigint" ? "n" : "", range;
    if (byteLength2 > 3)
      if (min === 0 || min === BigInt(0))
        range = `>= 0${n} and < 2${n} ** ${(byteLength2 + 1) * 8}${n}`;
      else
        range = `>= -(2${n} ** ${(byteLength2 + 1) * 8 - 1}${n}) and < 2 ** ${(byteLength2 + 1) * 8 - 1}${n}`;
    else
      range = `>= ${min}${n} and <= ${max}${n}`;
    throw new ERR_OUT_OF_RANGE("value", range, value);
  }
  checkBounds(buf, offset, byteLength2);
}
function validateNumber(value, name) {
  if (typeof value !== "number")
    throw new ERR_INVALID_ARG_TYPE(name, "number", value);
}
function boundsError(value, length, type) {
  if (Math.floor(value) !== value)
    throw validateNumber(value, type), new ERR_OUT_OF_RANGE(type || "offset", "an integer", value);
  if (length < 0)
    throw new ERR_BUFFER_OUT_OF_BOUNDS;
  throw new ERR_OUT_OF_RANGE(type || "offset", `>= ${type ? 1 : 0} and <= ${length}`, value);
}
var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
function base64clean(str) {
  if (str = str.split("=")[0], str = str.trim().replace(INVALID_BASE64_RE, ""), str.length < 2)
    return "";
  while (str.length % 4 !== 0)
    str = str + "=";
  return str;
}
function utf8ToBytes2(string, units) {
  units = units || 1 / 0;
  let codePoint, length = string.length, leadSurrogate = null, bytes = [];
  for (let i2 = 0;i2 < length; ++i2) {
    if (codePoint = string.charCodeAt(i2), codePoint > 55295 && codePoint < 57344) {
      if (!leadSurrogate) {
        if (codePoint > 56319) {
          if ((units -= 3) > -1)
            bytes.push(239, 191, 189);
          continue;
        } else if (i2 + 1 === length) {
          if ((units -= 3) > -1)
            bytes.push(239, 191, 189);
          continue;
        }
        leadSurrogate = codePoint;
        continue;
      }
      if (codePoint < 56320) {
        if ((units -= 3) > -1)
          bytes.push(239, 191, 189);
        leadSurrogate = codePoint;
        continue;
      }
      codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
    } else if (leadSurrogate) {
      if ((units -= 3) > -1)
        bytes.push(239, 191, 189);
    }
    if (leadSurrogate = null, codePoint < 128) {
      if ((units -= 1) < 0)
        break;
      bytes.push(codePoint);
    } else if (codePoint < 2048) {
      if ((units -= 2) < 0)
        break;
      bytes.push(codePoint >> 6 | 192, codePoint & 63 | 128);
    } else if (codePoint < 65536) {
      if ((units -= 3) < 0)
        break;
      bytes.push(codePoint >> 12 | 224, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
    } else if (codePoint < 1114112) {
      if ((units -= 4) < 0)
        break;
      bytes.push(codePoint >> 18 | 240, codePoint >> 12 & 63 | 128, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
    } else
      throw Error("Invalid code point");
  }
  return bytes;
}
function asciiToBytes(str) {
  let byteArray = [];
  for (let i2 = 0;i2 < str.length; ++i2)
    byteArray.push(str.charCodeAt(i2) & 255);
  return byteArray;
}
function utf16leToBytes(str, units) {
  let c, hi, lo, byteArray = [];
  for (let i2 = 0;i2 < str.length; ++i2) {
    if ((units -= 2) < 0)
      break;
    c = str.charCodeAt(i2), hi = c >> 8, lo = c % 256, byteArray.push(lo), byteArray.push(hi);
  }
  return byteArray;
}
function base64ToBytes(str) {
  return toByteArray(base64clean(str));
}
function blitBuffer(src, dst, offset, length) {
  let i2;
  for (i2 = 0;i2 < length; ++i2) {
    if (i2 + offset >= dst.length || i2 >= src.length)
      break;
    dst[i2 + offset] = src[i2];
  }
  return i2;
}
function isInstance(obj, type) {
  return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
}
var hexSliceLookupTable = function() {
  let table = Array(256);
  for (let i2 = 0;i2 < 16; ++i2) {
    let i16 = i2 * 16;
    for (let j = 0;j < 16; ++j)
      table[i16 + j] = "0123456789abcdef"[i2] + "0123456789abcdef"[j];
  }
  return table;
}();
function defineBigIntMethod(fn) {
  return typeof BigInt > "u" ? BufferBigIntNotDefined : fn;
}
function BufferBigIntNotDefined() {
  throw Error("BigInt not supported");
}
function notimpl(name) {
  return () => {
    throw Error(name + " is not implemented for node:buffer browser polyfill");
  };
}
var resolveObjectURL = notimpl("resolveObjectURL");
var isUtf8 = notimpl("isUtf8");
var transcode = notimpl("transcode");

// node_modules/cesr-ts/src/matter.ts
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

// node_modules/cesr-ts/src/diger.ts
class Diger extends Matter {
  _verify;
  constructor({ raw, code = MtrDex.Blake3_256, qb64, qb64b, qb2 }, ser = null) {
    try {
      super({ raw, code, qb64, qb64b, qb2 });
    } catch (error) {
      if (ser == null) {
        throw error;
      }
      if (code === MtrDex.Blake3_256) {
        const dig = blake32.create({}).update(ser).digest();
        super({ raw: dig, code });
      } else {
        throw new Error(`Unsupported code = ${code} for digester.`);
      }
    }
    if (code === MtrDex.Blake3_256) {
      this._verify = this.blake3_256;
    } else {
      throw new Error(`Unsupported code = ${code} for digester.`);
    }
  }
  verify(ser) {
    return this._verify(ser, this.raw);
  }
  compare(ser, dig = null, diger = null) {
    if (dig != null) {
      if (dig.toString() == this.qb64) {
        return true;
      }
      diger = new Diger({ qb64b: dig });
    } else if (diger != null) {
      if (diger.qb64b == this.qb64b) {
        return true;
      }
    } else {
      throw new Error("Both dig and diger may not be None.");
    }
    if (diger.code == this.code) {
      return false;
    }
    return diger.verify(ser) && this.verify(ser);
  }
  blake3_256(ser, dig) {
    const digest = blake32.create({}).update(ser).digest();
    return digest.toString() === dig.toString();
  }
}

// src/cesr/keys.ts
var exports_keys = {};
__export(exports_keys, {
  decodeKey: () => decodeKey,
  encodeKey: () => encodeKey
});
function encodeKey(publicKey, transferable = true) {
  const code = transferable ? MtrDex.Ed25519 : MtrDex.Ed25519N;
  const matter = new Matter({ raw: publicKey, code });
  return { algo: "ed25519", qb64: matter.qb64, raw: publicKey };
}
function decodeKey(qb64) {
  const matter = new Matter({ qb64 });
  if (matter.code === MtrDex.Ed25519 || matter.code === MtrDex.Ed25519N) {
    return { algo: "ed25519", qb64, raw: matter.raw };
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
  const decoded = decodeKey(verferQb64);
  const diger = new Diger({ code: algorithm }, decoded.raw);
  return diger.qb64;
}

// node_modules/json-canonicalize/esm5/serializer.js
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

// node_modules/json-canonicalize/esm5/canonicalize.js
function canonicalize(obj, allowCircular) {
  return _serialize(obj, {
    allowCircular,
    filterUndefined: true,
    undefinedInArrayToNull: true
  });
}

// src/common/canonical.ts
function canonical(obj) {
  return canonicalize(obj);
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

// node_modules/@noble/curves/utils.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function aarray(item, title, inner = () => {}) {
  if (!Array.isArray(item))
    throw new TypeError(`"${title}" expected array, got type=${typeof item}`);
  for (let i = 0;i < item.length; i++)
    inner(item[i], `${title}[${i}]`);
  return item;
}
var abytes3 = (value, length, title) => abytes(value, length, title);
var anumber3 = anumber;
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
var isBytes3 = isBytes;
var randomBytes2 = (bytesLength) => randomBytes(bytesLength);
var _0n = /* @__PURE__ */ BigInt(0);
var _1n = /* @__PURE__ */ BigInt(1);
var atitle2 = (title) => title ? `"${title}" ` : "";
function abool(value, title = "") {
  if (typeof value !== "boolean")
    throw new TypeError(atitle2(title) + "expected boolean, got type=" + typeof value);
  return value;
}
function abignumber(n) {
  if (typeof n === "bigint") {
    if (!isPosBig(n))
      throw new RangeError("positive bigint expected, got " + n);
  } else
    anumber3(n);
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
function hexToNumber(hex) {
  if (typeof hex !== "string")
    throw new TypeError("hex string expected, got " + typeof hex);
  return hex === "" ? _0n : BigInt("0x" + hex);
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
  return Uint8Array.from(abytes3(bytes));
}
function isPosBig(n) {
  return typeof n === "bigint" && _0n <= n;
}
function inRange(n, min, max) {
  return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
}
function aInRange(title, n, min, max) {
  if (!inRange(n, min, max))
    throw new RangeError("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
}
function bitLen(n) {
  if (n < _0n)
    throw new Error("expected non-negative bigint, got " + n);
  return n === _0n ? 0 : n.toString(2).length;
}
var bitMask = (n) => {
  asafenumber(n, "n");
  return (_1n << BigInt(n)) - _1n;
};
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
var _0n2 = /* @__PURE__ */ BigInt(0);
var _1n2 = /* @__PURE__ */ BigInt(1);
var _2n = /* @__PURE__ */ BigInt(2);
var _3n = /* @__PURE__ */ BigInt(3);
var _4n = /* @__PURE__ */ BigInt(4);
var _5n = /* @__PURE__ */ BigInt(5);
var _7n = /* @__PURE__ */ BigInt(7);
var _8n = /* @__PURE__ */ BigInt(8);
var _9n = /* @__PURE__ */ BigInt(9);
var _15n = /* @__PURE__ */ BigInt(15);
var _16n = /* @__PURE__ */ BigInt(16);
var POW_WINDOWED_MIN = /* @__PURE__ */ BigInt("0x10000000000000000");
function mod(a, b) {
  if (b <= _0n2)
    throw new Error("mod: expected positive modulus, got " + b);
  const result = a % b;
  return result >= _0n2 ? result : b + result;
}
function pow(num, power, modulo) {
  if (modulo <= _1n2)
    throw new Error("pow: expected modulus > 1, got " + modulo);
  if (typeof power !== "bigint")
    throw new TypeError("invalid exponent: expected bigint, got " + typeof power);
  if (power < _0n2)
    throw new Error("invalid exponent, negatives unsupported");
  if (power === _0n2)
    return _1n2;
  if (power === _1n2)
    return num;
  let d = num % modulo;
  if (d < _0n2)
    d += modulo;
  if (power < POW_WINDOWED_MIN) {
    let p = _1n2;
    while (power > _0n2) {
      if (power & _1n2)
        p = p * d % modulo;
      d = d * d % modulo;
      power >>= _1n2;
    }
    return p;
  }
  const digits = [];
  while (power > _0n2) {
    digits.push(Number(power & _15n));
    power >>= _4n;
  }
  const table = new Array(16);
  table[0] = _1n2;
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
  if (modulo <= _1n2)
    throw new Error("pow2: expected modulus > 1, got " + modulo);
  if (power < _0n2)
    throw new Error("pow2: expected non-negative exponent, got " + power);
  let res = x;
  while (power-- > _0n2) {
    res *= res;
    res %= modulo;
  }
  return res;
}
function invert(number, modulo) {
  if (number === _0n2)
    throw new Error("invert: expected non-zero number");
  if (modulo <= _1n2)
    throw new Error("invert: expected modulus > 1, got " + modulo);
  let a = mod(number, modulo);
  let b = modulo;
  let x = _0n2, u = _1n2;
  while (a !== _0n2) {
    const q = b / a;
    const r = b - a * q;
    const m = x - u * q;
    b = a, a = r, x = u, u = m;
  }
  const gcd = b;
  if (gcd !== _1n2)
    throw new Error("invert: does not exist");
  return mod(x, modulo);
}
function assertIsSquare(Fp, root, n) {
  const F = Fp;
  if (!F.eql(F.sqr(root), n))
    throw new Error("Cannot find square root");
}
function aoddModulus(order, fnName) {
  if ((order & _1n2) === _0n2)
    throw new Error(fnName + ": expected odd modulus, got " + order);
}
function sqrt3mod4(Fp, n) {
  const F = Fp;
  const p1div4 = (F.ORDER + _1n2) / _4n;
  const root = F.pow(n, p1div4);
  assertIsSquare(F, root, n);
  return root;
}
function sqrt5mod8(Fp, n) {
  const F = Fp;
  const p5div8 = (F.ORDER - _5n) / _8n;
  const n2 = F.mul(n, _2n);
  const v = F.pow(n2, p5div8);
  const nv = F.mul(n, v);
  const i = F.mul(F.mul(nv, _2n), v);
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
  const c4 = (P + _7n) / _16n;
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
  let Q = P - _1n2;
  let S = 0;
  while (Q % _2n === _0n2) {
    Q /= _2n;
    S++;
  }
  let Z = _2n;
  const _Fp = Field(P);
  while (FpLegendre(_Fp, Z) === 1) {
    if (Z++ > 1000)
      throw new Error("Cannot find square root: probably non-prime P");
  }
  if (S === 1)
    return sqrt3mod4;
  let cc = _Fp.pow(Z, Q);
  const Q1div2 = (Q + _1n2) / _2n;
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
      const exponent = _1n2 << BigInt(M - i - 1);
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
var isNegativeLE = (num, modulo) => (mod(num, modulo) & _1n2) === _1n2;
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
  if (field.ORDER <= _1n2)
    throw new Error("invalid field: expected ORDER > 1, got " + field.ORDER);
  return field;
}
function FpInvertBatch(Fp, nums, passZero = false) {
  validateField(Fp);
  aarray(nums, "nums");
  abool(passZero, "passZero");
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
  const p1mod2 = (F.ORDER - _1n2) / _2n;
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
    anumber3(nBitLength);
  if (n <= _0n2)
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
  ZERO = _0n2;
  ONE = _1n2;
  _lengths;
  _mod;
  constructor(ORDER, opts = {}) {
    if (ORDER <= _1n2)
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
    return _0n2 <= num && num < this.ORDER;
  }
  is0(num) {
    return num === _0n2;
  }
  isValidNot0(num) {
    return !this.is0(num) && this.isValid(num);
  }
  isOdd(num) {
    return (num & _1n2) === _1n2;
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
    abytes3(bytes);
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
    abool(condition, "condition");
    return condition ? b : a;
  }
}
function Field(ORDER, opts = {}) {
  Object.freeze(_Field.prototype);
  return new _Field(ORDER, opts);
}

// node_modules/@noble/curves/abstract/curve.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n3 = /* @__PURE__ */ BigInt(0);
var _1n3 = /* @__PURE__ */ BigInt(1);
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
    if (!isBytes3(probe) || probe.length !== length)
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
  while (n > _0n3) {
    let w = 0;
    if (n & _1n3) {
      w = Number(n & mask);
      if (w >= half)
        w -= size;
      n -= BigInt(w);
    }
    d.push(w);
    n >>= _1n3;
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
      n += _1n3;
    }
    d.push(v);
  }
  if (n !== _0n3)
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
    if (!inRange(scalar, _1n3, this.Point.Fn.ORDER))
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
    if (!isBytes3(blind) || blind.length !== BLIND_BYTES)
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
    if (cofactor === _1n3)
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
  abool(allowOversized, "allowOversized");
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
    if (!(isPosBig(val) && val !== _0n3))
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
var _0n4 = /* @__PURE__ */ BigInt(0);
var _1n4 = /* @__PURE__ */ BigInt(1);
var _2n2 = /* @__PURE__ */ BigInt(2);
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
  const MASK = _2n2 << BigInt(Fp.BYTES * 8) - _1n4;
  function isOdd(n) {
    if (!Fp.isOdd)
      throw new Error("Field does not have .isOdd()");
    return Fp.isOdd(n);
  }
  const uvRatio = opts.uvRatio === undefined ? (u, v) => {
    try {
      return { isValid: true, value: Fp.sqrt(Fp.div(u, v)) };
    } catch (e) {
      return { isValid: false, value: _0n4 };
    }
  } : opts.uvRatio;
  if (!isEdValidXY(Fp, CURVE, CURVE.Gx, CURVE.Gy))
    throw new Error("bad curve params: generator point");
  const mulA = Fp.eql(CURVE.a, Fp.neg(Fp.ONE)) ? (x) => Fp.neg(x) : Fp.eql(CURVE.a, Fp.ONE) ? (x) => x : (x) => Fp.mul(CURVE.a, x);
  function acoord(title, n, banZero = false) {
    const min = banZero ? _1n4 : _0n4;
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
      bytes = copyBytes2(abytes3(bytes, len, "point"));
      abool(zip215, "zip215");
      const normed = copyBytes2(bytes);
      const lastByte = bytes[len - 1];
      normed[len - 1] = lastByte & ~128;
      const y = bytesToNumberLE(normed);
      const max = zip215 ? MASK : Fp.ORDER;
      aInRange("point.y", y, _0n4, max);
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
        this.multiply(_2n2);
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
      const C = Fp.mul(Fp.sqr(Z1), _2n2);
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
      if (scalar === _0n4)
        return Point.ZERO;
      if (this.is0() || scalar === _1n4)
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
      if (cofactor === _1n4)
        return this;
      if (cofactor === _2n2)
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
    abool(phflag, "phflag");
    if (ctx.length || phflag)
      throw new Error("Contexts/pre-hash are not supported");
    return data;
  } : opts.domain;
  function modN_LE(hash) {
    return Fn.create(bytesToNumberLE(hash));
  }
  function getPrivateScalar(key) {
    const len = lengths.secretKey;
    abytes3(key, lengths.secretKey, "secretKey");
    const hashed = abytes3(hash(key), 2 * len, "hashedSecretKey");
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
    return modN_LE(hash(domain(msg, abytes3(context, undefined, "context"), !!prehash)));
  }
  function sign(msg, secretKey, options = {}) {
    validateObject(options, {}, {}, "options");
    msg = copyBytes2(abytes3(msg, undefined, "message"));
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
    return abytes3(rs, lengths.signature, "result");
  }
  const verifyOpts = {
    zip215: opts.zip215
  };
  function verify(sig, msg, publicKey, options = verifyOpts) {
    validateObject(options);
    const { context } = options;
    const zip215 = options.zip215 === undefined ? !!verifyOpts.zip215 : options.zip215;
    const len = lengths.signature;
    sig = abytes3(sig, len, "signature");
    msg = abytes3(msg, undefined, "message");
    publicKey = abytes3(publicKey, lengths.publicKey, "publicKey");
    if (zip215 !== undefined)
      abool(zip215, "zip215");
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
    return abytes3(seed, lengths.seed, "seed");
  }
  function isValidSecretKey(key) {
    return isBytes3(key) && key.length === lengths.secretKey;
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
var _0n5 = /* @__PURE__ */ BigInt(0);
var _1n5 = /* @__PURE__ */ BigInt(1);
var _2n3 = /* @__PURE__ */ BigInt(2);
function cmask(P, swap) {
  return P + swap - (swap >> _1n5 << _1n5);
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
  const minScalar = is25519 ? _2n3 ** BigInt(254) : _2n3 ** BigInt(447);
  const maxAdded = is25519 ? BigInt(8) * (_2n3 ** BigInt(251) - _1n5) : BigInt(4) * (_2n3 ** BigInt(445) - _1n5);
  const maxScalar = minScalar + maxAdded + _1n5;
  const modP = (n) => mod(n, P);
  const GuBytes = encodeU(Gu);
  function encodeU(u) {
    return numberToBytesLE(modP(u), fieldLen);
  }
  function decodeU(u) {
    const _u = copyBytes2(abytes3(u, fieldLen, "uCoordinate"));
    if (is25519)
      _u[31] &= 127;
    return modP(bytesToNumberLE(_u));
  }
  function decodeScalar(scalar) {
    return bytesToNumberLE(adjustScalarBytes(copyBytes2(abytes3(scalar, fieldLen, "scalar"))));
  }
  const lowOrderU = new Set(is25519 ? [
    _0n5,
    _1n5,
    P - _1n5,
    BigInt("325606250916557431795983626356110631294008115727848805560023387167927233504"),
    BigInt("39382357235489614581723060781553021112529911719440698176882885853963445705823")
  ] : [_0n5, _1n5, P - _1n5]);
  function scalarMult(scalar, u) {
    const pointU = decodeU(u);
    if (lowOrderU.has(pointU))
      throw new Error("invalid private or public key received");
    const pu = montgomeryLadder(pointU, decodeScalar(scalar));
    if (pu === _0n5)
      throw new Error("invalid private or public key received");
    return encodeU(pu);
  }
  function scalarMultBase(scalar) {
    if (mulBaseHook === undefined)
      return scalarMult(scalar, GuBytes);
    const k = decodeScalar(scalar);
    aInRange("scalar", k, minScalar, maxScalar);
    const pu = modP(mulBaseHook(k));
    if (pu === _0n5)
      throw new Error("invalid private or public key received");
    return encodeU(pu);
  }
  const getPublicKey = scalarMultBase;
  const getSharedSecret = scalarMult;
  function montgomeryLadder(u, scalar) {
    aInRange("u", u, _0n5, P);
    aInRange("scalar", scalar, minScalar, maxScalar);
    const k = scalar;
    const x_1 = u;
    let x_2 = _1n5;
    let z_2 = _0n5;
    let x_3 = u;
    let z_3 = _1n5;
    const kx = k ^ k >> _1n5;
    for (let t = BigInt(montgomeryBits - 1);t >= _0n5; t--) {
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
    abytes3(seed, lengths.seed, "seed");
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
var _0n6 = /* @__PURE__ */ BigInt(0);
var _1n6 = /* @__PURE__ */ BigInt(1);
var _2n4 = /* @__PURE__ */ BigInt(2);
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
  const b4 = pow2(b2, _2n4, P) * b2 % P;
  const b5 = pow2(b4, _1n6, P) * x % P;
  const b10 = pow2(b5, _5n2, P) * b5 % P;
  const b20 = pow2(b10, _10n, P) * b10 % P;
  const b40 = pow2(b20, _20n, P) * b20 % P;
  const b80 = pow2(b40, _40n, P) * b40 % P;
  const b160 = pow2(b80, _80n, P) * b80 % P;
  const b240 = pow2(b160, _80n, P) * b80 % P;
  const b250 = pow2(b240, _10n, P) * b10 % P;
  const pow_p_5_8 = pow2(b250, _2n4, P) * x % P;
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
  return Fp.toBytes(Fp.div(_1n6 + y, _1n6 - y));
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
      if (kn === _0n6)
        return _0n6;
      const p = ed25519_Point.BASE.multiply(kn);
      return mod((p.Z + p.Y) * powPminus2(mod(p.Z - p.Y, P)), P);
    }
  });
})();

// src/cesr/sigs.ts
var exports_sigs = {};
__export(exports_sigs, {
  decodeSig: () => decodeSig,
  encodeSig: () => encodeSig
});
function encodeSig(sig, transferable = true) {
  const code = transferable ? MtrDex.Ed25519_Sig : "0A";
  const matter = new Matter({ raw: sig, code });
  return { algo: "ed25519", qb64: matter.qb64, raw: sig };
}
function decodeSig(qb64) {
  const matter = new Matter({ qb64 });
  if (matter.code === MtrDex.Ed25519_Sig || matter.code === "0A") {
    return { algo: "ed25519", qb64, raw: matter.raw };
  }
  throw new Error(`Unsupported sig code: ${matter.code}`);
}

// src/signature/verify.ts
function verify(publicKey, signature, data) {
  try {
    const pubKeyBytes = decodeKey(publicKey).raw;
    const sigBytes = decodeSig(signature).raw;
    return ed25519.verify(sigBytes, data, pubKeyBytes);
  } catch {
    return false;
  }
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
function Hash2(value) {
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
      const hashed = Hash2(element);
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
      const hashed = Hash2(element);
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
var ThresholdExpressionPattern = "^[0-9]+(/[0-9]+)?$";
var ThresholdExpressionSchema = Type.String({
  title: "Threshold Expression",
  description: 'Number of signatures required as numeric string or fraction. Examples: "1" (simple), "2/3" (fractional M/N).',
  pattern: ThresholdExpressionPattern,
  examples: ["1", "2", "3", "1/1", "2/3", "3/5"]
});
var WeightedThresholdSchema = Type.Array(Type.Array(Type.String()), {
  title: "Weighted Threshold",
  description: 'Weighted threshold clauses with rational fractions. Each inner array is a clause. Example: [["1/2", "1/2", "1/4", "1/4"]]',
  examples: [[["1/2", "1/2"]], [["1/2", "1/2", "1/4", "1/4"]]]
});
var ThresholdSchema = Type.Union([ThresholdExpressionSchema, WeightedThresholdSchema], {
  title: "Threshold",
  description: "Threshold can be a simple/fractional expression (string) or weighted clauses (array of arrays)."
});
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

// src/acdc/index.ts
var Acdc = {
  ...ACDCData,
  ...ACDCOps
};
// src/cesr/attachments.ts
var exports_attachments = {};
__export(exports_attachments, {
  decodeAttachmentGroups: () => decodeAttachmentGroups,
  decodeAttachmentGroupsFromStream: () => decodeAttachmentGroupsFromStream,
  encodeAttachmentGroups: () => encodeAttachmentGroups
});

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
    const full = both + Buffer.from(bytes).toString("base64url").slice(ps - xizage.ls);
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
      const paw = Buffer.from(base, "base64url");
      const pi = readInt(paw.slice(0, ps));
      if (pi & 2 ** pbs - 1) {
        throw new Error(`Non zeroed prepad bits = {pi & (2 ** pbs - 1 ):<06b} in {qb64b[cs:cs+1]}.`);
      }
      raw = paw.slice(ps);
    } else {
      const base = qb64.slice(cs);
      const paw = Buffer.from(base, "base64url");
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
var textDecoder = new TextDecoder;
function decodeAttachmentGroupsFromStream(data) {
  if (data.length === 0)
    return { attachments: [], bytesConsumed: 0 };
  const text = textDecoder.decode(data);
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
      for (let i = 0;i < counter.count; i++) {
        if (pos >= text.length) {
          throw new Error(`Truncated: expected ${counter.count} indexed sigs, got ${i}`);
        }
        const { attachment, consumed } = decodeIndexedSig(text, pos);
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
  const bytesConsumed = textEncoder.encode(text.slice(0, pos)).length;
  return { attachments, bytesConsumed };
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
function decodeIndexedSig(text, pos) {
  let siger;
  try {
    siger = new Siger({ qb64: text.slice(pos) });
  } catch (e) {
    throw new Error(`Failed to parse indexed signature at position ${pos}: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (siger.code !== IdrDex.Ed25519_Sig && siger.code !== IdrDex.Ed25519_Big_Sig) {
    throw new Error(`Unsupported indexer code: ${siger.code}. Only Ed25519 indexed signatures are supported.`);
  }
  const sigMatter = new Matter({ raw: siger.raw, code: MtrDex.Ed25519_Sig });
  const sizage = Siger.Sizes.get(siger.code);
  if (!sizage || sizage.fs === undefined) {
    throw new Error(`Cannot determine size for indexer code: ${siger.code}`);
  }
  return {
    attachment: {
      kind: "sig",
      form: "indexed",
      keyIndex: siger.index,
      sig: sigMatter.qb64
    },
    consumed: sizage.fs
  };
}
function encodeIndexedSig(att) {
  const { keyIndex, sig } = att;
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
  const indexerCode = keyIndex < 64 ? IdrDex.Ed25519_Sig : IdrDex.Ed25519_Big_Sig;
  const siger = new Siger({
    raw: matter.raw,
    code: indexerCode,
    index: keyIndex,
    ondex: keyIndex
  });
  return siger.qb64;
}
function encodeReceiptCouple(att) {
  return att.by + att.sig;
}
function encodeTransReceiptQuadruple(att) {
  const { seal, sig, keyIndex } = att;
  const prefixQb64 = seal.i;
  const snNum = parseInt(seal.s, 10);
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
  const indexerCode = idx < 64 ? IdrDex.Ed25519_Sig : IdrDex.Ed25519_Big_Sig;
  const siger = new Siger({ raw: sigMatter.raw, code: indexerCode, index: idx, ondex: idx });
  return prefixQb64 + seqnerQb64 + digestQb64 + siger.qb64;
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
        s: String(sn),
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
  const snNum = parseInt(att.s, 10);
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
      s: String(sn),
      d: digest.matter.qb64
    },
    consumed: seqner.consumed + digest.consumed
  };
}

// src/cesr/prefix.ts
var exports_prefix = {};
__export(exports_prefix, {
  inspect: () => inspect
});
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

// src/cesr/types.ts
var exports_types = {};

// src/cesr/index.ts
var Cesr = {
  ...exports_types,
  ...exports_keys,
  ...exports_prefix,
  ...exports_sigs,
  ...exports_digest,
  ...exports_attachments
};
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
var MAX_INT32 = 2 ** 32;
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0), buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers)
    buf.set(buffer, i), i += buffer.length;
  return buf;
}
function writeUInt32BE(buf, value, offset) {
  if (value < 0 || value >= MAX_INT32)
    throw new RangeError(`value must be >= 0 and <= ${MAX_INT32 - 1}. Received ${value}`);
  buf.set([value >>> 24, value >>> 16, value >>> 8, value & 255], offset);
}
function uint64be(value) {
  const high = Math.floor(value / MAX_INT32), low = value % MAX_INT32, buf = new Uint8Array(8);
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
  } catch {
    throw new ErrorClass(`Failed to base64url decode the ${label}`);
  }
}
function encodeBase64url(value, label, ErrorClass) {
  try {
    return encode3(value);
  } catch {
    throw new ErrorClass(`The ${label} is not a valid base64url string`);
  }
}
function parseJoseHeader(b64, ErrorClass, message) {
  let parsed;
  try {
    parsed = JSON.parse(strictDecoder.decode(decode3(b64)));
  } catch {
    throw new ErrorClass(message);
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
  const { alg, secret } = entry, privateKey = usage === "decrypt" || usage === "sign";
  if (secret && key instanceof Uint8Array)
    return key;
  let normalized, keyObject;
  if (isObject(key)) {
    if (normalized = normalizeJwk(key), typeof normalized.kty != "string")
      throw invalidKeyType(alg, key, secret);
    if (!(secret ? normalized.kty === "oct" && typeof normalized.k == "string" : normalized.kty !== "oct" && (privateKey ? normalized.kty === "AKP" && typeof normalized.priv == "string" || typeof normalized.d == "string" : normalized.d === undefined && normalized.priv === undefined)))
      throw new TypeError(secret ? 'JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present' : `JSON Web Key for this operation must be a ${privateKey ? "private" : "public"} JWK`);
    if (jwkMatchesOp(entry, normalized, usage), normalized.kty === "oct")
      return decode3(normalized.k);
    if (!Object.isFrozen(key)) {
      const { key_ops } = key;
      Array.isArray(key_ops) && Object.freeze(key_ops), Object.freeze(key);
    }
  } else {
    if (!isKeyLike(key))
      throw invalidKeyType(alg, key, secret);
    const expectedType = secret ? "secret" : privateKey ? "private" : "public";
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
  const keySize = enc.cekBits >> 1, encKey = await crypto.subtle.importKey("raw", cek.subarray(keySize >> 3), "AES-CBC", false, [usage]), macKey = await crypto.subtle.importKey("raw", cek.subarray(0, keySize >> 3), {
    hash: `SHA-${keySize << 1}`,
    name: "HMAC"
  }, false, ["sign"]);
  return [encKey, macKey, keySize];
}
async function cbcHmacTag(macKey, macData, keySize) {
  return new Uint8Array((await crypto.subtle.sign("HMAC", macKey, macData)).slice(0, keySize >> 3));
}
async function cbcEncrypt(enc, plaintext, cek, iv, aad) {
  const [encKey, macKey, keySize] = await cbcKeySetup(enc, cek, "encrypt"), ciphertext = new Uint8Array(await crypto.subtle.encrypt({
    iv,
    name: "AES-CBC"
  }, encKey, plaintext)), macData = concat(aad, iv, ciphertext, uint64be(aad.length * 8)), tag = await cbcHmacTag(macKey, macData, keySize);
  return { ciphertext, tag, iv };
}
async function timingSafeEqual(a, b) {
  const algorithm = { name: "HMAC", hash: "SHA-256" }, key = await crypto.subtle.generateKey(algorithm, false, ["sign", "verify"]), aHmac = await crypto.subtle.sign(algorithm, key, a);
  return crypto.subtle.verify(algorithm, key, aHmac, b);
}
async function cbcDecrypt(enc, cek, ciphertext, iv, tag, aad) {
  const [encKey, macKey, keySize] = await cbcKeySetup(enc, cek, "decrypt"), macData = concat(aad, iv, ciphertext, uint64be(aad.length * 8)), expectedTag = await cbcHmacTag(macKey, macData, keySize);
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
function ecdh(mode) {
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
  "ECDH-ES": ecdh("direct-key-agreement"),
  "ECDH-ES+A128KW": ecdh("key-agreement-with-key-wrapping"),
  "ECDH-ES+A192KW": ecdh("key-agreement-with-key-wrapping"),
  "ECDH-ES+A256KW": ecdh("key-agreement-with-key-wrapping"),
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
  const salt = concat(encode3(alg), Uint8Array.of(0), p2s), keylen = parseInt(alg.slice(13, 16), 10), subtleAlg = {
    hash: `SHA-${alg.slice(8, 11)}`,
    iterations: p2c,
    name: "PBKDF2",
    salt
  }, cryptoKey = await rawKey(key, jweAlgorithm(alg).subtle, "deriveBits");
  return new Uint8Array(await crypto.subtle.deriveBits(subtleAlg, cryptoKey, keylen));
}
function lengthAndInput(input) {
  return concat(uint32be(input.length), input);
}
async function concatKdf(Z, L, OtherInfo) {
  const dkLen = L >> 3, hashLen = 32, reps = Math.ceil(dkLen / hashLen), dk = new Uint8Array(reps * hashLen);
  for (let i = 1;i <= reps; i++) {
    const hashResult = await digest("sha256", concat(uint32be(i), Z, OtherInfo));
    dk.set(hashResult, (i - 1) * hashLen);
  }
  return dk.slice(0, dkLen);
}
async function ecdhesDeriveKey(publicKey, privateKey, algorithm, keyLength, apu = new Uint8Array, apv = new Uint8Array) {
  checkEcdhCryptoKey(publicKey), checkEcdhCryptoKey(privateKey, "deriveBits");
  const otherInfo = concat(lengthAndInput(encode3(algorithm)), lengthAndInput(apu), lengthAndInput(apv), uint32be(keyLength)), Z = new Uint8Array(await crypto.subtle.deriveBits({
    name: publicKey.algorithm.name,
    public: publicKey
  }, privateKey, publicKey.algorithm.name === "X25519" ? 256 : Math.ceil(parseInt(publicKey.algorithm.namedCurve.slice(-3), 10) / 8) << 3));
  return concatKdf(Z, keyLength, otherInfo);
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
      const sharedSecret = await ecdhesDeriveKey(ephemeralPublicKey, key, direct ? enc.alg : alg, direct ? enc.cekBits : parseInt(alg.slice(-5, -2), 10), partyUInfo, partyVInfo);
      if (direct)
        return sharedSecret;
      key = sharedSecret;
      break;
    }
    case "RSA-OAEP":
      return assertCryptoKey(key), checkRsaKey(alg, key, "decrypt"), new Uint8Array(await crypto.subtle.decrypt("RSA-OAEP", key, encryptedKey));
    case "PBKDF2": {
      if (typeof joseHeader.p2c != "number")
        throw new JWEInvalid('JOSE Header "p2c" (PBES2 Count) missing or invalid');
      validateMaxPBES2Count(maxPBES2Count);
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
      let ephemeralKey;
      providedParameters.epk !== undefined ? ephemeralKey = await prepareKey(entry, providedParameters.epk, "decrypt") : ephemeralKey = (await crypto.subtle.generateKey(key.algorithm, true, ["deriveBits"])).privateKey;
      const subtle = crypto.subtle;
      let exportableEpk = ephemeralKey;
      if (!exportableEpk.extractable) {
        if (typeof subtle.getPublicKey != "function")
          throw new TypeError('CryptoKey for "epk" must be extractable');
        exportableEpk = await subtle.getPublicKey(ephemeralKey, []);
      }
      const { x, y, crv, kty } = await subtle.exportKey("jwk", exportableEpk), direct = mode === "direct-key-agreement", sharedSecret = await ecdhesDeriveKey(key, ephemeralKey, direct ? enc.alg : alg, direct ? enc.cekBits : parseInt(alg.slice(-5, -2), 10), apu, apv), epk = { x, crv, kty };
      if (kty === "EC" && (epk.y = y), parameters = { epk }, providedApu !== undefined && (parameters.apu = encode4(providedApu)), providedApv !== undefined && (parameters.apv = encode4(providedApv)), direct)
        return [sharedSecret, undefined, parameters];
      key = sharedSecret;
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
      throw new JWEInvalid("Decompressed plaintext exceeded the configured limit");
  }
  return concat(...chunks);
}
async function compress2(input) {
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
  let parsedProt;
  return encodedProtected !== undefined && (parsedProt = parseJoseHeader(encodedProtected, JWEInvalid, "JWE Protected Header is invalid")), [
    parsedProt,
    decodeBase64url(ciphertext, "ciphertext", JWEInvalid),
    iv !== undefined ? decodeBase64url(iv, "iv", JWEInvalid) : undefined,
    tag !== undefined ? decodeBase64url(tag, "tag", JWEInvalid) : undefined,
    encodeBase64url((encodedProtected ?? "") + (aad !== undefined ? `.${aad}` : ""), "aad", JWEInvalid)
  ];
}
function prepareDecrypt(options) {
  return [
    options && validateAlgorithms("keyManagementAlgorithms", options.keyManagementAlgorithms),
    options && validateAlgorithms("contentEncryptionAlgorithms", options.contentEncryptionAlgorithms),
    options?.crit,
    options?.maxPBES2Count,
    options?.maxDecompressedLength
  ];
}
async function decryptJWE(jwe, shared, key, token = shareJWE(jwe)) {
  const [parsedProt, ciphertext, iv, tag, additionalData] = token, { header, unprotected, aad } = jwe;
  let joseHeader;
  if (header !== undefined || unprotected !== undefined) {
    if (!isDisjoint(parsedProt, header, unprotected))
      throw new JWEInvalid("JWE Protected, JWE Unprotected Header, and JWE Per-Recipient Unprotected Header Parameter names must be disjoint");
    joseHeader = { ...parsedProt, ...header, ...unprotected };
  } else
    joseHeader = parsedProt ?? {};
  const [keyManagementAlgorithms, contentEncryptionAlgorithms, crit, maxPBES2Count, maxDecompressedLength] = shared, { encrypted_key: encodedKey } = jwe;
  validateCrit(JWEInvalid, JWE_RECOGNIZED, crit, parsedProt, joseHeader), validateZip(joseHeader, parsedProt);
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
  typeof key == "function" && (key = await key(parsedProt, jwe), resolvedKey = true);
  const algEntry = selected ?? jweAlgorithm(alg);
  isJWECEKTransport(algEntry) && encryptedKey === undefined && (encryptedKey = new Uint8Array);
  const k = await prepareKey(algEntry.mode === "direct-encryption" ? encEntry : algEntry, key, "decrypt");
  let plaintext;
  if (algEntry.mode === "integrated-encryption")
    plaintext = await algEntry.decrypt(k, encryptedKey, ciphertext, additionalData, parsedProt, joseHeader);
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
    plaintext = await decrypt(encryption, cek, ciphertext, iv, tag, additionalData);
  }
  if (joseHeader.zip === "DEF") {
    const decompressionLimit = maxDecompressedLength ?? 250000;
    if (decompressionLimit === 0)
      throw new JOSENotSupported('JWE "zip" (Compression Algorithm) Header Parameter is not supported.');
    if (decompressionLimit !== 1 / 0 && (!Number.isSafeInteger(decompressionLimit) || decompressionLimit < 1))
      throw new TypeError("maxDecompressedLength must be 0, a positive safe integer, or Infinity");
    plaintext = await decompress(plaintext, decompressionLimit).catch((cause) => {
      throw cause instanceof JWEInvalid ? cause : new JWEInvalid("Failed to decompress plaintext", { cause });
    });
  }
  return {
    plaintext,
    ...parsedProt && { protectedHeader: parsedProt },
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
  let shared, sharedJwe, token;
  try {
    shared = prepareDecrypt(options), sharedJwe = snapshotSharedJWE(jwe), token = shareJWE(sharedJwe);
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
  const protectedHeaderS = protectedHeader ? encode4(JSON.stringify(protectedHeader)) : "", aadMember = aad?.byteLength ? encode4(aad) : undefined, additionalData = encode3(aadMember ? `${protectedHeaderS}.${aadMember}` : protectedHeaderS);
  let plaintext = inputPlaintext;
  joseHeader.zip === "DEF" && (plaintext = await compress2(plaintext).catch((cause) => {
    throw new JWEInvalid("Failed to compress plaintext", { cause });
  }));
  let ciphertext, tag, iv;
  algEntry.mode === "integrated-encryption" ? [encryptedKey, ciphertext] = await algEntry.encrypt(cek, plaintext, additionalData, protectedHeader, joseHeader, keyManagementParameters) : { ciphertext, tag, iv } = await encrypt(encEntry, plaintext, cek, inputIv, additionalData);
  const jwe = {
    ciphertext: encode4(ciphertext)
  };
  return iv && (jwe.iv = encode4(iv)), tag && (jwe.tag = encode4(tag)), encryptedKey?.byteLength && (jwe.encrypted_key = encode4(encryptedKey)), aadMember && (jwe.aad = aadMember), protectedHeader && (jwe.protected = protectedHeaderS), sharedUnprotectedHeader && (jwe.unprotected = sharedUnprotectedHeader), unprotectedHeader && (jwe.header = unprotectedHeader), jwe;
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
  #unprotectedHeader;
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
    return assertNotSet(this.#unprotectedHeader, "setSharedUnprotectedHeader"), this.#unprotectedHeader = sharedUnprotectedHeader, this;
  }
  setAdditionalAuthenticatedData(aad) {
    return this.#aad = aad, this;
  }
  async encrypt() {
    if (!this.#recipients.length)
      throw new JWEInvalid("at least one recipient must be added");
    assertUint8Array(this.#plaintext, "plaintext");
    const multiple = this.#recipients.length > 1;
    let enc, protectedHeader = this.#protectedHeader, sharedUnprotectedHeader = this.#unprotectedHeader;
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
function hmac(bits) {
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
function ecdsa(crv, bits) {
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
function mldsa(bits) {
  const subtle = { name: `ML-DSA-${bits}` };
  return {
    kty: ["AKP"],
    subtle,
    signing: subtle,
    usages: sig
  };
}
var JWS = table({
  HS256: hmac(256),
  HS384: hmac(384),
  HS512: hmac(512),
  RS256: rsa(256),
  RS384: rsa(384),
  RS512: rsa(512),
  PS256: rsa(256, 32),
  PS384: rsa(384, 48),
  PS512: rsa(512, 64),
  ES256: ecdsa("P-256", 256),
  ES384: ecdsa("P-384", 384),
  ES512: ecdsa("P-521", 512),
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
var hmac2 = /* @__PURE__ */ (() => {
  const hmac_ = (hash, key, message) => new _HMAC(hash, key).update(message).digest();
  hmac_.create = (hash, key) => new _HMAC(hash, key);
  return hmac_;
})();

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
  const { iHash, oHash } = hmac2.create(hash, prk);
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
  const HMAC = hmac2.create(hash, salt).update(ikm);
  return expand(hash, HMAC.digest(), info, length, HMAC);
};

// src/crypto/hkdf.ts
function hkdfBlake3(ikm, salt, info, length) {
  return hkdf(blake3, ikm, salt, info, length);
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
// src/kel/event-signing.ts
var exports_event_signing = {};
__export(exports_event_signing, {
  encodeEventBytes: () => encodeEventBytes,
  signCesrEventWithSigner: () => signCesrEventWithSigner
});
function encodeEventBytes(event, encoding = "JSON") {
  if (encoding !== "JSON") {
    throw new Error(`Encoding ${encoding} not yet supported. Only JSON is currently implemented.`);
  }
  return canonicalizeEvent(event);
}
async function signCesrEventWithSigner(env, signer, aid, keyIndex = 0) {
  const eventBytes = encodeEventBytes(env.event, env.enc);
  const signature = await signer.signBytes(eventBytes);
  const sigAttachment = {
    kind: "sig",
    form: "indexed",
    signerAid: aid,
    keyIndex,
    sig: signature
  };
  return {
    ...env,
    attachments: [...env.attachments, sigAttachment]
  };
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
      kt: params.signingThreshold ?? "1",
      k: params.keys,
      nt: params.nextThreshold ?? params.signingThreshold ?? "1",
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
      kt: params.signingThreshold ?? "1",
      k: params.keys,
      nt: params.nextThreshold ?? params.signingThreshold ?? "1",
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
      s: params.sequence,
      p: params.priorEventSaid,
      kt: params.signingThreshold,
      k: params.keys,
      nt: params.nextThreshold,
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
      s: params.sequence,
      p: params.priorEventSaid,
      kt: params.signingThreshold,
      k: params.keys,
      nt: params.nextThreshold,
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
      s: params.sequence,
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
    return String(Number.parseInt(priorSeq, 10) + 1);
  }
  KELEvents.nextSequence = nextSequence;
  function assembleSignedEvent(params) {
    const attachments = params.signatures.map((s) => ({
      kind: "sig",
      form: "indexed",
      keyIndex: s.keyIndex,
      sig: s.sig
    }));
    return {
      event: params.event,
      attachments,
      enc: "JSON",
      ...params.bytesB64 !== undefined ? { bytesB64: params.bytesB64 } : {}
    };
  }
  KELEvents.assembleSignedEvent = assembleSignedEvent;
})(KELEvents ||= {});
// src/kel/predicates.ts
var exports_predicates = {};
__export(exports_predicates, {
  isDip: () => isDip,
  isDrt: () => isDrt,
  isEstablishment: () => isEstablishment,
  isIcp: () => isIcp,
  isIxn: () => isIxn,
  isRot: () => isRot
});
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
function isEstablishment(e) {
  return e.t === "icp" || e.t === "rot" || e.t === "dip" || e.t === "drt";
}

// src/kel/rotation.ts
var exports_rotation = {};
__export(exports_rotation, {
  assertCurrentThresholdSatisfiable: () => assertCurrentThresholdSatisfiable,
  assertKeyRevelation: () => assertKeyRevelation,
  buildNextCommitment: () => buildNextCommitment,
  matchKeyRevelation: () => matchKeyRevelation,
  resolveCurrentKeys: () => resolveCurrentKeys
});

// src/kel/threshold.ts
var exports_threshold = {};
__export(exports_threshold, {
  checkThreshold: () => checkThreshold,
  parseSimpleThreshold: () => parseSimpleThreshold,
  resolveThresholdValue: () => resolveThresholdValue,
  validateThreshold: () => validateThreshold,
  validateThresholdSpec: () => validateThresholdSpec,
  validateWeightedThreshold: () => validateWeightedThreshold
});
function parseSimpleThreshold(expr, n) {
  if (!expr)
    return 1;
  if (expr.includes("/")) {
    const parts = expr.split("/");
    if (parts.length !== 2) {
      throw new Error(`Invalid threshold "${expr}": expected "numerator/denominator"`);
    }
    const numerator = Number(parts[0]);
    const denominator = Number(parts[1]);
    if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
      throw new Error(`Invalid threshold "${expr}": numerator and denominator must be integers`);
    }
    if (denominator !== n) {
      throw new Error(`Invalid threshold "${expr}" for N=${n}: denominator must equal cardinality (got ${denominator}, expected ${n})`);
    }
    if (numerator < 1 || numerator > n) {
      throw new Error(`Invalid threshold "${expr}": numerator must be between 1 and ${n}`);
    }
    return numerator;
  }
  const t = Number(expr);
  if (!Number.isInteger(t)) {
    throw new Error(`Invalid threshold "${expr}": must be an integer`);
  }
  if (t < 1 || t > n) {
    throw new Error(`Invalid threshold "${expr}" for N=${n}: must be between 1 and ${n}`);
  }
  return t;
}
function validateThreshold(threshold, n, fieldName) {
  if (Array.isArray(threshold)) {
    if (threshold.length === 0) {
      throw new Error(`${fieldName}: weighted threshold must have at least one clause`);
    }
    for (let clauseIndex = 0;clauseIndex < threshold.length; clauseIndex++) {
      const clause = threshold[clauseIndex];
      if (!Array.isArray(clause)) {
        throw new Error(`${fieldName}: clause ${clauseIndex} must be an array of weight strings`);
      }
      if (clause.length !== n) {
        throw new Error(`${fieldName}: clause ${clauseIndex} has ${clause.length} weights but there are ${n} keys. Clause length must equal key count.`);
      }
      for (let i = 0;i < clause.length; i++) {
        const weight = clause[i];
        if (typeof weight !== "string") {
          throw new Error(`${fieldName}: clause ${clauseIndex} weight ${i} must be a string, got ${typeof weight}`);
        }
        const parts = weight.split("/");
        if (parts.length !== 2) {
          throw new Error(`${fieldName}: clause ${clauseIndex} weight ${i} "${weight}" is invalid. Expected format: "numerator/denominator"`);
        }
        const numerator = Number(parts[0]);
        const denominator = Number(parts[1]);
        if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
          throw new Error(`${fieldName}: clause ${clauseIndex} weight ${i} "${weight}" must have integer numerator and denominator`);
        }
        if (denominator === 0) {
          throw new Error(`${fieldName}: clause ${clauseIndex} weight ${i} "${weight}" has zero denominator`);
        }
        if (numerator < 0 || denominator < 0) {
          throw new Error(`${fieldName}: clause ${clauseIndex} weight ${i} "${weight}" must have non-negative numerator and denominator`);
        }
      }
    }
  } else if (typeof threshold === "string") {
    try {
      parseSimpleThreshold(threshold, n);
    } catch (error) {
      throw new Error(`${fieldName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    throw new Error(`${fieldName}: invalid type ${typeof threshold}. Expected string or array of arrays.`);
  }
}
function validateWeightedThreshold(clauses, n, fieldName) {
  if (clauses.length === 0) {
    throw new Error(`${fieldName}: weighted threshold must have at least one clause`);
  }
  for (let clauseIndex = 0;clauseIndex < clauses.length; clauseIndex++) {
    const clause = clauses[clauseIndex];
    if (!Array.isArray(clause)) {
      throw new Error(`${fieldName}: clause ${clauseIndex} must be an array of weight strings`);
    }
    if (clause.length !== n) {
      throw new Error(`${fieldName}: clause ${clauseIndex} has ${clause.length} weights but there are ${n} keys. Clause length must equal key count.`);
    }
    for (let i = 0;i < clause.length; i++) {
      const weight = clause[i];
      if (typeof weight !== "string") {
        throw new Error(`${fieldName}: clause ${clauseIndex} weight ${i} must be a string, got ${typeof weight}`);
      }
      const parts = weight.split("/");
      if (parts.length !== 2) {
        throw new Error(`${fieldName}: clause ${clauseIndex} weight ${i} "${weight}" is invalid. Expected format: "numerator/denominator"`);
      }
      const numerator = Number(parts[0]);
      const denominator = Number(parts[1]);
      if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
        throw new Error(`${fieldName}: clause ${clauseIndex} weight ${i} "${weight}" must have integer numerator and denominator`);
      }
      if (denominator === 0) {
        throw new Error(`${fieldName}: clause ${clauseIndex} weight ${i} "${weight}" has zero denominator`);
      }
      if (numerator < 0 || denominator < 0) {
        throw new Error(`${fieldName}: clause ${clauseIndex} weight ${i} "${weight}" must have non-negative numerator and denominator`);
      }
    }
  }
}
function validateThresholdSpec(threshold, n, fieldName) {
  if (Array.isArray(threshold)) {
    validateWeightedThreshold(threshold, n, fieldName);
  } else if (typeof threshold === "string") {
    parseSimpleThreshold(threshold, n);
  } else {
    throw new Error(`${fieldName}: invalid type ${typeof threshold}. Expected string or array of arrays.`);
  }
}
function resolveThresholdValue(threshold, n) {
  if (!threshold)
    return 1;
  if (Array.isArray(threshold)) {
    validateWeightedThreshold(threshold, n, "threshold");
    return threshold;
  }
  return parseSimpleThreshold(threshold, n);
}
function parseFraction(str) {
  const parts = str.trim().split("/");
  if (parts.length !== 2) {
    throw new Error(`Invalid fraction format: "${str}". Expected format: "numerator/denominator"`);
  }
  const numerator = Number.parseInt(parts[0], 10);
  const denominator = Number.parseInt(parts[1], 10);
  if (Number.isNaN(numerator) || Number.isNaN(denominator)) {
    throw new Error(`Invalid fraction: "${str}". Numerator and denominator must be integers.`);
  }
  if (denominator === 0) {
    throw new Error(`Invalid fraction: "${str}". Denominator cannot be zero.`);
  }
  if (numerator < 0 || denominator < 0) {
    throw new Error(`Invalid fraction: "${str}". Numerator and denominator must be non-negative.`);
  }
  return { numerator, denominator };
}
function fractionToDecimal(fraction) {
  return fraction.numerator / fraction.denominator;
}
function addFractions(a, b) {
  const numerator = a.numerator * b.denominator + b.numerator * a.denominator;
  const denominator = a.denominator * b.denominator;
  return { numerator, denominator };
}
function checkSimpleThreshold(threshold, signedIndices, totalKeys) {
  if (threshold < 0) {
    throw new Error(`Invalid threshold: ${threshold}. Threshold must be non-negative.`);
  }
  if (threshold > totalKeys) {
    throw new Error(`Invalid threshold: ${threshold} exceeds total keys ${totalKeys}. Threshold cannot exceed cardinality.`);
  }
  const collected = signedIndices.size;
  const satisfied = collected >= threshold;
  return {
    satisfied,
    required: threshold,
    collected,
    type: "simple"
  };
}
function checkWeightedThreshold(clauses, signedIndices, totalKeys) {
  if (clauses.length === 0) {
    throw new Error("Weighted threshold must have at least one clause");
  }
  const clauseDetails = [];
  let allClausesSatisfied = true;
  for (let clauseIndex = 0;clauseIndex < clauses.length; clauseIndex++) {
    const clause = clauses[clauseIndex];
    if (clause.length !== totalKeys) {
      throw new Error(`Clause ${clauseIndex} has ${clause.length} weights but there are ${totalKeys} keys. Clause length must equal key count.`);
    }
    let weightSum = { numerator: 0, denominator: 1 };
    for (const keyIndex of signedIndices) {
      if (keyIndex >= clause.length) {
        throw new Error(`Key index ${keyIndex} exceeds clause length ${clause.length}`);
      }
      const weightStr = clause[keyIndex];
      const weight = parseFraction(weightStr);
      weightSum = addFractions(weightSum, weight);
    }
    const weightDecimal = fractionToDecimal(weightSum);
    const clauseSatisfied = weightDecimal >= 1;
    clauseDetails.push({
      clauseIndex,
      required: 1,
      collected: weightDecimal,
      satisfied: clauseSatisfied
    });
    if (!clauseSatisfied) {
      allClausesSatisfied = false;
    }
  }
  return {
    satisfied: allClausesSatisfied,
    required: "1.0 per clause",
    collected: `${clauseDetails.filter((c) => c.satisfied).length}/${clauses.length} clauses`,
    type: "weighted",
    clauseDetails
  };
}
function checkThreshold(threshold, signedIndices, totalKeys) {
  if (totalKeys <= 0) {
    throw new Error(`Invalid totalKeys: ${totalKeys}. Must be positive.`);
  }
  const signedSet = Array.isArray(signedIndices) ? new Set(signedIndices) : signedIndices;
  for (const index of signedSet) {
    if (index < 0 || index >= totalKeys) {
      throw new Error(`Invalid key index: ${index}. Must be in range [0, ${totalKeys - 1}]`);
    }
  }
  if (typeof threshold === "number") {
    return checkSimpleThreshold(threshold, signedSet, totalKeys);
  }
  if (typeof threshold === "string") {
    const thresholdNum = Number.parseInt(threshold, 10);
    if (Number.isNaN(thresholdNum)) {
      throw new Error(`Invalid threshold string: "${threshold}". Expected integer or weighted array.`);
    }
    return checkSimpleThreshold(thresholdNum, signedSet, totalKeys);
  }
  if (Array.isArray(threshold)) {
    return checkWeightedThreshold(threshold, signedSet, totalKeys);
  }
  throw new Error(`Invalid threshold type: ${typeof threshold}. Expected number, string, or array.`);
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
  const digestToNIndex = new Map;
  for (let i = 0;i < priorN.length; i++) {
    digestToNIndex.set(priorN[i], i);
  }
  const revealed = [];
  const augmented = [];
  const matchedNIndices = new Set;
  for (let kIdx = 0;kIdx < proposedK.length; kIdx++) {
    const keyDigest = digestVerfer(proposedK[kIdx]);
    const nIdx = digestToNIndex.get(keyDigest);
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
  let priorNtSatisfied = false;
  if (matchedIndices.length > 0) {
    const thresholdResult = checkThreshold(priorNt, matchedIndices, priorN.length);
    priorNtSatisfied = thresholdResult.satisfied;
  }
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
function assertCurrentThresholdSatisfiable(kt, kLength) {
  const numericKt = typeof kt === "string" ? Number.parseInt(kt, 10) : Number.NaN;
  if (!Number.isNaN(numericKt) && numericKt > kLength) {
    throw new Error(`Current threshold not satisfiable: kt=${kt} but only ${kLength} signing keys provided`);
  }
}
function buildNextCommitment(nextPublicKeys, nextThreshold) {
  const n = nextPublicKeys.map((key) => digestVerfer(key));
  return { n, nt: nextThreshold };
}

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
  const targetSn = parseInt(sealSource.s, 10);
  const parentEvent = parentKel.find((e) => parseInt(String(e.event.s), 10) === targetSn);
  if (!parentEvent) {
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
  const hasAnchor = anchors.some((anchor) => anchor.i === event.i && anchor.s === String(event.s) && anchor.d === event.d);
  if (!hasAnchor) {
    return { passed: false, parentAid, reason: "anchor-seal-missing" };
  }
  return { passed: true, parentAid };
}
function verifyParentEventSignatures(parentEvent, parentKel, targetSn) {
  const establishmentTypes = new Set(["icp", "rot", "dip", "drt"]);
  let establishment;
  for (const e of parentKel) {
    const sn = parseInt(String(e.event.s), 10);
    if (sn > targetSn)
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
  const kt = estEvent.kt ?? "1";
  const threshold = parseInt(kt, 10);
  if (Number.isNaN(threshold))
    return sigs.length > 0;
  return sigs.length >= threshold;
}

// src/kel/threshold-normalize.ts
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}
function lcm(a, b) {
  return a / gcd(a, b) * b;
}
function parseFractionStr(str) {
  const parts = str.trim().split("/");
  if (parts.length !== 2) {
    throw new Error(`Invalid fraction: "${str}"`);
  }
  const numerator = Number.parseInt(parts[0], 10);
  const denominator = Number.parseInt(parts[1], 10);
  if (Number.isNaN(numerator) || Number.isNaN(denominator)) {
    throw new Error(`Invalid fraction: "${str}"`);
  }
  if (denominator === 0) {
    throw new Error(`Zero denominator in fraction: "${str}"`);
  }
  if (numerator < 0 || denominator < 0) {
    throw new Error(`Negative value in fraction: "${str}"`);
  }
  return { numerator, denominator };
}
function normalizeThreshold(raw, keyCount) {
  if (Array.isArray(raw)) {
    if (raw.length === 0) {
      throw new Error("Weighted threshold must have at least one clause");
    }
    const clauses = [];
    for (let ci = 0;ci < raw.length; ci++) {
      const clause = raw[ci];
      if (!Array.isArray(clause)) {
        throw new Error(`Clause ${ci} must be an array`);
      }
      if (clause.length !== keyCount) {
        throw new Error(`Clause ${ci} has ${clause.length} weights but there are ${keyCount} keys`);
      }
      const weights = clause.map((w) => parseFractionStr(w));
      clauses.push({ weights });
    }
    return { type: "weighted", clauses };
  }
  if (typeof raw === "string") {
    if (raw.includes("/")) {
      const parts = raw.split("/");
      if (parts.length !== 2)
        throw new Error(`Invalid threshold: "${raw}"`);
      const m = Number.parseInt(parts[0], 10);
      const n = Number.parseInt(parts[1], 10);
      if (Number.isNaN(m) || Number.isNaN(n))
        throw new Error(`Invalid threshold: "${raw}"`);
      if (n !== keyCount) {
        throw new Error(`Threshold denominator ${n} !== key count ${keyCount}`);
      }
      if (m < 1 || m > n)
        throw new Error(`Threshold ${m} out of range [1, ${n}]`);
      return { type: "simple", m, n };
    }
    const m = Number.parseInt(raw, 10);
    if (Number.isNaN(m))
      throw new Error(`Invalid threshold: "${raw}"`);
    if (m < 1 || m > keyCount)
      throw new Error(`Threshold ${m} out of range [1, ${keyCount}]`);
    return { type: "simple", m, n: keyCount };
  }
  throw new Error(`Invalid threshold type: ${typeof raw}`);
}
function checkNormalizedThreshold(threshold, signedIndices) {
  if (threshold.type === "simple") {
    const collected = signedIndices.size;
    return {
      satisfied: collected >= threshold.m,
      type: "simple",
      required: threshold.m,
      collected
    };
  }
  const clauseDetails = [];
  let allSatisfied = true;
  for (let ci = 0;ci < threshold.clauses.length; ci++) {
    const clause = threshold.clauses[ci];
    let lcd = 1;
    for (const w of clause.weights)
      lcd = lcm(lcd, w.denominator);
    let sumNumerator = 0;
    for (const idx of signedIndices) {
      if (idx < clause.weights.length) {
        const w = clause.weights[idx];
        sumNumerator += w.numerator * (lcd / w.denominator);
      }
    }
    const satisfied = sumNumerator >= lcd;
    const sum = sumNumerator / lcd;
    clauseDetails.push({ clauseIndex: ci, required: 1, collected: sum, satisfied });
    if (!satisfied)
      allSatisfied = false;
  }
  return {
    satisfied: allSatisfied,
    type: "weighted",
    required: "1.0 per clause",
    collected: `${clauseDetails.filter((c) => c.satisfied).length}/${threshold.clauses.length}`,
    clauseDetails
  };
}

// src/kel/kel-state.ts
function isEstablishment2(event) {
  return event.t === "icp" || event.t === "rot" || event.t === "dip" || event.t === "drt";
}
function isInception(event) {
  return event.t === "icp" || event.t === "dip";
}
function tryNormalize(raw, keyCount) {
  if (!raw) {
    return {
      threshold: { type: "simple", m: 1, n: keyCount },
      note: { code: "unparseable-threshold", message: "Missing threshold, defaulting to 1" }
    };
  }
  try {
    return { threshold: normalizeThreshold(raw, keyCount) };
  } catch (e) {
    return {
      threshold: { type: "simple", m: 1, n: keyCount },
      note: {
        code: "unparseable-threshold",
        message: `Failed to parse threshold: ${e instanceof Error ? e.message : String(e)}`
      }
    };
  }
}
function reduceKelState(events) {
  if (events.length === 0)
    return [];
  const states = [];
  let kelAid = "";
  let signingKeys = [];
  let signingThreshold = { type: "simple", m: 1, n: 1 };
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
    if (isEstablishment2(event)) {
      signingKeys = event.k ?? [];
      const keyCount = signingKeys.length || 1;
      const { threshold, note } = tryNormalize(event.kt, keyCount);
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
      expectedSequence: String(i),
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

// src/kel/validation-predicates.ts
var exports_validation_predicates = {};
__export(exports_validation_predicates, {
  eventContainsAnchorForSaid: () => eventContainsAnchorForSaid,
  isDelegationAnchor: () => isDelegationAnchor,
  verifyVrcAgainstThreshold: () => verifyVrcAgainstThreshold,
  verifyWitnessReceipt: () => verifyWitnessReceipt
});
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
  let thresholdMet = false;
  try {
    const normalized = normalizeThreshold(parentEstablishment.kt, parentEstablishment.k.length);
    const thresholdResult = checkNormalizedThreshold(normalized, validKeyIndices);
    thresholdMet = thresholdResult.satisfied;
  } catch {
    thresholdMet = false;
  }
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
function validateSignaturesWithDetails(cesrEvent, keys) {
  const event = cesrEvent.event;
  const sigAttachments = getSignatureAttachments(cesrEvent);
  const details = [];
  const validKeyIndices = new Set;
  let allValid = true;
  for (const sigAtt of sigAttachments) {
    const keyIndex = typeof sigAtt.keyIndex === "number" ? sigAtt.keyIndex : parseInt(sigAtt.keyIndex, 10);
    if (keyIndex < 0 || keyIndex >= keys.length) {
      details.push({
        keyIndex,
        publicKey: "unknown",
        valid: false,
        error: `Key index ${keyIndex} out of range (0-${keys.length - 1})`
      });
      allValid = false;
      continue;
    }
    const publicKey = keys[keyIndex];
    let isValid = false;
    let verifyError;
    try {
      isValid = verifyEventSignature(event, publicKey, sigAtt.sig);
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
    } else {
      allValid = false;
    }
  }
  return { details, allValid, validKeyIndices };
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
function validateDelegationWithDetails(cesrEvent, parentKel) {
  const result = validateDelegation({
    childEvent: cesrEvent,
    parentKel
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
    const validTypes = ["icp", "rot", "ixn", "dip", "drt"];
    const typeValid = validTypes.includes(event.t);
    let typeError;
    if (!typeValid) {
      typeError = `Invalid event type '${event.t}'. Must be one of: ${validTypes.join(", ")}`;
    }
    checks.isValidKeriEvent = { passed: typeValid, error: typeError };
    if (!typeValid && !firstError) {
      firstError = {
        code: "MISSING_REQUIRED_FIELD",
        scope: "event",
        severity: "error",
        message: typeError ?? "Invalid KERI event type",
        eventIndex: i
      };
      overallValid = false;
    }
    const computedSaid = computeEventSaid(event);
    const saidMatches = computedSaid === event.d;
    checks.saidValid = {
      passed: saidMatches,
      expected: computedSaid,
      actual: event.d,
      error: saidMatches ? undefined : `SAID mismatch: expected ${computedSaid}, got ${event.d}`
    };
    if (!saidMatches && !firstError) {
      firstError = {
        code: "SAID_MISMATCH",
        scope: "event",
        severity: "error",
        message: `SAID mismatch for event ${i}`,
        eventIndex: i
      };
      overallValid = false;
    }
    if (saidMatches && (event.t === "icp" || event.t === "dip") && event.i !== event.d) {
      if (!firstError) {
        firstError = {
          code: "AID_DERIVATION_INVALID",
          scope: "event",
          severity: "error",
          message: `AID derivation invalid at event ${i}: i=${event.i} but d=${event.d} (must be equal for inception events)`,
          eventIndex: i
        };
      }
      overallValid = false;
    }
    const requiredResult = checkRequiredFields(event);
    checks.requiredFieldsPresent = {
      passed: requiredResult.passed,
      missing: requiredResult.missing,
      error: requiredResult.passed ? undefined : `Missing required fields: ${requiredResult.missing?.join(", ")}`
    };
    if (!requiredResult.passed && !firstError) {
      firstError = {
        code: "MISSING_REQUIRED_FIELD",
        scope: "event",
        severity: "error",
        message: `Missing required fields in event ${i}: ${requiredResult.missing?.join(", ")}`,
        eventIndex: i
      };
      overallValid = false;
    }
    const previousEvent = i > 0 ? events[i - 1]?.event : undefined;
    const prevEventResult = validatePreviousEventLink(event, previousEvent);
    checks.previousEventValid = prevEventResult;
    if (!prevEventResult.passed && !firstError) {
      firstError = {
        code: "PREVIOUS_EVENT_MISMATCH",
        scope: "chain",
        severity: "error",
        message: prevEventResult.error ?? `Previous event link invalid in event ${i}`,
        eventIndex: i
      };
      overallValid = false;
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
    const sigResult = typeValid ? validateSignaturesWithDetails(cesrEvent, keys) : { details: [], allValid: false, validKeyIndices: new Set };
    if (typeValid) {
      checks.signaturesValid = {
        passed: sigResult.allValid,
        details: sigResult.details,
        error: sigResult.allValid ? undefined : "One or more signatures failed verification"
      };
      if (!sigResult.allValid && !firstError) {
        const firstInvalid = sigResult.details.find((d) => !d.valid);
        firstError = {
          code: "SIGNATURE_INVALID",
          scope: "attachment",
          severity: "error",
          message: `Signature at index ${firstInvalid?.keyIndex ?? "unknown"} is invalid`,
          eventIndex: i
        };
        overallValid = false;
      }
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
        const normalizedResult = checkNormalizedThreshold(state.signingThreshold, sigResult.validKeyIndices);
        thresholdMet = normalizedResult.satisfied;
      } else {
        try {
          const thresholdSpec = threshold;
          const thresholdResult = checkThreshold(thresholdSpec, Array.from(sigResult.validKeyIndices), keys.length);
          thresholdMet = thresholdResult.satisfied;
        } catch {
          thresholdMet = false;
        }
      }
    }
    checks.thresholdMet = {
      passed: thresholdMet,
      required: typeof threshold === "string" ? threshold : JSON.stringify(threshold),
      validSignatureCount: sigResult.validKeyIndices.size,
      error: typeValid ? thresholdMet ? undefined : `Threshold not met: ${sigResult.validKeyIndices.size} valid signatures` : typeError ?? "Cannot verify threshold for invalid event type"
    };
    if (typeValid && !thresholdMet && !firstError) {
      firstError = {
        code: "THRESHOLD_NOT_MET",
        scope: "attachment",
        severity: "error",
        message: `Threshold not met for event ${i}: ${sigResult.validKeyIndices.size} valid signatures`,
        eventIndex: i
      };
      overallValid = false;
    }
    if ((event.t === "rot" || event.t === "drt") && lastEstablishment) {
      const keyChainResult = validateKeyChainWithDetails(event, lastEstablishment);
      checks.keyChainValid = keyChainResult;
      if (!keyChainResult.passed && !firstError) {
        firstError = {
          code: "NEXT_KEY_MISMATCH",
          scope: "event",
          severity: "error",
          message: `Keys in event ${i} do not match previous event's next key commitments`,
          eventIndex: i
        };
        overallValid = false;
      }
    }
    if (isDelegatedEvent(event)) {
      const delegationResult = validateDelegationWithDetails(cesrEvent, parentKel);
      checks.delegationValid = delegationResult;
      if (!delegationResult.passed && !firstError) {
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
        firstError = {
          code: errorCode,
          scope: "attachment",
          severity: "error",
          message: delegationResult.error ?? "Delegation validation failed",
          eventIndex: i,
          missingAid: delegationResult.parentAid
        };
        overallValid = false;
      }
    }
    if (state && event.s !== state.expectedSequence) {
      if (!firstError) {
        firstError = {
          code: "SEQUENCE_INVALID",
          scope: "event",
          severity: "error",
          message: `Sequence number mismatch at event ${i}: expected ${state.expectedSequence}, got ${event.s}`,
          eventIndex: i
        };
        overallValid = false;
      }
    }
    if (state && i > 0 && event.i !== state.kelAid) {
      if (!firstError) {
        firstError = {
          code: "AID_INCONSISTENT",
          scope: "chain",
          severity: "error",
          message: `AID mismatch at event ${i}: expected ${state.kelAid}, got ${event.i}`,
          eventIndex: i
        };
        overallValid = false;
      }
    }
    if (state && i === 0 && event.t !== "icp" && event.t !== "dip") {
      if (!firstError) {
        firstError = {
          code: "FIRST_EVENT_NOT_INCEPTION",
          scope: "chain",
          severity: "error",
          message: `First event must be icp or dip, got ${event.t}`,
          eventIndex: i
        };
        overallValid = false;
      }
    }
    if (state?.nonTransferable && i > start) {
      if (!firstError) {
        firstError = {
          code: "NON_TRANSFERABLE_VIOLATION",
          scope: "event",
          severity: "error",
          message: `Non-transferable AID cannot have any event after inception at index ${i}`,
          eventIndex: i
        };
        overallValid = false;
      }
    }
    if (state?.inceptionTraits.has("EO") && event.t === "ixn") {
      if (!firstError) {
        firstError = {
          code: "CONFIG_TRAIT_VIOLATION",
          scope: "event",
          severity: "error",
          message: `Establishment-only (EO) AID cannot have interaction event at ${i}`,
          eventIndex: i
        };
        overallValid = false;
      }
    }
    if (state && (event.t === "rot" || event.t === "drt") && state.inceptionTraits.size > 0) {
      const rotTraits = new Set(event.c ?? []);
      for (const trait of state.inceptionTraits) {
        if (!rotTraits.has(trait)) {
          if (!firstError) {
            firstError = {
              code: "CONFIG_TRAIT_REMOVED",
              scope: "event",
              severity: "error",
              message: `Rotation at event ${i} removes inception trait '${trait}'`,
              eventIndex: i
            };
          }
          overallValid = false;
          break;
        }
      }
    }
    if (isEstablishmentEvent(event)) {
      const dupKeys = checkArrayUniqueness(event.k);
      if (dupKeys.length > 0 && !firstError) {
        firstError = {
          code: "DUPLICATE_KEYS",
          scope: "event",
          severity: "error",
          message: `Duplicate signing keys at event ${i}: ${dupKeys.join(", ")}`,
          eventIndex: i
        };
        overallValid = false;
      }
      const dupNextDigests = checkArrayUniqueness(event.n);
      if (dupNextDigests.length > 0 && !firstError) {
        firstError = {
          code: "DUPLICATE_NEXT_DIGESTS",
          scope: "event",
          severity: "error",
          message: `Duplicate next key digests at event ${i}: ${dupNextDigests.join(", ")}`,
          eventIndex: i
        };
        overallValid = false;
      }
    }
    if (state && isEstablishmentEvent(event)) {
      const bt = typeof state.witnessThreshold === "string" ? parseInt(state.witnessThreshold, 10) || 0 : 0;
      const witnessCount = state.witnesses.size;
      if (bt > witnessCount) {
        if (!firstError) {
          firstError = {
            code: "WITNESS_THRESHOLD_UNSATISFIABLE",
            scope: "event",
            severity: "error",
            message: `Witness threshold ${bt} exceeds witness count ${witnessCount} at event ${i}`,
            eventIndex: i
          };
        }
        overallValid = false;
      }
      const witnessNotes = state.notes.filter((n) => n.code === "malformed-witnesses");
      if (witnessNotes.length > 0) {
        if (!firstError) {
          firstError = {
            code: "WITNESS_DELTA_INVALID",
            scope: "event",
            severity: "error",
            message: witnessNotes[0].message,
            eventIndex: i
          };
        }
        overallValid = false;
      }
    }
    if (state && options?.mode === "fully-witnessed" && isEstablishmentEvent(event)) {
      const bt = typeof state.witnessThreshold === "string" ? parseInt(state.witnessThreshold, 10) || 0 : 0;
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
        if (receiptSigInvalid && !firstError) {
          firstError = {
            code: "WITNESS_RECEIPT_SIGNATURE_INVALID",
            scope: "attachment",
            severity: "error",
            message: `Witness receipt signature verification failed at event ${i}`,
            eventIndex: i
          };
          overallValid = false;
        }
        if (verifiedReceipts.length < bt) {
          if (!firstError) {
            firstError = {
              code: "WITNESS_RECEIPT_THRESHOLD_NOT_MET",
              scope: "attachment",
              severity: "error",
              message: `Witness receipt threshold not met at event ${i}: ${verifiedReceipts.length} verified receipts, need ${bt}`,
              eventIndex: i
            };
          }
          overallValid = false;
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
      checks
    });
    const allChecksPassed = checks.isValidKeriEvent.passed && checks.saidValid.passed && checks.requiredFieldsPresent.passed && (checks.previousEventValid?.passed ?? true) && checks.signaturesValid.passed && checks.thresholdMet.passed && (checks.keyChainValid?.passed ?? true) && (checks.delegationValid?.passed ?? true);
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
})(KELData ||= {});

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
  s: NonEmpty("Sequence", "Current sequence number as string", ["0", "1", "2"]),
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
  sig: CesrSignatureSchema
}, {
  additionalProperties: false,
  title: "Controller Signature Attachment",
  description: 'Signature over the serialized event bytes. When form="indexed", keyIndex MUST be present.'
});
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

// src/kel/ops.ts
function ksnToKeyState(ksn) {
  return {
    aid: ksn.i,
    seqNo: parseInt(ksn.s, 16),
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
        const target = String(sn);
        return refs.find((r) => r.event.s === target);
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
    const result = validateKelChain(allEvents, { startIndex, parentKel: options?.parentKel });
    const candidateDetail = result.eventDetails[0];
    if (!candidateDetail) {
      return {
        ok: false,
        errors: [
          {
            code: "MISSING_REQUIRED_FIELD",
            scope: "event",
            severity: "error",
            message: "No validation detail",
            eventIndex: startIndex
          }
        ],
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
          }
        }
      };
    }
    const failedChecks = Object.entries(candidateDetail.checks).filter(([_, check]) => check && !check.passed);
    if (failedChecks.length > 0) {
      const errors = failedChecks.map(([name, check]) => ({
        code: "MISSING_REQUIRED_FIELD",
        scope: "event",
        severity: "error",
        message: `${name}: ${check.error ?? "failed"}`,
        eventIndex: startIndex
      }));
      return { ok: false, errors, validation: candidateDetail };
    }
    return { ok: true, validation: candidateDetail };
  }
  KELOps.validateAppend = validateAppend;
  const APPEND_ALLOWED_FAILURE_CHECKS = new Set(["signaturesValid", "thresholdMet", "delegationValid"]);
  function isOnlyPendingSignatureFailures(validation) {
    let hasFailure = false;
    for (const [name, check] of Object.entries(validation.checks)) {
      if (!check || check.passed)
        continue;
      hasFailure = true;
      if (!APPEND_ALLOWED_FAILURE_CHECKS.has(name))
        return false;
    }
    return hasFailure;
  }
  KELOps.isOnlyPendingSignatureFailures = isOnlyPendingSignatureFailures;
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
  KELOps.resolveCurrentKeys = resolveCurrentKeys;
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
    const digestToNIndex = new Map;
    for (let i = 0;i < priorN.length; i++) {
      digestToNIndex.set(priorN[i], i);
    }
    const revealed = [];
    const augmented = [];
    const matchedNIndices = new Set;
    for (let kIdx = 0;kIdx < proposedK.length; kIdx++) {
      const keyDigest = digestVerfer(proposedK[kIdx]);
      const nIdx = digestToNIndex.get(keyDigest);
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
    let priorNtSatisfied = false;
    if (matchedIndices.length > 0) {
      const thresholdResult = checkThreshold(priorNt, matchedIndices, priorN.length);
      priorNtSatisfied = thresholdResult.satisfied;
    }
    return { revealed, augmented, priorNtSatisfied, errors };
  }
  KELOps.matchKeyRevelation = matchKeyRevelation;
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
  function buildNextCommitment(nextPublicKeys, nextThreshold) {
    const n = nextPublicKeys.map((key) => digestVerfer(key));
    return { n, nt: nextThreshold };
  }
  KELOps.buildNextCommitment = buildNextCommitment;
  function assertThresholdSatisfiable(kt, keyCount) {
    const numericKt = typeof kt === "string" ? parseInt(kt, 10) : NaN;
    if (!Number.isNaN(numericKt) && numericKt > keyCount) {
      return {
        ok: false,
        error: `Current threshold not satisfiable: kt=${kt} but only ${keyCount} signing keys provided`
      };
    }
    return { ok: true };
  }
  KELOps.assertThresholdSatisfiable = assertThresholdSatisfiable;
  KELOps.reduceKelState = reduceKelState;
  KELOps.validateKel = validateKel;
  KELOps.validateKelChain = validateKelChain;
  KELOps.validateSignedIcp = validateSignedIcp;
  KELOps.isValidKeriEvent = isValidKeriEvent;
  KELOps.validateEventSaid = validateEventSaid;
  KELOps.validateRequiredFields = validateRequiredFields;
  KELOps.validateKeyChain = validateKeyChain;
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
// src/kel/index.ts
var Kel = {
  ...exports_predicates,
  ...exports_validation_predicates,
  ...exports_threshold,
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
  credentialMetadata: (aid, schemaSaid) => `${KERI_PREFIX}/aid/${aid}/credential-metadata/${schemaSaid}`,
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
// src/result.ts
function ok(value) {
  return { ok: true, value };
}
function err(error) {
  return { ok: false, error };
}

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
    members: input.members.map((m) => ({
      aid: m.aid,
      contributingKey: m.contributingKey
    })),
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
// src/said/next-key-digest.ts
var exports_next_key_digest = {};
__export(exports_next_key_digest, {
  nextKeyDigestQb64FromPublicKeyQb64: () => nextKeyDigestQb64FromPublicKeyQb64
});
function nextKeyDigestQb64FromPublicKeyQb64(pubKeyQb64) {
  return digestVerfer(pubKeyQb64);
}

// src/said/said.ts
var exports_said = {};
__export(exports_said, {
  encodeSAID: () => encodeSAID,
  saidFromJson: () => saidFromJson,
  validateSAID: () => validateSAID
});

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
var exports_hashing = {};
__export(exports_hashing, {
  hash: () => hash2,
  hashBase64Url: () => hashBase64Url,
  hashHex: () => hashHex,
  hashObject: () => hashObject
});
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
var exports_primitives = {};
__export(exports_primitives, {
  bytesToHex: () => bytesToHex3,
  canonicalize: () => canonicalize,
  canonicalizeToBytes: () => canonicalizeToBytes,
  decodeBase64Url: () => decodeBase64Url,
  encodeBase64Url: () => encodeBase64Url,
  generateKeyPair: () => generateKeyPair,
  getPublicKey: () => getPublicKey,
  hexToBytes: () => hexToBytes3,
  randomBytes: () => randomBytes3,
  sha256: () => sha2562,
  sha256Hex: () => sha256Hex,
  sha512: () => sha5122,
  sha512Hex: () => sha512Hex,
  sign: () => sign,
  verify: () => verify2
});
function generateKeyPair() {
  const privateKey = randomBytes3(32);
  const publicKey = ed25519.getPublicKey(privateKey);
  return { publicKey, privateKey };
}
function getPublicKey(secretSeed) {
  return ed25519.getPublicKey(secretSeed);
}
function sign(data, secretSeed) {
  return ed25519.sign(data, secretSeed);
}
function verify2(signature, data, publicKey) {
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
  const text = canonicalize(obj);
  return new TextEncoder().encode(text);
}
function randomBytes3(length) {
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

// src/signature/signer.ts
function isEd25519Signer(signer) {
  return typeof signer.getX25519PublicKey === "function" && typeof signer.deriveX25519HkdfBlake3Key === "function";
}
function isSecp256k1Signer(signer) {
  return typeof signer?.signDigest === "function" && signer?.compressedPublicKey instanceof Uint8Array;
}
// src/signature/key-agreement.ts
var MAX_HKDF_DERIVE_LENGTH = 64;

// src/signature/signers.ts
var Signers;
((Signers) => {
  function fromKeyPair(keypair) {
    return {
      publicKey: keypair.publicKey,
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

// src/signature/index.ts
var Signature = {
  ...exports_primitives,
  ...exports_hashing,
  verify
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
      s: params.sequence,
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
      s: params.sequence,
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
      s: params.sequence,
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
      s: params.sequence,
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
      s: params.sequence,
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
    return String(Number.parseInt(priorSeq, 10) + 1);
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
  let raw;
  if (isVcp(event) || isVrt(event)) {
    raw = event.bt;
  } else if (rsn) {
    raw = rsn.bt;
  }
  if (typeof raw !== "string")
    return 0;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? 0 : n;
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
  return parseInt(event.s, 10);
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
var TelEventSchema = Type.Union([
  VcpEventSchema,
  VrtEventSchema,
  IssEventSchema,
  RevEventSchema,
  BisEventSchema,
  BrvEventSchema
]);
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
  const sn = parseInt(event.s, 10);
  if (Number.isNaN(sn) || sn < 0) {
    errors.push({ field: "s", message: "sequence must be a non-negative integer string" });
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
function validateAppend(existing, candidate) {
  const errors = [];
  const structural = validateEvent(candidate);
  if (!structural.ok)
    return structural;
  const expectedSeq = existing.length;
  const candidateSeq = parseInt(candidate.s, 10);
  if (candidateSeq !== expectedSeq) {
    errors.push({
      field: "s",
      message: `expected sequence ${expectedSeq}, got ${candidateSeq}`
    });
  }
  if (TELData.isVcp(candidate) && expectedSeq !== 0) {
    errors.push({
      field: "t",
      message: "VCP is only valid at sequence 0"
    });
  }
  if (!TELData.isVcp(candidate) && existing.length === 0) {
    errors.push({
      field: "t",
      message: "first event must be VCP"
    });
  }
  if (TELData.isVrt(candidate)) {
    const hasVcp = existing.some((e) => TELData.isVcp(e));
    if (!hasVcp) {
      errors.push({
        field: "t",
        message: "VRT requires a prior VCP in the chain"
      });
    }
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
    errors.push({
      field: "ri",
      message: "ISS/REV require a non-empty ri field"
    });
  }
  if (existing.length > 0) {
    const vcpRegistryId = existing[0].i;
    const candidateRegistryId = TELData.registryId(candidate);
    if (candidateRegistryId !== vcpRegistryId) {
      errors.push({
        field: "i",
        message: `registry ID mismatch: expected ${vcpRegistryId}, got ${candidateRegistryId}`
      });
    }
  }
  const existingSaids = new Set(existing.map((e) => e.d));
  if (existingSaids.has(candidate.d)) {
    errors.push({
      field: "d",
      message: `duplicate SAID: ${candidate.d}`
    });
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
function validateChain(entries) {
  for (let i = 0;i < entries.length; i++) {
    const existing = entries.slice(0, i);
    const candidate = entries[i];
    const result = validateAppend(existing, candidate);
    if (!result.ok)
      return result;
  }
  return { ok: true };
}
var TELOps = {
  head,
  issuerId,
  credentialStatus,
  validateEvent,
  validateAppend,
  validateChain
};

// src/tel/index.ts
var Tel = {
  ...TELData,
  ...TELOps,
  ...TELEvents
};
// src/version.ts
var VERSION = "0.3.114";
var GIT_SHA = "b7479cc67c016e6cbf6fc7b0b22fcb23fbc63805";
export {
  ACCOUNT_RECOVERY_PATH_PREFIX,
  ACDCData,
  ACDCOps,
  ACDC_CREDENTIAL_SURFACE,
  ACDC_SCHEMA_SURFACE,
  Acdc,
  AidManifestEventSchema,
  AidManifestSchema,
  AnySealSchema,
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
  ConflictError,
  ControllerNotFoundError,
  CoreError,
  Data,
  DigestSealSchema,
  DipEventSchema,
  DrtEventSchema,
  GIT_SHA,
  IcpEventSchema,
  IssEventSchema,
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
  KeriKeyPairSchema,
  KeriKeyPairs,
  KeriPrivateKeySchema,
  KeriPublicKeySchema,
  KeriVersionPattern,
  KeyIndexSchema,
  KeyRefSchema,
  MAX_HKDF_DERIVE_LENGTH,
  MemberDirectoryEntrySchema,
  NetworkError,
  NonEmpty,
  NotFoundError,
  PermissionError,
  PublishedCredentialSchema,
  PublishedMembershipDirectorySchema,
  PublishedResourceSchema,
  Qb64Schema,
  RECOVERY_EXPAND_SALT,
  RECOVERY_SCHEDULE_VERSION,
  RotEventSchema,
  SAID_PLACEHOLDER,
  Said,
  Schema,
  SchemaData,
  SchemaOps,
  Signature as SignatureOps,
  Signers,
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
  ThresholdError,
  ThresholdExpressionPattern,
  ThresholdExpressionSchema,
  ThresholdSchema,
  TimestampSchema,
  VERSION,
  ValidationError,
  ValidationErrorCode,
  VaultErrorCode,
  VerificationError,
  VersionSchema,
  WeightedThresholdSchema,
  advanceRecoveryDerivation,
  aidManifestToKelManifestData,
  asEd25519PrivateRaw,
  asEd25519PublicRaw,
  assessTelKelAnchor,
  assessTelKelAnchors,
  buildAAD,
  buildACDCCredentialSurface,
  buildAccountRecoverySigningPath,
  buildDeviceRecoverySigningPath,
  buildPublishedMembershipDirectory,
  bytesToHex3 as bytesToHex,
  canonical,
  canonicalize,
  canonicalizeEvent,
  canonicalizeToBytes,
  checkThreshold,
  createInitialRecoveryDerivation,
  createSaidMessageType,
  createStructuredValidationError,
  createTypedRemote,
  decode,
  decodeBase64,
  decodeBase64Url,
  decodeDigest,
  decodeKey,
  decodeSig as decodeSignature,
  decryptEnvelope,
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
  encodeDigest,
  encodeEventBytes,
  encodeKey,
  encodeSAID,
  encodeSig as encodeSignature,
  encryptEnvelope,
  err,
  eventContainsAnchorForSaid,
  generateKeyPair,
  getCodeMeta,
  getPublicKey,
  hexToBytes3 as hexToBytes,
  hkdfBlake3,
  hkdfSha256,
  inferSchema,
  inspect,
  isAid,
  isEd25519Signer,
  isSecp256k1Signer,
  isStructuredValidationError,
  isValidKeriEvent,
  kelManifestDataToAidManifest,
  keyRef,
  keyRefEquals,
  latestSnFromKelManifestData,
  manifestUrlFromKelManifestData,
  manifestUrlFromRecords,
  memberRole,
  mergeRemoteRecords,
  nextKeyDigestQb64FromPublicKeyQb64,
  normalizeDisplayNameToProfileUsername,
  normalizeThreshold,
  ok,
  parseAidQb64,
  parseBlake3Hex,
  parseBlake3Qb64,
  parseBlake3Qb64Digest,
  parseEd25519PrivateQb64,
  parseEd25519PublicQb64,
  parseEd25519SignatureQb64,
  parseKelManifestWire,
  parseProfileAlias,
  parseSaidQb64,
  parseSha256Hex,
  parseSimpleThreshold,
  presentationDefinitionSaid,
  profileUsernameFromDisplayName,
  randomBytes3 as randomBytes,
  recomputeSaid,
  recoveryCommitmentAt,
  recoveryKeyDerivationSpec,
  recoveryPublicKeyAt,
  reduceKelState,
  remoteRecordsFromAidManifest,
  remoteRecordsFromKelManifestData,
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
  toEd25519KeyPairBranded,
  transferableKeyToPublicKey,
  validateEventSaid,
  validateInceptionSignRequest,
  validateKel,
  validateKelChain,
  validateKeyChain,
  validatePublishedCredential,
  validateRequiredFields,
  validateSAID,
  validateSignedIcp,
  verify2 as verify,
  verifyWitnessReceipt
};
