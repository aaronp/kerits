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
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);

// node_modules/@sinclair/typebox/build/esm/type/guard/value.mjs
var exports_value = {};
__export(exports_value, {
  IsUndefined: () => IsUndefined,
  IsUint8Array: () => IsUint8Array,
  IsSymbol: () => IsSymbol,
  IsString: () => IsString,
  IsRegExp: () => IsRegExp,
  IsObject: () => IsObject,
  IsNumber: () => IsNumber,
  IsNull: () => IsNull,
  IsIterator: () => IsIterator,
  IsFunction: () => IsFunction,
  IsDate: () => IsDate,
  IsBoolean: () => IsBoolean,
  IsBigInt: () => IsBigInt,
  IsAsyncIterator: () => IsAsyncIterator,
  IsArray: () => IsArray,
  HasPropertyKey: () => HasPropertyKey
});
function HasPropertyKey(value, key) {
  return key in value;
}
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
  return value.map((value2) => Visit(value2));
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
function CloneRest(schemas) {
  return schemas.map((schema) => CloneType(schema));
}
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
function IsAsyncIterator2(value2) {
  return IsObject2(value2) && globalThis.Symbol.asyncIterator in value2;
}
function IsIterator2(value2) {
  return IsObject2(value2) && globalThis.Symbol.iterator in value2;
}
function IsStandardObject(value2) {
  return IsObject2(value2) && (globalThis.Object.getPrototypeOf(value2) === Object.prototype || globalThis.Object.getPrototypeOf(value2) === null);
}
function IsPromise(value2) {
  return value2 instanceof globalThis.Promise;
}
function IsDate2(value2) {
  return value2 instanceof Date && globalThis.Number.isFinite(value2.getTime());
}
function IsMap(value2) {
  return value2 instanceof globalThis.Map;
}
function IsSet(value2) {
  return value2 instanceof globalThis.Set;
}
function IsTypedArray(value2) {
  return globalThis.ArrayBuffer.isView(value2);
}
function IsUint8Array2(value2) {
  return value2 instanceof globalThis.Uint8Array;
}
function HasPropertyKey2(value2, key) {
  return key in value2;
}
function IsObject2(value2) {
  return value2 !== null && typeof value2 === "object";
}
function IsArray2(value2) {
  return globalThis.Array.isArray(value2) && !globalThis.ArrayBuffer.isView(value2);
}
function IsUndefined2(value2) {
  return value2 === undefined;
}
function IsNull2(value2) {
  return value2 === null;
}
function IsBoolean2(value2) {
  return typeof value2 === "boolean";
}
function IsNumber2(value2) {
  return typeof value2 === "number";
}
function IsInteger(value2) {
  return globalThis.Number.isInteger(value2);
}
function IsBigInt2(value2) {
  return typeof value2 === "bigint";
}
function IsString2(value2) {
  return typeof value2 === "string";
}
function IsFunction2(value2) {
  return typeof value2 === "function";
}
function IsSymbol2(value2) {
  return typeof value2 === "symbol";
}
function IsValueType(value2) {
  return IsBigInt2(value2) || IsBoolean2(value2) || IsNull2(value2) || IsNumber2(value2) || IsString2(value2) || IsSymbol2(value2) || IsUndefined2(value2);
}

// node_modules/@sinclair/typebox/build/esm/value/guard/index.mjs
var init_guard = () => {};

// node_modules/@sinclair/typebox/build/esm/system/policy.mjs
var TypeSystemPolicy;
var init_policy = __esm(() => {
  init_guard();
  (function(TypeSystemPolicy2) {
    TypeSystemPolicy2.InstanceMode = "default";
    TypeSystemPolicy2.ExactOptionalPropertyTypes = false;
    TypeSystemPolicy2.AllowArrayObject = false;
    TypeSystemPolicy2.AllowNaN = false;
    TypeSystemPolicy2.AllowNullVoid = false;
    function IsExactOptionalProperty(value2, key) {
      return TypeSystemPolicy2.ExactOptionalPropertyTypes ? key in value2 : value2[key] !== undefined;
    }
    TypeSystemPolicy2.IsExactOptionalProperty = IsExactOptionalProperty;
    function IsObjectLike(value2) {
      const isObject = IsObject2(value2);
      return TypeSystemPolicy2.AllowArrayObject ? isObject : isObject && !IsArray2(value2);
    }
    TypeSystemPolicy2.IsObjectLike = IsObjectLike;
    function IsRecordLike(value2) {
      return IsObjectLike(value2) && !(value2 instanceof Date) && !(value2 instanceof Uint8Array);
    }
    TypeSystemPolicy2.IsRecordLike = IsRecordLike;
    function IsNumberLike(value2) {
      return TypeSystemPolicy2.AllowNaN ? IsNumber2(value2) : Number.isFinite(value2);
    }
    TypeSystemPolicy2.IsNumberLike = IsNumberLike;
    function IsVoidLike(value2) {
      const isUndefined = IsUndefined2(value2);
      return TypeSystemPolicy2.AllowNullVoid ? isUndefined || value2 === null : isUndefined;
    }
    TypeSystemPolicy2.IsVoidLike = IsVoidLike;
  })(TypeSystemPolicy || (TypeSystemPolicy = {}));
});

// node_modules/@sinclair/typebox/build/esm/type/create/immutable.mjs
function ImmutableArray(value2) {
  return globalThis.Object.freeze(value2).map((value3) => Immutable(value3));
}
function ImmutableDate(value2) {
  return value2;
}
function ImmutableUint8Array(value2) {
  return value2;
}
function ImmutableRegExp(value2) {
  return value2;
}
function ImmutableObject(value2) {
  const result = {};
  for (const key of Object.getOwnPropertyNames(value2)) {
    result[key] = Immutable(value2[key]);
  }
  for (const key of Object.getOwnPropertySymbols(value2)) {
    result[key] = Immutable(value2[key]);
  }
  return globalThis.Object.freeze(result);
}
function Immutable(value2) {
  return IsArray(value2) ? ImmutableArray(value2) : IsDate(value2) ? ImmutableDate(value2) : IsUint8Array(value2) ? ImmutableUint8Array(value2) : IsRegExp(value2) ? ImmutableRegExp(value2) : IsObject(value2) ? ImmutableObject(value2) : value2;
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
var exports_kind = {};
__export(exports_kind, {
  IsVoid: () => IsVoid,
  IsUnsafe: () => IsUnsafe,
  IsUnknown: () => IsUnknown,
  IsUnion: () => IsUnion,
  IsUndefined: () => IsUndefined3,
  IsUint8Array: () => IsUint8Array3,
  IsTuple: () => IsTuple,
  IsTransform: () => IsTransform,
  IsThis: () => IsThis,
  IsTemplateLiteral: () => IsTemplateLiteral,
  IsSymbol: () => IsSymbol3,
  IsString: () => IsString3,
  IsSchema: () => IsSchema,
  IsRegExp: () => IsRegExp2,
  IsRef: () => IsRef,
  IsRecursive: () => IsRecursive,
  IsRecord: () => IsRecord,
  IsReadonly: () => IsReadonly,
  IsProperties: () => IsProperties,
  IsPromise: () => IsPromise2,
  IsOptional: () => IsOptional,
  IsObject: () => IsObject3,
  IsNumber: () => IsNumber3,
  IsNull: () => IsNull3,
  IsNot: () => IsNot,
  IsNever: () => IsNever,
  IsMappedResult: () => IsMappedResult,
  IsMappedKey: () => IsMappedKey,
  IsLiteralValue: () => IsLiteralValue,
  IsLiteralString: () => IsLiteralString,
  IsLiteralNumber: () => IsLiteralNumber,
  IsLiteralBoolean: () => IsLiteralBoolean,
  IsLiteral: () => IsLiteral,
  IsKindOf: () => IsKindOf,
  IsKind: () => IsKind,
  IsIterator: () => IsIterator3,
  IsIntersect: () => IsIntersect,
  IsInteger: () => IsInteger2,
  IsImport: () => IsImport,
  IsFunction: () => IsFunction3,
  IsDate: () => IsDate3,
  IsConstructor: () => IsConstructor,
  IsComputed: () => IsComputed,
  IsBoolean: () => IsBoolean3,
  IsBigInt: () => IsBigInt3,
  IsAsyncIterator: () => IsAsyncIterator3,
  IsArray: () => IsArray3,
  IsArgument: () => IsArgument,
  IsAny: () => IsAny
});
function IsReadonly(value2) {
  return IsObject(value2) && value2[ReadonlyKind] === "Readonly";
}
function IsOptional(value2) {
  return IsObject(value2) && value2[OptionalKind] === "Optional";
}
function IsAny(value2) {
  return IsKindOf(value2, "Any");
}
function IsArgument(value2) {
  return IsKindOf(value2, "Argument");
}
function IsArray3(value2) {
  return IsKindOf(value2, "Array");
}
function IsAsyncIterator3(value2) {
  return IsKindOf(value2, "AsyncIterator");
}
function IsBigInt3(value2) {
  return IsKindOf(value2, "BigInt");
}
function IsBoolean3(value2) {
  return IsKindOf(value2, "Boolean");
}
function IsComputed(value2) {
  return IsKindOf(value2, "Computed");
}
function IsConstructor(value2) {
  return IsKindOf(value2, "Constructor");
}
function IsDate3(value2) {
  return IsKindOf(value2, "Date");
}
function IsFunction3(value2) {
  return IsKindOf(value2, "Function");
}
function IsImport(value2) {
  return IsKindOf(value2, "Import");
}
function IsInteger2(value2) {
  return IsKindOf(value2, "Integer");
}
function IsProperties(value2) {
  return IsObject(value2);
}
function IsIntersect(value2) {
  return IsKindOf(value2, "Intersect");
}
function IsIterator3(value2) {
  return IsKindOf(value2, "Iterator");
}
function IsKindOf(value2, kind) {
  return IsObject(value2) && Kind in value2 && value2[Kind] === kind;
}
function IsLiteralString(value2) {
  return IsLiteral(value2) && IsString(value2.const);
}
function IsLiteralNumber(value2) {
  return IsLiteral(value2) && IsNumber(value2.const);
}
function IsLiteralBoolean(value2) {
  return IsLiteral(value2) && IsBoolean(value2.const);
}
function IsLiteralValue(value2) {
  return IsBoolean(value2) || IsNumber(value2) || IsString(value2);
}
function IsLiteral(value2) {
  return IsKindOf(value2, "Literal");
}
function IsMappedKey(value2) {
  return IsKindOf(value2, "MappedKey");
}
function IsMappedResult(value2) {
  return IsKindOf(value2, "MappedResult");
}
function IsNever(value2) {
  return IsKindOf(value2, "Never");
}
function IsNot(value2) {
  return IsKindOf(value2, "Not");
}
function IsNull3(value2) {
  return IsKindOf(value2, "Null");
}
function IsNumber3(value2) {
  return IsKindOf(value2, "Number");
}
function IsObject3(value2) {
  return IsKindOf(value2, "Object");
}
function IsPromise2(value2) {
  return IsKindOf(value2, "Promise");
}
function IsRecord(value2) {
  return IsKindOf(value2, "Record");
}
function IsRecursive(value2) {
  return IsObject(value2) && Hint in value2 && value2[Hint] === "Recursive";
}
function IsRef(value2) {
  return IsKindOf(value2, "Ref");
}
function IsRegExp2(value2) {
  return IsKindOf(value2, "RegExp");
}
function IsString3(value2) {
  return IsKindOf(value2, "String");
}
function IsSymbol3(value2) {
  return IsKindOf(value2, "Symbol");
}
function IsTemplateLiteral(value2) {
  return IsKindOf(value2, "TemplateLiteral");
}
function IsThis(value2) {
  return IsKindOf(value2, "This");
}
function IsTransform(value2) {
  return IsObject(value2) && TransformKind in value2;
}
function IsTuple(value2) {
  return IsKindOf(value2, "Tuple");
}
function IsUndefined3(value2) {
  return IsKindOf(value2, "Undefined");
}
function IsUnion(value2) {
  return IsKindOf(value2, "Union");
}
function IsUint8Array3(value2) {
  return IsKindOf(value2, "Uint8Array");
}
function IsUnknown(value2) {
  return IsKindOf(value2, "Unknown");
}
function IsUnsafe(value2) {
  return IsKindOf(value2, "Unsafe");
}
function IsVoid(value2) {
  return IsKindOf(value2, "Void");
}
function IsKind(value2) {
  return IsObject(value2) && Kind in value2 && IsString(value2[Kind]);
}
function IsSchema(value2) {
  return IsAny(value2) || IsArgument(value2) || IsArray3(value2) || IsBoolean3(value2) || IsBigInt3(value2) || IsAsyncIterator3(value2) || IsComputed(value2) || IsConstructor(value2) || IsDate3(value2) || IsFunction3(value2) || IsInteger2(value2) || IsIntersect(value2) || IsIterator3(value2) || IsLiteral(value2) || IsMappedKey(value2) || IsMappedResult(value2) || IsNever(value2) || IsNot(value2) || IsNull3(value2) || IsNumber3(value2) || IsObject3(value2) || IsPromise2(value2) || IsRecord(value2) || IsRef(value2) || IsRegExp2(value2) || IsString3(value2) || IsSymbol3(value2) || IsTemplateLiteral(value2) || IsThis(value2) || IsTuple(value2) || IsUndefined3(value2) || IsUnion(value2) || IsUint8Array3(value2) || IsUnknown(value2) || IsUnsafe(value2) || IsVoid(value2) || IsKind(value2);
}
var init_kind = __esm(() => {
  init_symbols2();
});

// node_modules/@sinclair/typebox/build/esm/type/guard/type.mjs
var exports_type = {};
__export(exports_type, {
  TypeGuardUnknownTypeError: () => TypeGuardUnknownTypeError,
  IsVoid: () => IsVoid2,
  IsUnsafe: () => IsUnsafe2,
  IsUnknown: () => IsUnknown2,
  IsUnionLiteral: () => IsUnionLiteral,
  IsUnion: () => IsUnion2,
  IsUndefined: () => IsUndefined4,
  IsUint8Array: () => IsUint8Array4,
  IsTuple: () => IsTuple2,
  IsTransform: () => IsTransform2,
  IsThis: () => IsThis2,
  IsTemplateLiteral: () => IsTemplateLiteral2,
  IsSymbol: () => IsSymbol4,
  IsString: () => IsString4,
  IsSchema: () => IsSchema2,
  IsRegExp: () => IsRegExp3,
  IsRef: () => IsRef2,
  IsRecursive: () => IsRecursive2,
  IsRecord: () => IsRecord2,
  IsReadonly: () => IsReadonly2,
  IsProperties: () => IsProperties2,
  IsPromise: () => IsPromise3,
  IsOptional: () => IsOptional2,
  IsObject: () => IsObject4,
  IsNumber: () => IsNumber4,
  IsNull: () => IsNull4,
  IsNot: () => IsNot2,
  IsNever: () => IsNever2,
  IsMappedResult: () => IsMappedResult2,
  IsMappedKey: () => IsMappedKey2,
  IsLiteralValue: () => IsLiteralValue2,
  IsLiteralString: () => IsLiteralString2,
  IsLiteralNumber: () => IsLiteralNumber2,
  IsLiteralBoolean: () => IsLiteralBoolean2,
  IsLiteral: () => IsLiteral2,
  IsKindOf: () => IsKindOf2,
  IsKind: () => IsKind2,
  IsIterator: () => IsIterator4,
  IsIntersect: () => IsIntersect2,
  IsInteger: () => IsInteger3,
  IsImport: () => IsImport2,
  IsFunction: () => IsFunction4,
  IsDate: () => IsDate4,
  IsConstructor: () => IsConstructor2,
  IsComputed: () => IsComputed2,
  IsBoolean: () => IsBoolean4,
  IsBigInt: () => IsBigInt4,
  IsAsyncIterator: () => IsAsyncIterator4,
  IsArray: () => IsArray4,
  IsArgument: () => IsArgument2,
  IsAny: () => IsAny2
});
function IsPattern(value2) {
  try {
    new RegExp(value2);
    return true;
  } catch {
    return false;
  }
}
function IsControlCharacterFree(value2) {
  if (!IsString(value2))
    return false;
  for (let i2 = 0;i2 < value2.length; i2++) {
    const code2 = value2.charCodeAt(i2);
    if (code2 >= 7 && code2 <= 13 || code2 === 27 || code2 === 127) {
      return false;
    }
  }
  return true;
}
function IsAdditionalProperties(value2) {
  return IsOptionalBoolean(value2) || IsSchema2(value2);
}
function IsOptionalBigInt(value2) {
  return IsUndefined(value2) || IsBigInt(value2);
}
function IsOptionalNumber(value2) {
  return IsUndefined(value2) || IsNumber(value2);
}
function IsOptionalBoolean(value2) {
  return IsUndefined(value2) || IsBoolean(value2);
}
function IsOptionalString(value2) {
  return IsUndefined(value2) || IsString(value2);
}
function IsOptionalPattern(value2) {
  return IsUndefined(value2) || IsString(value2) && IsControlCharacterFree(value2) && IsPattern(value2);
}
function IsOptionalFormat(value2) {
  return IsUndefined(value2) || IsString(value2) && IsControlCharacterFree(value2);
}
function IsOptionalSchema(value2) {
  return IsUndefined(value2) || IsSchema2(value2);
}
function IsReadonly2(value2) {
  return IsObject(value2) && value2[ReadonlyKind] === "Readonly";
}
function IsOptional2(value2) {
  return IsObject(value2) && value2[OptionalKind] === "Optional";
}
function IsAny2(value2) {
  return IsKindOf2(value2, "Any") && IsOptionalString(value2.$id);
}
function IsArgument2(value2) {
  return IsKindOf2(value2, "Argument") && IsNumber(value2.index);
}
function IsArray4(value2) {
  return IsKindOf2(value2, "Array") && value2.type === "array" && IsOptionalString(value2.$id) && IsSchema2(value2.items) && IsOptionalNumber(value2.minItems) && IsOptionalNumber(value2.maxItems) && IsOptionalBoolean(value2.uniqueItems) && IsOptionalSchema(value2.contains) && IsOptionalNumber(value2.minContains) && IsOptionalNumber(value2.maxContains);
}
function IsAsyncIterator4(value2) {
  return IsKindOf2(value2, "AsyncIterator") && value2.type === "AsyncIterator" && IsOptionalString(value2.$id) && IsSchema2(value2.items);
}
function IsBigInt4(value2) {
  return IsKindOf2(value2, "BigInt") && value2.type === "bigint" && IsOptionalString(value2.$id) && IsOptionalBigInt(value2.exclusiveMaximum) && IsOptionalBigInt(value2.exclusiveMinimum) && IsOptionalBigInt(value2.maximum) && IsOptionalBigInt(value2.minimum) && IsOptionalBigInt(value2.multipleOf);
}
function IsBoolean4(value2) {
  return IsKindOf2(value2, "Boolean") && value2.type === "boolean" && IsOptionalString(value2.$id);
}
function IsComputed2(value2) {
  return IsKindOf2(value2, "Computed") && IsString(value2.target) && IsArray(value2.parameters) && value2.parameters.every((schema) => IsSchema2(schema));
}
function IsConstructor2(value2) {
  return IsKindOf2(value2, "Constructor") && value2.type === "Constructor" && IsOptionalString(value2.$id) && IsArray(value2.parameters) && value2.parameters.every((schema) => IsSchema2(schema)) && IsSchema2(value2.returns);
}
function IsDate4(value2) {
  return IsKindOf2(value2, "Date") && value2.type === "Date" && IsOptionalString(value2.$id) && IsOptionalNumber(value2.exclusiveMaximumTimestamp) && IsOptionalNumber(value2.exclusiveMinimumTimestamp) && IsOptionalNumber(value2.maximumTimestamp) && IsOptionalNumber(value2.minimumTimestamp) && IsOptionalNumber(value2.multipleOfTimestamp);
}
function IsFunction4(value2) {
  return IsKindOf2(value2, "Function") && value2.type === "Function" && IsOptionalString(value2.$id) && IsArray(value2.parameters) && value2.parameters.every((schema) => IsSchema2(schema)) && IsSchema2(value2.returns);
}
function IsImport2(value2) {
  return IsKindOf2(value2, "Import") && HasPropertyKey(value2, "$defs") && IsObject(value2.$defs) && IsProperties2(value2.$defs) && HasPropertyKey(value2, "$ref") && IsString(value2.$ref) && value2.$ref in value2.$defs;
}
function IsInteger3(value2) {
  return IsKindOf2(value2, "Integer") && value2.type === "integer" && IsOptionalString(value2.$id) && IsOptionalNumber(value2.exclusiveMaximum) && IsOptionalNumber(value2.exclusiveMinimum) && IsOptionalNumber(value2.maximum) && IsOptionalNumber(value2.minimum) && IsOptionalNumber(value2.multipleOf);
}
function IsProperties2(value2) {
  return IsObject(value2) && Object.entries(value2).every(([key, schema]) => IsControlCharacterFree(key) && IsSchema2(schema));
}
function IsIntersect2(value2) {
  return IsKindOf2(value2, "Intersect") && (IsString(value2.type) && value2.type !== "object" ? false : true) && IsArray(value2.allOf) && value2.allOf.every((schema) => IsSchema2(schema) && !IsTransform2(schema)) && IsOptionalString(value2.type) && (IsOptionalBoolean(value2.unevaluatedProperties) || IsOptionalSchema(value2.unevaluatedProperties)) && IsOptionalString(value2.$id);
}
function IsIterator4(value2) {
  return IsKindOf2(value2, "Iterator") && value2.type === "Iterator" && IsOptionalString(value2.$id) && IsSchema2(value2.items);
}
function IsKindOf2(value2, kind) {
  return IsObject(value2) && Kind in value2 && value2[Kind] === kind;
}
function IsLiteralString2(value2) {
  return IsLiteral2(value2) && IsString(value2.const);
}
function IsLiteralNumber2(value2) {
  return IsLiteral2(value2) && IsNumber(value2.const);
}
function IsLiteralBoolean2(value2) {
  return IsLiteral2(value2) && IsBoolean(value2.const);
}
function IsLiteral2(value2) {
  return IsKindOf2(value2, "Literal") && IsOptionalString(value2.$id) && IsLiteralValue2(value2.const);
}
function IsLiteralValue2(value2) {
  return IsBoolean(value2) || IsNumber(value2) || IsString(value2);
}
function IsMappedKey2(value2) {
  return IsKindOf2(value2, "MappedKey") && IsArray(value2.keys) && value2.keys.every((key) => IsNumber(key) || IsString(key));
}
function IsMappedResult2(value2) {
  return IsKindOf2(value2, "MappedResult") && IsProperties2(value2.properties);
}
function IsNever2(value2) {
  return IsKindOf2(value2, "Never") && IsObject(value2.not) && Object.getOwnPropertyNames(value2.not).length === 0;
}
function IsNot2(value2) {
  return IsKindOf2(value2, "Not") && IsSchema2(value2.not);
}
function IsNull4(value2) {
  return IsKindOf2(value2, "Null") && value2.type === "null" && IsOptionalString(value2.$id);
}
function IsNumber4(value2) {
  return IsKindOf2(value2, "Number") && value2.type === "number" && IsOptionalString(value2.$id) && IsOptionalNumber(value2.exclusiveMaximum) && IsOptionalNumber(value2.exclusiveMinimum) && IsOptionalNumber(value2.maximum) && IsOptionalNumber(value2.minimum) && IsOptionalNumber(value2.multipleOf);
}
function IsObject4(value2) {
  return IsKindOf2(value2, "Object") && value2.type === "object" && IsOptionalString(value2.$id) && IsProperties2(value2.properties) && IsAdditionalProperties(value2.additionalProperties) && IsOptionalNumber(value2.minProperties) && IsOptionalNumber(value2.maxProperties);
}
function IsPromise3(value2) {
  return IsKindOf2(value2, "Promise") && value2.type === "Promise" && IsOptionalString(value2.$id) && IsSchema2(value2.item);
}
function IsRecord2(value2) {
  return IsKindOf2(value2, "Record") && value2.type === "object" && IsOptionalString(value2.$id) && IsAdditionalProperties(value2.additionalProperties) && IsObject(value2.patternProperties) && ((schema) => {
    const keys = Object.getOwnPropertyNames(schema.patternProperties);
    return keys.length === 1 && IsPattern(keys[0]) && IsObject(schema.patternProperties) && IsSchema2(schema.patternProperties[keys[0]]);
  })(value2);
}
function IsRecursive2(value2) {
  return IsObject(value2) && Hint in value2 && value2[Hint] === "Recursive";
}
function IsRef2(value2) {
  return IsKindOf2(value2, "Ref") && IsOptionalString(value2.$id) && IsString(value2.$ref);
}
function IsRegExp3(value2) {
  return IsKindOf2(value2, "RegExp") && IsOptionalString(value2.$id) && IsString(value2.source) && IsString(value2.flags) && IsOptionalNumber(value2.maxLength) && IsOptionalNumber(value2.minLength);
}
function IsString4(value2) {
  return IsKindOf2(value2, "String") && value2.type === "string" && IsOptionalString(value2.$id) && IsOptionalNumber(value2.minLength) && IsOptionalNumber(value2.maxLength) && IsOptionalPattern(value2.pattern) && IsOptionalFormat(value2.format);
}
function IsSymbol4(value2) {
  return IsKindOf2(value2, "Symbol") && value2.type === "symbol" && IsOptionalString(value2.$id);
}
function IsTemplateLiteral2(value2) {
  return IsKindOf2(value2, "TemplateLiteral") && value2.type === "string" && IsString(value2.pattern) && value2.pattern[0] === "^" && value2.pattern[value2.pattern.length - 1] === "$";
}
function IsThis2(value2) {
  return IsKindOf2(value2, "This") && IsOptionalString(value2.$id) && IsString(value2.$ref);
}
function IsTransform2(value2) {
  return IsObject(value2) && TransformKind in value2;
}
function IsTuple2(value2) {
  return IsKindOf2(value2, "Tuple") && value2.type === "array" && IsOptionalString(value2.$id) && IsNumber(value2.minItems) && IsNumber(value2.maxItems) && value2.minItems === value2.maxItems && (IsUndefined(value2.items) && IsUndefined(value2.additionalItems) && value2.minItems === 0 || IsArray(value2.items) && value2.items.every((schema) => IsSchema2(schema)));
}
function IsUndefined4(value2) {
  return IsKindOf2(value2, "Undefined") && value2.type === "undefined" && IsOptionalString(value2.$id);
}
function IsUnionLiteral(value2) {
  return IsUnion2(value2) && value2.anyOf.every((schema) => IsLiteralString2(schema) || IsLiteralNumber2(schema));
}
function IsUnion2(value2) {
  return IsKindOf2(value2, "Union") && IsOptionalString(value2.$id) && IsObject(value2) && IsArray(value2.anyOf) && value2.anyOf.every((schema) => IsSchema2(schema));
}
function IsUint8Array4(value2) {
  return IsKindOf2(value2, "Uint8Array") && value2.type === "Uint8Array" && IsOptionalString(value2.$id) && IsOptionalNumber(value2.minByteLength) && IsOptionalNumber(value2.maxByteLength);
}
function IsUnknown2(value2) {
  return IsKindOf2(value2, "Unknown") && IsOptionalString(value2.$id);
}
function IsUnsafe2(value2) {
  return IsKindOf2(value2, "Unsafe");
}
function IsVoid2(value2) {
  return IsKindOf2(value2, "Void") && value2.type === "void" && IsOptionalString(value2.$id);
}
function IsKind2(value2) {
  return IsObject(value2) && Kind in value2 && IsString(value2[Kind]) && !KnownTypes.includes(value2[Kind]);
}
function IsSchema2(value2) {
  return IsObject(value2) && (IsAny2(value2) || IsArgument2(value2) || IsArray4(value2) || IsBoolean4(value2) || IsBigInt4(value2) || IsAsyncIterator4(value2) || IsComputed2(value2) || IsConstructor2(value2) || IsDate4(value2) || IsFunction4(value2) || IsInteger3(value2) || IsIntersect2(value2) || IsIterator4(value2) || IsLiteral2(value2) || IsMappedKey2(value2) || IsMappedResult2(value2) || IsNever2(value2) || IsNot2(value2) || IsNull4(value2) || IsNumber4(value2) || IsObject4(value2) || IsPromise3(value2) || IsRecord2(value2) || IsRef2(value2) || IsRegExp3(value2) || IsString4(value2) || IsSymbol4(value2) || IsTemplateLiteral2(value2) || IsThis2(value2) || IsTuple2(value2) || IsUndefined4(value2) || IsUnion2(value2) || IsUint8Array4(value2) || IsUnknown2(value2) || IsUnsafe2(value2) || IsVoid2(value2) || IsKind2(value2));
}
var TypeGuardUnknownTypeError, KnownTypes;
var init_type3 = __esm(() => {
  init_symbols2();
  init_error2();
  TypeGuardUnknownTypeError = class TypeGuardUnknownTypeError extends TypeBoxError {
  };
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

// node_modules/@sinclair/typebox/build/esm/type/helpers/helpers.mjs
function Increment(T) {
  return (parseInt(T) + 1).toString();
}

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
var exports_format = {};
__export(exports_format, {
  Set: () => Set2,
  Has: () => Has,
  Get: () => Get,
  Entries: () => Entries,
  Delete: () => Delete,
  Clear: () => Clear
});
function Entries() {
  return new Map(map);
}
function Clear() {
  return map.clear();
}
function Delete(format) {
  return map.delete(format);
}
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
var exports_type2 = {};
__export(exports_type2, {
  Set: () => Set3,
  Has: () => Has2,
  Get: () => Get2,
  Entries: () => Entries2,
  Delete: () => Delete2,
  Clear: () => Clear2
});
function Entries2() {
  return new Map(map2);
}
function Clear2() {
  return map2.clear();
}
function Delete2(kind) {
  return map2.delete(kind);
}
function Has2(kind) {
  return map2.has(kind);
}
function Set3(kind, func) {
  map2.set(kind, func);
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
function SetIsSubset(T, S) {
  return T.every((L) => SetIncludes(S, L));
}
function SetDistinct(T) {
  return [...new Set(T)];
}
function SetIntersect(T, S) {
  return T.filter((L) => S.includes(L));
}
function SetUnion(T, S) {
  return [...T, ...S];
}
function SetComplement(T, S) {
  return T.filter((L) => !S.includes(L));
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
function DiscardKey(value2, key) {
  const { [key]: _, ...rest } = value2;
  return rest;
}
function Discard(value2, keys) {
  return keys.reduce((acc, key) => DiscardKey(acc, key), value2);
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
function MappedKey(T) {
  return CreateType({
    [Kind]: "MappedKey",
    keys: T
  });
}
var init_mapped_key = __esm(() => {
  init_type2();
  init_symbols2();
});

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
  return types.some((type3) => IsOptional(type3));
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
      const range2 = pattern.slice(start, index);
      if (range2.length > 0)
        expressions.push(TemplateLiteralParse(range2));
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
  function Group(value2, index) {
    if (!IsOpenParen(value2, index))
      throw new TemplateLiteralParserError(`TemplateLiteralParser: Index must point to open parens`);
    let count = 0;
    for (let scan = index;scan < value2.length; scan++) {
      if (IsOpenParen(value2, scan))
        count += 1;
      if (IsCloseParen(value2, scan))
        count -= 1;
      if (count === 0)
        return [index, scan];
    }
    throw new TemplateLiteralParserError(`TemplateLiteralParser: Unclosed group parens in expression`);
  }
  function Range(pattern2, index) {
    for (let scan = index;scan < pattern2.length; scan++) {
      if (IsOpenParen(pattern2, scan))
        return [index, scan];
    }
    return [index, pattern2.length];
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
function Literal(value2, options) {
  return CreateType({
    [Kind]: "Literal",
    const: value2,
    type: typeof value2
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
    const literals = trim.split("|").map((literal2) => Literal(literal2.trim()));
    return literals.length === 0 ? Never() : literals.length === 1 ? literals[0] : UnionEvaluated(literals);
  })();
}
function* FromTerminal(syntax) {
  if (syntax[1] !== "{") {
    const L = Literal("$");
    const R = FromSyntax(syntax.slice(1));
    return yield* [L, ...R];
  }
  for (let i2 = 2;i2 < syntax.length; i2++) {
    if (syntax[i2] === "}") {
      const L = FromUnion(syntax.slice(2, i2));
      const R = FromSyntax(syntax.slice(i2 + 1));
      return yield* [...L, ...R];
    }
  }
  yield Literal(syntax);
}
function* FromSyntax(syntax) {
  for (let i2 = 0;i2 < syntax.length; i2++) {
    if (syntax[i2] === "$") {
      const L = Literal(syntax.slice(0, i2));
      const R = FromTerminal(syntax.slice(i2));
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
function Escape(value2) {
  return value2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function Visit2(schema, acc) {
  return IsTemplateLiteral(schema) ? schema.pattern.slice(1, schema.pattern.length - 1) : IsUnion(schema) ? `(${schema.anyOf.map((schema2) => Visit2(schema2, acc)).join("|")})` : IsNumber3(schema) ? `${acc}${PatternNumber}` : IsInteger2(schema) ? `${acc}${PatternNumber}` : IsBigInt3(schema) ? `${acc}${PatternNumber}` : IsString3(schema) ? `${acc}${PatternString}` : IsLiteral(schema) ? `${acc}${Escape(schema.const.toString())}` : IsBoolean3(schema) ? `${acc}${PatternBoolean}` : (() => {
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
  for (const type3 of types)
    result.push(...IndexPropertyKeys(type3));
  return result;
}
function FromLiteral(literalValue) {
  return [literalValue.toString()];
}
function IndexPropertyKeys(type3) {
  return [...new Set(IsTemplateLiteral(type3) ? FromTemplateLiteral(type3) : IsUnion(type3) ? FromUnion2(type3.anyOf) : IsLiteral(type3) ? FromLiteral(type3.const) : IsNumber3(type3) ? ["[number]"] : IsInteger2(type3) ? ["[number]"] : [])];
}
var init_indexed_property_keys = __esm(() => {
  init_template_literal2();
  init_kind();
});

// node_modules/@sinclair/typebox/build/esm/type/indexed/indexed-from-mapped-result.mjs
function FromProperties(type3, properties, options) {
  const result = {};
  for (const K2 of Object.getOwnPropertyNames(properties)) {
    result[K2] = Index(type3, IndexPropertyKeys(properties[K2]), options);
  }
  return result;
}
function FromMappedResult(type3, mappedResult, options) {
  return FromProperties(type3, mappedResult.properties, options);
}
function IndexFromMappedResult(type3, mappedResult, options) {
  const properties = FromMappedResult(type3, mappedResult, options);
  return MappedResult(properties);
}
var init_indexed_from_mapped_result = __esm(() => {
  init_mapped2();
  init_indexed_property_keys();
  init_indexed2();
});

// node_modules/@sinclair/typebox/build/esm/type/indexed/indexed.mjs
function FromRest(types, key) {
  return types.map((type3) => IndexFromPropertyKey(type3, key));
}
function FromIntersectRest(types) {
  return types.filter((type3) => !IsNever(type3));
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
function FromArray(type3, key) {
  return key === "[number]" ? type3 : Never();
}
function FromProperty(properties, propertyKey) {
  return propertyKey in properties ? properties[propertyKey] : Never();
}
function IndexFromPropertyKey(type3, propertyKey) {
  return IsIntersect(type3) ? FromIntersect(type3.allOf, propertyKey) : IsUnion(type3) ? FromUnion3(type3.anyOf, propertyKey) : IsTuple(type3) ? FromTuple(type3.items ?? [], propertyKey) : IsArray3(type3) ? FromArray(type3.items, propertyKey) : IsObject3(type3) ? FromProperty(type3.properties, propertyKey) : Never();
}
function IndexFromPropertyKeys(type3, propertyKeys) {
  return propertyKeys.map((propertyKey) => IndexFromPropertyKey(type3, propertyKey));
}
function FromSchema(type3, propertyKeys) {
  return UnionEvaluated(IndexFromPropertyKeys(type3, propertyKeys));
}
function IndexFromComputed(type3, key) {
  return Computed("Index", [type3, key]);
}
function Index(type3, key, options) {
  if (IsRef(type3) || IsRef(key)) {
    const error2 = `Index types using Ref parameters require both Type and Key to be of TSchema`;
    if (!IsSchema(type3) || !IsSchema(key))
      throw new TypeBoxError(error2);
    return Computed("Index", [type3, key]);
  }
  if (IsMappedResult(key))
    return IndexFromMappedResult(type3, key, options);
  if (IsMappedKey(key))
    return IndexFromMappedKey(type3, key, options);
  return CreateType(IsSchema(key) ? FromSchema(type3, IndexPropertyKeys(key)) : FromSchema(type3, key), options);
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
function MappedIndexPropertyKey(type3, key, options) {
  return { [key]: Index(type3, [key], Clone(options)) };
}
function MappedIndexPropertyKeys(type3, propertyKeys, options) {
  return propertyKeys.reduce((result, left) => {
    return { ...result, ...MappedIndexPropertyKey(type3, left, options) };
  }, {});
}
function MappedIndexProperties(type3, mappedKey, options) {
  return MappedIndexPropertyKeys(type3, mappedKey.keys, options);
}
function IndexFromMappedKey(type3, mappedKey, options) {
  const properties = MappedIndexProperties(type3, mappedKey, options);
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
function Mapped(key, map3, options) {
  const K = IsSchema(key) ? IndexPropertyKeys(key) : key;
  const RT = map3({ [Kind]: "MappedKey", keys: K });
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
function RemoveOptionalFromType2(type3) {
  return Discard(type3, [OptionalKind]);
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
function FromPromise(type3) {
  return Awaited(type3);
}
function FromRest3(types) {
  return types.map((type3) => Awaited(type3));
}
function Awaited(type3, options) {
  return CreateType(IsComputed(type3) ? FromComputed(type3.target, type3.parameters) : IsIntersect(type3) ? FromIntersect2(type3.allOf) : IsUnion(type3) ? FromUnion4(type3.anyOf) : IsPromise2(type3) ? FromPromise(type3.item) : IsRef(type3) ? FromRef(type3.$ref) : type3, options);
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
function KeyOfPropertyKeys(type3) {
  return IsIntersect(type3) ? FromIntersect3(type3.allOf) : IsUnion(type3) ? FromUnion5(type3.anyOf) : IsTuple(type3) ? FromTuple2(type3.items ?? []) : IsArray3(type3) ? FromArray2(type3.items) : IsObject3(type3) ? FromProperties5(type3.properties) : IsRecord(type3) ? FromPatternProperties(type3.patternProperties) : [];
}
function KeyOfPattern(schema) {
  includePatternProperties = true;
  const keys = KeyOfPropertyKeys(schema);
  includePatternProperties = false;
  const pattern2 = keys.map((key) => `(${key})`);
  return `^(${pattern2.join("|")})$`;
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
function KeyOfFromType(type3, options) {
  const propertyKeys = KeyOfPropertyKeys(type3);
  const propertyKeyTypes = KeyOfPropertyKeysToRest(propertyKeys);
  const result = UnionEvaluated(propertyKeyTypes);
  return CreateType(result, options);
}
function KeyOfPropertyKeysToRest(propertyKeys) {
  return propertyKeys.map((L) => L === "[number]" ? Number2() : Literal(L));
}
function KeyOf(type3, options) {
  return IsComputed(type3) ? FromComputed2(type3.target, type3.parameters) : IsRef(type3) ? FromRef2(type3.$ref) : IsMappedResult(type3) ? KeyOfFromMappedResult(type3, options) : KeyOfFromType(type3, options);
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
function KeyOfPropertyEntries(schema) {
  const keys = KeyOfPropertyKeys(schema);
  const schemas = IndexFromPropertyKeys(schema, keys);
  return keys.map((_, index) => [keys[index], schemas[index]]);
}
var init_keyof_property_entries = __esm(() => {
  init_indexed();
  init_keyof_property_keys();
});

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
function FromProperties7(value2) {
  const Acc = {};
  for (const K of globalThis.Object.getOwnPropertyNames(value2))
    Acc[K] = Readonly(FromValue(value2[K], false));
  return Acc;
}
function ConditionalReadonly(T, root) {
  return root === true ? T : Readonly(T);
}
function FromValue(value2, root) {
  return IsAsyncIterator(value2) ? ConditionalReadonly(Any(), root) : IsIterator(value2) ? ConditionalReadonly(Any(), root) : IsArray(value2) ? Readonly(Tuple(FromArray3(value2))) : IsUint8Array(value2) ? Uint8Array2() : IsDate(value2) ? Date2() : IsObject(value2) ? ConditionalReadonly(Object2(FromProperties7(value2)), root) : IsFunction(value2) ? ConditionalReadonly(Function([], Unknown()), root) : IsUndefined(value2) ? Undefined() : IsNull(value2) ? Null() : IsSymbol(value2) ? Symbol2() : IsBigInt(value2) ? BigInt2() : IsNumber(value2) ? Literal(value2) : IsBoolean(value2) ? Literal(value2) : IsString(value2) ? Literal(value2) : Object2({});
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
  const anyOf = values2.map((value2) => Literal(value2));
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
  return exports_type.IsNever(right) || exports_type.IsIntersect(right) || exports_type.IsUnion(right) || exports_type.IsUnknown(right) || exports_type.IsAny(right);
}
function StructuralRight(left, right) {
  return exports_type.IsNever(right) ? FromNeverRight(left, right) : exports_type.IsIntersect(right) ? FromIntersectRight(left, right) : exports_type.IsUnion(right) ? FromUnionRight(left, right) : exports_type.IsUnknown(right) ? FromUnknownRight(left, right) : exports_type.IsAny(right) ? FromAnyRight(left, right) : Throw("StructuralRight");
}
function FromAnyRight(left, right) {
  return ExtendsResult.True;
}
function FromAny(left, right) {
  return exports_type.IsIntersect(right) ? FromIntersectRight(left, right) : exports_type.IsUnion(right) && right.anyOf.some((schema) => exports_type.IsAny(schema) || exports_type.IsUnknown(schema)) ? ExtendsResult.True : exports_type.IsUnion(right) ? ExtendsResult.Union : exports_type.IsUnknown(right) ? ExtendsResult.True : exports_type.IsAny(right) ? ExtendsResult.True : ExtendsResult.Union;
}
function FromArrayRight(left, right) {
  return exports_type.IsUnknown(left) ? ExtendsResult.False : exports_type.IsAny(left) ? ExtendsResult.Union : exports_type.IsNever(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromArray4(left, right) {
  return exports_type.IsObject(right) && IsObjectArrayLike(right) ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : !exports_type.IsArray(right) ? ExtendsResult.False : IntoBooleanResult(Visit3(left.items, right.items));
}
function FromAsyncIterator(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : !exports_type.IsAsyncIterator(right) ? ExtendsResult.False : IntoBooleanResult(Visit3(left.items, right.items));
}
function FromBigInt(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type.IsObject(right) ? FromObjectRight(left, right) : exports_type.IsRecord(right) ? FromRecordRight(left, right) : exports_type.IsBigInt(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromBooleanRight(left, right) {
  return exports_type.IsLiteralBoolean(left) ? ExtendsResult.True : exports_type.IsBoolean(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromBoolean(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type.IsObject(right) ? FromObjectRight(left, right) : exports_type.IsRecord(right) ? FromRecordRight(left, right) : exports_type.IsBoolean(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromConstructor(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type.IsObject(right) ? FromObjectRight(left, right) : !exports_type.IsConstructor(right) ? ExtendsResult.False : left.parameters.length > right.parameters.length ? ExtendsResult.False : !left.parameters.every((schema, index) => IntoBooleanResult(Visit3(right.parameters[index], schema)) === ExtendsResult.True) ? ExtendsResult.False : IntoBooleanResult(Visit3(left.returns, right.returns));
}
function FromDate(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type.IsObject(right) ? FromObjectRight(left, right) : exports_type.IsRecord(right) ? FromRecordRight(left, right) : exports_type.IsDate(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromFunction(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type.IsObject(right) ? FromObjectRight(left, right) : !exports_type.IsFunction(right) ? ExtendsResult.False : left.parameters.length > right.parameters.length ? ExtendsResult.False : !left.parameters.every((schema, index) => IntoBooleanResult(Visit3(right.parameters[index], schema)) === ExtendsResult.True) ? ExtendsResult.False : IntoBooleanResult(Visit3(left.returns, right.returns));
}
function FromIntegerRight(left, right) {
  return exports_type.IsLiteral(left) && exports_value.IsNumber(left.const) ? ExtendsResult.True : exports_type.IsNumber(left) || exports_type.IsInteger(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromInteger(left, right) {
  return exports_type.IsInteger(right) || exports_type.IsNumber(right) ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : exports_type.IsObject(right) ? FromObjectRight(left, right) : exports_type.IsRecord(right) ? FromRecordRight(left, right) : ExtendsResult.False;
}
function FromIntersectRight(left, right) {
  return right.allOf.every((schema) => Visit3(left, schema) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromIntersect4(left, right) {
  return left.allOf.some((schema) => Visit3(schema, right) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromIterator(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : !exports_type.IsIterator(right) ? ExtendsResult.False : IntoBooleanResult(Visit3(left.items, right.items));
}
function FromLiteral2(left, right) {
  return exports_type.IsLiteral(right) && right.const === left.const ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : exports_type.IsObject(right) ? FromObjectRight(left, right) : exports_type.IsRecord(right) ? FromRecordRight(left, right) : exports_type.IsString(right) ? FromStringRight(left, right) : exports_type.IsNumber(right) ? FromNumberRight(left, right) : exports_type.IsInteger(right) ? FromIntegerRight(left, right) : exports_type.IsBoolean(right) ? FromBooleanRight(left, right) : ExtendsResult.False;
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
    if (!exports_type.IsNot(current))
      break;
    current = current.not;
    depth += 1;
  }
  return depth % 2 === 0 ? current : Unknown();
}
function FromNot(left, right) {
  return exports_type.IsNot(left) ? Visit3(UnwrapTNot(left), right) : exports_type.IsNot(right) ? Visit3(left, UnwrapTNot(right)) : Throw("Invalid fallthrough for Not");
}
function FromNull(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type.IsObject(right) ? FromObjectRight(left, right) : exports_type.IsRecord(right) ? FromRecordRight(left, right) : exports_type.IsNull(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromNumberRight(left, right) {
  return exports_type.IsLiteralNumber(left) ? ExtendsResult.True : exports_type.IsNumber(left) || exports_type.IsInteger(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromNumber(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type.IsObject(right) ? FromObjectRight(left, right) : exports_type.IsRecord(right) ? FromRecordRight(left, right) : exports_type.IsInteger(right) || exports_type.IsNumber(right) ? ExtendsResult.True : ExtendsResult.False;
}
function IsObjectPropertyCount(schema, count) {
  return Object.getOwnPropertyNames(schema.properties).length === count;
}
function IsObjectStringLike(schema) {
  return IsObjectArrayLike(schema);
}
function IsObjectSymbolLike(schema) {
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "description" in schema.properties && exports_type.IsUnion(schema.properties.description) && schema.properties.description.anyOf.length === 2 && (exports_type.IsString(schema.properties.description.anyOf[0]) && exports_type.IsUndefined(schema.properties.description.anyOf[1]) || exports_type.IsString(schema.properties.description.anyOf[1]) && exports_type.IsUndefined(schema.properties.description.anyOf[0]));
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
  return Visit3(left, right) === ExtendsResult.False ? ExtendsResult.False : exports_type.IsOptional(left) && !exports_type.IsOptional(right) ? ExtendsResult.False : ExtendsResult.True;
}
function FromObjectRight(left, right) {
  return exports_type.IsUnknown(left) ? ExtendsResult.False : exports_type.IsAny(left) ? ExtendsResult.Union : exports_type.IsNever(left) || exports_type.IsLiteralString(left) && IsObjectStringLike(right) || exports_type.IsLiteralNumber(left) && IsObjectNumberLike(right) || exports_type.IsLiteralBoolean(left) && IsObjectBooleanLike(right) || exports_type.IsSymbol(left) && IsObjectSymbolLike(right) || exports_type.IsBigInt(left) && IsObjectBigIntLike(right) || exports_type.IsString(left) && IsObjectStringLike(right) || exports_type.IsSymbol(left) && IsObjectSymbolLike(right) || exports_type.IsNumber(left) && IsObjectNumberLike(right) || exports_type.IsInteger(left) && IsObjectNumberLike(right) || exports_type.IsBoolean(left) && IsObjectBooleanLike(right) || exports_type.IsUint8Array(left) && IsObjectUint8ArrayLike(right) || exports_type.IsDate(left) && IsObjectDateLike(right) || exports_type.IsConstructor(left) && IsObjectConstructorLike(right) || exports_type.IsFunction(left) && IsObjectFunctionLike(right) ? ExtendsResult.True : exports_type.IsRecord(left) && exports_type.IsString(RecordKey(left)) ? (() => {
    return right[Hint] === "Record" ? ExtendsResult.True : ExtendsResult.False;
  })() : exports_type.IsRecord(left) && exports_type.IsNumber(RecordKey(left)) ? (() => {
    return IsObjectPropertyCount(right, 0) ? ExtendsResult.True : ExtendsResult.False;
  })() : ExtendsResult.False;
}
function FromObject(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type.IsRecord(right) ? FromRecordRight(left, right) : !exports_type.IsObject(right) ? ExtendsResult.False : (() => {
    for (const key of Object.getOwnPropertyNames(right.properties)) {
      if (!(key in left.properties) && !exports_type.IsOptional(right.properties[key])) {
        return ExtendsResult.False;
      }
      if (exports_type.IsOptional(right.properties[key])) {
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
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type.IsObject(right) && IsObjectPromiseLike(right) ? ExtendsResult.True : !exports_type.IsPromise(right) ? ExtendsResult.False : IntoBooleanResult(Visit3(left.item, right.item));
}
function RecordKey(schema) {
  return PatternNumberExact in schema.patternProperties ? Number2() : (PatternStringExact in schema.patternProperties) ? String2() : Throw("Unknown record key pattern");
}
function RecordValue(schema) {
  return PatternNumberExact in schema.patternProperties ? schema.patternProperties[PatternNumberExact] : (PatternStringExact in schema.patternProperties) ? schema.patternProperties[PatternStringExact] : Throw("Unable to get record value schema");
}
function FromRecordRight(left, right) {
  const [Key, Value] = [RecordKey(right), RecordValue(right)];
  return exports_type.IsLiteralString(left) && exports_type.IsNumber(Key) && IntoBooleanResult(Visit3(left, Value)) === ExtendsResult.True ? ExtendsResult.True : exports_type.IsUint8Array(left) && exports_type.IsNumber(Key) ? Visit3(left, Value) : exports_type.IsString(left) && exports_type.IsNumber(Key) ? Visit3(left, Value) : exports_type.IsArray(left) && exports_type.IsNumber(Key) ? Visit3(left, Value) : exports_type.IsObject(left) ? (() => {
    for (const key of Object.getOwnPropertyNames(left.properties)) {
      if (Property(Value, left.properties[key]) === ExtendsResult.False) {
        return ExtendsResult.False;
      }
    }
    return ExtendsResult.True;
  })() : ExtendsResult.False;
}
function FromRecord(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type.IsObject(right) ? FromObjectRight(left, right) : !exports_type.IsRecord(right) ? ExtendsResult.False : Visit3(RecordValue(left), RecordValue(right));
}
function FromRegExp(left, right) {
  const L = exports_type.IsRegExp(left) ? String2() : left;
  const R = exports_type.IsRegExp(right) ? String2() : right;
  return Visit3(L, R);
}
function FromStringRight(left, right) {
  return exports_type.IsLiteral(left) && exports_value.IsString(left.const) ? ExtendsResult.True : exports_type.IsString(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromString(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type.IsObject(right) ? FromObjectRight(left, right) : exports_type.IsRecord(right) ? FromRecordRight(left, right) : exports_type.IsString(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromSymbol(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type.IsObject(right) ? FromObjectRight(left, right) : exports_type.IsRecord(right) ? FromRecordRight(left, right) : exports_type.IsSymbol(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromTemplateLiteral2(left, right) {
  return exports_type.IsTemplateLiteral(left) ? Visit3(TemplateLiteralToUnion(left), right) : exports_type.IsTemplateLiteral(right) ? Visit3(left, TemplateLiteralToUnion(right)) : Throw("Invalid fallthrough for TemplateLiteral");
}
function IsArrayOfTuple(left, right) {
  return exports_type.IsArray(right) && left.items !== undefined && left.items.every((schema) => Visit3(schema, right.items) === ExtendsResult.True);
}
function FromTupleRight(left, right) {
  return exports_type.IsNever(left) ? ExtendsResult.True : exports_type.IsUnknown(left) ? ExtendsResult.False : exports_type.IsAny(left) ? ExtendsResult.Union : ExtendsResult.False;
}
function FromTuple3(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type.IsObject(right) && IsObjectArrayLike(right) ? ExtendsResult.True : exports_type.IsArray(right) && IsArrayOfTuple(left, right) ? ExtendsResult.True : !exports_type.IsTuple(right) ? ExtendsResult.False : exports_value.IsUndefined(left.items) && !exports_value.IsUndefined(right.items) || !exports_value.IsUndefined(left.items) && exports_value.IsUndefined(right.items) ? ExtendsResult.False : exports_value.IsUndefined(left.items) && !exports_value.IsUndefined(right.items) ? ExtendsResult.True : left.items.every((schema, index) => Visit3(schema, right.items[index]) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUint8Array(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type.IsObject(right) ? FromObjectRight(left, right) : exports_type.IsRecord(right) ? FromRecordRight(left, right) : exports_type.IsUint8Array(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUndefined(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type.IsObject(right) ? FromObjectRight(left, right) : exports_type.IsRecord(right) ? FromRecordRight(left, right) : exports_type.IsVoid(right) ? FromVoidRight(left, right) : exports_type.IsUndefined(right) ? ExtendsResult.True : ExtendsResult.False;
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
  return exports_type.IsNever(right) ? FromNeverRight(left, right) : exports_type.IsIntersect(right) ? FromIntersectRight(left, right) : exports_type.IsUnion(right) ? FromUnionRight(left, right) : exports_type.IsAny(right) ? FromAnyRight(left, right) : exports_type.IsString(right) ? FromStringRight(left, right) : exports_type.IsNumber(right) ? FromNumberRight(left, right) : exports_type.IsInteger(right) ? FromIntegerRight(left, right) : exports_type.IsBoolean(right) ? FromBooleanRight(left, right) : exports_type.IsArray(right) ? FromArrayRight(left, right) : exports_type.IsTuple(right) ? FromTupleRight(left, right) : exports_type.IsObject(right) ? FromObjectRight(left, right) : exports_type.IsUnknown(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromVoidRight(left, right) {
  return exports_type.IsUndefined(left) ? ExtendsResult.True : exports_type.IsUndefined(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromVoid(left, right) {
  return exports_type.IsIntersect(right) ? FromIntersectRight(left, right) : exports_type.IsUnion(right) ? FromUnionRight(left, right) : exports_type.IsUnknown(right) ? FromUnknownRight(left, right) : exports_type.IsAny(right) ? FromAnyRight(left, right) : exports_type.IsObject(right) ? FromObjectRight(left, right) : exports_type.IsVoid(right) ? ExtendsResult.True : ExtendsResult.False;
}
function Visit3(left, right) {
  return exports_type.IsTemplateLiteral(left) || exports_type.IsTemplateLiteral(right) ? FromTemplateLiteral2(left, right) : exports_type.IsRegExp(left) || exports_type.IsRegExp(right) ? FromRegExp(left, right) : exports_type.IsNot(left) || exports_type.IsNot(right) ? FromNot(left, right) : exports_type.IsAny(left) ? FromAny(left, right) : exports_type.IsArray(left) ? FromArray4(left, right) : exports_type.IsBigInt(left) ? FromBigInt(left, right) : exports_type.IsBoolean(left) ? FromBoolean(left, right) : exports_type.IsAsyncIterator(left) ? FromAsyncIterator(left, right) : exports_type.IsConstructor(left) ? FromConstructor(left, right) : exports_type.IsDate(left) ? FromDate(left, right) : exports_type.IsFunction(left) ? FromFunction(left, right) : exports_type.IsInteger(left) ? FromInteger(left, right) : exports_type.IsIntersect(left) ? FromIntersect4(left, right) : exports_type.IsIterator(left) ? FromIterator(left, right) : exports_type.IsLiteral(left) ? FromLiteral2(left, right) : exports_type.IsNever(left) ? FromNever(left, right) : exports_type.IsNull(left) ? FromNull(left, right) : exports_type.IsNumber(left) ? FromNumber(left, right) : exports_type.IsObject(left) ? FromObject(left, right) : exports_type.IsRecord(left) ? FromRecord(left, right) : exports_type.IsString(left) ? FromString(left, right) : exports_type.IsSymbol(left) ? FromSymbol(left, right) : exports_type.IsTuple(left) ? FromTuple3(left, right) : exports_type.IsPromise(left) ? FromPromise2(left, right) : exports_type.IsUint8Array(left) ? FromUint8Array(left, right) : exports_type.IsUndefined(left) ? FromUndefined(left, right) : exports_type.IsUnion(left) ? FromUnion6(left, right) : exports_type.IsUnknown(left) ? FromUnknown(left, right) : exports_type.IsVoid(left) ? FromVoid(left, right) : Throw(`Unknown left type operand '${left[Kind]}'`);
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
  (function(ExtendsResult2) {
    ExtendsResult2[ExtendsResult2["Union"] = 0] = "Union";
    ExtendsResult2[ExtendsResult2["True"] = 1] = "True";
    ExtendsResult2[ExtendsResult2["False"] = 2] = "False";
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
  return schema.allOf.every((schema2) => ExtendsUndefinedCheck(schema2));
}
function Union2(schema) {
  return schema.anyOf.some((schema2) => ExtendsUndefinedCheck(schema2));
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
function RecordCreateFromPattern(pattern2, T, options) {
  return CreateType({ [Kind]: "Record", type: "object", patternProperties: { [pattern2]: T } }, options);
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
function FromUnionKey(key, type3, options) {
  return RecordCreateFromKeys(IndexPropertyKeys(Union(key)), type3, options);
}
function FromLiteralKey(key, type3, options) {
  return RecordCreateFromKeys([key.toString()], type3, options);
}
function FromRegExpKey(key, type3, options) {
  return RecordCreateFromPattern(key.source, type3, options);
}
function FromStringKey(key, type3, options) {
  const pattern2 = IsUndefined(key.pattern) ? PatternStringExact : key.pattern;
  return RecordCreateFromPattern(pattern2, type3, options);
}
function FromAnyKey(_, type3, options) {
  return RecordCreateFromPattern(PatternStringExact, type3, options);
}
function FromNeverKey(_key, type3, options) {
  return RecordCreateFromPattern(PatternNeverExact, type3, options);
}
function FromBooleanKey(_key, type3, options) {
  return Object2({ true: type3, false: type3 }, options);
}
function FromIntegerKey(_key, type3, options) {
  return RecordCreateFromPattern(PatternNumberExact, type3, options);
}
function FromNumberKey(_, type3, options) {
  return RecordCreateFromPattern(PatternNumberExact, type3, options);
}
function Record(key, type3, options = {}) {
  return IsUnion(key) ? FromUnionKey(key.anyOf, type3, options) : IsTemplateLiteral(key) ? FromTemplateLiteralKey(key, type3, options) : IsLiteral(key) ? FromLiteralKey(key.const, type3, options) : IsBoolean3(key) ? FromBooleanKey(key, type3, options) : IsInteger2(key) ? FromIntegerKey(key, type3, options) : IsNumber3(key) ? FromNumberKey(key, type3, options) : IsRegExp2(key) ? FromRegExpKey(key, type3, options) : IsString3(key) ? FromStringKey(key, type3, options) : IsAny(key) ? FromAnyKey(key, type3, options) : IsNever(key) ? FromNeverKey(key, type3, options) : Never(options);
}
function RecordPattern(record) {
  return globalThis.Object.getOwnPropertyNames(record.patternProperties)[0];
}
function RecordKey2(type3) {
  const pattern2 = RecordPattern(type3);
  return pattern2 === PatternStringExact ? String2() : pattern2 === PatternNumberExact ? Number2() : String2({ pattern: pattern2 });
}
function RecordValue2(type3) {
  return type3.patternProperties[RecordPattern(type3)];
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
function FromConstructor2(args, type3) {
  type3.parameters = FromTypes(args, type3.parameters);
  type3.returns = FromType(args, type3.returns);
  return type3;
}
function FromFunction2(args, type3) {
  type3.parameters = FromTypes(args, type3.parameters);
  type3.returns = FromType(args, type3.returns);
  return type3;
}
function FromIntersect5(args, type3) {
  type3.allOf = FromTypes(args, type3.allOf);
  return type3;
}
function FromUnion7(args, type3) {
  type3.anyOf = FromTypes(args, type3.anyOf);
  return type3;
}
function FromTuple4(args, type3) {
  if (IsUndefined(type3.items))
    return type3;
  type3.items = FromTypes(args, type3.items);
  return type3;
}
function FromArray5(args, type3) {
  type3.items = FromType(args, type3.items);
  return type3;
}
function FromAsyncIterator2(args, type3) {
  type3.items = FromType(args, type3.items);
  return type3;
}
function FromIterator2(args, type3) {
  type3.items = FromType(args, type3.items);
  return type3;
}
function FromPromise3(args, type3) {
  type3.item = FromType(args, type3.item);
  return type3;
}
function FromObject2(args, type3) {
  const mappedProperties = FromProperties11(args, type3.properties);
  return { ...type3, ...Object2(mappedProperties) };
}
function FromRecord2(args, type3) {
  const mappedKey = FromType(args, RecordKey2(type3));
  const mappedValue = FromType(args, RecordValue2(type3));
  const result = Record(mappedKey, mappedValue);
  return { ...type3, ...result };
}
function FromArgument(args, argument2) {
  return argument2.index in args ? args[argument2.index] : Unknown();
}
function FromProperty2(args, type3) {
  const isReadonly = IsReadonly(type3);
  const isOptional = IsOptional(type3);
  const mapped2 = FromType(args, type3);
  return isReadonly && isOptional ? ReadonlyOptional(mapped2) : isReadonly && !isOptional ? Readonly(mapped2) : !isReadonly && isOptional ? Optional(mapped2) : mapped2;
}
function FromProperties11(args, properties) {
  return globalThis.Object.getOwnPropertyNames(properties).reduce((result, key) => {
    return { ...result, [key]: FromProperty2(args, properties[key]) };
  }, {});
}
function FromTypes(args, types) {
  return types.map((type3) => FromType(args, type3));
}
function FromType(args, type3) {
  return IsConstructor(type3) ? FromConstructor2(args, type3) : IsFunction3(type3) ? FromFunction2(args, type3) : IsIntersect(type3) ? FromIntersect5(args, type3) : IsUnion(type3) ? FromUnion7(args, type3) : IsTuple(type3) ? FromTuple4(args, type3) : IsArray3(type3) ? FromArray5(args, type3) : IsAsyncIterator3(type3) ? FromAsyncIterator2(args, type3) : IsIterator3(type3) ? FromIterator2(args, type3) : IsPromise2(type3) ? FromPromise3(args, type3) : IsObject3(type3) ? FromObject2(args, type3) : IsRecord(type3) ? FromRecord2(args, type3) : IsArgument(type3) ? FromArgument(args, type3) : type3;
}
function Instantiate(type3, args) {
  return FromType(args, CloneType(type3));
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
function ApplyUncapitalize(value2) {
  const [first, rest] = [value2.slice(0, 1), value2.slice(1)];
  return [first.toLowerCase(), rest].join("");
}
function ApplyCapitalize(value2) {
  const [first, rest] = [value2.slice(0, 1), value2.slice(1)];
  return [first.toUpperCase(), rest].join("");
}
function ApplyUppercase(value2) {
  return value2.toUpperCase();
}
function ApplyLowercase(value2) {
  return value2.toLowerCase();
}
function FromTemplateLiteral3(schema, mode, options) {
  const expression = TemplateLiteralParseExact(schema.pattern);
  const finite2 = IsTemplateLiteralExpressionFinite(expression);
  if (!finite2)
    return { ...schema, pattern: FromLiteralValue(schema.pattern, mode) };
  const strings = [...TemplateLiteralExpressionGenerate(expression)];
  const literals = strings.map((value2) => Literal(value2));
  const mapped2 = FromRest5(literals, mode);
  const union3 = Union(mapped2);
  return TemplateLiteral([union3], options);
}
function FromLiteralValue(value2, mode) {
  return typeof value2 === "string" ? mode === "Uncapitalize" ? ApplyUncapitalize(value2) : mode === "Capitalize" ? ApplyCapitalize(value2) : mode === "Uppercase" ? ApplyUppercase(value2) : mode === "Lowercase" ? ApplyLowercase(value2) : value2 : value2.toString();
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
  return types.map((type3) => OmitResolve(type3, propertyKeys));
}
function FromUnion8(types, propertyKeys) {
  return types.map((type3) => OmitResolve(type3, propertyKeys));
}
function FromProperty3(properties, key) {
  const { [key]: _, ...R } = properties;
  return R;
}
function FromProperties13(properties, propertyKeys) {
  return propertyKeys.reduce((T, K2) => FromProperty3(T, K2), properties);
}
function FromObject3(type3, propertyKeys, properties) {
  const options = Discard(type3, [TransformKind, "$id", "required", "properties"]);
  const mappedProperties = FromProperties13(properties, propertyKeys);
  return Object2(mappedProperties, options);
}
function UnionFromPropertyKeys(propertyKeys) {
  const result = propertyKeys.reduce((result2, key) => IsLiteralValue(key) ? [...result2, Literal(key)] : result2, []);
  return Union(result);
}
function OmitResolve(type3, propertyKeys) {
  return IsIntersect(type3) ? Intersect(FromIntersect6(type3.allOf, propertyKeys)) : IsUnion(type3) ? Union(FromUnion8(type3.anyOf, propertyKeys)) : IsObject3(type3) ? FromObject3(type3, propertyKeys, type3.properties) : Object2({});
}
function Omit(type3, key, options) {
  const typeKey = IsArray(key) ? UnionFromPropertyKeys(key) : key;
  const propertyKeys = IsSchema(key) ? IndexPropertyKeys(key) : key;
  const isTypeRef = IsRef(type3);
  const isKeyRef = IsRef(key);
  return IsMappedResult(type3) ? OmitFromMappedResult(type3, propertyKeys, options) : IsMappedKey(key) ? OmitFromMappedKey(type3, key, options) : isTypeRef && isKeyRef ? Computed("Omit", [type3, typeKey], options) : !isTypeRef && isKeyRef ? Computed("Omit", [type3, typeKey], options) : isTypeRef && !isKeyRef ? Computed("Omit", [type3, typeKey], options) : CreateType({ ...OmitResolve(type3, propertyKeys), ...options });
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
function FromPropertyKey2(type3, key, options) {
  return { [key]: Omit(type3, [key], Clone(options)) };
}
function FromPropertyKeys2(type3, propertyKeys, options) {
  return propertyKeys.reduce((Acc, LK) => {
    return { ...Acc, ...FromPropertyKey2(type3, LK, options) };
  }, {});
}
function FromMappedKey3(type3, mappedKey, options) {
  return FromPropertyKeys2(type3, mappedKey.keys, options);
}
function OmitFromMappedKey(type3, mappedKey, options) {
  const properties = FromMappedKey3(type3, mappedKey, options);
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
  return types.map((type3) => PickResolve(type3, propertyKeys));
}
function FromUnion9(types, propertyKeys) {
  return types.map((type3) => PickResolve(type3, propertyKeys));
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
  const result = propertyKeys.reduce((result2, key) => IsLiteralValue(key) ? [...result2, Literal(key)] : result2, []);
  return Union(result);
}
function PickResolve(type3, propertyKeys) {
  return IsIntersect(type3) ? Intersect(FromIntersect7(type3.allOf, propertyKeys)) : IsUnion(type3) ? Union(FromUnion9(type3.anyOf, propertyKeys)) : IsObject3(type3) ? FromObject4(type3, propertyKeys, type3.properties) : Object2({});
}
function Pick(type3, key, options) {
  const typeKey = IsArray(key) ? UnionFromPropertyKeys2(key) : key;
  const propertyKeys = IsSchema(key) ? IndexPropertyKeys(key) : key;
  const isTypeRef = IsRef(type3);
  const isKeyRef = IsRef(key);
  return IsMappedResult(type3) ? PickFromMappedResult(type3, propertyKeys, options) : IsMappedKey(key) ? PickFromMappedKey(type3, key, options) : isTypeRef && isKeyRef ? Computed("Pick", [type3, typeKey], options) : !isTypeRef && isKeyRef ? Computed("Pick", [type3, typeKey], options) : isTypeRef && !isKeyRef ? Computed("Pick", [type3, typeKey], options) : CreateType({ ...PickResolve(type3, propertyKeys), ...options });
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
function FromPropertyKey3(type3, key, options) {
  return {
    [key]: Pick(type3, [key], Clone(options))
  };
}
function FromPropertyKeys3(type3, propertyKeys, options) {
  return propertyKeys.reduce((result, leftKey) => {
    return { ...result, ...FromPropertyKey3(type3, leftKey, options) };
  }, {});
}
function FromMappedKey4(type3, mappedKey, options) {
  return FromPropertyKeys3(type3, mappedKey.keys, options);
}
function PickFromMappedKey(type3, mappedKey, options) {
  const properties = FromMappedKey4(type3, mappedKey, options);
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
function FromObject5(type3, properties) {
  const options = Discard(type3, [TransformKind, "$id", "required", "properties"]);
  const mappedProperties = FromProperties16(properties);
  return Object2(mappedProperties, options);
}
function FromRest6(types) {
  return types.map((type3) => PartialResolve(type3));
}
function PartialResolve(type3) {
  return IsComputed(type3) ? FromComputed3(type3.target, type3.parameters) : IsRef(type3) ? FromRef3(type3.$ref) : IsIntersect(type3) ? Intersect(FromRest6(type3.allOf)) : IsUnion(type3) ? Union(FromRest6(type3.anyOf)) : IsObject3(type3) ? FromObject5(type3, type3.properties) : IsBigInt3(type3) ? type3 : IsBoolean3(type3) ? type3 : IsInteger2(type3) ? type3 : IsLiteral(type3) ? type3 : IsNull3(type3) ? type3 : IsNumber3(type3) ? type3 : IsString3(type3) ? type3 : IsSymbol3(type3) ? type3 : IsUndefined3(type3) ? type3 : Object2({});
}
function Partial(type3, options) {
  if (IsMappedResult(type3)) {
    return PartialFromMappedResult(type3, options);
  } else {
    return CreateType({ ...PartialResolve(type3), ...options });
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
function FromObject6(type3, properties) {
  const options = Discard(type3, [TransformKind, "$id", "required", "properties"]);
  const mappedProperties = FromProperties18(properties);
  return Object2(mappedProperties, options);
}
function FromRest7(types) {
  return types.map((type3) => RequiredResolve(type3));
}
function RequiredResolve(type3) {
  return IsComputed(type3) ? FromComputed4(type3.target, type3.parameters) : IsRef(type3) ? FromRef4(type3.$ref) : IsIntersect(type3) ? Intersect(FromRest7(type3.allOf)) : IsUnion(type3) ? Union(FromRest7(type3.anyOf)) : IsObject3(type3) ? FromObject6(type3, type3.properties) : IsBigInt3(type3) ? type3 : IsBoolean3(type3) ? type3 : IsInteger2(type3) ? type3 : IsLiteral(type3) ? type3 : IsNull3(type3) ? type3 : IsNumber3(type3) ? type3 : IsString3(type3) ? type3 : IsSymbol3(type3) ? type3 : IsUndefined3(type3) ? type3 : Object2({});
}
function Required(type3, options) {
  if (IsMappedResult(type3)) {
    return RequiredFromMappedResult(type3, options);
  } else {
    return CreateType({ ...RequiredResolve(type3), ...options });
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
  return types.map((type3) => {
    return IsRef(type3) ? Dereference(moduleProperties, type3.$ref) : FromType2(moduleProperties, type3);
  });
}
function Dereference(moduleProperties, ref2) {
  return ref2 in moduleProperties ? IsRef(moduleProperties[ref2]) ? Dereference(moduleProperties, moduleProperties[ref2].$ref) : FromType2(moduleProperties, moduleProperties[ref2]) : Never();
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
function FromArray6(moduleProperties, type3) {
  return Array2(FromType2(moduleProperties, type3));
}
function FromAsyncIterator3(moduleProperties, type3) {
  return AsyncIterator(FromType2(moduleProperties, type3));
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
function FromIterator3(moduleProperties, type3) {
  return Iterator(FromType2(moduleProperties, type3));
}
function FromObject7(moduleProperties, properties) {
  return Object2(globalThis.Object.keys(properties).reduce((result, key) => {
    return { ...result, [key]: FromType2(moduleProperties, properties[key]) };
  }, {}));
}
function FromRecord3(moduleProperties, type3) {
  const [value2, pattern2] = [FromType2(moduleProperties, RecordValue2(type3)), RecordPattern(type3)];
  const result = CloneType(type3);
  result.patternProperties[pattern2] = value2;
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
  return types.map((type3) => FromType2(moduleProperties, type3));
}
function FromType2(moduleProperties, type3) {
  return IsOptional(type3) ? CreateType(FromType2(moduleProperties, Discard(type3, [OptionalKind])), type3) : IsReadonly(type3) ? CreateType(FromType2(moduleProperties, Discard(type3, [ReadonlyKind])), type3) : IsTransform(type3) ? CreateType(FromTransform(moduleProperties, type3), type3) : IsArray3(type3) ? CreateType(FromArray6(moduleProperties, type3.items), type3) : IsAsyncIterator3(type3) ? CreateType(FromAsyncIterator3(moduleProperties, type3.items), type3) : IsComputed(type3) ? CreateType(FromComputed5(moduleProperties, type3.target, type3.parameters)) : IsConstructor(type3) ? CreateType(FromConstructor3(moduleProperties, type3.parameters, type3.returns), type3) : IsFunction3(type3) ? CreateType(FromFunction3(moduleProperties, type3.parameters, type3.returns), type3) : IsIntersect(type3) ? CreateType(FromIntersect8(moduleProperties, type3.allOf), type3) : IsIterator3(type3) ? CreateType(FromIterator3(moduleProperties, type3.items), type3) : IsObject3(type3) ? CreateType(FromObject7(moduleProperties, type3.properties), type3) : IsRecord(type3) ? CreateType(FromRecord3(moduleProperties, type3)) : IsTuple(type3) ? CreateType(FromTuple5(moduleProperties, type3.items || []), type3) : IsUnion(type3) ? CreateType(FromUnion10(moduleProperties, type3.anyOf), type3) : type3;
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
    const computed2 = ComputeModuleProperties($defs);
    const identified = this.WithIdentifiers(computed2);
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
function Not2(type3, options) {
  return CreateType({ [Kind]: "Not", not: type3 }, options);
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
  constructor(schema2) {
    this.schema = schema2;
  }
  Decode(decode) {
    return new TransformEncodeBuilder(this.schema, decode);
  }
}

class TransformEncodeBuilder {
  constructor(schema2, decode) {
    this.schema = schema2;
    this.decode = decode;
  }
  EncodeTransform(encode2, schema2) {
    const Encode = (value2) => schema2[TransformKind].Encode(encode2(value2));
    const Decode = (value2) => this.decode(schema2[TransformKind].Decode(value2));
    const Codec = { Encode, Decode };
    return { ...schema2, [TransformKind]: Codec };
  }
  EncodeSchema(encode2, schema2) {
    const Codec = { Decode: this.decode, Encode: encode2 };
    return { ...schema2, [TransformKind]: Codec };
  }
  Encode(encode2) {
    return IsTransform(this.schema) ? this.EncodeTransform(encode2, this.schema) : this.EncodeSchema(encode2, this.schema);
  }
}
function Transform(schema2) {
  return new TransformDecodeBuilder(schema2);
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

// node_modules/@sinclair/typebox/build/esm/type/type/json.mjs
class JsonTypeBuilder {
  ReadonlyOptional(type3) {
    return ReadonlyOptional(type3);
  }
  Readonly(type3, enable) {
    return Readonly(type3, enable ?? true);
  }
  Optional(type3, enable) {
    return Optional(type3, enable ?? true);
  }
  Any(options) {
    return Any(options);
  }
  Array(items, options) {
    return Array2(items, options);
  }
  Boolean(options) {
    return Boolean(options);
  }
  Capitalize(schema2, options) {
    return Capitalize(schema2, options);
  }
  Composite(schemas, options) {
    return Composite(schemas, options);
  }
  Const(value2, options) {
    return Const(value2, options);
  }
  Enum(item, options) {
    return Enum(item, options);
  }
  Exclude(unionType, excludedMembers, options) {
    return Exclude(unionType, excludedMembers, options);
  }
  Extends(L, R, T, F, options) {
    return Extends(L, R, T, F, options);
  }
  Extract(type3, union3, options) {
    return Extract(type3, union3, options);
  }
  Index(type3, key, options) {
    return Index(type3, key, options);
  }
  Integer(options) {
    return Integer(options);
  }
  Intersect(types, options) {
    return Intersect(types, options);
  }
  KeyOf(type3, options) {
    return KeyOf(type3, options);
  }
  Literal(literalValue, options) {
    return Literal(literalValue, options);
  }
  Lowercase(type3, options) {
    return Lowercase(type3, options);
  }
  Mapped(key, map3, options) {
    return Mapped(key, map3, options);
  }
  Module(properties) {
    return Module(properties);
  }
  Never(options) {
    return Never(options);
  }
  Not(type3, options) {
    return Not2(type3, options);
  }
  Null(options) {
    return Null(options);
  }
  Number(options) {
    return Number2(options);
  }
  Object(properties, options) {
    return Object2(properties, options);
  }
  Omit(schema2, selector, options) {
    return Omit(schema2, selector, options);
  }
  Partial(type3, options) {
    return Partial(type3, options);
  }
  Pick(type3, key, options) {
    return Pick(type3, key, options);
  }
  Record(key, value2, options) {
    return Record(key, value2, options);
  }
  Recursive(callback, options) {
    return Recursive(callback, options);
  }
  Ref(...args) {
    return Ref(args[0], args[1]);
  }
  Required(type3, options) {
    return Required(type3, options);
  }
  Rest(type3) {
    return Rest(type3);
  }
  String(options) {
    return String2(options);
  }
  TemplateLiteral(unresolved, options) {
    return TemplateLiteral(unresolved, options);
  }
  Transform(type3) {
    return Transform(type3);
  }
  Tuple(types, options) {
    return Tuple(types, options);
  }
  Uncapitalize(type3, options) {
    return Uncapitalize(type3, options);
  }
  Union(types, options) {
    return Union(types, options);
  }
  Unknown(options) {
    return Unknown(options);
  }
  Unsafe(options) {
    return Unsafe(options);
  }
  Uppercase(schema2, options) {
    return Uppercase(schema2, options);
  }
}
var init_json = __esm(() => {
  init_any2();
  init_array2();
  init_boolean2();
  init_composite2();
  init_const2();
  init_enum2();
  init_exclude2();
  init_extends2();
  init_extract2();
  init_indexed2();
  init_integer2();
  init_intersect2();
  init_intrinsic2();
  init_keyof2();
  init_literal2();
  init_mapped2();
  init_never2();
  init_not2();
  init_null2();
  init_module2();
  init_number2();
  init_object2();
  init_omit2();
  init_optional2();
  init_partial2();
  init_pick2();
  init_readonly2();
  init_readonly_optional2();
  init_record2();
  init_recursive2();
  init_ref2();
  init_required2();
  init_rest2();
  init_string2();
  init_template_literal2();
  init_transform2();
  init_tuple2();
  init_union2();
  init_unknown2();
  init_unsafe2();
});

// node_modules/@sinclair/typebox/build/esm/type/type/type.mjs
var exports_type3 = {};
__export(exports_type3, {
  Void: () => Void,
  Uppercase: () => Uppercase,
  Unsafe: () => Unsafe,
  Unknown: () => Unknown,
  Union: () => Union,
  Undefined: () => Undefined,
  Uncapitalize: () => Uncapitalize,
  Uint8Array: () => Uint8Array2,
  Tuple: () => Tuple,
  Transform: () => Transform,
  TemplateLiteral: () => TemplateLiteral,
  Symbol: () => Symbol2,
  String: () => String2,
  ReturnType: () => ReturnType,
  Rest: () => Rest,
  Required: () => Required,
  RegExp: () => RegExp2,
  Ref: () => Ref,
  Recursive: () => Recursive,
  Record: () => Record,
  ReadonlyOptional: () => ReadonlyOptional,
  Readonly: () => Readonly,
  Promise: () => Promise2,
  Pick: () => Pick,
  Partial: () => Partial,
  Parameters: () => Parameters,
  Optional: () => Optional,
  Omit: () => Omit,
  Object: () => Object2,
  Number: () => Number2,
  Null: () => Null,
  Not: () => Not2,
  Never: () => Never,
  Module: () => Module,
  Mapped: () => Mapped,
  Lowercase: () => Lowercase,
  Literal: () => Literal,
  KeyOf: () => KeyOf,
  Iterator: () => Iterator,
  Intersect: () => Intersect,
  Integer: () => Integer,
  Instantiate: () => Instantiate,
  InstanceType: () => InstanceType,
  Index: () => Index,
  Function: () => Function,
  Extract: () => Extract,
  Extends: () => Extends,
  Exclude: () => Exclude,
  Enum: () => Enum,
  Date: () => Date2,
  ConstructorParameters: () => ConstructorParameters,
  Constructor: () => Constructor,
  Const: () => Const,
  Composite: () => Composite,
  Capitalize: () => Capitalize,
  Boolean: () => Boolean,
  BigInt: () => BigInt2,
  Awaited: () => Awaited,
  AsyncIterator: () => AsyncIterator,
  Array: () => Array2,
  Argument: () => Argument,
  Any: () => Any
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

// node_modules/@sinclair/typebox/build/esm/type/type/javascript.mjs
var JavaScriptTypeBuilder;
var init_javascript = __esm(() => {
  init_json();
  init_argument2();
  init_async_iterator2();
  init_awaited2();
  init_bigint2();
  init_constructor2();
  init_constructor_parameters2();
  init_date2();
  init_function2();
  init_instance_type2();
  init_instantiate2();
  init_iterator2();
  init_parameters2();
  init_promise2();
  init_regexp2();
  init_return_type2();
  init_symbol2();
  init_uint8array2();
  init_undefined2();
  init_void2();
  JavaScriptTypeBuilder = class JavaScriptTypeBuilder extends JsonTypeBuilder {
    Argument(index) {
      return Argument(index);
    }
    AsyncIterator(items, options) {
      return AsyncIterator(items, options);
    }
    Awaited(schema2, options) {
      return Awaited(schema2, options);
    }
    BigInt(options) {
      return BigInt2(options);
    }
    ConstructorParameters(schema2, options) {
      return ConstructorParameters(schema2, options);
    }
    Constructor(parameters2, instanceType, options) {
      return Constructor(parameters2, instanceType, options);
    }
    Date(options = {}) {
      return Date2(options);
    }
    Function(parameters2, returnType, options) {
      return Function(parameters2, returnType, options);
    }
    InstanceType(schema2, options) {
      return InstanceType(schema2, options);
    }
    Instantiate(schema2, parameters2) {
      return Instantiate(schema2, parameters2);
    }
    Iterator(items, options) {
      return Iterator(items, options);
    }
    Parameters(schema2, options) {
      return Parameters(schema2, options);
    }
    Promise(item, options) {
      return Promise2(item, options);
    }
    RegExp(unresolved, options) {
      return RegExp2(unresolved, options);
    }
    ReturnType(type3, options) {
      return ReturnType(type3, options);
    }
    Symbol(options) {
      return Symbol2(options);
    }
    Undefined(options) {
      return Undefined(options);
    }
    Uint8Array(options) {
      return Uint8Array2(options);
    }
    Void(options) {
      return Void(options);
    }
  };
});

// node_modules/@sinclair/typebox/build/esm/type/type/index.mjs
var Type;
var init_type6 = __esm(() => {
  init_json();
  init_type5();
  init_javascript();
  Type = exports_type3;
});

// node_modules/@sinclair/typebox/build/esm/index.mjs
var exports_esm = {};
__export(exports_esm, {
  Void: () => Void,
  ValueGuard: () => exports_value,
  Uppercase: () => Uppercase,
  Unsafe: () => Unsafe,
  Unknown: () => Unknown,
  UnionEvaluated: () => UnionEvaluated,
  Union: () => Union,
  Undefined: () => Undefined,
  Uncapitalize: () => Uncapitalize,
  Uint8Array: () => Uint8Array2,
  TypeRegistry: () => exports_type2,
  TypeGuard: () => exports_type,
  TypeBoxError: () => TypeBoxError,
  Type: () => Type,
  Tuple: () => Tuple,
  TransformKind: () => TransformKind,
  TransformEncodeBuilder: () => TransformEncodeBuilder,
  TransformDecodeBuilder: () => TransformDecodeBuilder,
  Transform: () => Transform,
  TemplateLiteralToUnion: () => TemplateLiteralToUnion,
  TemplateLiteralSyntax: () => TemplateLiteralSyntax,
  TemplateLiteralPatternError: () => TemplateLiteralPatternError,
  TemplateLiteralPattern: () => TemplateLiteralPattern,
  TemplateLiteralParserError: () => TemplateLiteralParserError,
  TemplateLiteralParseExact: () => TemplateLiteralParseExact,
  TemplateLiteralParse: () => TemplateLiteralParse,
  TemplateLiteralGenerateError: () => TemplateLiteralGenerateError,
  TemplateLiteralGenerate: () => TemplateLiteralGenerate,
  TemplateLiteralFiniteError: () => TemplateLiteralFiniteError,
  TemplateLiteralExpressionGenerate: () => TemplateLiteralExpressionGenerate,
  TemplateLiteral: () => TemplateLiteral,
  TModule: () => TModule,
  Symbol: () => Symbol2,
  String: () => String2,
  SetUnionMany: () => SetUnionMany,
  SetUnion: () => SetUnion,
  SetIsSubset: () => SetIsSubset,
  SetIntersectMany: () => SetIntersectMany,
  SetIntersect: () => SetIntersect,
  SetIncludes: () => SetIncludes,
  SetDistinct: () => SetDistinct,
  SetComplement: () => SetComplement,
  ReturnType: () => ReturnType,
  Rest: () => Rest,
  RequiredFromMappedResult: () => RequiredFromMappedResult,
  Required: () => Required,
  RegExp: () => RegExp2,
  Ref: () => Ref,
  Recursive: () => Recursive,
  RecordValue: () => RecordValue2,
  RecordPattern: () => RecordPattern,
  RecordKey: () => RecordKey2,
  Record: () => Record,
  ReadonlyOptional: () => ReadonlyOptional,
  ReadonlyKind: () => ReadonlyKind,
  ReadonlyFromMappedResult: () => ReadonlyFromMappedResult,
  Readonly: () => Readonly,
  Promise: () => Promise2,
  PickFromMappedResult: () => PickFromMappedResult,
  PickFromMappedKey: () => PickFromMappedKey,
  Pick: () => Pick,
  PatternStringExact: () => PatternStringExact,
  PatternString: () => PatternString,
  PatternNumberExact: () => PatternNumberExact,
  PatternNumber: () => PatternNumber,
  PatternNeverExact: () => PatternNeverExact,
  PatternNever: () => PatternNever,
  PatternBooleanExact: () => PatternBooleanExact,
  PatternBoolean: () => PatternBoolean,
  PartialFromMappedResult: () => PartialFromMappedResult,
  Partial: () => Partial,
  Parameters: () => Parameters,
  OptionalKind: () => OptionalKind,
  OptionalFromMappedResult: () => OptionalFromMappedResult,
  Optional: () => Optional,
  OmitFromMappedResult: () => OmitFromMappedResult,
  OmitFromMappedKey: () => OmitFromMappedKey,
  Omit: () => Omit,
  Object: () => Object2,
  Number: () => Number2,
  Null: () => Null,
  Not: () => Not2,
  Never: () => Never,
  Module: () => Module,
  MappedResult: () => MappedResult,
  MappedKey: () => MappedKey,
  MappedFunctionReturnType: () => MappedFunctionReturnType,
  Mapped: () => Mapped,
  Lowercase: () => Lowercase,
  Literal: () => Literal,
  KindGuard: () => exports_kind,
  Kind: () => Kind,
  KeyOfPropertyKeysToRest: () => KeyOfPropertyKeysToRest,
  KeyOfPropertyKeys: () => KeyOfPropertyKeys,
  KeyOfPropertyEntries: () => KeyOfPropertyEntries,
  KeyOfPattern: () => KeyOfPattern,
  KeyOfFromMappedResult: () => KeyOfFromMappedResult,
  KeyOf: () => KeyOf,
  JsonTypeBuilder: () => JsonTypeBuilder,
  JavaScriptTypeBuilder: () => JavaScriptTypeBuilder,
  Iterator: () => Iterator,
  IsTemplateLiteralFinite: () => IsTemplateLiteralFinite,
  IsTemplateLiteralExpressionFinite: () => IsTemplateLiteralExpressionFinite,
  IntrinsicFromMappedKey: () => IntrinsicFromMappedKey,
  Intrinsic: () => Intrinsic,
  IntersectEvaluated: () => IntersectEvaluated,
  Intersect: () => Intersect,
  Integer: () => Integer,
  Instantiate: () => Instantiate,
  InstanceType: () => InstanceType,
  IndexPropertyKeys: () => IndexPropertyKeys,
  IndexFromPropertyKeys: () => IndexFromPropertyKeys,
  IndexFromPropertyKey: () => IndexFromPropertyKey,
  IndexFromMappedResult: () => IndexFromMappedResult,
  IndexFromMappedKey: () => IndexFromMappedKey,
  IndexFromComputed: () => IndexFromComputed,
  Index: () => Index,
  Increment: () => Increment,
  Hint: () => Hint,
  Function: () => Function,
  FromTypes: () => FromTypes,
  FormatRegistry: () => exports_format,
  ExtractFromTemplateLiteral: () => ExtractFromTemplateLiteral,
  ExtractFromMappedResult: () => ExtractFromMappedResult,
  Extract: () => Extract,
  ExtendsUndefinedCheck: () => ExtendsUndefinedCheck,
  ExtendsResult: () => ExtendsResult,
  ExtendsResolverError: () => ExtendsResolverError,
  ExtendsFromMappedResult: () => ExtendsFromMappedResult,
  ExtendsFromMappedKey: () => ExtendsFromMappedKey,
  ExtendsCheck: () => ExtendsCheck,
  Extends: () => Extends,
  ExcludeFromTemplateLiteral: () => ExcludeFromTemplateLiteral,
  ExcludeFromMappedResult: () => ExcludeFromMappedResult,
  Exclude: () => Exclude,
  Enum: () => Enum,
  Date: () => Date2,
  CreateType: () => CreateType,
  ConstructorParameters: () => ConstructorParameters,
  Constructor: () => Constructor,
  Const: () => Const,
  Composite: () => Composite,
  CloneType: () => CloneType,
  CloneRest: () => CloneRest,
  Clone: () => Clone,
  Capitalize: () => Capitalize,
  Boolean: () => Boolean,
  BigInt: () => BigInt2,
  Awaited: () => Awaited,
  AsyncIterator: () => AsyncIterator,
  Array: () => Array2,
  Argument: () => Argument,
  Any: () => Any
});
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
// node_modules/@noble/hashes/utils.js
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
function anumber(n, title = "") {
  if (typeof n !== "number") {
    const prefix = title && `"${title}" `;
    throw new TypeError(`${prefix}expected number, got ${typeof n}`);
  }
  if (!Number.isSafeInteger(n) || n < 0) {
    const prefix = title && `"${title}" `;
    throw new RangeError(`${prefix}expected integer >= 0, got ${n}`);
  }
}
function abytes(value, length, title = "") {
  const bytes = isBytes(value);
  const len = value?.length;
  const needsLen = length !== undefined;
  if (!bytes || needsLen && len !== length) {
    const prefix = title && `"${title}" `;
    const ofLen = needsLen ? ` of length ${length}` : "";
    const got = bytes ? `length=${len}` : `type=${typeof value}`;
    const message = prefix + "expected Uint8Array" + ofLen + ", got " + got;
    if (!bytes)
      throw new TypeError(message);
    throw new RangeError(message);
  }
  return value;
}
function copyBytes(bytes) {
  return Uint8Array.from(abytes(bytes));
}
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput(out, instance) {
  abytes(out, undefined, "digestInto() output");
  const min = instance.outputLen;
  if (out.length < min) {
    throw new RangeError('"digestInto() output" expected to be of length >=' + min);
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
function createHasher(hashCons, info = {}) {
  const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
  const tmp = hashCons(undefined);
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.canXOF = tmp.canXOF;
  hashC.create = (opts) => hashCons(opts);
  Object.assign(hashC, info);
  return Object.freeze(hashC);
}

// node_modules/@noble/hashes/_md.js
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

// node_modules/@noble/hashes/_u64.js
var U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
var _32n = /* @__PURE__ */ BigInt(32);
function fromBig(n, le = false) {
  if (le)
    return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
  return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
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
  let ll = add3L(Al, Bl, Xl);
  Ah = add3H(ll, Ah, Bh, Xh);
  Al = ll | 0;
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotr32H(Dh, Dl), Dl: rotr32L(Dh, Dl) });
  ({ h: Ch, l: Cl } = add(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrSH(Bh, Bl, 24), Bl: rotrSL(Bh, Bl, 24) });
  BBUF[2 * a] = Al, BBUF[2 * a + 1] = Ah;
  BBUF[2 * b] = Bl, BBUF[2 * b + 1] = Bh;
  BBUF[2 * c] = Cl, BBUF[2 * c + 1] = Ch;
  BBUF[2 * d] = Dl, BBUF[2 * d + 1] = Dh;
}
function G2b(a, b, c, d, msg, x) {
  const Xl = msg[x], Xh = msg[x + 1];
  let Al = BBUF[2 * a], Ah = BBUF[2 * a + 1];
  let Bl = BBUF[2 * b], Bh = BBUF[2 * b + 1];
  let Cl = BBUF[2 * c], Ch = BBUF[2 * c + 1];
  let Dl = BBUF[2 * d], Dh = BBUF[2 * d + 1];
  let ll = add3L(Al, Bl, Xl);
  Ah = add3H(ll, Ah, Bh, Xh);
  Al = ll | 0;
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotrSH(Dh, Dl, 16), Dl: rotrSL(Dh, Dl, 16) });
  ({ h: Ch, l: Cl } = add(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrBH(Bh, Bl, 63), Bl: rotrBL(Bh, Bl, 63) });
  BBUF[2 * a] = Al, BBUF[2 * a + 1] = Ah;
  BBUF[2 * b] = Bl, BBUF[2 * b + 1] = Bh;
  BBUF[2 * c] = Cl, BBUF[2 * c + 1] = Ch;
  BBUF[2 * d] = Dl, BBUF[2 * d + 1] = Dh;
}
function checkBlake2Opts(outputLen, opts = {}, keyLen, saltLen, persLen) {
  anumber(keyLen);
  if (outputLen <= 0 || outputLen > keyLen)
    throw new Error("outputLen bigger than keyLen");
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
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      this.length += take;
      pos += take;
    }
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    const { pos, buffer32 } = this;
    this.finished = true;
    clean(this.buffer.subarray(pos));
    swap32IfBE(buffer32);
    this.compress(buffer32, 0, true);
    swap32IfBE(buffer32);
    if (out.byteOffset & 3)
      throw new RangeError('"digestInto() output" expected 4-byte aligned byteOffset, got ' + out.byteOffset);
    const state = this.get();
    const out32 = u32(out);
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
      const slt = u32(salt);
      this.v4l ^= swap8IfBE(slt[0]);
      this.v4h ^= swap8IfBE(slt[1]);
      this.v5l ^= swap8IfBE(slt[2]);
      this.v5h ^= swap8IfBE(slt[3]);
    }
    if (personalization !== undefined) {
      abytes(personalization, undefined, "personalization");
      const pers = u32(personalization);
      this.v6l ^= swap8IfBE(pers[0]);
      this.v6h ^= swap8IfBE(pers[1]);
      this.v7l ^= swap8IfBE(pers[2]);
      this.v7h ^= swap8IfBE(pers[3]);
    }
    if (key !== undefined) {
      const tmp = new Uint8Array(this.blockLen);
      tmp.set(key);
      this.update(tmp);
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
    this.get().forEach((v, i) => BBUF[i] = v);
    BBUF.set(B2B_IV, 16);
    let { h, l } = fromBig(BigInt(this.length));
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
function compress(s, offset, msg, rounds, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15) {
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
      const slt = u32(salt);
      this.v4 ^= swap8IfBE(slt[0]);
      this.v5 ^= swap8IfBE(slt[1]);
    }
    if (personalization !== undefined) {
      abytes(personalization, undefined, "personalization");
      const pers = u32(personalization);
      this.v6 ^= swap8IfBE(pers[0]);
      this.v7 ^= swap8IfBE(pers[1]);
    }
    if (key !== undefined) {
      const tmp = new Uint8Array(this.blockLen);
      tmp.set(key);
      this.update(tmp);
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
    const { h, l } = fromBig(BigInt(this.length));
    const { v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15 } = compress(BSIGMA, offset, msg, 10, this.v0, this.v1, this.v2, this.v3, this.v4, this.v5, this.v6, this.v7, B2S_IV[0], B2S_IV[1], B2S_IV[2], B2S_IV[3], l ^ B2S_IV[4], h ^ B2S_IV[5], isLast ? ~B2S_IV[6] : B2S_IV[6], B2S_IV[7]);
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
    super(64, opts.dkLen === undefined ? 32 : opts.dkLen);
    const { key, context } = opts;
    const hasContext = context !== undefined;
    if (key !== undefined) {
      if (hasContext)
        throw new Error('Only "key" or "context" can be specified at same time');
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
      this.IV = B3_IV.slice();
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
    const { h, l } = fromBig(BigInt(counter), true);
    const { v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15 } = compress(B3_SIGMA, bufPos, buf, 7, s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], B3_IV[0], B3_IV[1], B3_IV[2], B3_IV[3], h, l, pos, flags);
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
      for (let last, chunks = this.chunksDone + 1;isLast || !(chunks & 1); chunks >>= 1) {
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
    clean(this.state, this.buffer32, this.IV, this.bufferOut32);
    clean(...this.stack);
  }
  b2CompressOut() {
    const { state: s, pos, flags, buffer32, bufferOut32: out32 } = this;
    const { h, l } = fromBig(BigInt(this.chunkOut++));
    swap32IfBE(buffer32);
    const { v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15 } = compress(B3_SIGMA, 0, buffer32, 7, s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], B3_IV[0], B3_IV[1], B3_IV[2], B3_IV[3], l, h, pos, flags);
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
    clean(this.buffer.subarray(this.pos));
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
      throw new Error("XOF is not possible after digest call");
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
    this.writeInto(out.subarray(0, this.outputLen));
    this.destroy();
  }
  digest() {
    const out = new Uint8Array(this.outputLen);
    this.digestInto(out);
    return out;
  }
}
var blake3 = /* @__PURE__ */ createHasher((opts = {}) => new _BLAKE3(opts));

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
  for (let i2 = 0;i2 < x; i2++) {
    out = "A" + out;
  }
  return out;
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
function read(buffer, offset, isLE2, mLen, nBytes) {
  var e, m, eLen = nBytes * 8 - mLen - 1, eMax = (1 << eLen) - 1, eBias = eMax >> 1, nBits = -7, i2 = isLE2 ? nBytes - 1 : 0, d2 = isLE2 ? -1 : 1, s = buffer[offset + i2];
  i2 += d2, e = s & (1 << -nBits) - 1, s >>= -nBits, nBits += eLen;
  for (;nBits > 0; e = e * 256 + buffer[offset + i2], i2 += d2, nBits -= 8)
    ;
  m = e & (1 << -nBits) - 1, e >>= -nBits, nBits += mLen;
  for (;nBits > 0; m = m * 256 + buffer[offset + i2], i2 += d2, nBits -= 8)
    ;
  if (e === 0)
    e = 1 - eBias;
  else if (e === eMax)
    return m ? NaN : (s ? -1 : 1) * (1 / 0);
  else
    m = m + Math.pow(2, mLen), e = e - eBias;
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
}
function write(buffer, value, offset, isLE2, mLen, nBytes) {
  var e, m, c, eLen = nBytes * 8 - mLen - 1, eMax = (1 << eLen) - 1, eBias = eMax >> 1, rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, i2 = isLE2 ? 0 : nBytes - 1, d2 = isLE2 ? 1 : -1, s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
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
  for (;mLen >= 8; buffer[offset + i2] = m & 255, i2 += d2, m /= 256, mLen -= 8)
    ;
  e = e << mLen | m, eLen += mLen;
  for (;eLen > 0; buffer[offset + i2] = e & 255, i2 += d2, e /= 256, eLen -= 8)
    ;
  buffer[offset + i2 - d2] |= s * 128;
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
  let b2 = fromObject(value);
  if (b2)
    return b2;
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
Buffer.isBuffer = function(b2) {
  return b2 != null && b2._isBuffer === true && b2 !== Buffer.prototype;
};
Buffer.compare = function(a, b2) {
  if (isInstance(a, Uint8Array))
    a = Buffer.from(a, a.offset, a.byteLength);
  if (isInstance(b2, Uint8Array))
    b2 = Buffer.from(b2, b2.offset, b2.byteLength);
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b2))
    throw TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
  if (a === b2)
    return 0;
  let x = a.length, y = b2.length;
  for (let i2 = 0, len2 = Math.min(x, y);i2 < len2; ++i2)
    if (a[i2] !== b2[i2]) {
      x = a[i2], y = b2[i2];
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
        return utf8ToBytes(string).length;
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
          return mustMatch ? -1 : utf8ToBytes(string).length;
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
function swap(b2, n, m) {
  let i2 = b2[n];
  b2[n] = b2[m], b2[m] = i2;
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
Buffer.prototype.equals = function(b2) {
  if (!Buffer.isBuffer(b2))
    throw TypeError("Argument must be a Buffer");
  if (this === b2)
    return true;
  return Buffer.compare(this, b2) === 0;
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
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
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
function utf8ToBytes(string, units) {
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
    code: code2 = MtrDex.Ed25519N,
    qb64b,
    qb64,
    qb2,
    rize
  }) {
    let size = -1;
    if (raw != null) {
      if (code2.length == 0) {
        throw new Error("Improper initialization need either (raw and code) or qb64b or qb64 or qb2.");
      }
      if (SmallVrzDex.has(code2[0]) || LargeVrzDex.has(code2[0])) {
        if (rize !== undefined) {
          if (rize < 0)
            throw new Error(`missing var raw size for code=${code2}`);
        } else {
          rize = raw.length;
        }
        const ls = (3 - rize % 3) % 3;
        size = Math.floor((rize + ls) / 3);
        if (SmallVrzDex.has(code2[0])) {
          if (size <= 64 ** 2 - 1) {
            const hs = 2;
            const s = Object.values(SmallVrzDex)[ls];
            code2 = `${s}${code2.substring(1, hs)}`;
          } else if (size <= 64 ** 4 - 1) {
            const hs = 4;
            const s = Object.values(LargeVrzDex)[ls];
            code2 = `${s}${"AAAA".substring(0, hs - 2)}${code2[1]}`;
          } else {
            throw new Error(`Unsupported raw size for code=${code2}`);
          }
        } else {
          if (size <= 64 ** 4 - 1) {
            const hs = 4;
            const s = Object.values(LargeVrzDex)[ls];
            code2 = `${s}${code2.substring(1, hs)}`;
          } else {
            throw new Error(`Unsupported raw size for code=${code2}`);
          }
        }
      } else {
        const sizage = Matter.Sizes.get(code2);
        if (sizage.fs == -1) {
          throw new Error(`Unsupported variable size code=${code2}`);
        }
        rize = Matter._rawSize(code2);
      }
      raw = raw.slice(0, rize);
      if (raw.length != rize) {
        throw new Error(`Not enougth raw bytes for code=${code2} expected ${rize} got ${raw.length}.`);
      }
      this._code = code2;
      this._size = size;
      this._raw = raw;
    } else if (qb64 !== undefined) {
      this._exfil(qb64);
    } else if (qb64b !== undefined) {
      const qb642 = d(qb64b);
      this._exfil(qb642);
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
  static _rawSize(code2) {
    const sizage = this.Sizes.get(code2);
    const cs = sizage.hs + sizage.ss;
    if (sizage.fs === -1) {
      throw Error(`Non-fixed raw size code ${code2}.`);
    }
    return Math.floor((sizage.fs - cs) * 3 / 4) - sizage.ls;
  }
  static _leadSize(code2) {
    const sizage = this.Sizes.get(code2);
    return sizage.ls;
  }
  get both() {
    const sizage = Matter.Sizes.get(this.code);
    return `${this.code}${intToB64(this.size, sizage.ss)}`;
  }
  _infil() {
    const code2 = this.code;
    const size = this.size;
    const raw = this.raw;
    const ps = (3 - raw.length % 3) % 3;
    const sizage = Matter.Sizes.get(code2);
    if (sizage.fs === undefined) {
      const cs = sizage.hs + sizage.ss;
      if (cs % 4) {
        throw new Error(`Whole code size not multiple of 4 for variable length material. cs=${cs}`);
      }
      if (size < 0 || size > 64 ** sizage.ss - 1) {
        throw new Error(`Invalid size=${size} for code=${code2}.`);
      }
      const both = `${code2}${intToB64(size, sizage.ss)}`;
      if (both.length % 4 !== ps - sizage.ls) {
        throw new Error(`Invalid code=${both} for converted raw pad size=${ps}.`);
      }
      const bytes = new Uint8Array(sizage.ls + raw.length);
      for (let i2 = 0;i2 < sizage.ls; i2++) {
        bytes[i2] = 0;
      }
      for (let i2 = 0;i2 < raw.length; i2++) {
        const odx = i2 + ps;
        bytes[odx] = raw[i2];
      }
      return both + Buffer.from(bytes).toString("base64url");
    } else {
      const both = code2;
      const cs = both.length;
      if (cs % 4 != ps - sizage.ls) {
        throw new Error(`Invalid code=${both} for converted raw pad size=${ps}, ${raw.length}.`);
      }
      const bytes = new Uint8Array(ps + raw.length);
      for (let i2 = 0;i2 < ps; i2++) {
        bytes[i2] = 0;
      }
      for (let i2 = 0;i2 < raw.length; i2++) {
        const odx = i2 + ps;
        bytes[odx] = raw[i2];
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

// src/cesr/digest.ts
function encode(raw, code2) {
  const matter = new Matter({ raw, code: code2 });
  return matter.qb64;
}
function encodeDigest(digest, code2 = MtrDex.Blake3_256) {
  return encode(digest, code2);
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
async function inferSchema(value2) {
  const { Type: Type2 } = await Promise.resolve().then(() => (init_esm(), exports_esm));
  function infer(v) {
    if (v === null) {
      return Type2.Null();
    }
    if (Array.isArray(v)) {
      if (v.length === 0) {
        return Type2.Array(Type2.Unknown());
      }
      return Type2.Array(infer(v[0]));
    }
    switch (typeof v) {
      case "string":
        return Type2.String();
      case "number":
        return Type2.Number();
      case "boolean":
        return Type2.Boolean();
      case "object": {
        const properties = {};
        for (const [key, val] of Object.entries(v)) {
          properties[key] = infer(val);
        }
        return Type2.Object(properties);
      }
      default:
        return Type2.Unknown();
    }
  }
  return infer(value2);
}
function schemaSaidOf(schema3) {
  const canonicalText = canonical(schema3);
  return Data.digest(new TextEncoder().encode(canonicalText));
}
async function createSaidMessageType(example) {
  const schema3 = await inferSchema(example);
  const schemaSaid = schemaSaidOf(schema3);
  return `SAID:${schemaSaid}`;
}
// src/common/errors.ts
class CoreError extends Error {
  code;
  details;
  constructor(message, code2, details) {
    super(message);
    this.name = this.constructor.name;
    this.code = code2;
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
function createStructuredValidationError(code2, message, details) {
  return {
    type: "validation",
    code: code2,
    message,
    details
  };
}
function isStructuredValidationError(error3) {
  return typeof error3 === "object" && error3 !== null && "type" in error3 && error3.type === "validation" && "code" in error3 && "message" in error3;
}
// src/common/types.ts
init_esm();

// node_modules/@sinclair/typebox/build/esm/value/index.mjs
init_guard();

// node_modules/@sinclair/typebox/build/esm/errors/errors.mjs
init_keyof2();
init_registry();
init_extends_undefined();

// node_modules/@sinclair/typebox/build/esm/errors/function.mjs
init_symbols2();
function DefaultErrorFunction(error3) {
  switch (error3.errorType) {
    case ValueErrorType.ArrayContains:
      return "Expected array to contain at least one matching value";
    case ValueErrorType.ArrayMaxContains:
      return `Expected array to contain no more than ${error3.schema.maxContains} matching values`;
    case ValueErrorType.ArrayMinContains:
      return `Expected array to contain at least ${error3.schema.minContains} matching values`;
    case ValueErrorType.ArrayMaxItems:
      return `Expected array length to be less or equal to ${error3.schema.maxItems}`;
    case ValueErrorType.ArrayMinItems:
      return `Expected array length to be greater or equal to ${error3.schema.minItems}`;
    case ValueErrorType.ArrayUniqueItems:
      return "Expected array elements to be unique";
    case ValueErrorType.Array:
      return "Expected array";
    case ValueErrorType.AsyncIterator:
      return "Expected AsyncIterator";
    case ValueErrorType.BigIntExclusiveMaximum:
      return `Expected bigint to be less than ${error3.schema.exclusiveMaximum}`;
    case ValueErrorType.BigIntExclusiveMinimum:
      return `Expected bigint to be greater than ${error3.schema.exclusiveMinimum}`;
    case ValueErrorType.BigIntMaximum:
      return `Expected bigint to be less or equal to ${error3.schema.maximum}`;
    case ValueErrorType.BigIntMinimum:
      return `Expected bigint to be greater or equal to ${error3.schema.minimum}`;
    case ValueErrorType.BigIntMultipleOf:
      return `Expected bigint to be a multiple of ${error3.schema.multipleOf}`;
    case ValueErrorType.BigInt:
      return "Expected bigint";
    case ValueErrorType.Boolean:
      return "Expected boolean";
    case ValueErrorType.DateExclusiveMinimumTimestamp:
      return `Expected Date timestamp to be greater than ${error3.schema.exclusiveMinimumTimestamp}`;
    case ValueErrorType.DateExclusiveMaximumTimestamp:
      return `Expected Date timestamp to be less than ${error3.schema.exclusiveMaximumTimestamp}`;
    case ValueErrorType.DateMinimumTimestamp:
      return `Expected Date timestamp to be greater or equal to ${error3.schema.minimumTimestamp}`;
    case ValueErrorType.DateMaximumTimestamp:
      return `Expected Date timestamp to be less or equal to ${error3.schema.maximumTimestamp}`;
    case ValueErrorType.DateMultipleOfTimestamp:
      return `Expected Date timestamp to be a multiple of ${error3.schema.multipleOfTimestamp}`;
    case ValueErrorType.Date:
      return "Expected Date";
    case ValueErrorType.Function:
      return "Expected function";
    case ValueErrorType.IntegerExclusiveMaximum:
      return `Expected integer to be less than ${error3.schema.exclusiveMaximum}`;
    case ValueErrorType.IntegerExclusiveMinimum:
      return `Expected integer to be greater than ${error3.schema.exclusiveMinimum}`;
    case ValueErrorType.IntegerMaximum:
      return `Expected integer to be less or equal to ${error3.schema.maximum}`;
    case ValueErrorType.IntegerMinimum:
      return `Expected integer to be greater or equal to ${error3.schema.minimum}`;
    case ValueErrorType.IntegerMultipleOf:
      return `Expected integer to be a multiple of ${error3.schema.multipleOf}`;
    case ValueErrorType.Integer:
      return "Expected integer";
    case ValueErrorType.IntersectUnevaluatedProperties:
      return "Unexpected property";
    case ValueErrorType.Intersect:
      return "Expected all values to match";
    case ValueErrorType.Iterator:
      return "Expected Iterator";
    case ValueErrorType.Literal:
      return `Expected ${typeof error3.schema.const === "string" ? `'${error3.schema.const}'` : error3.schema.const}`;
    case ValueErrorType.Never:
      return "Never";
    case ValueErrorType.Not:
      return "Value should not match";
    case ValueErrorType.Null:
      return "Expected null";
    case ValueErrorType.NumberExclusiveMaximum:
      return `Expected number to be less than ${error3.schema.exclusiveMaximum}`;
    case ValueErrorType.NumberExclusiveMinimum:
      return `Expected number to be greater than ${error3.schema.exclusiveMinimum}`;
    case ValueErrorType.NumberMaximum:
      return `Expected number to be less or equal to ${error3.schema.maximum}`;
    case ValueErrorType.NumberMinimum:
      return `Expected number to be greater or equal to ${error3.schema.minimum}`;
    case ValueErrorType.NumberMultipleOf:
      return `Expected number to be a multiple of ${error3.schema.multipleOf}`;
    case ValueErrorType.Number:
      return "Expected number";
    case ValueErrorType.Object:
      return "Expected object";
    case ValueErrorType.ObjectAdditionalProperties:
      return "Unexpected property";
    case ValueErrorType.ObjectMaxProperties:
      return `Expected object to have no more than ${error3.schema.maxProperties} properties`;
    case ValueErrorType.ObjectMinProperties:
      return `Expected object to have at least ${error3.schema.minProperties} properties`;
    case ValueErrorType.ObjectRequiredProperty:
      return "Expected required property";
    case ValueErrorType.Promise:
      return "Expected Promise";
    case ValueErrorType.RegExp:
      return "Expected string to match regular expression";
    case ValueErrorType.StringFormatUnknown:
      return `Unknown format '${error3.schema.format}'`;
    case ValueErrorType.StringFormat:
      return `Expected string to match '${error3.schema.format}' format`;
    case ValueErrorType.StringMaxLength:
      return `Expected string length less or equal to ${error3.schema.maxLength}`;
    case ValueErrorType.StringMinLength:
      return `Expected string length greater or equal to ${error3.schema.minLength}`;
    case ValueErrorType.StringPattern:
      return `Expected string to match '${error3.schema.pattern}'`;
    case ValueErrorType.String:
      return "Expected string";
    case ValueErrorType.Symbol:
      return "Expected symbol";
    case ValueErrorType.TupleLength:
      return `Expected tuple to have ${error3.schema.maxItems || 0} elements`;
    case ValueErrorType.Tuple:
      return "Expected tuple";
    case ValueErrorType.Uint8ArrayMaxByteLength:
      return `Expected byte length less or equal to ${error3.schema.maxByteLength}`;
    case ValueErrorType.Uint8ArrayMinByteLength:
      return `Expected byte length greater or equal to ${error3.schema.minByteLength}`;
    case ValueErrorType.Uint8Array:
      return "Expected Uint8Array";
    case ValueErrorType.Undefined:
      return "Expected undefined";
    case ValueErrorType.Union:
      return "Expected union value";
    case ValueErrorType.Void:
      return "Expected void";
    case ValueErrorType.Kind:
      return `Expected kind '${error3.schema[Kind]}'`;
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
  constructor(schema3) {
    super(`Unable to dereference schema with $id '${schema3.$ref}'`);
    this.schema = schema3;
  }
}
function Resolve(schema3, references) {
  const target = references.find((target2) => target2.$id === schema3.$ref);
  if (target === undefined)
    throw new TypeDereferenceError(schema3);
  return Deref(target, references);
}
function Pushref(schema3, references) {
  if (!IsString2(schema3.$id) || references.some((target) => target.$id === schema3.$id))
    return references;
  references.push(schema3);
  return references;
}
function Deref(schema3, references) {
  return schema3[Kind] === "This" || schema3[Kind] === "Ref" ? Resolve(schema3, references) : schema3;
}

// node_modules/@sinclair/typebox/build/esm/value/hash/hash.mjs
init_guard();
init_error2();

class ValueHashError extends TypeBoxError {
  constructor(value2) {
    super(`Unable to hash value`);
    this.value = value2;
  }
}
var ByteMarker;
(function(ByteMarker2) {
  ByteMarker2[ByteMarker2["Undefined"] = 0] = "Undefined";
  ByteMarker2[ByteMarker2["Null"] = 1] = "Null";
  ByteMarker2[ByteMarker2["Boolean"] = 2] = "Boolean";
  ByteMarker2[ByteMarker2["Number"] = 3] = "Number";
  ByteMarker2[ByteMarker2["String"] = 4] = "String";
  ByteMarker2[ByteMarker2["Object"] = 5] = "Object";
  ByteMarker2[ByteMarker2["Array"] = 6] = "Array";
  ByteMarker2[ByteMarker2["Date"] = 7] = "Date";
  ByteMarker2[ByteMarker2["Uint8Array"] = 8] = "Uint8Array";
  ByteMarker2[ByteMarker2["Symbol"] = 9] = "Symbol";
  ByteMarker2[ByteMarker2["BigInt"] = 10] = "BigInt";
})(ByteMarker || (ByteMarker = {}));
var Accumulator = BigInt("14695981039346656037");
var [Prime, Size] = [BigInt("1099511628211"), BigInt("18446744073709551616")];
var Bytes = Array.from({ length: 256 }).map((_, i2) => BigInt(i2));
var F64 = new Float64Array(1);
var F64In = new DataView(F64.buffer);
var F64Out = new Uint8Array(F64.buffer);
function* NumberToBytes(value2) {
  const byteCount = value2 === 0 ? 1 : Math.ceil(Math.floor(Math.log2(value2) + 1) / 8);
  for (let i2 = 0;i2 < byteCount; i2++) {
    yield value2 >> 8 * (byteCount - 1 - i2) & 255;
  }
}
function ArrayType2(value2) {
  FNV1A64(ByteMarker.Array);
  for (const item of value2) {
    Visit4(item);
  }
}
function BooleanType(value2) {
  FNV1A64(ByteMarker.Boolean);
  FNV1A64(value2 ? 1 : 0);
}
function BigIntType(value2) {
  FNV1A64(ByteMarker.BigInt);
  F64In.setBigInt64(0, value2);
  for (const byte of F64Out) {
    FNV1A64(byte);
  }
}
function DateType2(value2) {
  FNV1A64(ByteMarker.Date);
  Visit4(value2.getTime());
}
function NullType(value2) {
  FNV1A64(ByteMarker.Null);
}
function NumberType(value2) {
  FNV1A64(ByteMarker.Number);
  F64In.setFloat64(0, value2);
  for (const byte of F64Out) {
    FNV1A64(byte);
  }
}
function ObjectType2(value2) {
  FNV1A64(ByteMarker.Object);
  for (const key of globalThis.Object.getOwnPropertyNames(value2).sort()) {
    Visit4(key);
    Visit4(value2[key]);
  }
}
function StringType(value2) {
  FNV1A64(ByteMarker.String);
  for (let i2 = 0;i2 < value2.length; i2++) {
    for (const byte of NumberToBytes(value2.charCodeAt(i2))) {
      FNV1A64(byte);
    }
  }
}
function SymbolType(value2) {
  FNV1A64(ByteMarker.Symbol);
  Visit4(value2.description);
}
function Uint8ArrayType2(value2) {
  FNV1A64(ByteMarker.Uint8Array);
  for (let i2 = 0;i2 < value2.length; i2++) {
    FNV1A64(value2[i2]);
  }
}
function UndefinedType(value2) {
  return FNV1A64(ByteMarker.Undefined);
}
function Visit4(value2) {
  if (IsArray2(value2))
    return ArrayType2(value2);
  if (IsBoolean2(value2))
    return BooleanType(value2);
  if (IsBigInt2(value2))
    return BigIntType(value2);
  if (IsDate2(value2))
    return DateType2(value2);
  if (IsNull2(value2))
    return NullType(value2);
  if (IsNumber2(value2))
    return NumberType(value2);
  if (IsObject2(value2))
    return ObjectType2(value2);
  if (IsString2(value2))
    return StringType(value2);
  if (IsSymbol2(value2))
    return SymbolType(value2);
  if (IsUint8Array2(value2))
    return Uint8ArrayType2(value2);
  if (IsUndefined2(value2))
    return UndefinedType(value2);
  throw new ValueHashError(value2);
}
function FNV1A64(byte) {
  Accumulator = Accumulator ^ Bytes[byte];
  Accumulator = Accumulator * Prime % Size;
}
function Hash(value2) {
  Accumulator = BigInt("14695981039346656037");
  Visit4(value2);
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
  constructor(schema3) {
    super(`Unknown type`);
    this.schema = schema3;
  }
}
function IsAnyOrUnknown(schema3) {
  return schema3[Kind] === "Any" || schema3[Kind] === "Unknown";
}
function IsDefined(value2) {
  return value2 !== undefined;
}
function FromAny2(schema3, references, value2) {
  return true;
}
function FromArgument2(schema3, references, value2) {
  return true;
}
function FromArray7(schema3, references, value2) {
  if (!IsArray2(value2))
    return false;
  if (IsDefined(schema3.minItems) && !(value2.length >= schema3.minItems)) {
    return false;
  }
  if (IsDefined(schema3.maxItems) && !(value2.length <= schema3.maxItems)) {
    return false;
  }
  for (const element of value2) {
    if (!Visit5(schema3.items, references, element))
      return false;
  }
  if (schema3.uniqueItems === true && !function() {
    const set2 = new Set;
    for (const element of value2) {
      const hashed = Hash(element);
      if (set2.has(hashed)) {
        return false;
      } else {
        set2.add(hashed);
      }
    }
    return true;
  }()) {
    return false;
  }
  if (!(IsDefined(schema3.contains) || IsNumber2(schema3.minContains) || IsNumber2(schema3.maxContains))) {
    return true;
  }
  const containsSchema = IsDefined(schema3.contains) ? schema3.contains : Never();
  const containsCount = value2.reduce((acc, value3) => Visit5(containsSchema, references, value3) ? acc + 1 : acc, 0);
  if (containsCount === 0) {
    return false;
  }
  if (IsNumber2(schema3.minContains) && containsCount < schema3.minContains) {
    return false;
  }
  if (IsNumber2(schema3.maxContains) && containsCount > schema3.maxContains) {
    return false;
  }
  return true;
}
function FromAsyncIterator4(schema3, references, value2) {
  return IsAsyncIterator2(value2);
}
function FromBigInt2(schema3, references, value2) {
  if (!IsBigInt2(value2))
    return false;
  if (IsDefined(schema3.exclusiveMaximum) && !(value2 < schema3.exclusiveMaximum)) {
    return false;
  }
  if (IsDefined(schema3.exclusiveMinimum) && !(value2 > schema3.exclusiveMinimum)) {
    return false;
  }
  if (IsDefined(schema3.maximum) && !(value2 <= schema3.maximum)) {
    return false;
  }
  if (IsDefined(schema3.minimum) && !(value2 >= schema3.minimum)) {
    return false;
  }
  if (IsDefined(schema3.multipleOf) && !(value2 % schema3.multipleOf === BigInt(0))) {
    return false;
  }
  return true;
}
function FromBoolean2(schema3, references, value2) {
  return IsBoolean2(value2);
}
function FromConstructor4(schema3, references, value2) {
  return Visit5(schema3.returns, references, value2.prototype);
}
function FromDate2(schema3, references, value2) {
  if (!IsDate2(value2))
    return false;
  if (IsDefined(schema3.exclusiveMaximumTimestamp) && !(value2.getTime() < schema3.exclusiveMaximumTimestamp)) {
    return false;
  }
  if (IsDefined(schema3.exclusiveMinimumTimestamp) && !(value2.getTime() > schema3.exclusiveMinimumTimestamp)) {
    return false;
  }
  if (IsDefined(schema3.maximumTimestamp) && !(value2.getTime() <= schema3.maximumTimestamp)) {
    return false;
  }
  if (IsDefined(schema3.minimumTimestamp) && !(value2.getTime() >= schema3.minimumTimestamp)) {
    return false;
  }
  if (IsDefined(schema3.multipleOfTimestamp) && !(value2.getTime() % schema3.multipleOfTimestamp === 0)) {
    return false;
  }
  return true;
}
function FromFunction4(schema3, references, value2) {
  return IsFunction2(value2);
}
function FromImport(schema3, references, value2) {
  const definitions = globalThis.Object.values(schema3.$defs);
  const target = schema3.$defs[schema3.$ref];
  return Visit5(target, [...references, ...definitions], value2);
}
function FromInteger2(schema3, references, value2) {
  if (!IsInteger(value2)) {
    return false;
  }
  if (IsDefined(schema3.exclusiveMaximum) && !(value2 < schema3.exclusiveMaximum)) {
    return false;
  }
  if (IsDefined(schema3.exclusiveMinimum) && !(value2 > schema3.exclusiveMinimum)) {
    return false;
  }
  if (IsDefined(schema3.maximum) && !(value2 <= schema3.maximum)) {
    return false;
  }
  if (IsDefined(schema3.minimum) && !(value2 >= schema3.minimum)) {
    return false;
  }
  if (IsDefined(schema3.multipleOf) && !(value2 % schema3.multipleOf === 0)) {
    return false;
  }
  return true;
}
function FromIntersect9(schema3, references, value2) {
  const check1 = schema3.allOf.every((schema4) => Visit5(schema4, references, value2));
  if (schema3.unevaluatedProperties === false) {
    const keyPattern = new RegExp(KeyOfPattern(schema3));
    const check2 = Object.getOwnPropertyNames(value2).every((key) => keyPattern.test(key));
    return check1 && check2;
  } else if (IsSchema(schema3.unevaluatedProperties)) {
    const keyCheck = new RegExp(KeyOfPattern(schema3));
    const check2 = Object.getOwnPropertyNames(value2).every((key) => keyCheck.test(key) || Visit5(schema3.unevaluatedProperties, references, value2[key]));
    return check1 && check2;
  } else {
    return check1;
  }
}
function FromIterator4(schema3, references, value2) {
  return IsIterator2(value2);
}
function FromLiteral3(schema3, references, value2) {
  return value2 === schema3.const;
}
function FromNever2(schema3, references, value2) {
  return false;
}
function FromNot2(schema3, references, value2) {
  return !Visit5(schema3.not, references, value2);
}
function FromNull2(schema3, references, value2) {
  return IsNull2(value2);
}
function FromNumber2(schema3, references, value2) {
  if (!TypeSystemPolicy.IsNumberLike(value2))
    return false;
  if (IsDefined(schema3.exclusiveMaximum) && !(value2 < schema3.exclusiveMaximum)) {
    return false;
  }
  if (IsDefined(schema3.exclusiveMinimum) && !(value2 > schema3.exclusiveMinimum)) {
    return false;
  }
  if (IsDefined(schema3.minimum) && !(value2 >= schema3.minimum)) {
    return false;
  }
  if (IsDefined(schema3.maximum) && !(value2 <= schema3.maximum)) {
    return false;
  }
  if (IsDefined(schema3.multipleOf) && !(value2 % schema3.multipleOf === 0)) {
    return false;
  }
  return true;
}
function FromObject8(schema3, references, value2) {
  if (!TypeSystemPolicy.IsObjectLike(value2))
    return false;
  if (IsDefined(schema3.minProperties) && !(Object.getOwnPropertyNames(value2).length >= schema3.minProperties)) {
    return false;
  }
  if (IsDefined(schema3.maxProperties) && !(Object.getOwnPropertyNames(value2).length <= schema3.maxProperties)) {
    return false;
  }
  const knownKeys = Object.getOwnPropertyNames(schema3.properties);
  for (const knownKey of knownKeys) {
    const property = schema3.properties[knownKey];
    if (schema3.required && schema3.required.includes(knownKey)) {
      if (!Visit5(property, references, value2[knownKey])) {
        return false;
      }
      if ((ExtendsUndefinedCheck(property) || IsAnyOrUnknown(property)) && !(knownKey in value2)) {
        return false;
      }
    } else {
      if (TypeSystemPolicy.IsExactOptionalProperty(value2, knownKey) && !Visit5(property, references, value2[knownKey])) {
        return false;
      }
    }
  }
  if (schema3.additionalProperties === false) {
    const valueKeys = Object.getOwnPropertyNames(value2);
    if (schema3.required && schema3.required.length === knownKeys.length && valueKeys.length === knownKeys.length) {
      return true;
    } else {
      return valueKeys.every((valueKey) => knownKeys.includes(valueKey));
    }
  } else if (typeof schema3.additionalProperties === "object") {
    const valueKeys = Object.getOwnPropertyNames(value2);
    return valueKeys.every((key) => knownKeys.includes(key) || Visit5(schema3.additionalProperties, references, value2[key]));
  } else {
    return true;
  }
}
function FromPromise4(schema3, references, value2) {
  return IsPromise(value2);
}
function FromRecord4(schema3, references, value2) {
  if (!TypeSystemPolicy.IsRecordLike(value2)) {
    return false;
  }
  if (IsDefined(schema3.minProperties) && !(Object.getOwnPropertyNames(value2).length >= schema3.minProperties)) {
    return false;
  }
  if (IsDefined(schema3.maxProperties) && !(Object.getOwnPropertyNames(value2).length <= schema3.maxProperties)) {
    return false;
  }
  const [patternKey, patternSchema] = Object.entries(schema3.patternProperties)[0];
  const regex = new RegExp(patternKey);
  const check1 = Object.entries(value2).every(([key, value3]) => {
    return regex.test(key) ? Visit5(patternSchema, references, value3) : true;
  });
  const check2 = typeof schema3.additionalProperties === "object" ? Object.entries(value2).every(([key, value3]) => {
    return !regex.test(key) ? Visit5(schema3.additionalProperties, references, value3) : true;
  }) : true;
  const check3 = schema3.additionalProperties === false ? Object.getOwnPropertyNames(value2).every((key) => {
    return regex.test(key);
  }) : true;
  return check1 && check2 && check3;
}
function FromRef5(schema3, references, value2) {
  return Visit5(Deref(schema3, references), references, value2);
}
function FromRegExp2(schema3, references, value2) {
  const regex = new RegExp(schema3.source, schema3.flags);
  if (IsDefined(schema3.minLength)) {
    if (!(value2.length >= schema3.minLength))
      return false;
  }
  if (IsDefined(schema3.maxLength)) {
    if (!(value2.length <= schema3.maxLength))
      return false;
  }
  return regex.test(value2);
}
function FromString2(schema3, references, value2) {
  if (!IsString2(value2)) {
    return false;
  }
  if (IsDefined(schema3.minLength)) {
    if (!(value2.length >= schema3.minLength))
      return false;
  }
  if (IsDefined(schema3.maxLength)) {
    if (!(value2.length <= schema3.maxLength))
      return false;
  }
  if (IsDefined(schema3.pattern)) {
    const regex = new RegExp(schema3.pattern);
    if (!regex.test(value2))
      return false;
  }
  if (IsDefined(schema3.format)) {
    if (!exports_format.Has(schema3.format))
      return false;
    const func = exports_format.Get(schema3.format);
    return func(value2);
  }
  return true;
}
function FromSymbol2(schema3, references, value2) {
  return IsSymbol2(value2);
}
function FromTemplateLiteral4(schema3, references, value2) {
  return IsString2(value2) && new RegExp(schema3.pattern).test(value2);
}
function FromThis(schema3, references, value2) {
  return Visit5(Deref(schema3, references), references, value2);
}
function FromTuple6(schema3, references, value2) {
  if (!IsArray2(value2)) {
    return false;
  }
  if (schema3.items === undefined && !(value2.length === 0)) {
    return false;
  }
  if (!(value2.length === schema3.maxItems)) {
    return false;
  }
  if (!schema3.items) {
    return true;
  }
  for (let i2 = 0;i2 < schema3.items.length; i2++) {
    if (!Visit5(schema3.items[i2], references, value2[i2]))
      return false;
  }
  return true;
}
function FromUndefined2(schema3, references, value2) {
  return IsUndefined2(value2);
}
function FromUnion11(schema3, references, value2) {
  return schema3.anyOf.some((inner) => Visit5(inner, references, value2));
}
function FromUint8Array2(schema3, references, value2) {
  if (!IsUint8Array2(value2)) {
    return false;
  }
  if (IsDefined(schema3.maxByteLength) && !(value2.length <= schema3.maxByteLength)) {
    return false;
  }
  if (IsDefined(schema3.minByteLength) && !(value2.length >= schema3.minByteLength)) {
    return false;
  }
  return true;
}
function FromUnknown2(schema3, references, value2) {
  return true;
}
function FromVoid2(schema3, references, value2) {
  return TypeSystemPolicy.IsVoidLike(value2);
}
function FromKind(schema3, references, value2) {
  if (!exports_type2.Has(schema3[Kind]))
    return false;
  const func = exports_type2.Get(schema3[Kind]);
  return func(schema3, value2);
}
function Visit5(schema3, references, value2) {
  const references_ = IsDefined(schema3.$id) ? Pushref(schema3, references) : references;
  const schema_ = schema3;
  switch (schema_[Kind]) {
    case "Any":
      return FromAny2(schema_, references_, value2);
    case "Argument":
      return FromArgument2(schema_, references_, value2);
    case "Array":
      return FromArray7(schema_, references_, value2);
    case "AsyncIterator":
      return FromAsyncIterator4(schema_, references_, value2);
    case "BigInt":
      return FromBigInt2(schema_, references_, value2);
    case "Boolean":
      return FromBoolean2(schema_, references_, value2);
    case "Constructor":
      return FromConstructor4(schema_, references_, value2);
    case "Date":
      return FromDate2(schema_, references_, value2);
    case "Function":
      return FromFunction4(schema_, references_, value2);
    case "Import":
      return FromImport(schema_, references_, value2);
    case "Integer":
      return FromInteger2(schema_, references_, value2);
    case "Intersect":
      return FromIntersect9(schema_, references_, value2);
    case "Iterator":
      return FromIterator4(schema_, references_, value2);
    case "Literal":
      return FromLiteral3(schema_, references_, value2);
    case "Never":
      return FromNever2(schema_, references_, value2);
    case "Not":
      return FromNot2(schema_, references_, value2);
    case "Null":
      return FromNull2(schema_, references_, value2);
    case "Number":
      return FromNumber2(schema_, references_, value2);
    case "Object":
      return FromObject8(schema_, references_, value2);
    case "Promise":
      return FromPromise4(schema_, references_, value2);
    case "Record":
      return FromRecord4(schema_, references_, value2);
    case "Ref":
      return FromRef5(schema_, references_, value2);
    case "RegExp":
      return FromRegExp2(schema_, references_, value2);
    case "String":
      return FromString2(schema_, references_, value2);
    case "Symbol":
      return FromSymbol2(schema_, references_, value2);
    case "TemplateLiteral":
      return FromTemplateLiteral4(schema_, references_, value2);
    case "This":
      return FromThis(schema_, references_, value2);
    case "Tuple":
      return FromTuple6(schema_, references_, value2);
    case "Undefined":
      return FromUndefined2(schema_, references_, value2);
    case "Union":
      return FromUnion11(schema_, references_, value2);
    case "Uint8Array":
      return FromUint8Array2(schema_, references_, value2);
    case "Unknown":
      return FromUnknown2(schema_, references_, value2);
    case "Void":
      return FromVoid2(schema_, references_, value2);
    default:
      if (!exports_type2.Has(schema_[Kind]))
        throw new ValueCheckUnknownTypeError(schema_);
      return FromKind(schema_, references_, value2);
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
(function(ValueErrorType2) {
  ValueErrorType2[ValueErrorType2["ArrayContains"] = 0] = "ArrayContains";
  ValueErrorType2[ValueErrorType2["ArrayMaxContains"] = 1] = "ArrayMaxContains";
  ValueErrorType2[ValueErrorType2["ArrayMaxItems"] = 2] = "ArrayMaxItems";
  ValueErrorType2[ValueErrorType2["ArrayMinContains"] = 3] = "ArrayMinContains";
  ValueErrorType2[ValueErrorType2["ArrayMinItems"] = 4] = "ArrayMinItems";
  ValueErrorType2[ValueErrorType2["ArrayUniqueItems"] = 5] = "ArrayUniqueItems";
  ValueErrorType2[ValueErrorType2["Array"] = 6] = "Array";
  ValueErrorType2[ValueErrorType2["AsyncIterator"] = 7] = "AsyncIterator";
  ValueErrorType2[ValueErrorType2["BigIntExclusiveMaximum"] = 8] = "BigIntExclusiveMaximum";
  ValueErrorType2[ValueErrorType2["BigIntExclusiveMinimum"] = 9] = "BigIntExclusiveMinimum";
  ValueErrorType2[ValueErrorType2["BigIntMaximum"] = 10] = "BigIntMaximum";
  ValueErrorType2[ValueErrorType2["BigIntMinimum"] = 11] = "BigIntMinimum";
  ValueErrorType2[ValueErrorType2["BigIntMultipleOf"] = 12] = "BigIntMultipleOf";
  ValueErrorType2[ValueErrorType2["BigInt"] = 13] = "BigInt";
  ValueErrorType2[ValueErrorType2["Boolean"] = 14] = "Boolean";
  ValueErrorType2[ValueErrorType2["DateExclusiveMaximumTimestamp"] = 15] = "DateExclusiveMaximumTimestamp";
  ValueErrorType2[ValueErrorType2["DateExclusiveMinimumTimestamp"] = 16] = "DateExclusiveMinimumTimestamp";
  ValueErrorType2[ValueErrorType2["DateMaximumTimestamp"] = 17] = "DateMaximumTimestamp";
  ValueErrorType2[ValueErrorType2["DateMinimumTimestamp"] = 18] = "DateMinimumTimestamp";
  ValueErrorType2[ValueErrorType2["DateMultipleOfTimestamp"] = 19] = "DateMultipleOfTimestamp";
  ValueErrorType2[ValueErrorType2["Date"] = 20] = "Date";
  ValueErrorType2[ValueErrorType2["Function"] = 21] = "Function";
  ValueErrorType2[ValueErrorType2["IntegerExclusiveMaximum"] = 22] = "IntegerExclusiveMaximum";
  ValueErrorType2[ValueErrorType2["IntegerExclusiveMinimum"] = 23] = "IntegerExclusiveMinimum";
  ValueErrorType2[ValueErrorType2["IntegerMaximum"] = 24] = "IntegerMaximum";
  ValueErrorType2[ValueErrorType2["IntegerMinimum"] = 25] = "IntegerMinimum";
  ValueErrorType2[ValueErrorType2["IntegerMultipleOf"] = 26] = "IntegerMultipleOf";
  ValueErrorType2[ValueErrorType2["Integer"] = 27] = "Integer";
  ValueErrorType2[ValueErrorType2["IntersectUnevaluatedProperties"] = 28] = "IntersectUnevaluatedProperties";
  ValueErrorType2[ValueErrorType2["Intersect"] = 29] = "Intersect";
  ValueErrorType2[ValueErrorType2["Iterator"] = 30] = "Iterator";
  ValueErrorType2[ValueErrorType2["Kind"] = 31] = "Kind";
  ValueErrorType2[ValueErrorType2["Literal"] = 32] = "Literal";
  ValueErrorType2[ValueErrorType2["Never"] = 33] = "Never";
  ValueErrorType2[ValueErrorType2["Not"] = 34] = "Not";
  ValueErrorType2[ValueErrorType2["Null"] = 35] = "Null";
  ValueErrorType2[ValueErrorType2["NumberExclusiveMaximum"] = 36] = "NumberExclusiveMaximum";
  ValueErrorType2[ValueErrorType2["NumberExclusiveMinimum"] = 37] = "NumberExclusiveMinimum";
  ValueErrorType2[ValueErrorType2["NumberMaximum"] = 38] = "NumberMaximum";
  ValueErrorType2[ValueErrorType2["NumberMinimum"] = 39] = "NumberMinimum";
  ValueErrorType2[ValueErrorType2["NumberMultipleOf"] = 40] = "NumberMultipleOf";
  ValueErrorType2[ValueErrorType2["Number"] = 41] = "Number";
  ValueErrorType2[ValueErrorType2["ObjectAdditionalProperties"] = 42] = "ObjectAdditionalProperties";
  ValueErrorType2[ValueErrorType2["ObjectMaxProperties"] = 43] = "ObjectMaxProperties";
  ValueErrorType2[ValueErrorType2["ObjectMinProperties"] = 44] = "ObjectMinProperties";
  ValueErrorType2[ValueErrorType2["ObjectRequiredProperty"] = 45] = "ObjectRequiredProperty";
  ValueErrorType2[ValueErrorType2["Object"] = 46] = "Object";
  ValueErrorType2[ValueErrorType2["Promise"] = 47] = "Promise";
  ValueErrorType2[ValueErrorType2["RegExp"] = 48] = "RegExp";
  ValueErrorType2[ValueErrorType2["StringFormatUnknown"] = 49] = "StringFormatUnknown";
  ValueErrorType2[ValueErrorType2["StringFormat"] = 50] = "StringFormat";
  ValueErrorType2[ValueErrorType2["StringMaxLength"] = 51] = "StringMaxLength";
  ValueErrorType2[ValueErrorType2["StringMinLength"] = 52] = "StringMinLength";
  ValueErrorType2[ValueErrorType2["StringPattern"] = 53] = "StringPattern";
  ValueErrorType2[ValueErrorType2["String"] = 54] = "String";
  ValueErrorType2[ValueErrorType2["Symbol"] = 55] = "Symbol";
  ValueErrorType2[ValueErrorType2["TupleLength"] = 56] = "TupleLength";
  ValueErrorType2[ValueErrorType2["Tuple"] = 57] = "Tuple";
  ValueErrorType2[ValueErrorType2["Uint8ArrayMaxByteLength"] = 58] = "Uint8ArrayMaxByteLength";
  ValueErrorType2[ValueErrorType2["Uint8ArrayMinByteLength"] = 59] = "Uint8ArrayMinByteLength";
  ValueErrorType2[ValueErrorType2["Uint8Array"] = 60] = "Uint8Array";
  ValueErrorType2[ValueErrorType2["Undefined"] = 61] = "Undefined";
  ValueErrorType2[ValueErrorType2["Union"] = 62] = "Union";
  ValueErrorType2[ValueErrorType2["Void"] = 63] = "Void";
})(ValueErrorType || (ValueErrorType = {}));

class ValueErrorsUnknownTypeError extends TypeBoxError {
  constructor(schema3) {
    super("Unknown type");
    this.schema = schema3;
  }
}
function EscapeKey(key) {
  return key.replace(/~/g, "~0").replace(/\//g, "~1");
}
function IsDefined2(value2) {
  return value2 !== undefined;
}

class ValueErrorIterator {
  constructor(iterator3) {
    this.iterator = iterator3;
  }
  [Symbol.iterator]() {
    return this.iterator;
  }
  First() {
    const next = this.iterator.next();
    return next.done ? undefined : next.value;
  }
}
function Create(errorType, schema3, path, value2, errors = []) {
  return {
    type: errorType,
    schema: schema3,
    path,
    value: value2,
    message: GetErrorFunction()({ errorType, path, schema: schema3, value: value2, errors }),
    errors
  };
}
function* FromAny3(schema3, references, path, value2) {}
function* FromArgument3(schema3, references, path, value2) {}
function* FromArray8(schema3, references, path, value2) {
  if (!IsArray2(value2)) {
    return yield Create(ValueErrorType.Array, schema3, path, value2);
  }
  if (IsDefined2(schema3.minItems) && !(value2.length >= schema3.minItems)) {
    yield Create(ValueErrorType.ArrayMinItems, schema3, path, value2);
  }
  if (IsDefined2(schema3.maxItems) && !(value2.length <= schema3.maxItems)) {
    yield Create(ValueErrorType.ArrayMaxItems, schema3, path, value2);
  }
  for (let i2 = 0;i2 < value2.length; i2++) {
    yield* Visit6(schema3.items, references, `${path}/${i2}`, value2[i2]);
  }
  if (schema3.uniqueItems === true && !function() {
    const set2 = new Set;
    for (const element of value2) {
      const hashed = Hash(element);
      if (set2.has(hashed)) {
        return false;
      } else {
        set2.add(hashed);
      }
    }
    return true;
  }()) {
    yield Create(ValueErrorType.ArrayUniqueItems, schema3, path, value2);
  }
  if (!(IsDefined2(schema3.contains) || IsDefined2(schema3.minContains) || IsDefined2(schema3.maxContains))) {
    return;
  }
  const containsSchema = IsDefined2(schema3.contains) ? schema3.contains : Never();
  const containsCount = value2.reduce((acc, value3, index) => Visit6(containsSchema, references, `${path}${index}`, value3).next().done === true ? acc + 1 : acc, 0);
  if (containsCount === 0) {
    yield Create(ValueErrorType.ArrayContains, schema3, path, value2);
  }
  if (IsNumber2(schema3.minContains) && containsCount < schema3.minContains) {
    yield Create(ValueErrorType.ArrayMinContains, schema3, path, value2);
  }
  if (IsNumber2(schema3.maxContains) && containsCount > schema3.maxContains) {
    yield Create(ValueErrorType.ArrayMaxContains, schema3, path, value2);
  }
}
function* FromAsyncIterator5(schema3, references, path, value2) {
  if (!IsAsyncIterator2(value2))
    yield Create(ValueErrorType.AsyncIterator, schema3, path, value2);
}
function* FromBigInt3(schema3, references, path, value2) {
  if (!IsBigInt2(value2))
    return yield Create(ValueErrorType.BigInt, schema3, path, value2);
  if (IsDefined2(schema3.exclusiveMaximum) && !(value2 < schema3.exclusiveMaximum)) {
    yield Create(ValueErrorType.BigIntExclusiveMaximum, schema3, path, value2);
  }
  if (IsDefined2(schema3.exclusiveMinimum) && !(value2 > schema3.exclusiveMinimum)) {
    yield Create(ValueErrorType.BigIntExclusiveMinimum, schema3, path, value2);
  }
  if (IsDefined2(schema3.maximum) && !(value2 <= schema3.maximum)) {
    yield Create(ValueErrorType.BigIntMaximum, schema3, path, value2);
  }
  if (IsDefined2(schema3.minimum) && !(value2 >= schema3.minimum)) {
    yield Create(ValueErrorType.BigIntMinimum, schema3, path, value2);
  }
  if (IsDefined2(schema3.multipleOf) && !(value2 % schema3.multipleOf === BigInt(0))) {
    yield Create(ValueErrorType.BigIntMultipleOf, schema3, path, value2);
  }
}
function* FromBoolean3(schema3, references, path, value2) {
  if (!IsBoolean2(value2))
    yield Create(ValueErrorType.Boolean, schema3, path, value2);
}
function* FromConstructor5(schema3, references, path, value2) {
  yield* Visit6(schema3.returns, references, path, value2.prototype);
}
function* FromDate3(schema3, references, path, value2) {
  if (!IsDate2(value2))
    return yield Create(ValueErrorType.Date, schema3, path, value2);
  if (IsDefined2(schema3.exclusiveMaximumTimestamp) && !(value2.getTime() < schema3.exclusiveMaximumTimestamp)) {
    yield Create(ValueErrorType.DateExclusiveMaximumTimestamp, schema3, path, value2);
  }
  if (IsDefined2(schema3.exclusiveMinimumTimestamp) && !(value2.getTime() > schema3.exclusiveMinimumTimestamp)) {
    yield Create(ValueErrorType.DateExclusiveMinimumTimestamp, schema3, path, value2);
  }
  if (IsDefined2(schema3.maximumTimestamp) && !(value2.getTime() <= schema3.maximumTimestamp)) {
    yield Create(ValueErrorType.DateMaximumTimestamp, schema3, path, value2);
  }
  if (IsDefined2(schema3.minimumTimestamp) && !(value2.getTime() >= schema3.minimumTimestamp)) {
    yield Create(ValueErrorType.DateMinimumTimestamp, schema3, path, value2);
  }
  if (IsDefined2(schema3.multipleOfTimestamp) && !(value2.getTime() % schema3.multipleOfTimestamp === 0)) {
    yield Create(ValueErrorType.DateMultipleOfTimestamp, schema3, path, value2);
  }
}
function* FromFunction5(schema3, references, path, value2) {
  if (!IsFunction2(value2))
    yield Create(ValueErrorType.Function, schema3, path, value2);
}
function* FromImport2(schema3, references, path, value2) {
  const definitions = globalThis.Object.values(schema3.$defs);
  const target = schema3.$defs[schema3.$ref];
  yield* Visit6(target, [...references, ...definitions], path, value2);
}
function* FromInteger3(schema3, references, path, value2) {
  if (!IsInteger(value2))
    return yield Create(ValueErrorType.Integer, schema3, path, value2);
  if (IsDefined2(schema3.exclusiveMaximum) && !(value2 < schema3.exclusiveMaximum)) {
    yield Create(ValueErrorType.IntegerExclusiveMaximum, schema3, path, value2);
  }
  if (IsDefined2(schema3.exclusiveMinimum) && !(value2 > schema3.exclusiveMinimum)) {
    yield Create(ValueErrorType.IntegerExclusiveMinimum, schema3, path, value2);
  }
  if (IsDefined2(schema3.maximum) && !(value2 <= schema3.maximum)) {
    yield Create(ValueErrorType.IntegerMaximum, schema3, path, value2);
  }
  if (IsDefined2(schema3.minimum) && !(value2 >= schema3.minimum)) {
    yield Create(ValueErrorType.IntegerMinimum, schema3, path, value2);
  }
  if (IsDefined2(schema3.multipleOf) && !(value2 % schema3.multipleOf === 0)) {
    yield Create(ValueErrorType.IntegerMultipleOf, schema3, path, value2);
  }
}
function* FromIntersect10(schema3, references, path, value2) {
  let hasError = false;
  for (const inner of schema3.allOf) {
    for (const error3 of Visit6(inner, references, path, value2)) {
      hasError = true;
      yield error3;
    }
  }
  if (hasError) {
    return yield Create(ValueErrorType.Intersect, schema3, path, value2);
  }
  if (schema3.unevaluatedProperties === false) {
    const keyCheck = new RegExp(KeyOfPattern(schema3));
    for (const valueKey of Object.getOwnPropertyNames(value2)) {
      if (!keyCheck.test(valueKey)) {
        yield Create(ValueErrorType.IntersectUnevaluatedProperties, schema3, `${path}/${valueKey}`, value2);
      }
    }
  }
  if (typeof schema3.unevaluatedProperties === "object") {
    const keyCheck = new RegExp(KeyOfPattern(schema3));
    for (const valueKey of Object.getOwnPropertyNames(value2)) {
      if (!keyCheck.test(valueKey)) {
        const next = Visit6(schema3.unevaluatedProperties, references, `${path}/${valueKey}`, value2[valueKey]).next();
        if (!next.done)
          yield next.value;
      }
    }
  }
}
function* FromIterator5(schema3, references, path, value2) {
  if (!IsIterator2(value2))
    yield Create(ValueErrorType.Iterator, schema3, path, value2);
}
function* FromLiteral4(schema3, references, path, value2) {
  if (!(value2 === schema3.const))
    yield Create(ValueErrorType.Literal, schema3, path, value2);
}
function* FromNever3(schema3, references, path, value2) {
  yield Create(ValueErrorType.Never, schema3, path, value2);
}
function* FromNot3(schema3, references, path, value2) {
  if (Visit6(schema3.not, references, path, value2).next().done === true)
    yield Create(ValueErrorType.Not, schema3, path, value2);
}
function* FromNull3(schema3, references, path, value2) {
  if (!IsNull2(value2))
    yield Create(ValueErrorType.Null, schema3, path, value2);
}
function* FromNumber3(schema3, references, path, value2) {
  if (!TypeSystemPolicy.IsNumberLike(value2))
    return yield Create(ValueErrorType.Number, schema3, path, value2);
  if (IsDefined2(schema3.exclusiveMaximum) && !(value2 < schema3.exclusiveMaximum)) {
    yield Create(ValueErrorType.NumberExclusiveMaximum, schema3, path, value2);
  }
  if (IsDefined2(schema3.exclusiveMinimum) && !(value2 > schema3.exclusiveMinimum)) {
    yield Create(ValueErrorType.NumberExclusiveMinimum, schema3, path, value2);
  }
  if (IsDefined2(schema3.maximum) && !(value2 <= schema3.maximum)) {
    yield Create(ValueErrorType.NumberMaximum, schema3, path, value2);
  }
  if (IsDefined2(schema3.minimum) && !(value2 >= schema3.minimum)) {
    yield Create(ValueErrorType.NumberMinimum, schema3, path, value2);
  }
  if (IsDefined2(schema3.multipleOf) && !(value2 % schema3.multipleOf === 0)) {
    yield Create(ValueErrorType.NumberMultipleOf, schema3, path, value2);
  }
}
function* FromObject9(schema3, references, path, value2) {
  if (!TypeSystemPolicy.IsObjectLike(value2))
    return yield Create(ValueErrorType.Object, schema3, path, value2);
  if (IsDefined2(schema3.minProperties) && !(Object.getOwnPropertyNames(value2).length >= schema3.minProperties)) {
    yield Create(ValueErrorType.ObjectMinProperties, schema3, path, value2);
  }
  if (IsDefined2(schema3.maxProperties) && !(Object.getOwnPropertyNames(value2).length <= schema3.maxProperties)) {
    yield Create(ValueErrorType.ObjectMaxProperties, schema3, path, value2);
  }
  const requiredKeys = Array.isArray(schema3.required) ? schema3.required : [];
  const knownKeys = Object.getOwnPropertyNames(schema3.properties);
  const unknownKeys = Object.getOwnPropertyNames(value2);
  for (const requiredKey of requiredKeys) {
    if (unknownKeys.includes(requiredKey))
      continue;
    yield Create(ValueErrorType.ObjectRequiredProperty, schema3.properties[requiredKey], `${path}/${EscapeKey(requiredKey)}`, undefined);
  }
  if (schema3.additionalProperties === false) {
    for (const valueKey of unknownKeys) {
      if (!knownKeys.includes(valueKey)) {
        yield Create(ValueErrorType.ObjectAdditionalProperties, schema3, `${path}/${EscapeKey(valueKey)}`, value2[valueKey]);
      }
    }
  }
  if (typeof schema3.additionalProperties === "object") {
    for (const valueKey of unknownKeys) {
      if (knownKeys.includes(valueKey))
        continue;
      yield* Visit6(schema3.additionalProperties, references, `${path}/${EscapeKey(valueKey)}`, value2[valueKey]);
    }
  }
  for (const knownKey of knownKeys) {
    const property = schema3.properties[knownKey];
    if (schema3.required && schema3.required.includes(knownKey)) {
      yield* Visit6(property, references, `${path}/${EscapeKey(knownKey)}`, value2[knownKey]);
      if (ExtendsUndefinedCheck(schema3) && !(knownKey in value2)) {
        yield Create(ValueErrorType.ObjectRequiredProperty, property, `${path}/${EscapeKey(knownKey)}`, undefined);
      }
    } else {
      if (TypeSystemPolicy.IsExactOptionalProperty(value2, knownKey)) {
        yield* Visit6(property, references, `${path}/${EscapeKey(knownKey)}`, value2[knownKey]);
      }
    }
  }
}
function* FromPromise5(schema3, references, path, value2) {
  if (!IsPromise(value2))
    yield Create(ValueErrorType.Promise, schema3, path, value2);
}
function* FromRecord5(schema3, references, path, value2) {
  if (!TypeSystemPolicy.IsRecordLike(value2))
    return yield Create(ValueErrorType.Object, schema3, path, value2);
  if (IsDefined2(schema3.minProperties) && !(Object.getOwnPropertyNames(value2).length >= schema3.minProperties)) {
    yield Create(ValueErrorType.ObjectMinProperties, schema3, path, value2);
  }
  if (IsDefined2(schema3.maxProperties) && !(Object.getOwnPropertyNames(value2).length <= schema3.maxProperties)) {
    yield Create(ValueErrorType.ObjectMaxProperties, schema3, path, value2);
  }
  const [patternKey, patternSchema] = Object.entries(schema3.patternProperties)[0];
  const regex = new RegExp(patternKey);
  for (const [propertyKey, propertyValue] of Object.entries(value2)) {
    if (regex.test(propertyKey))
      yield* Visit6(patternSchema, references, `${path}/${EscapeKey(propertyKey)}`, propertyValue);
  }
  if (typeof schema3.additionalProperties === "object") {
    for (const [propertyKey, propertyValue] of Object.entries(value2)) {
      if (!regex.test(propertyKey))
        yield* Visit6(schema3.additionalProperties, references, `${path}/${EscapeKey(propertyKey)}`, propertyValue);
    }
  }
  if (schema3.additionalProperties === false) {
    for (const [propertyKey, propertyValue] of Object.entries(value2)) {
      if (regex.test(propertyKey))
        continue;
      return yield Create(ValueErrorType.ObjectAdditionalProperties, schema3, `${path}/${EscapeKey(propertyKey)}`, propertyValue);
    }
  }
}
function* FromRef6(schema3, references, path, value2) {
  yield* Visit6(Deref(schema3, references), references, path, value2);
}
function* FromRegExp3(schema3, references, path, value2) {
  if (!IsString2(value2))
    return yield Create(ValueErrorType.String, schema3, path, value2);
  if (IsDefined2(schema3.minLength) && !(value2.length >= schema3.minLength)) {
    yield Create(ValueErrorType.StringMinLength, schema3, path, value2);
  }
  if (IsDefined2(schema3.maxLength) && !(value2.length <= schema3.maxLength)) {
    yield Create(ValueErrorType.StringMaxLength, schema3, path, value2);
  }
  const regex = new RegExp(schema3.source, schema3.flags);
  if (!regex.test(value2)) {
    return yield Create(ValueErrorType.RegExp, schema3, path, value2);
  }
}
function* FromString3(schema3, references, path, value2) {
  if (!IsString2(value2))
    return yield Create(ValueErrorType.String, schema3, path, value2);
  if (IsDefined2(schema3.minLength) && !(value2.length >= schema3.minLength)) {
    yield Create(ValueErrorType.StringMinLength, schema3, path, value2);
  }
  if (IsDefined2(schema3.maxLength) && !(value2.length <= schema3.maxLength)) {
    yield Create(ValueErrorType.StringMaxLength, schema3, path, value2);
  }
  if (IsString2(schema3.pattern)) {
    const regex = new RegExp(schema3.pattern);
    if (!regex.test(value2)) {
      yield Create(ValueErrorType.StringPattern, schema3, path, value2);
    }
  }
  if (IsString2(schema3.format)) {
    if (!exports_format.Has(schema3.format)) {
      yield Create(ValueErrorType.StringFormatUnknown, schema3, path, value2);
    } else {
      const format = exports_format.Get(schema3.format);
      if (!format(value2)) {
        yield Create(ValueErrorType.StringFormat, schema3, path, value2);
      }
    }
  }
}
function* FromSymbol3(schema3, references, path, value2) {
  if (!IsSymbol2(value2))
    yield Create(ValueErrorType.Symbol, schema3, path, value2);
}
function* FromTemplateLiteral5(schema3, references, path, value2) {
  if (!IsString2(value2))
    return yield Create(ValueErrorType.String, schema3, path, value2);
  const regex = new RegExp(schema3.pattern);
  if (!regex.test(value2)) {
    yield Create(ValueErrorType.StringPattern, schema3, path, value2);
  }
}
function* FromThis2(schema3, references, path, value2) {
  yield* Visit6(Deref(schema3, references), references, path, value2);
}
function* FromTuple7(schema3, references, path, value2) {
  if (!IsArray2(value2))
    return yield Create(ValueErrorType.Tuple, schema3, path, value2);
  if (schema3.items === undefined && !(value2.length === 0)) {
    return yield Create(ValueErrorType.TupleLength, schema3, path, value2);
  }
  if (!(value2.length === schema3.maxItems)) {
    return yield Create(ValueErrorType.TupleLength, schema3, path, value2);
  }
  if (!schema3.items) {
    return;
  }
  for (let i2 = 0;i2 < schema3.items.length; i2++) {
    yield* Visit6(schema3.items[i2], references, `${path}/${i2}`, value2[i2]);
  }
}
function* FromUndefined3(schema3, references, path, value2) {
  if (!IsUndefined2(value2))
    yield Create(ValueErrorType.Undefined, schema3, path, value2);
}
function* FromUnion12(schema3, references, path, value2) {
  if (Check(schema3, references, value2))
    return;
  const errors = schema3.anyOf.map((variant) => new ValueErrorIterator(Visit6(variant, references, path, value2)));
  yield Create(ValueErrorType.Union, schema3, path, value2, errors);
}
function* FromUint8Array3(schema3, references, path, value2) {
  if (!IsUint8Array2(value2))
    return yield Create(ValueErrorType.Uint8Array, schema3, path, value2);
  if (IsDefined2(schema3.maxByteLength) && !(value2.length <= schema3.maxByteLength)) {
    yield Create(ValueErrorType.Uint8ArrayMaxByteLength, schema3, path, value2);
  }
  if (IsDefined2(schema3.minByteLength) && !(value2.length >= schema3.minByteLength)) {
    yield Create(ValueErrorType.Uint8ArrayMinByteLength, schema3, path, value2);
  }
}
function* FromUnknown3(schema3, references, path, value2) {}
function* FromVoid3(schema3, references, path, value2) {
  if (!TypeSystemPolicy.IsVoidLike(value2))
    yield Create(ValueErrorType.Void, schema3, path, value2);
}
function* FromKind2(schema3, references, path, value2) {
  const check = exports_type2.Get(schema3[Kind]);
  if (!check(schema3, value2))
    yield Create(ValueErrorType.Kind, schema3, path, value2);
}
function* Visit6(schema3, references, path, value2) {
  const references_ = IsDefined2(schema3.$id) ? [...references, schema3] : references;
  const schema_ = schema3;
  switch (schema_[Kind]) {
    case "Any":
      return yield* FromAny3(schema_, references_, path, value2);
    case "Argument":
      return yield* FromArgument3(schema_, references_, path, value2);
    case "Array":
      return yield* FromArray8(schema_, references_, path, value2);
    case "AsyncIterator":
      return yield* FromAsyncIterator5(schema_, references_, path, value2);
    case "BigInt":
      return yield* FromBigInt3(schema_, references_, path, value2);
    case "Boolean":
      return yield* FromBoolean3(schema_, references_, path, value2);
    case "Constructor":
      return yield* FromConstructor5(schema_, references_, path, value2);
    case "Date":
      return yield* FromDate3(schema_, references_, path, value2);
    case "Function":
      return yield* FromFunction5(schema_, references_, path, value2);
    case "Import":
      return yield* FromImport2(schema_, references_, path, value2);
    case "Integer":
      return yield* FromInteger3(schema_, references_, path, value2);
    case "Intersect":
      return yield* FromIntersect10(schema_, references_, path, value2);
    case "Iterator":
      return yield* FromIterator5(schema_, references_, path, value2);
    case "Literal":
      return yield* FromLiteral4(schema_, references_, path, value2);
    case "Never":
      return yield* FromNever3(schema_, references_, path, value2);
    case "Not":
      return yield* FromNot3(schema_, references_, path, value2);
    case "Null":
      return yield* FromNull3(schema_, references_, path, value2);
    case "Number":
      return yield* FromNumber3(schema_, references_, path, value2);
    case "Object":
      return yield* FromObject9(schema_, references_, path, value2);
    case "Promise":
      return yield* FromPromise5(schema_, references_, path, value2);
    case "Record":
      return yield* FromRecord5(schema_, references_, path, value2);
    case "Ref":
      return yield* FromRef6(schema_, references_, path, value2);
    case "RegExp":
      return yield* FromRegExp3(schema_, references_, path, value2);
    case "String":
      return yield* FromString3(schema_, references_, path, value2);
    case "Symbol":
      return yield* FromSymbol3(schema_, references_, path, value2);
    case "TemplateLiteral":
      return yield* FromTemplateLiteral5(schema_, references_, path, value2);
    case "This":
      return yield* FromThis2(schema_, references_, path, value2);
    case "Tuple":
      return yield* FromTuple7(schema_, references_, path, value2);
    case "Undefined":
      return yield* FromUndefined3(schema_, references_, path, value2);
    case "Union":
      return yield* FromUnion12(schema_, references_, path, value2);
    case "Uint8Array":
      return yield* FromUint8Array3(schema_, references_, path, value2);
    case "Unknown":
      return yield* FromUnknown3(schema_, references_, path, value2);
    case "Void":
      return yield* FromVoid3(schema_, references_, path, value2);
    default:
      if (!exports_type2.Has(schema_[Kind]))
        throw new ValueErrorsUnknownTypeError(schema3);
      return yield* FromKind2(schema_, references_, path, value2);
  }
}
function Errors(...args) {
  const iterator3 = args.length === 3 ? Visit6(args[0], args[1], "", args[2]) : Visit6(args[0], [], "", args[1]);
  return new ValueErrorIterator(iterator3);
}

// node_modules/@sinclair/typebox/build/esm/value/assert/assert.mjs
init_error();
var __classPrivateFieldSet = function(receiver, state, value2, kind, f) {
  if (kind === "m")
    throw new TypeError("Private method is not writable");
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value2) : f ? f.value = value2 : state.set(receiver, value2), value2;
};
var __classPrivateFieldGet = function(receiver, state, kind, f) {
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _AssertError_instances;
var _AssertError_iterator;
var _AssertError_Iterator;

class AssertError extends TypeBoxError {
  constructor(iterator3) {
    const error3 = iterator3.First();
    super(error3 === undefined ? "Invalid Value" : error3.message);
    _AssertError_instances.add(this);
    _AssertError_iterator.set(this, undefined);
    __classPrivateFieldSet(this, _AssertError_iterator, iterator3, "f");
    this.error = error3;
  }
  Errors() {
    return new ValueErrorIterator(__classPrivateFieldGet(this, _AssertError_instances, "m", _AssertError_Iterator).call(this));
  }
}
_AssertError_iterator = new WeakMap, _AssertError_instances = new WeakSet, _AssertError_Iterator = function* _AssertError_Iterator2() {
  if (this.error)
    yield this.error;
  yield* __classPrivateFieldGet(this, _AssertError_iterator, "f");
};
function AssertValue(schema3, references, value2) {
  if (Check(schema3, references, value2))
    return;
  throw new AssertError(Errors(schema3, references, value2));
}
function Assert(...args) {
  return args.length === 3 ? AssertValue(args[0], args[1], args[2]) : AssertValue(args[0], [], args[1]);
}
// node_modules/@sinclair/typebox/build/esm/value/cast/cast.mjs
init_guard();
init_error2();
init_symbols2();

// node_modules/@sinclair/typebox/build/esm/value/create/create.mjs
init_guard();

// node_modules/@sinclair/typebox/build/esm/value/clone/clone.mjs
init_guard();
function FromObject10(value2) {
  const Acc = {};
  for (const key of Object.getOwnPropertyNames(value2)) {
    Acc[key] = Clone2(value2[key]);
  }
  for (const key of Object.getOwnPropertySymbols(value2)) {
    Acc[key] = Clone2(value2[key]);
  }
  return Acc;
}
function FromArray9(value2) {
  return value2.map((element) => Clone2(element));
}
function FromTypedArray(value2) {
  return value2.slice();
}
function FromMap(value2) {
  return new Map(Clone2([...value2.entries()]));
}
function FromSet(value2) {
  return new Set(Clone2([...value2.entries()]));
}
function FromDate4(value2) {
  return new Date(value2.toISOString());
}
function FromValue2(value2) {
  return value2;
}
function Clone2(value2) {
  if (IsArray2(value2))
    return FromArray9(value2);
  if (IsDate2(value2))
    return FromDate4(value2);
  if (IsTypedArray(value2))
    return FromTypedArray(value2);
  if (IsMap(value2))
    return FromMap(value2);
  if (IsSet(value2))
    return FromSet(value2);
  if (IsObject2(value2))
    return FromObject10(value2);
  if (IsValueType(value2))
    return FromValue2(value2);
  throw new Error("ValueClone: Unable to clone value");
}

// node_modules/@sinclair/typebox/build/esm/value/create/create.mjs
init_template_literal2();
init_registry();
init_symbols2();
init_error2();

class ValueCreateError extends TypeBoxError {
  constructor(schema3, message) {
    super(message);
    this.schema = schema3;
  }
}
function FromDefault(value2) {
  return IsFunction2(value2) ? value2() : Clone2(value2);
}
function FromAny4(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else {
    return {};
  }
}
function FromArgument4(schema3, references) {
  return {};
}
function FromArray10(schema3, references) {
  if (schema3.uniqueItems === true && !HasPropertyKey2(schema3, "default")) {
    throw new ValueCreateError(schema3, "Array with the uniqueItems constraint requires a default value");
  } else if ("contains" in schema3 && !HasPropertyKey2(schema3, "default")) {
    throw new ValueCreateError(schema3, "Array with the contains constraint requires a default value");
  } else if ("default" in schema3) {
    return FromDefault(schema3.default);
  } else if (schema3.minItems !== undefined) {
    return Array.from({ length: schema3.minItems }).map((item) => {
      return Visit7(schema3.items, references);
    });
  } else {
    return [];
  }
}
function FromAsyncIterator6(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else {
    return async function* () {}();
  }
}
function FromBigInt4(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else {
    return BigInt(0);
  }
}
function FromBoolean4(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else {
    return false;
  }
}
function FromConstructor6(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else {
    const value2 = Visit7(schema3.returns, references);
    if (typeof value2 === "object" && !Array.isArray(value2)) {
      return class {
        constructor() {
          for (const [key, val] of Object.entries(value2)) {
            const self = this;
            self[key] = val;
          }
        }
      };
    } else {
      return class {
      };
    }
  }
}
function FromDate5(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else if (schema3.minimumTimestamp !== undefined) {
    return new Date(schema3.minimumTimestamp);
  } else {
    return new Date;
  }
}
function FromFunction6(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else {
    return () => Visit7(schema3.returns, references);
  }
}
function FromImport3(schema3, references) {
  const definitions = globalThis.Object.values(schema3.$defs);
  const target = schema3.$defs[schema3.$ref];
  return Visit7(target, [...references, ...definitions]);
}
function FromInteger4(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else if (schema3.minimum !== undefined) {
    return schema3.minimum;
  } else {
    return 0;
  }
}
function FromIntersect11(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else {
    const value2 = schema3.allOf.reduce((acc, schema4) => {
      const next = Visit7(schema4, references);
      return typeof next === "object" ? { ...acc, ...next } : next;
    }, {});
    if (!Check(schema3, references, value2))
      throw new ValueCreateError(schema3, "Intersect produced invalid value. Consider using a default value.");
    return value2;
  }
}
function FromIterator6(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else {
    return function* () {}();
  }
}
function FromLiteral5(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else {
    return schema3.const;
  }
}
function FromNever4(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else {
    throw new ValueCreateError(schema3, "Never types cannot be created. Consider using a default value.");
  }
}
function FromNot4(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else {
    throw new ValueCreateError(schema3, "Not types must have a default value");
  }
}
function FromNull4(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else {
    return null;
  }
}
function FromNumber4(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else if (schema3.minimum !== undefined) {
    return schema3.minimum;
  } else {
    return 0;
  }
}
function FromObject11(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else {
    const required3 = new Set(schema3.required);
    const Acc = {};
    for (const [key, subschema] of Object.entries(schema3.properties)) {
      if (!required3.has(key))
        continue;
      Acc[key] = Visit7(subschema, references);
    }
    return Acc;
  }
}
function FromPromise6(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else {
    return Promise.resolve(Visit7(schema3.item, references));
  }
}
function FromRecord6(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else {
    return {};
  }
}
function FromRef7(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else {
    return Visit7(Deref(schema3, references), references);
  }
}
function FromRegExp4(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else {
    throw new ValueCreateError(schema3, "RegExp types cannot be created. Consider using a default value.");
  }
}
function FromString4(schema3, references) {
  if (schema3.pattern !== undefined) {
    if (!HasPropertyKey2(schema3, "default")) {
      throw new ValueCreateError(schema3, "String types with patterns must specify a default value");
    } else {
      return FromDefault(schema3.default);
    }
  } else if (schema3.format !== undefined) {
    if (!HasPropertyKey2(schema3, "default")) {
      throw new ValueCreateError(schema3, "String types with formats must specify a default value");
    } else {
      return FromDefault(schema3.default);
    }
  } else {
    if (HasPropertyKey2(schema3, "default")) {
      return FromDefault(schema3.default);
    } else if (schema3.minLength !== undefined) {
      return Array.from({ length: schema3.minLength }).map(() => " ").join("");
    } else {
      return "";
    }
  }
}
function FromSymbol4(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else if ("value" in schema3) {
    return Symbol.for(schema3.value);
  } else {
    return Symbol();
  }
}
function FromTemplateLiteral6(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  }
  if (!IsTemplateLiteralFinite(schema3))
    throw new ValueCreateError(schema3, "Can only create template literals that produce a finite variants. Consider using a default value.");
  const generated = TemplateLiteralGenerate(schema3);
  return generated[0];
}
function FromThis3(schema3, references) {
  if (recursiveDepth++ > recursiveMaxDepth)
    throw new ValueCreateError(schema3, "Cannot create recursive type as it appears possibly infinite. Consider using a default.");
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else {
    return Visit7(Deref(schema3, references), references);
  }
}
function FromTuple8(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  }
  if (schema3.items === undefined) {
    return [];
  } else {
    return Array.from({ length: schema3.minItems }).map((_, index) => Visit7(schema3.items[index], references));
  }
}
function FromUndefined4(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else {
    return;
  }
}
function FromUnion13(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else if (schema3.anyOf.length === 0) {
    throw new Error("ValueCreate.Union: Cannot create Union with zero variants");
  } else {
    return Visit7(schema3.anyOf[0], references);
  }
}
function FromUint8Array4(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else if (schema3.minByteLength !== undefined) {
    return new Uint8Array(schema3.minByteLength);
  } else {
    return new Uint8Array(0);
  }
}
function FromUnknown4(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else {
    return {};
  }
}
function FromVoid4(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else {
    return;
  }
}
function FromKind3(schema3, references) {
  if (HasPropertyKey2(schema3, "default")) {
    return FromDefault(schema3.default);
  } else {
    throw new Error("User defined types must specify a default value");
  }
}
function Visit7(schema3, references) {
  const references_ = Pushref(schema3, references);
  const schema_ = schema3;
  switch (schema_[Kind]) {
    case "Any":
      return FromAny4(schema_, references_);
    case "Argument":
      return FromArgument4(schema_, references_);
    case "Array":
      return FromArray10(schema_, references_);
    case "AsyncIterator":
      return FromAsyncIterator6(schema_, references_);
    case "BigInt":
      return FromBigInt4(schema_, references_);
    case "Boolean":
      return FromBoolean4(schema_, references_);
    case "Constructor":
      return FromConstructor6(schema_, references_);
    case "Date":
      return FromDate5(schema_, references_);
    case "Function":
      return FromFunction6(schema_, references_);
    case "Import":
      return FromImport3(schema_, references_);
    case "Integer":
      return FromInteger4(schema_, references_);
    case "Intersect":
      return FromIntersect11(schema_, references_);
    case "Iterator":
      return FromIterator6(schema_, references_);
    case "Literal":
      return FromLiteral5(schema_, references_);
    case "Never":
      return FromNever4(schema_, references_);
    case "Not":
      return FromNot4(schema_, references_);
    case "Null":
      return FromNull4(schema_, references_);
    case "Number":
      return FromNumber4(schema_, references_);
    case "Object":
      return FromObject11(schema_, references_);
    case "Promise":
      return FromPromise6(schema_, references_);
    case "Record":
      return FromRecord6(schema_, references_);
    case "Ref":
      return FromRef7(schema_, references_);
    case "RegExp":
      return FromRegExp4(schema_, references_);
    case "String":
      return FromString4(schema_, references_);
    case "Symbol":
      return FromSymbol4(schema_, references_);
    case "TemplateLiteral":
      return FromTemplateLiteral6(schema_, references_);
    case "This":
      return FromThis3(schema_, references_);
    case "Tuple":
      return FromTuple8(schema_, references_);
    case "Undefined":
      return FromUndefined4(schema_, references_);
    case "Union":
      return FromUnion13(schema_, references_);
    case "Uint8Array":
      return FromUint8Array4(schema_, references_);
    case "Unknown":
      return FromUnknown4(schema_, references_);
    case "Void":
      return FromVoid4(schema_, references_);
    default:
      if (!exports_type2.Has(schema_[Kind]))
        throw new ValueCreateError(schema_, "Unknown type");
      return FromKind3(schema_, references_);
  }
}
var recursiveMaxDepth = 512;
var recursiveDepth = 0;
function Create2(...args) {
  recursiveDepth = 0;
  return args.length === 2 ? Visit7(args[0], args[1]) : Visit7(args[0], []);
}

// node_modules/@sinclair/typebox/build/esm/value/cast/cast.mjs
class ValueCastError extends TypeBoxError {
  constructor(schema3, message) {
    super(message);
    this.schema = schema3;
  }
}
function ScoreUnion(schema3, references, value2) {
  if (schema3[Kind] === "Object" && typeof value2 === "object" && !IsNull2(value2)) {
    const object3 = schema3;
    const keys = Object.getOwnPropertyNames(value2);
    const entries = Object.entries(object3.properties);
    return entries.reduce((acc, [key, schema4]) => {
      const literal3 = schema4[Kind] === "Literal" && schema4.const === value2[key] ? 100 : 0;
      const checks = Check(schema4, references, value2[key]) ? 10 : 0;
      const exists = keys.includes(key) ? 1 : 0;
      return acc + (literal3 + checks + exists);
    }, 0);
  } else if (schema3[Kind] === "Union") {
    const schemas = schema3.anyOf.map((schema4) => Deref(schema4, references));
    const scores = schemas.map((schema4) => ScoreUnion(schema4, references, value2));
    return Math.max(...scores);
  } else {
    return Check(schema3, references, value2) ? 1 : 0;
  }
}
function SelectUnion(union4, references, value2) {
  const schemas = union4.anyOf.map((schema3) => Deref(schema3, references));
  let [select, best] = [schemas[0], 0];
  for (const schema3 of schemas) {
    const score = ScoreUnion(schema3, references, value2);
    if (score > best) {
      select = schema3;
      best = score;
    }
  }
  return select;
}
function CastUnion(union4, references, value2) {
  if ("default" in union4) {
    return typeof value2 === "function" ? union4.default : Clone2(union4.default);
  } else {
    const schema3 = SelectUnion(union4, references, value2);
    return Cast(schema3, references, value2);
  }
}
function DefaultClone(schema3, references, value2) {
  return Check(schema3, references, value2) ? Clone2(value2) : Create2(schema3, references);
}
function Default(schema3, references, value2) {
  return Check(schema3, references, value2) ? value2 : Create2(schema3, references);
}
function FromArray11(schema3, references, value2) {
  if (Check(schema3, references, value2))
    return Clone2(value2);
  const created = IsArray2(value2) ? Clone2(value2) : Create2(schema3, references);
  const minimum = IsNumber2(schema3.minItems) && created.length < schema3.minItems ? [...created, ...Array.from({ length: schema3.minItems - created.length }, () => null)] : created;
  const maximum = IsNumber2(schema3.maxItems) && minimum.length > schema3.maxItems ? minimum.slice(0, schema3.maxItems) : minimum;
  const casted = maximum.map((value3) => Visit8(schema3.items, references, value3));
  if (schema3.uniqueItems !== true)
    return casted;
  const unique = [...new Set(casted)];
  if (!Check(schema3, references, unique))
    throw new ValueCastError(schema3, "Array cast produced invalid data due to uniqueItems constraint");
  return unique;
}
function FromConstructor7(schema3, references, value2) {
  if (Check(schema3, references, value2))
    return Create2(schema3, references);
  const required3 = new Set(schema3.returns.required || []);
  const result = function() {};
  for (const [key, property] of Object.entries(schema3.returns.properties)) {
    if (!required3.has(key) && value2.prototype[key] === undefined)
      continue;
    result.prototype[key] = Visit8(property, references, value2.prototype[key]);
  }
  return result;
}
function FromImport4(schema3, references, value2) {
  const definitions = globalThis.Object.values(schema3.$defs);
  const target = schema3.$defs[schema3.$ref];
  return Visit8(target, [...references, ...definitions], value2);
}
function IntersectAssign(correct, value2) {
  if (IsObject2(correct) && !IsObject2(value2) || !IsObject2(correct) && IsObject2(value2))
    return correct;
  if (!IsObject2(correct) || !IsObject2(value2))
    return value2;
  return globalThis.Object.getOwnPropertyNames(correct).reduce((result, key) => {
    const property = key in value2 ? IntersectAssign(correct[key], value2[key]) : correct[key];
    return { ...result, [key]: property };
  }, {});
}
function FromIntersect12(schema3, references, value2) {
  if (Check(schema3, references, value2))
    return value2;
  const correct = Create2(schema3, references);
  const assigned = IntersectAssign(correct, value2);
  return Check(schema3, references, assigned) ? assigned : correct;
}
function FromNever5(schema3, references, value2) {
  throw new ValueCastError(schema3, "Never types cannot be cast");
}
function FromObject12(schema3, references, value2) {
  if (Check(schema3, references, value2))
    return value2;
  if (value2 === null || typeof value2 !== "object")
    return Create2(schema3, references);
  const required3 = new Set(schema3.required || []);
  const result = {};
  for (const [key, property] of Object.entries(schema3.properties)) {
    if (!required3.has(key) && value2[key] === undefined)
      continue;
    result[key] = Visit8(property, references, value2[key]);
  }
  if (typeof schema3.additionalProperties === "object") {
    const propertyNames = Object.getOwnPropertyNames(schema3.properties);
    for (const propertyName of Object.getOwnPropertyNames(value2)) {
      if (propertyNames.includes(propertyName))
        continue;
      result[propertyName] = Visit8(schema3.additionalProperties, references, value2[propertyName]);
    }
  }
  return result;
}
function FromRecord7(schema3, references, value2) {
  if (Check(schema3, references, value2))
    return Clone2(value2);
  if (value2 === null || typeof value2 !== "object" || Array.isArray(value2) || value2 instanceof Date)
    return Create2(schema3, references);
  const subschemaPropertyName = Object.getOwnPropertyNames(schema3.patternProperties)[0];
  const subschema = schema3.patternProperties[subschemaPropertyName];
  const result = {};
  for (const [propKey, propValue] of Object.entries(value2)) {
    result[propKey] = Visit8(subschema, references, propValue);
  }
  return result;
}
function FromRef8(schema3, references, value2) {
  return Visit8(Deref(schema3, references), references, value2);
}
function FromThis4(schema3, references, value2) {
  return Visit8(Deref(schema3, references), references, value2);
}
function FromTuple9(schema3, references, value2) {
  if (Check(schema3, references, value2))
    return Clone2(value2);
  if (!IsArray2(value2))
    return Create2(schema3, references);
  if (schema3.items === undefined)
    return [];
  return schema3.items.map((schema4, index) => Visit8(schema4, references, value2[index]));
}
function FromUnion14(schema3, references, value2) {
  return Check(schema3, references, value2) ? Clone2(value2) : CastUnion(schema3, references, value2);
}
function Visit8(schema3, references, value2) {
  const references_ = IsString2(schema3.$id) ? Pushref(schema3, references) : references;
  const schema_ = schema3;
  switch (schema3[Kind]) {
    case "Array":
      return FromArray11(schema_, references_, value2);
    case "Constructor":
      return FromConstructor7(schema_, references_, value2);
    case "Import":
      return FromImport4(schema_, references_, value2);
    case "Intersect":
      return FromIntersect12(schema_, references_, value2);
    case "Never":
      return FromNever5(schema_, references_, value2);
    case "Object":
      return FromObject12(schema_, references_, value2);
    case "Record":
      return FromRecord7(schema_, references_, value2);
    case "Ref":
      return FromRef8(schema_, references_, value2);
    case "This":
      return FromThis4(schema_, references_, value2);
    case "Tuple":
      return FromTuple9(schema_, references_, value2);
    case "Union":
      return FromUnion14(schema_, references_, value2);
    case "Date":
    case "Symbol":
    case "Uint8Array":
      return DefaultClone(schema3, references, value2);
    default:
      return Default(schema_, references_, value2);
  }
}
function Cast(...args) {
  return args.length === 3 ? Visit8(args[0], args[1], args[2]) : Visit8(args[0], [], args[1]);
}
// node_modules/@sinclair/typebox/build/esm/value/clean/clean.mjs
init_keyof2();
init_symbols2();
init_guard();
init_kind();
function IsCheckable(schema3) {
  return IsKind(schema3) && schema3[Kind] !== "Unsafe";
}
function FromArray12(schema3, references, value2) {
  if (!IsArray2(value2))
    return value2;
  return value2.map((value3) => Visit9(schema3.items, references, value3));
}
function FromImport5(schema3, references, value2) {
  const definitions = globalThis.Object.values(schema3.$defs);
  const target = schema3.$defs[schema3.$ref];
  return Visit9(target, [...references, ...definitions], value2);
}
function FromIntersect13(schema3, references, value2) {
  const unevaluatedProperties = schema3.unevaluatedProperties;
  const intersections = schema3.allOf.map((schema4) => Visit9(schema4, references, Clone2(value2)));
  const composite3 = intersections.reduce((acc, value3) => IsObject2(value3) ? { ...acc, ...value3 } : value3, {});
  if (!IsObject2(value2) || !IsObject2(composite3) || !IsKind(unevaluatedProperties))
    return composite3;
  const knownkeys = KeyOfPropertyKeys(schema3);
  for (const key of Object.getOwnPropertyNames(value2)) {
    if (knownkeys.includes(key))
      continue;
    if (Check(unevaluatedProperties, references, value2[key])) {
      composite3[key] = Visit9(unevaluatedProperties, references, value2[key]);
    }
  }
  return composite3;
}
function FromObject13(schema3, references, value2) {
  if (!IsObject2(value2) || IsArray2(value2))
    return value2;
  const additionalProperties = schema3.additionalProperties;
  for (const key of Object.getOwnPropertyNames(value2)) {
    if (HasPropertyKey2(schema3.properties, key)) {
      value2[key] = Visit9(schema3.properties[key], references, value2[key]);
      continue;
    }
    if (IsKind(additionalProperties) && Check(additionalProperties, references, value2[key])) {
      value2[key] = Visit9(additionalProperties, references, value2[key]);
      continue;
    }
    delete value2[key];
  }
  return value2;
}
function FromRecord8(schema3, references, value2) {
  if (!IsObject2(value2))
    return value2;
  const additionalProperties = schema3.additionalProperties;
  const propertyKeys = Object.getOwnPropertyNames(value2);
  const [propertyKey, propertySchema] = Object.entries(schema3.patternProperties)[0];
  const propertyKeyTest = new RegExp(propertyKey);
  for (const key of propertyKeys) {
    if (propertyKeyTest.test(key)) {
      value2[key] = Visit9(propertySchema, references, value2[key]);
      continue;
    }
    if (IsKind(additionalProperties) && Check(additionalProperties, references, value2[key])) {
      value2[key] = Visit9(additionalProperties, references, value2[key]);
      continue;
    }
    delete value2[key];
  }
  return value2;
}
function FromRef9(schema3, references, value2) {
  return Visit9(Deref(schema3, references), references, value2);
}
function FromThis5(schema3, references, value2) {
  return Visit9(Deref(schema3, references), references, value2);
}
function FromTuple10(schema3, references, value2) {
  if (!IsArray2(value2))
    return value2;
  if (IsUndefined2(schema3.items))
    return [];
  const length = Math.min(value2.length, schema3.items.length);
  for (let i2 = 0;i2 < length; i2++) {
    value2[i2] = Visit9(schema3.items[i2], references, value2[i2]);
  }
  return value2.length > length ? value2.slice(0, length) : value2;
}
function FromUnion15(schema3, references, value2) {
  for (const inner of schema3.anyOf) {
    if (IsCheckable(inner) && Check(inner, references, value2)) {
      return Visit9(inner, references, value2);
    }
  }
  return value2;
}
function Visit9(schema3, references, value2) {
  const references_ = IsString2(schema3.$id) ? Pushref(schema3, references) : references;
  const schema_ = schema3;
  switch (schema_[Kind]) {
    case "Array":
      return FromArray12(schema_, references_, value2);
    case "Import":
      return FromImport5(schema_, references_, value2);
    case "Intersect":
      return FromIntersect13(schema_, references_, value2);
    case "Object":
      return FromObject13(schema_, references_, value2);
    case "Record":
      return FromRecord8(schema_, references_, value2);
    case "Ref":
      return FromRef9(schema_, references_, value2);
    case "This":
      return FromThis5(schema_, references_, value2);
    case "Tuple":
      return FromTuple10(schema_, references_, value2);
    case "Union":
      return FromUnion15(schema_, references_, value2);
    default:
      return value2;
  }
}
function Clean(...args) {
  return args.length === 3 ? Visit9(args[0], args[1], args[2]) : Visit9(args[0], [], args[1]);
}
// node_modules/@sinclair/typebox/build/esm/value/convert/convert.mjs
init_symbols2();
init_guard();
function IsStringNumeric(value2) {
  return IsString2(value2) && !isNaN(value2) && !isNaN(parseFloat(value2));
}
function IsValueToString(value2) {
  return IsBigInt2(value2) || IsBoolean2(value2) || IsNumber2(value2);
}
function IsValueTrue(value2) {
  return value2 === true || IsNumber2(value2) && value2 === 1 || IsBigInt2(value2) && value2 === BigInt("1") || IsString2(value2) && (value2.toLowerCase() === "true" || value2 === "1");
}
function IsValueFalse(value2) {
  return value2 === false || IsNumber2(value2) && (value2 === 0 || Object.is(value2, -0)) || IsBigInt2(value2) && value2 === BigInt("0") || IsString2(value2) && (value2.toLowerCase() === "false" || value2 === "0" || value2 === "-0");
}
function IsTimeStringWithTimeZone(value2) {
  return IsString2(value2) && /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i.test(value2);
}
function IsTimeStringWithoutTimeZone(value2) {
  return IsString2(value2) && /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)?$/i.test(value2);
}
function IsDateTimeStringWithTimeZone(value2) {
  return IsString2(value2) && /^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i.test(value2);
}
function IsDateTimeStringWithoutTimeZone(value2) {
  return IsString2(value2) && /^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)?$/i.test(value2);
}
function IsDateString(value2) {
  return IsString2(value2) && /^\d\d\d\d-[0-1]\d-[0-3]\d$/i.test(value2);
}
function TryConvertLiteralString(value2, target) {
  const conversion = TryConvertString(value2);
  return conversion === target ? conversion : value2;
}
function TryConvertLiteralNumber(value2, target) {
  const conversion = TryConvertNumber(value2);
  return conversion === target ? conversion : value2;
}
function TryConvertLiteralBoolean(value2, target) {
  const conversion = TryConvertBoolean(value2);
  return conversion === target ? conversion : value2;
}
function TryConvertLiteral(schema3, value2) {
  return IsString2(schema3.const) ? TryConvertLiteralString(value2, schema3.const) : IsNumber2(schema3.const) ? TryConvertLiteralNumber(value2, schema3.const) : IsBoolean2(schema3.const) ? TryConvertLiteralBoolean(value2, schema3.const) : value2;
}
function TryConvertBoolean(value2) {
  return IsValueTrue(value2) ? true : IsValueFalse(value2) ? false : value2;
}
function TryConvertBigInt(value2) {
  const truncateInteger = (value3) => value3.split(".")[0];
  return IsStringNumeric(value2) ? BigInt(truncateInteger(value2)) : IsNumber2(value2) ? BigInt(Math.trunc(value2)) : IsValueFalse(value2) ? BigInt(0) : IsValueTrue(value2) ? BigInt(1) : value2;
}
function TryConvertString(value2) {
  return IsSymbol2(value2) && value2.description !== undefined ? value2.description.toString() : IsValueToString(value2) ? value2.toString() : value2;
}
function TryConvertNumber(value2) {
  return IsStringNumeric(value2) ? parseFloat(value2) : IsValueTrue(value2) ? 1 : IsValueFalse(value2) ? 0 : value2;
}
function TryConvertInteger(value2) {
  return IsStringNumeric(value2) ? parseInt(value2) : IsNumber2(value2) ? Math.trunc(value2) : IsValueTrue(value2) ? 1 : IsValueFalse(value2) ? 0 : value2;
}
function TryConvertNull(value2) {
  return IsString2(value2) && value2.toLowerCase() === "null" ? null : value2;
}
function TryConvertUndefined(value2) {
  return IsString2(value2) && value2 === "undefined" ? undefined : value2;
}
function TryConvertDate(value2) {
  return IsDate2(value2) ? value2 : IsNumber2(value2) ? new Date(value2) : IsValueTrue(value2) ? new Date(1) : IsValueFalse(value2) ? new Date(0) : IsStringNumeric(value2) ? new Date(parseInt(value2)) : IsTimeStringWithoutTimeZone(value2) ? new Date(`1970-01-01T${value2}.000Z`) : IsTimeStringWithTimeZone(value2) ? new Date(`1970-01-01T${value2}`) : IsDateTimeStringWithoutTimeZone(value2) ? new Date(`${value2}.000Z`) : IsDateTimeStringWithTimeZone(value2) ? new Date(value2) : IsDateString(value2) ? new Date(`${value2}T00:00:00.000Z`) : value2;
}
function Default2(value2) {
  return value2;
}
function FromArray13(schema3, references, value2) {
  const elements = IsArray2(value2) ? value2 : [value2];
  return elements.map((element) => Visit10(schema3.items, references, element));
}
function FromBigInt5(schema3, references, value2) {
  return TryConvertBigInt(value2);
}
function FromBoolean5(schema3, references, value2) {
  return TryConvertBoolean(value2);
}
function FromDate6(schema3, references, value2) {
  return TryConvertDate(value2);
}
function FromImport6(schema3, references, value2) {
  const definitions = globalThis.Object.values(schema3.$defs);
  const target = schema3.$defs[schema3.$ref];
  return Visit10(target, [...references, ...definitions], value2);
}
function FromInteger5(schema3, references, value2) {
  return TryConvertInteger(value2);
}
function FromIntersect14(schema3, references, value2) {
  return schema3.allOf.reduce((value3, schema4) => Visit10(schema4, references, value3), value2);
}
function FromLiteral6(schema3, references, value2) {
  return TryConvertLiteral(schema3, value2);
}
function FromNull5(schema3, references, value2) {
  return TryConvertNull(value2);
}
function FromNumber5(schema3, references, value2) {
  return TryConvertNumber(value2);
}
function FromObject14(schema3, references, value2) {
  if (!IsObject2(value2) || IsArray2(value2))
    return value2;
  for (const propertyKey of Object.getOwnPropertyNames(schema3.properties)) {
    if (!HasPropertyKey2(value2, propertyKey))
      continue;
    value2[propertyKey] = Visit10(schema3.properties[propertyKey], references, value2[propertyKey]);
  }
  return value2;
}
function FromRecord9(schema3, references, value2) {
  const isConvertable = IsObject2(value2) && !IsArray2(value2);
  if (!isConvertable)
    return value2;
  const propertyKey = Object.getOwnPropertyNames(schema3.patternProperties)[0];
  const property = schema3.patternProperties[propertyKey];
  for (const [propKey, propValue] of Object.entries(value2)) {
    value2[propKey] = Visit10(property, references, propValue);
  }
  return value2;
}
function FromRef10(schema3, references, value2) {
  return Visit10(Deref(schema3, references), references, value2);
}
function FromString5(schema3, references, value2) {
  return TryConvertString(value2);
}
function FromSymbol5(schema3, references, value2) {
  return IsString2(value2) || IsNumber2(value2) ? Symbol(value2) : value2;
}
function FromThis6(schema3, references, value2) {
  return Visit10(Deref(schema3, references), references, value2);
}
function FromTuple11(schema3, references, value2) {
  const isConvertable = IsArray2(value2) && !IsUndefined2(schema3.items);
  if (!isConvertable)
    return value2;
  return value2.map((value3, index) => {
    return index < schema3.items.length ? Visit10(schema3.items[index], references, value3) : value3;
  });
}
function FromUndefined5(schema3, references, value2) {
  return TryConvertUndefined(value2);
}
function FromUnion16(schema3, references, value2) {
  for (const subschema of schema3.anyOf) {
    if (Check(subschema, references, value2)) {
      return value2;
    }
  }
  for (const subschema of schema3.anyOf) {
    const converted = Visit10(subschema, references, Clone2(value2));
    if (!Check(subschema, references, converted))
      continue;
    return converted;
  }
  return value2;
}
function Visit10(schema3, references, value2) {
  const references_ = Pushref(schema3, references);
  const schema_ = schema3;
  switch (schema3[Kind]) {
    case "Array":
      return FromArray13(schema_, references_, value2);
    case "BigInt":
      return FromBigInt5(schema_, references_, value2);
    case "Boolean":
      return FromBoolean5(schema_, references_, value2);
    case "Date":
      return FromDate6(schema_, references_, value2);
    case "Import":
      return FromImport6(schema_, references_, value2);
    case "Integer":
      return FromInteger5(schema_, references_, value2);
    case "Intersect":
      return FromIntersect14(schema_, references_, value2);
    case "Literal":
      return FromLiteral6(schema_, references_, value2);
    case "Null":
      return FromNull5(schema_, references_, value2);
    case "Number":
      return FromNumber5(schema_, references_, value2);
    case "Object":
      return FromObject14(schema_, references_, value2);
    case "Record":
      return FromRecord9(schema_, references_, value2);
    case "Ref":
      return FromRef10(schema_, references_, value2);
    case "String":
      return FromString5(schema_, references_, value2);
    case "Symbol":
      return FromSymbol5(schema_, references_, value2);
    case "This":
      return FromThis6(schema_, references_, value2);
    case "Tuple":
      return FromTuple11(schema_, references_, value2);
    case "Undefined":
      return FromUndefined5(schema_, references_, value2);
    case "Union":
      return FromUnion16(schema_, references_, value2);
    default:
      return Default2(value2);
  }
}
function Convert(...args) {
  return args.length === 3 ? Visit10(args[0], args[1], args[2]) : Visit10(args[0], [], args[1]);
}
// node_modules/@sinclair/typebox/build/esm/value/transform/decode.mjs
init_policy();
init_symbols2();
init_error2();
init_keyof2();
init_guard();
init_kind();

class TransformDecodeCheckError extends TypeBoxError {
  constructor(schema3, value2, error3) {
    super(`Unable to decode value as it does not match the expected schema`);
    this.schema = schema3;
    this.value = value2;
    this.error = error3;
  }
}

class TransformDecodeError extends TypeBoxError {
  constructor(schema3, path, value2, error3) {
    super(error3 instanceof Error ? error3.message : "Unknown error");
    this.schema = schema3;
    this.path = path;
    this.value = value2;
    this.error = error3;
  }
}
function Default3(schema3, path, value2) {
  try {
    return IsTransform(schema3) ? schema3[TransformKind].Decode(value2) : value2;
  } catch (error3) {
    throw new TransformDecodeError(schema3, path, value2, error3);
  }
}
function FromArray14(schema3, references, path, value2) {
  return IsArray2(value2) ? Default3(schema3, path, value2.map((value3, index) => Visit11(schema3.items, references, `${path}/${index}`, value3))) : Default3(schema3, path, value2);
}
function FromIntersect15(schema3, references, path, value2) {
  if (!IsObject2(value2) || IsValueType(value2))
    return Default3(schema3, path, value2);
  const knownEntries = KeyOfPropertyEntries(schema3);
  const knownKeys = knownEntries.map((entry) => entry[0]);
  const knownProperties = { ...value2 };
  for (const [knownKey, knownSchema] of knownEntries)
    if (knownKey in knownProperties) {
      knownProperties[knownKey] = Visit11(knownSchema, references, `${path}/${knownKey}`, knownProperties[knownKey]);
    }
  if (!IsTransform(schema3.unevaluatedProperties)) {
    return Default3(schema3, path, knownProperties);
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const unevaluatedProperties = schema3.unevaluatedProperties;
  const unknownProperties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.includes(key)) {
      unknownProperties[key] = Default3(unevaluatedProperties, `${path}/${key}`, unknownProperties[key]);
    }
  return Default3(schema3, path, unknownProperties);
}
function FromImport7(schema3, references, path, value2) {
  const additional = globalThis.Object.values(schema3.$defs);
  const target = schema3.$defs[schema3.$ref];
  const result = Visit11(target, [...references, ...additional], path, value2);
  return Default3(schema3, path, result);
}
function FromNot5(schema3, references, path, value2) {
  return Default3(schema3, path, Visit11(schema3.not, references, path, value2));
}
function FromObject15(schema3, references, path, value2) {
  if (!IsObject2(value2))
    return Default3(schema3, path, value2);
  const knownKeys = KeyOfPropertyKeys(schema3);
  const knownProperties = { ...value2 };
  for (const key of knownKeys) {
    if (!HasPropertyKey2(knownProperties, key))
      continue;
    if (IsUndefined2(knownProperties[key]) && (!IsUndefined3(schema3.properties[key]) || TypeSystemPolicy.IsExactOptionalProperty(knownProperties, key)))
      continue;
    knownProperties[key] = Visit11(schema3.properties[key], references, `${path}/${key}`, knownProperties[key]);
  }
  if (!IsSchema(schema3.additionalProperties)) {
    return Default3(schema3, path, knownProperties);
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const additionalProperties = schema3.additionalProperties;
  const unknownProperties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.includes(key)) {
      unknownProperties[key] = Default3(additionalProperties, `${path}/${key}`, unknownProperties[key]);
    }
  return Default3(schema3, path, unknownProperties);
}
function FromRecord10(schema3, references, path, value2) {
  if (!IsObject2(value2))
    return Default3(schema3, path, value2);
  const pattern2 = Object.getOwnPropertyNames(schema3.patternProperties)[0];
  const knownKeys = new RegExp(pattern2);
  const knownProperties = { ...value2 };
  for (const key of Object.getOwnPropertyNames(value2))
    if (knownKeys.test(key)) {
      knownProperties[key] = Visit11(schema3.patternProperties[pattern2], references, `${path}/${key}`, knownProperties[key]);
    }
  if (!IsSchema(schema3.additionalProperties)) {
    return Default3(schema3, path, knownProperties);
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const additionalProperties = schema3.additionalProperties;
  const unknownProperties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.test(key)) {
      unknownProperties[key] = Default3(additionalProperties, `${path}/${key}`, unknownProperties[key]);
    }
  return Default3(schema3, path, unknownProperties);
}
function FromRef11(schema3, references, path, value2) {
  const target = Deref(schema3, references);
  return Default3(schema3, path, Visit11(target, references, path, value2));
}
function FromThis7(schema3, references, path, value2) {
  const target = Deref(schema3, references);
  return Default3(schema3, path, Visit11(target, references, path, value2));
}
function FromTuple12(schema3, references, path, value2) {
  return IsArray2(value2) && IsArray2(schema3.items) ? Default3(schema3, path, schema3.items.map((schema4, index) => Visit11(schema4, references, `${path}/${index}`, value2[index]))) : Default3(schema3, path, value2);
}
function FromUnion17(schema3, references, path, value2) {
  for (const subschema of schema3.anyOf) {
    if (!Check(subschema, references, value2))
      continue;
    const decoded = Visit11(subschema, references, path, value2);
    return Default3(schema3, path, decoded);
  }
  return Default3(schema3, path, value2);
}
function Visit11(schema3, references, path, value2) {
  const references_ = Pushref(schema3, references);
  const schema_ = schema3;
  switch (schema3[Kind]) {
    case "Array":
      return FromArray14(schema_, references_, path, value2);
    case "Import":
      return FromImport7(schema_, references_, path, value2);
    case "Intersect":
      return FromIntersect15(schema_, references_, path, value2);
    case "Not":
      return FromNot5(schema_, references_, path, value2);
    case "Object":
      return FromObject15(schema_, references_, path, value2);
    case "Record":
      return FromRecord10(schema_, references_, path, value2);
    case "Ref":
      return FromRef11(schema_, references_, path, value2);
    case "Symbol":
      return Default3(schema_, path, value2);
    case "This":
      return FromThis7(schema_, references_, path, value2);
    case "Tuple":
      return FromTuple12(schema_, references_, path, value2);
    case "Union":
      return FromUnion17(schema_, references_, path, value2);
    default:
      return Default3(schema_, path, value2);
  }
}
function TransformDecode(schema3, references, value2) {
  return Visit11(schema3, references, "", value2);
}

// node_modules/@sinclair/typebox/build/esm/value/transform/encode.mjs
init_policy();
init_symbols2();
init_error2();
init_keyof2();
init_guard();
init_kind();

class TransformEncodeCheckError extends TypeBoxError {
  constructor(schema3, value2, error3) {
    super(`The encoded value does not match the expected schema`);
    this.schema = schema3;
    this.value = value2;
    this.error = error3;
  }
}

class TransformEncodeError extends TypeBoxError {
  constructor(schema3, path, value2, error3) {
    super(`${error3 instanceof Error ? error3.message : "Unknown error"}`);
    this.schema = schema3;
    this.path = path;
    this.value = value2;
    this.error = error3;
  }
}
function Default4(schema3, path, value2) {
  try {
    return IsTransform(schema3) ? schema3[TransformKind].Encode(value2) : value2;
  } catch (error3) {
    throw new TransformEncodeError(schema3, path, value2, error3);
  }
}
function FromArray15(schema3, references, path, value2) {
  const defaulted = Default4(schema3, path, value2);
  return IsArray2(defaulted) ? defaulted.map((value3, index) => Visit12(schema3.items, references, `${path}/${index}`, value3)) : defaulted;
}
function FromImport8(schema3, references, path, value2) {
  const additional = globalThis.Object.values(schema3.$defs);
  const target = schema3.$defs[schema3.$ref];
  const result = Default4(schema3, path, value2);
  return Visit12(target, [...references, ...additional], path, result);
}
function FromIntersect16(schema3, references, path, value2) {
  const defaulted = Default4(schema3, path, value2);
  if (!IsObject2(value2) || IsValueType(value2))
    return defaulted;
  const knownEntries = KeyOfPropertyEntries(schema3);
  const knownKeys = knownEntries.map((entry) => entry[0]);
  const knownProperties = { ...defaulted };
  for (const [knownKey, knownSchema] of knownEntries)
    if (knownKey in knownProperties) {
      knownProperties[knownKey] = Visit12(knownSchema, references, `${path}/${knownKey}`, knownProperties[knownKey]);
    }
  if (!IsTransform(schema3.unevaluatedProperties)) {
    return knownProperties;
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const unevaluatedProperties = schema3.unevaluatedProperties;
  const properties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.includes(key)) {
      properties[key] = Default4(unevaluatedProperties, `${path}/${key}`, properties[key]);
    }
  return properties;
}
function FromNot6(schema3, references, path, value2) {
  return Default4(schema3.not, path, Default4(schema3, path, value2));
}
function FromObject16(schema3, references, path, value2) {
  const defaulted = Default4(schema3, path, value2);
  if (!IsObject2(defaulted))
    return defaulted;
  const knownKeys = KeyOfPropertyKeys(schema3);
  const knownProperties = { ...defaulted };
  for (const key of knownKeys) {
    if (!HasPropertyKey2(knownProperties, key))
      continue;
    if (IsUndefined2(knownProperties[key]) && (!IsUndefined3(schema3.properties[key]) || TypeSystemPolicy.IsExactOptionalProperty(knownProperties, key)))
      continue;
    knownProperties[key] = Visit12(schema3.properties[key], references, `${path}/${key}`, knownProperties[key]);
  }
  if (!IsSchema(schema3.additionalProperties)) {
    return knownProperties;
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const additionalProperties = schema3.additionalProperties;
  const properties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.includes(key)) {
      properties[key] = Default4(additionalProperties, `${path}/${key}`, properties[key]);
    }
  return properties;
}
function FromRecord11(schema3, references, path, value2) {
  const defaulted = Default4(schema3, path, value2);
  if (!IsObject2(value2))
    return defaulted;
  const pattern2 = Object.getOwnPropertyNames(schema3.patternProperties)[0];
  const knownKeys = new RegExp(pattern2);
  const knownProperties = { ...defaulted };
  for (const key of Object.getOwnPropertyNames(value2))
    if (knownKeys.test(key)) {
      knownProperties[key] = Visit12(schema3.patternProperties[pattern2], references, `${path}/${key}`, knownProperties[key]);
    }
  if (!IsSchema(schema3.additionalProperties)) {
    return knownProperties;
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const additionalProperties = schema3.additionalProperties;
  const properties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.test(key)) {
      properties[key] = Default4(additionalProperties, `${path}/${key}`, properties[key]);
    }
  return properties;
}
function FromRef12(schema3, references, path, value2) {
  const target = Deref(schema3, references);
  const resolved = Visit12(target, references, path, value2);
  return Default4(schema3, path, resolved);
}
function FromThis8(schema3, references, path, value2) {
  const target = Deref(schema3, references);
  const resolved = Visit12(target, references, path, value2);
  return Default4(schema3, path, resolved);
}
function FromTuple13(schema3, references, path, value2) {
  const value1 = Default4(schema3, path, value2);
  return IsArray2(schema3.items) ? schema3.items.map((schema4, index) => Visit12(schema4, references, `${path}/${index}`, value1[index])) : [];
}
function FromUnion18(schema3, references, path, value2) {
  for (const subschema of schema3.anyOf) {
    if (!Check(subschema, references, value2))
      continue;
    const value1 = Visit12(subschema, references, path, value2);
    return Default4(schema3, path, value1);
  }
  for (const subschema of schema3.anyOf) {
    const value1 = Visit12(subschema, references, path, value2);
    if (!Check(schema3, references, value1))
      continue;
    return Default4(schema3, path, value1);
  }
  return Default4(schema3, path, value2);
}
function Visit12(schema3, references, path, value2) {
  const references_ = Pushref(schema3, references);
  const schema_ = schema3;
  switch (schema3[Kind]) {
    case "Array":
      return FromArray15(schema_, references_, path, value2);
    case "Import":
      return FromImport8(schema_, references_, path, value2);
    case "Intersect":
      return FromIntersect16(schema_, references_, path, value2);
    case "Not":
      return FromNot6(schema_, references_, path, value2);
    case "Object":
      return FromObject16(schema_, references_, path, value2);
    case "Record":
      return FromRecord11(schema_, references_, path, value2);
    case "Ref":
      return FromRef12(schema_, references_, path, value2);
    case "This":
      return FromThis8(schema_, references_, path, value2);
    case "Tuple":
      return FromTuple13(schema_, references_, path, value2);
    case "Union":
      return FromUnion18(schema_, references_, path, value2);
    default:
      return Default4(schema_, path, value2);
  }
}
function TransformEncode(schema3, references, value2) {
  return Visit12(schema3, references, "", value2);
}

// node_modules/@sinclair/typebox/build/esm/value/transform/has.mjs
init_symbols2();
init_kind();
init_guard();
function FromArray16(schema3, references) {
  return IsTransform(schema3) || Visit13(schema3.items, references);
}
function FromAsyncIterator7(schema3, references) {
  return IsTransform(schema3) || Visit13(schema3.items, references);
}
function FromConstructor8(schema3, references) {
  return IsTransform(schema3) || Visit13(schema3.returns, references) || schema3.parameters.some((schema4) => Visit13(schema4, references));
}
function FromFunction7(schema3, references) {
  return IsTransform(schema3) || Visit13(schema3.returns, references) || schema3.parameters.some((schema4) => Visit13(schema4, references));
}
function FromIntersect17(schema3, references) {
  return IsTransform(schema3) || IsTransform(schema3.unevaluatedProperties) || schema3.allOf.some((schema4) => Visit13(schema4, references));
}
function FromImport9(schema3, references) {
  const additional = globalThis.Object.getOwnPropertyNames(schema3.$defs).reduce((result, key) => [...result, schema3.$defs[key]], []);
  const target = schema3.$defs[schema3.$ref];
  return IsTransform(schema3) || Visit13(target, [...additional, ...references]);
}
function FromIterator7(schema3, references) {
  return IsTransform(schema3) || Visit13(schema3.items, references);
}
function FromNot7(schema3, references) {
  return IsTransform(schema3) || Visit13(schema3.not, references);
}
function FromObject17(schema3, references) {
  return IsTransform(schema3) || Object.values(schema3.properties).some((schema4) => Visit13(schema4, references)) || IsSchema(schema3.additionalProperties) && Visit13(schema3.additionalProperties, references);
}
function FromPromise7(schema3, references) {
  return IsTransform(schema3) || Visit13(schema3.item, references);
}
function FromRecord12(schema3, references) {
  const pattern2 = Object.getOwnPropertyNames(schema3.patternProperties)[0];
  const property = schema3.patternProperties[pattern2];
  return IsTransform(schema3) || Visit13(property, references) || IsSchema(schema3.additionalProperties) && IsTransform(schema3.additionalProperties);
}
function FromRef13(schema3, references) {
  if (IsTransform(schema3))
    return true;
  return Visit13(Deref(schema3, references), references);
}
function FromThis9(schema3, references) {
  if (IsTransform(schema3))
    return true;
  return Visit13(Deref(schema3, references), references);
}
function FromTuple14(schema3, references) {
  return IsTransform(schema3) || !IsUndefined2(schema3.items) && schema3.items.some((schema4) => Visit13(schema4, references));
}
function FromUnion19(schema3, references) {
  return IsTransform(schema3) || schema3.anyOf.some((schema4) => Visit13(schema4, references));
}
function Visit13(schema3, references) {
  const references_ = Pushref(schema3, references);
  const schema_ = schema3;
  if (schema3.$id && visited.has(schema3.$id))
    return false;
  if (schema3.$id)
    visited.add(schema3.$id);
  switch (schema3[Kind]) {
    case "Array":
      return FromArray16(schema_, references_);
    case "AsyncIterator":
      return FromAsyncIterator7(schema_, references_);
    case "Constructor":
      return FromConstructor8(schema_, references_);
    case "Function":
      return FromFunction7(schema_, references_);
    case "Import":
      return FromImport9(schema_, references_);
    case "Intersect":
      return FromIntersect17(schema_, references_);
    case "Iterator":
      return FromIterator7(schema_, references_);
    case "Not":
      return FromNot7(schema_, references_);
    case "Object":
      return FromObject17(schema_, references_);
    case "Promise":
      return FromPromise7(schema_, references_);
    case "Record":
      return FromRecord12(schema_, references_);
    case "Ref":
      return FromRef13(schema_, references_);
    case "This":
      return FromThis9(schema_, references_);
    case "Tuple":
      return FromTuple14(schema_, references_);
    case "Union":
      return FromUnion19(schema_, references_);
    default:
      return IsTransform(schema3);
  }
}
var visited = new Set;
function HasTransform(schema3, references) {
  visited.clear();
  return Visit13(schema3, references);
}

// node_modules/@sinclair/typebox/build/esm/value/decode/decode.mjs
function Decode(...args) {
  const [schema3, references, value2] = args.length === 3 ? [args[0], args[1], args[2]] : [args[0], [], args[1]];
  if (!Check(schema3, references, value2))
    throw new TransformDecodeCheckError(schema3, value2, Errors(schema3, references, value2).First());
  return HasTransform(schema3, references) ? TransformDecode(schema3, references, value2) : value2;
}
// node_modules/@sinclair/typebox/build/esm/value/default/default.mjs
init_symbols2();
init_guard();
init_kind();
function ValueOrDefault(schema3, value2) {
  const defaultValue = HasPropertyKey2(schema3, "default") ? schema3.default : undefined;
  const clone2 = IsFunction2(defaultValue) ? defaultValue() : Clone2(defaultValue);
  return IsUndefined2(value2) ? clone2 : IsObject2(value2) && IsObject2(clone2) ? Object.assign(clone2, value2) : value2;
}
function HasDefaultProperty(schema3) {
  return IsKind(schema3) && "default" in schema3;
}
function FromArray17(schema3, references, value2) {
  if (IsArray2(value2)) {
    for (let i2 = 0;i2 < value2.length; i2++) {
      value2[i2] = Visit14(schema3.items, references, value2[i2]);
    }
    return value2;
  }
  const defaulted = ValueOrDefault(schema3, value2);
  if (!IsArray2(defaulted))
    return defaulted;
  for (let i2 = 0;i2 < defaulted.length; i2++) {
    defaulted[i2] = Visit14(schema3.items, references, defaulted[i2]);
  }
  return defaulted;
}
function FromDate7(schema3, references, value2) {
  return IsDate2(value2) ? value2 : ValueOrDefault(schema3, value2);
}
function FromImport10(schema3, references, value2) {
  const definitions = globalThis.Object.values(schema3.$defs);
  const target = schema3.$defs[schema3.$ref];
  return Visit14(target, [...references, ...definitions], value2);
}
function FromIntersect18(schema3, references, value2) {
  const defaulted = ValueOrDefault(schema3, value2);
  return schema3.allOf.reduce((acc, schema4) => {
    const next = Visit14(schema4, references, defaulted);
    return IsObject2(next) ? { ...acc, ...next } : next;
  }, {});
}
function FromObject18(schema3, references, value2) {
  const defaulted = ValueOrDefault(schema3, value2);
  if (!IsObject2(defaulted))
    return defaulted;
  const knownPropertyKeys = Object.getOwnPropertyNames(schema3.properties);
  for (const key of knownPropertyKeys) {
    const propertyValue = Visit14(schema3.properties[key], references, defaulted[key]);
    if (IsUndefined2(propertyValue))
      continue;
    defaulted[key] = Visit14(schema3.properties[key], references, defaulted[key]);
  }
  if (!HasDefaultProperty(schema3.additionalProperties))
    return defaulted;
  for (const key of Object.getOwnPropertyNames(defaulted)) {
    if (knownPropertyKeys.includes(key))
      continue;
    defaulted[key] = Visit14(schema3.additionalProperties, references, defaulted[key]);
  }
  return defaulted;
}
function FromRecord13(schema3, references, value2) {
  const defaulted = ValueOrDefault(schema3, value2);
  if (!IsObject2(defaulted))
    return defaulted;
  const additionalPropertiesSchema = schema3.additionalProperties;
  const [propertyKeyPattern, propertySchema] = Object.entries(schema3.patternProperties)[0];
  const knownPropertyKey = new RegExp(propertyKeyPattern);
  for (const key of Object.getOwnPropertyNames(defaulted)) {
    if (!(knownPropertyKey.test(key) && HasDefaultProperty(propertySchema)))
      continue;
    defaulted[key] = Visit14(propertySchema, references, defaulted[key]);
  }
  if (!HasDefaultProperty(additionalPropertiesSchema))
    return defaulted;
  for (const key of Object.getOwnPropertyNames(defaulted)) {
    if (knownPropertyKey.test(key))
      continue;
    defaulted[key] = Visit14(additionalPropertiesSchema, references, defaulted[key]);
  }
  return defaulted;
}
function FromRef14(schema3, references, value2) {
  return Visit14(Deref(schema3, references), references, ValueOrDefault(schema3, value2));
}
function FromThis10(schema3, references, value2) {
  return Visit14(Deref(schema3, references), references, value2);
}
function FromTuple15(schema3, references, value2) {
  const defaulted = ValueOrDefault(schema3, value2);
  if (!IsArray2(defaulted) || IsUndefined2(schema3.items))
    return defaulted;
  const [items, max] = [schema3.items, Math.max(schema3.items.length, defaulted.length)];
  for (let i2 = 0;i2 < max; i2++) {
    if (i2 < items.length)
      defaulted[i2] = Visit14(items[i2], references, defaulted[i2]);
  }
  return defaulted;
}
function FromUnion20(schema3, references, value2) {
  const defaulted = ValueOrDefault(schema3, value2);
  for (const inner of schema3.anyOf) {
    const result = Visit14(inner, references, Clone2(defaulted));
    if (Check(inner, references, result)) {
      return result;
    }
  }
  return defaulted;
}
function Visit14(schema3, references, value2) {
  const references_ = Pushref(schema3, references);
  const schema_ = schema3;
  switch (schema_[Kind]) {
    case "Array":
      return FromArray17(schema_, references_, value2);
    case "Date":
      return FromDate7(schema_, references_, value2);
    case "Import":
      return FromImport10(schema_, references_, value2);
    case "Intersect":
      return FromIntersect18(schema_, references_, value2);
    case "Object":
      return FromObject18(schema_, references_, value2);
    case "Record":
      return FromRecord13(schema_, references_, value2);
    case "Ref":
      return FromRef14(schema_, references_, value2);
    case "This":
      return FromThis10(schema_, references_, value2);
    case "Tuple":
      return FromTuple15(schema_, references_, value2);
    case "Union":
      return FromUnion20(schema_, references_, value2);
    default:
      return ValueOrDefault(schema_, value2);
  }
}
function Default5(...args) {
  return args.length === 3 ? Visit14(args[0], args[1], args[2]) : Visit14(args[0], [], args[1]);
}
// node_modules/@sinclair/typebox/build/esm/value/delta/delta.mjs
init_guard();

// node_modules/@sinclair/typebox/build/esm/value/pointer/pointer.mjs
init_error2();
var exports_pointer = {};
__export(exports_pointer, {
  ValuePointerRootSetError: () => ValuePointerRootSetError,
  ValuePointerRootDeleteError: () => ValuePointerRootDeleteError,
  Set: () => Set4,
  Has: () => Has3,
  Get: () => Get3,
  Format: () => Format,
  Delete: () => Delete3
});

class ValuePointerRootSetError extends TypeBoxError {
  constructor(value2, path, update) {
    super("Cannot set root value");
    this.value = value2;
    this.path = path;
    this.update = update;
  }
}

class ValuePointerRootDeleteError extends TypeBoxError {
  constructor(value2, path) {
    super("Cannot delete root value");
    this.value = value2;
    this.path = path;
  }
}
function Escape2(component) {
  return component.indexOf("~") === -1 ? component : component.replace(/~1/g, "/").replace(/~0/g, "~");
}
function* Format(pointer) {
  if (pointer === "")
    return;
  let [start, end] = [0, 0];
  for (let i2 = 0;i2 < pointer.length; i2++) {
    const char = pointer.charAt(i2);
    if (char === "/") {
      if (i2 === 0) {
        start = i2 + 1;
      } else {
        end = i2;
        yield Escape2(pointer.slice(start, end));
        start = i2 + 1;
      }
    } else {
      end = i2;
    }
  }
  yield Escape2(pointer.slice(start));
}
function Set4(value2, pointer, update) {
  if (pointer === "")
    throw new ValuePointerRootSetError(value2, pointer, update);
  let [owner, next, key] = [null, value2, ""];
  for (const component of Format(pointer)) {
    if (next[component] === undefined)
      next[component] = {};
    owner = next;
    next = next[component];
    key = component;
  }
  owner[key] = update;
}
function Delete3(value2, pointer) {
  if (pointer === "")
    throw new ValuePointerRootDeleteError(value2, pointer);
  let [owner, next, key] = [null, value2, ""];
  for (const component of Format(pointer)) {
    if (next[component] === undefined || next[component] === null)
      return;
    owner = next;
    next = next[component];
    key = component;
  }
  if (Array.isArray(owner)) {
    const index = parseInt(key);
    owner.splice(index, 1);
  } else {
    delete owner[key];
  }
}
function Has3(value2, pointer) {
  if (pointer === "")
    return true;
  let [owner, next, key] = [null, value2, ""];
  for (const component of Format(pointer)) {
    if (next[component] === undefined)
      return false;
    owner = next;
    next = next[component];
    key = component;
  }
  return Object.getOwnPropertyNames(owner).includes(key);
}
function Get3(value2, pointer) {
  if (pointer === "")
    return value2;
  let current = value2;
  for (const component of Format(pointer)) {
    if (current[component] === undefined)
      return;
    current = current[component];
  }
  return current;
}
// node_modules/@sinclair/typebox/build/esm/value/equal/equal.mjs
init_guard();
function ObjectType3(left, right) {
  if (!IsObject2(right))
    return false;
  const leftKeys = [...Object.keys(left), ...Object.getOwnPropertySymbols(left)];
  const rightKeys = [...Object.keys(right), ...Object.getOwnPropertySymbols(right)];
  if (leftKeys.length !== rightKeys.length)
    return false;
  return leftKeys.every((key) => Equal(left[key], right[key]));
}
function DateType3(left, right) {
  return IsDate2(right) && left.getTime() === right.getTime();
}
function ArrayType3(left, right) {
  if (!IsArray2(right) || left.length !== right.length)
    return false;
  return left.every((value2, index) => Equal(value2, right[index]));
}
function TypedArrayType(left, right) {
  if (!IsTypedArray(right) || left.length !== right.length || Object.getPrototypeOf(left).constructor.name !== Object.getPrototypeOf(right).constructor.name)
    return false;
  return left.every((value2, index) => Equal(value2, right[index]));
}
function ValueType(left, right) {
  return left === right;
}
function Equal(left, right) {
  if (IsDate2(left))
    return DateType3(left, right);
  if (IsTypedArray(left))
    return TypedArrayType(left, right);
  if (IsArray2(left))
    return ArrayType3(left, right);
  if (IsObject2(left))
    return ObjectType3(left, right);
  if (IsValueType(left))
    return ValueType(left, right);
  throw new Error("ValueEquals: Unable to compare value");
}

// node_modules/@sinclair/typebox/build/esm/value/delta/delta.mjs
init_error2();
init_literal2();
init_object2();
init_string2();
init_unknown2();
init_union2();
var Insert = Object2({
  type: Literal("insert"),
  path: String2(),
  value: Unknown()
});
var Update = Object2({
  type: Literal("update"),
  path: String2(),
  value: Unknown()
});
var Delete4 = Object2({
  type: Literal("delete"),
  path: String2()
});
var Edit = Union([Insert, Update, Delete4]);

class ValueDiffError extends TypeBoxError {
  constructor(value2, message) {
    super(message);
    this.value = value2;
  }
}
function CreateUpdate(path, value2) {
  return { type: "update", path, value: value2 };
}
function CreateInsert(path, value2) {
  return { type: "insert", path, value: value2 };
}
function CreateDelete(path) {
  return { type: "delete", path };
}
function AssertDiffable(value2) {
  if (globalThis.Object.getOwnPropertySymbols(value2).length > 0)
    throw new ValueDiffError(value2, "Cannot diff objects with symbols");
}
function* ObjectType4(path, current, next) {
  AssertDiffable(current);
  AssertDiffable(next);
  if (!IsStandardObject(next))
    return yield CreateUpdate(path, next);
  const currentKeys = globalThis.Object.getOwnPropertyNames(current);
  const nextKeys = globalThis.Object.getOwnPropertyNames(next);
  for (const key of nextKeys) {
    if (HasPropertyKey2(current, key))
      continue;
    yield CreateInsert(`${path}/${key}`, next[key]);
  }
  for (const key of currentKeys) {
    if (!HasPropertyKey2(next, key))
      continue;
    if (Equal(current, next))
      continue;
    yield* Visit15(`${path}/${key}`, current[key], next[key]);
  }
  for (const key of currentKeys) {
    if (HasPropertyKey2(next, key))
      continue;
    yield CreateDelete(`${path}/${key}`);
  }
}
function* ArrayType4(path, current, next) {
  if (!IsArray2(next))
    return yield CreateUpdate(path, next);
  for (let i2 = 0;i2 < Math.min(current.length, next.length); i2++) {
    yield* Visit15(`${path}/${i2}`, current[i2], next[i2]);
  }
  for (let i2 = 0;i2 < next.length; i2++) {
    if (i2 < current.length)
      continue;
    yield CreateInsert(`${path}/${i2}`, next[i2]);
  }
  for (let i2 = current.length - 1;i2 >= 0; i2--) {
    if (i2 < next.length)
      continue;
    yield CreateDelete(`${path}/${i2}`);
  }
}
function* TypedArrayType2(path, current, next) {
  if (!IsTypedArray(next) || current.length !== next.length || globalThis.Object.getPrototypeOf(current).constructor.name !== globalThis.Object.getPrototypeOf(next).constructor.name)
    return yield CreateUpdate(path, next);
  for (let i2 = 0;i2 < Math.min(current.length, next.length); i2++) {
    yield* Visit15(`${path}/${i2}`, current[i2], next[i2]);
  }
}
function* ValueType2(path, current, next) {
  if (current === next)
    return;
  yield CreateUpdate(path, next);
}
function* Visit15(path, current, next) {
  if (IsStandardObject(current))
    return yield* ObjectType4(path, current, next);
  if (IsArray2(current))
    return yield* ArrayType4(path, current, next);
  if (IsTypedArray(current))
    return yield* TypedArrayType2(path, current, next);
  if (IsValueType(current))
    return yield* ValueType2(path, current, next);
  throw new ValueDiffError(current, "Unable to diff value");
}
function Diff(current, next) {
  return [...Visit15("", current, next)];
}
function IsRootUpdate(edits) {
  return edits.length > 0 && edits[0].path === "" && edits[0].type === "update";
}
function IsIdentity(edits) {
  return edits.length === 0;
}
function Patch(current, edits) {
  if (IsRootUpdate(edits)) {
    return Clone2(edits[0].value);
  }
  if (IsIdentity(edits)) {
    return Clone2(current);
  }
  const clone2 = Clone2(current);
  for (const edit of edits) {
    switch (edit.type) {
      case "insert": {
        exports_pointer.Set(clone2, edit.path, edit.value);
        break;
      }
      case "update": {
        exports_pointer.Set(clone2, edit.path, edit.value);
        break;
      }
      case "delete": {
        exports_pointer.Delete(clone2, edit.path);
        break;
      }
    }
  }
  return clone2;
}
// node_modules/@sinclair/typebox/build/esm/value/encode/encode.mjs
function Encode(...args) {
  const [schema3, references, value2] = args.length === 3 ? [args[0], args[1], args[2]] : [args[0], [], args[1]];
  const encoded = HasTransform(schema3, references) ? TransformEncode(schema3, references, value2) : value2;
  if (!Check(schema3, references, encoded))
    throw new TransformEncodeCheckError(schema3, encoded, Errors(schema3, references, encoded).First());
  return encoded;
}
// node_modules/@sinclair/typebox/build/esm/value/mutate/mutate.mjs
init_guard();
init_error2();
function IsStandardObject2(value2) {
  return IsObject2(value2) && !IsArray2(value2);
}

class ValueMutateError extends TypeBoxError {
  constructor(message) {
    super(message);
  }
}
function ObjectType5(root, path, current, next) {
  if (!IsStandardObject2(current)) {
    exports_pointer.Set(root, path, Clone2(next));
  } else {
    const currentKeys = Object.getOwnPropertyNames(current);
    const nextKeys = Object.getOwnPropertyNames(next);
    for (const currentKey of currentKeys) {
      if (!nextKeys.includes(currentKey)) {
        delete current[currentKey];
      }
    }
    for (const nextKey of nextKeys) {
      if (!currentKeys.includes(nextKey)) {
        current[nextKey] = null;
      }
    }
    for (const nextKey of nextKeys) {
      Visit16(root, `${path}/${nextKey}`, current[nextKey], next[nextKey]);
    }
  }
}
function ArrayType5(root, path, current, next) {
  if (!IsArray2(current)) {
    exports_pointer.Set(root, path, Clone2(next));
  } else {
    for (let index = 0;index < next.length; index++) {
      Visit16(root, `${path}/${index}`, current[index], next[index]);
    }
    current.splice(next.length);
  }
}
function TypedArrayType3(root, path, current, next) {
  if (IsTypedArray(current) && current.length === next.length) {
    for (let i2 = 0;i2 < current.length; i2++) {
      current[i2] = next[i2];
    }
  } else {
    exports_pointer.Set(root, path, Clone2(next));
  }
}
function ValueType3(root, path, current, next) {
  if (current === next)
    return;
  exports_pointer.Set(root, path, next);
}
function Visit16(root, path, current, next) {
  if (IsArray2(next))
    return ArrayType5(root, path, current, next);
  if (IsTypedArray(next))
    return TypedArrayType3(root, path, current, next);
  if (IsStandardObject2(next))
    return ObjectType5(root, path, current, next);
  if (IsValueType(next))
    return ValueType3(root, path, current, next);
}
function IsNonMutableValue(value2) {
  return IsTypedArray(value2) || IsValueType(value2);
}
function IsMismatchedValue(current, next) {
  return IsStandardObject2(current) && IsArray2(next) || IsArray2(current) && IsStandardObject2(next);
}
function Mutate(current, next) {
  if (IsNonMutableValue(current) || IsNonMutableValue(next))
    throw new ValueMutateError("Only object and array types can be mutated at the root level");
  if (IsMismatchedValue(current, next))
    throw new ValueMutateError("Cannot assign due type mismatch of assignable values");
  Visit16(current, "", current, next);
}
// node_modules/@sinclair/typebox/build/esm/value/parse/parse.mjs
init_error2();
init_guard();

class ParseError extends TypeBoxError {
  constructor(message) {
    super(message);
  }
}
var ParseRegistry;
(function(ParseRegistry2) {
  const registry2 = new Map([
    ["Assert", (type4, references, value2) => {
      Assert(type4, references, value2);
      return value2;
    }],
    ["Cast", (type4, references, value2) => Cast(type4, references, value2)],
    ["Clean", (type4, references, value2) => Clean(type4, references, value2)],
    ["Clone", (_type, _references, value2) => Clone2(value2)],
    ["Convert", (type4, references, value2) => Convert(type4, references, value2)],
    ["Decode", (type4, references, value2) => HasTransform(type4, references) ? TransformDecode(type4, references, value2) : value2],
    ["Default", (type4, references, value2) => Default5(type4, references, value2)],
    ["Encode", (type4, references, value2) => HasTransform(type4, references) ? TransformEncode(type4, references, value2) : value2]
  ]);
  function Delete5(key) {
    registry2.delete(key);
  }
  ParseRegistry2.Delete = Delete5;
  function Set5(key, callback) {
    registry2.set(key, callback);
  }
  ParseRegistry2.Set = Set5;
  function Get4(key) {
    return registry2.get(key);
  }
  ParseRegistry2.Get = Get4;
})(ParseRegistry || (ParseRegistry = {}));
var ParseDefault = [
  "Clone",
  "Clean",
  "Default",
  "Convert",
  "Assert",
  "Decode"
];
function ParseValue(operations, type4, references, value2) {
  return operations.reduce((value3, operationKey) => {
    const operation = ParseRegistry.Get(operationKey);
    if (IsUndefined2(operation))
      throw new ParseError(`Unable to find Parse operation '${operationKey}'`);
    return operation(type4, references, value3);
  }, value2);
}
function Parse(...args) {
  const [operations, schema3, references, value2] = args.length === 4 ? [args[0], args[1], args[2], args[3]] : args.length === 3 ? IsArray2(args[0]) ? [args[0], args[1], [], args[2]] : [ParseDefault, args[0], args[1], args[2]] : args.length === 2 ? [ParseDefault, args[0], [], args[1]] : (() => {
    throw new ParseError("Invalid Arguments");
  })();
  return ParseValue(operations, schema3, references, value2);
}
// node_modules/@sinclair/typebox/build/esm/value/value/value.mjs
var exports_value2 = {};
__export(exports_value2, {
  ValueErrorIterator: () => ValueErrorIterator,
  Patch: () => Patch,
  Parse: () => Parse,
  Mutate: () => Mutate,
  Hash: () => Hash,
  Errors: () => Errors,
  Equal: () => Equal,
  Encode: () => Encode,
  Edit: () => Edit,
  Diff: () => Diff,
  Default: () => Default5,
  Decode: () => Decode,
  Create: () => Create2,
  Convert: () => Convert,
  Clone: () => Clone2,
  Clean: () => Clean,
  Check: () => Check,
  Cast: () => Cast,
  Assert: () => Assert
});
// src/common/types.ts
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
function keyRef(aid, s, kidx, d2) {
  if (d2 !== undefined) {
    return { aid, s, kidx, d: d2 };
  }
  return { aid, s, kidx };
}
function keyRefEquals(a, b2) {
  return a.aid === b2.aid && a.s === b2.s && a.kidx === b2.kidx && a.d === b2.d;
}
function parseEd25519PublicQb64(qb64) {
  if (!exports_value2.Check(KeriPublicKeySchema, qb64)) {
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
  if (!exports_value2.Check(KeriPrivateKeySchema, qb64)) {
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
  if (!exports_value2.Check(CesrDigestSchema, qb64)) {
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
  if (!exports_value2.Check(CesrDigestSchema, qb64)) {
    throw new Error(`Invalid Blake3 QB64: ${qb64}`);
  }
  return qb64;
}
function parseEd25519SignatureQb64(qb64) {
  if (!exports_value2.Check(CesrSignatureSchema, qb64)) {
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
// src/policy/presentation-definition.ts
function presentationDefinitionSaid(pd) {
  return Data.digestFor(pd);
}
// src/remote/kel-manifest-data.ts
init_esm();

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
  function equal2(a, b2) {
    return a.d === b2.d;
  }
  KSNs.equal = equal2;
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
var CesrAttachmentSchema = Type.Union([CesrAttachment_Signature, CesrAttachment_WitnessReceipt, CesrAttachment_ValidatorReceipt], {
  title: "CESR Attachment",
  description: "Signatures and receipts attached to an event"
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

// src/remote/kel-resource-types.ts
function resourceKey(resource) {
  return `${resource.kind}:${resource.url}`;
}
function mergeRemoteRecords(existing, incoming) {
  const map3 = new Map;
  for (const record3 of existing) {
    map3.set(resourceKey(record3.resource), record3);
  }
  for (const record3 of incoming) {
    const key = resourceKey(record3.resource);
    const prior = map3.get(key);
    if (!prior || recordSortKey(record3) >= recordSortKey(prior)) {
      map3.set(key, record3);
    }
  }
  return [...map3.values()];
}
function recordSortKey(record3) {
  return `${record3.at}\x00${String(record3.seqNo).padStart(12, "0")}`;
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
  events.sort((a, b2) => a.sn - b2.sn);
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
function parseKelManifestWire(value2) {
  if (typeof value2 !== "object" || value2 === null)
    return;
  const v = value2.v;
  if (v === "kerits-aid-manifest/2") {
    if (!exports_value2.Check(KELManifestDataSchema, value2))
      return;
    return { version: 2, data: value2 };
  }
  if (v === "kerits-aid-manifest/1") {
    if (!exports_value2.Check(AidManifestSchema, value2))
      return;
    return { version: 1, manifest: value2 };
  }
  return;
}
function manifestUrlFromKelManifestData(data) {
  return data.entries.find((e) => e.resource.kind === "kel.manifest")?.resource.url;
}
// src/remote/typed-remote.ts
function createTypedRemote(store, codec, resolvePath) {
  return {
    async publish(key, value2) {
      const payloadFormat = codec.payloadFormat ?? "json";
      return store.publish(resolvePath(key), codec.encode(value2), { payloadFormat });
    },
    async fetch(key) {
      const data = await store.fetch(resolvePath(key));
      return data === undefined ? undefined : codec.decode(data);
    }
  };
}
// src/version.ts
var VERSION = "0.3.65";
var GIT_SHA = "7d070fc20ec69ac5590f291fcafa760ea69406d7";
export {
  verifyWitnessReceipt,
  verify,
  validateSignedIcp,
  validateSAID,
  validateRequiredFields,
  validatePublishedCredential,
  validateKeyChain,
  validateKelChain,
  validateKel,
  validateInceptionSignRequest,
  validateEventSaid,
  transferableKeyToPublicKey,
  toEd25519KeyPairBranded,
  sign,
  sha512Hex,
  sha512,
  sha256Hex,
  sha256,
  serializeForSigning,
  serializeEnvelope,
  schemaSaidOf,
  saidOf,
  resourceKey,
  remoteRecordsFromKelManifestData,
  remoteRecordsFromAidManifest,
  reduceKelState,
  recoveryPublicKeyAt,
  recoveryKeyDerivationSpec,
  recoveryCommitmentAt,
  recomputeSaid,
  randomBytes,
  profileUsernameFromDisplayName,
  presentationDefinitionSaid,
  parseSimpleThreshold,
  parseSha256Hex,
  parseSaidQb64,
  parseProfileAlias,
  parseKelManifestWire,
  parseEd25519SignatureQb64,
  parseEd25519PublicQb64,
  parseEd25519PrivateQb64,
  parseBlake3Qb64Digest,
  parseBlake3Qb64,
  parseBlake3Hex,
  parseAidQb64,
  ok,
  normalizeThreshold,
  normalizeDisplayNameToProfileUsername,
  nextKeyDigestQb64FromPublicKeyQb64,
  mergeRemoteRecords,
  manifestUrlFromRecords,
  manifestUrlFromKelManifestData,
  latestSnFromKelManifestData,
  keyRefEquals,
  keyRef,
  kelManifestDataToAidManifest,
  isValidKeriEvent,
  isStructuredValidationError,
  inspect,
  inferSchema,
  hkdfSha256,
  hkdfBlake3,
  hexToBytes,
  getPublicKey,
  getCodeMeta,
  generateKeyPair,
  eventContainsAnchorForSaid,
  err,
  encryptEnvelope,
  encodeSig as encodeSignature,
  encodeSAID,
  encodeKey,
  encodeEventBytes,
  encodeDigest2 as encodeDigest,
  encodeBase64Url,
  encodeBase64,
  encode3 as encode,
  ed25519ToX25519Public,
  ed25519ToX25519Private,
  digestVerfer,
  deserializeEnvelope,
  deriveSharedSecret,
  deriveScheduledEd25519Keypair,
  deriveSaid,
  decryptEnvelope,
  decodeSig as decodeSignature,
  decodeKey,
  decodeDigest,
  decodeBase64Url,
  decodeBase64,
  decode2 as decode,
  createTypedRemote,
  createStructuredValidationError,
  createSaidMessageType,
  createInitialRecoveryDerivation,
  checkThreshold,
  canonicalizeToBytes,
  canonicalizeEvent,
  canonicalize2 as canonicalize,
  canonical,
  bytesToHex,
  buildDeviceRecoverySigningPath,
  buildAccountRecoverySigningPath,
  buildACDCCredentialSurface,
  buildAAD,
  assessTelKelAnchors,
  assessTelKelAnchor,
  asEd25519PublicRaw,
  asEd25519PrivateRaw,
  aidManifestToKelManifestData,
  advanceRecoveryDerivation,
  WeightedThresholdSchema,
  VersionSchema,
  VerificationError,
  VaultErrorCode,
  ValidationErrorCode,
  ValidationError,
  VERSION,
  TimestampSchema,
  ThresholdSchema,
  ThresholdExpressionSchema,
  ThresholdExpressionPattern,
  ThresholdError,
  Tel,
  TEL_VRT_SURFACE,
  TEL_VCP_WITH_NONCE_SURFACE,
  TEL_VCP_SURFACE,
  TEL_REV_SURFACE,
  TEL_ISS_SURFACE,
  TEL_BRV_SURFACE,
  TEL_BIS_SURFACE,
  TELOps,
  TELEvents,
  TELData,
  Signers,
  Signature as SignatureOps,
  SchemaOps,
  SchemaData,
  Schema,
  Said,
  SAID_PLACEHOLDER,
  RotEventSchema2 as RotEventSchema,
  RECOVERY_SCHEDULE_VERSION,
  RECOVERY_EXPAND_SALT,
  Qb64Schema,
  PublishedResourceSchema,
  PublishedCredentialSchema,
  PermissionError,
  NotFoundError,
  NonEmpty,
  NetworkError,
  MAX_HKDF_DERIVE_LENGTH,
  KeyRefSchema,
  KeyIndexSchema2 as KeyIndexSchema,
  KeriVersionPattern,
  KeriPublicKeySchema,
  KeriPrivateKeySchema,
  KeriKeyPairs,
  KeriKeyPairSchema,
  KelErrorCode,
  KelAppends2 as KelAppends,
  KelAppendSchema2 as KelAppendSchema,
  Kel,
  KSNs2 as KSNs,
  KSNSchema2 as KSNSchema,
  KERI_PREFIX,
  KEL_ROT_SURFACE,
  KEL_IXN_SURFACE,
  KEL_ICP_SURFACE,
  KEL_DRT_SURFACE,
  KEL_DIP_SURFACE,
  KELOps,
  KELManifestDataSchema,
  KELEvents,
  KELEventSchema2 as KELEventSchema,
  KELData,
  IxnEventSchema2 as IxnEventSchema,
  IssEventSchema,
  IcpEventSchema2 as IcpEventSchema,
  GIT_SHA,
  DrtEventSchema2 as DrtEventSchema,
  DipEventSchema2 as DipEventSchema,
  DigestSealSchema2 as DigestSealSchema,
  Data,
  CoreError,
  ControllerNotFoundError,
  ConflictError,
  CesrType,
  CesrSignatureSchema,
  CesrSealSchema2 as CesrSealSchema,
  CesrKeyTransferableSchema,
  CesrDigestSchema,
  CesrAttachment_WitnessReceipt2 as CesrAttachment_WitnessReceipt,
  CesrAttachment_ValidatorReceipt2 as CesrAttachment_ValidatorReceipt,
  CesrAttachment_Signature2 as CesrAttachment_Signature,
  CesrAttachmentSchema2 as CesrAttachmentSchema,
  CesrAidSchema,
  Cesr,
  CanonicalPaths,
  CESREventSchema2 as CESREventSchema,
  BisEventSchema,
  AnySealSchema2 as AnySealSchema,
  AidManifestSchema2 as AidManifestSchema,
  AidManifestEventSchema2 as AidManifestEventSchema,
  Acdc,
  ACDC_SCHEMA_SURFACE,
  ACDC_CREDENTIAL_SURFACE,
  ACDCOps,
  ACDCData,
  ACCOUNT_RECOVERY_PATH_PREFIX
};
