continuum = (function(global, exports, require, module, undefined){


exports.esprima = (function(exports){
/*
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2012 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
  Copyright (C) 2012 Kris Kowal <kris.kowal@cixar.com>
  Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*jslint bitwise:true plusplus:true */
/*global esprima:true, define:true, exports:true, window: true,
throwError: true, createLiteral: true, generateStatement: true,
parseAssignmentExpression: true, parseBlock: true,
parseClassExpression: true, parseClassDeclaration: true, parseExpression: true,
parseForStatement: true,
parseFunctionDeclaration: true, parseFunctionExpression: true,
parseFunctionSourceElements: true, parseVariableIdentifier: true,
parseImportSpecifier: true,
parseLeftHandSideExpression: true,
parseStatement: true, parseSourceElement: true, parseModuleBlock: true, parseConciseBody: true,
parseYieldExpression: true
*/

(function (factory) {
    'use strict';

    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js,
    // and plain browser loading,
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        factory((window.esprima = {}));
    }
}(function (exports) {
    'use strict';

    var Token,
        TokenName,
        Syntax,
        PropertyKind,
        Messages,
        Regex,
        source,
        strict,
        yieldAllowed,
        yieldFound,
        index,
        lineNumber,
        lineStart,
        length,
        buffer,
        state,
        extra;

    Token = {
        BooleanLiteral: 1,
        EOF: 2,
        Identifier: 3,
        Keyword: 4,
        NullLiteral: 5,
        NumericLiteral: 6,
        Punctuator: 7,
        StringLiteral: 8,
        Template: 9,
        AtSymbol: 10
    };

    TokenName = {};
    TokenName[Token.BooleanLiteral] = 'Boolean';
    TokenName[Token.EOF] = '<end>';
    TokenName[Token.Identifier] = 'Identifier';
    TokenName[Token.Keyword] = 'Keyword';
    TokenName[Token.NullLiteral] = 'Null';
    TokenName[Token.NumericLiteral] = 'Numeric';
    TokenName[Token.Punctuator] = 'Punctuator';
    TokenName[Token.StringLiteral] = 'String';
    TokenName[Token.AtSymbol] = 'AtSymbol';

    Syntax = {
        ArrayExpression: 'ArrayExpression',
        ArrayPattern: 'ArrayPattern',
        ArrowFunctionExpression: 'ArrowFunctionExpression',
        AssignmentExpression: 'AssignmentExpression',
        AtSymbol: 'AtSymbol',
        BinaryExpression: 'BinaryExpression',
        BlockStatement: 'BlockStatement',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ClassBody: 'ClassBody',
        ClassDeclaration: 'ClassDeclaration',
        ClassExpression: 'ClassExpression',
        ClassHeritage: 'ClassHeritage',
        ComprehensionBlock: 'ComprehensionBlock',
        ComprehensionExpression: 'ComprehensionExpression',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DebuggerStatement: 'DebuggerStatement',
        DoWhileStatement: 'DoWhileStatement',
        EmptyStatement: 'EmptyStatement',
        ExportDeclaration: 'ExportDeclaration',
        ExportSpecifier: 'ExportSpecifier',
        ExportSpecifierSet: 'ExportSpecifierSet',
        ExpressionStatement: 'ExpressionStatement',
        ForInStatement: 'ForInStatement',
        ForOfStatement: 'ForOfStatement',
        ForStatement: 'ForStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Glob: 'Glob',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        ImportDeclaration: 'ImportDeclaration',
        ImportSpecifier: 'ImportSpecifier',
        LabeledStatement: 'LabeledStatement',
        Literal: 'Literal',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        MethodDefinition: 'MethodDefinition',
        ModuleDeclaration: 'ModuleDeclaration',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        ObjectPattern: 'ObjectPattern',
        Path:  'Path',
        Program: 'Program',
        Property: 'Property',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SpreadElement: 'SpreadElement',
        SwitchCase: 'SwitchCase',
        SwitchStatement: 'SwitchStatement',
        SymbolDeclaration: 'SymbolDeclaration',
        SymbolDeclarator: 'SymbolDeclarator',
        TaggedTemplateExpression: 'TaggedTemplateExpression',
        TemplateElement: 'TemplateElement',
        TemplateLiteral: 'TemplateLiteral',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement',
        YieldExpression: 'YieldExpression'
    };

    PropertyKind = {
        Data: 1,
        Get: 2,
        Set: 4
    };

    // Error messages should be identical to V8.
    Messages = {
        UnexpectedToken:  'Unexpected token %0',
        UnexpectedNumber:  'Unexpected number',
        UnexpectedString:  'Unexpected string',
        UnexpectedIdentifier:  'Unexpected identifier',
        UnexpectedReserved:  'Unexpected reserved word',
        UnexpectedTemplate:  'Unexpected template %0',
        UnexpectedEOS:  'Unexpected end of input',
        NewlineAfterThrow:  'Illegal newline after throw',
        InvalidRegExp: 'Invalid regular expression',
        UnterminatedRegExp:  'Invalid regular expression: missing /',
        InvalidLHSInAssignment:  'Invalid left-hand side in assignment',
        InvalidLHSInFormalsList:  'Invalid left-hand side in formals list',
        InvalidLHSInForIn:  'Invalid left-hand side in for-in',
        MultipleDefaultsInSwitch: 'More than one default clause in switch statement',
        NoCatchOrFinally:  'Missing catch or finally after try',
        UnknownLabel: 'Undefined label \'%0\'',
        Redeclaration: '%0 \'%1\' has already been declared',
        IllegalContinue: 'Illegal continue statement',
        IllegalBreak: 'Illegal break statement',
        IllegalReturn: 'Illegal return statement',
        IllegalYield: 'Illegal yield expression',
        IllegalSpread: 'Illegal spread element',
        StrictModeWith:  'Strict mode code may not include a with statement',
        StrictCatchVariable:  'Catch variable may not be eval or arguments in strict mode',
        StrictVarName:  'Variable name may not be eval or arguments in strict mode',
        StrictParamName:  'Parameter name eval or arguments is not allowed in strict mode',
        StrictParamDupe: 'Strict mode function may not have duplicate parameter names',
        ParameterAfterRestParameter: 'Rest parameter must be final parameter of an argument list',
        ElementAfterSpreadElement: 'Spread must be the final element of an element list',
        ObjectPatternAsRestParameter: 'Invalid rest parameter',
        ObjectPatternAsSpread: 'Invalid spread argument',
        StrictFunctionName:  'Function name may not be eval or arguments in strict mode',
        StrictOctalLiteral:  'Octal literals are not allowed in strict mode.',
        StrictDelete:  'Delete of an unqualified identifier in strict mode.',
        StrictDuplicateProperty:  'Duplicate data property in object literal not allowed in strict mode',
        AccessorDataProperty:  'Object literal may not have data and accessor property with the same name',
        AccessorGetSet:  'Object literal may not have multiple get/set accessors with the same name',
        StrictLHSAssignment:  'Assignment to eval or arguments is not allowed in strict mode',
        StrictLHSPostfix:  'Postfix increment/decrement may not have eval or arguments operand in strict mode',
        StrictLHSPrefix:  'Prefix increment/decrement may not have eval or arguments operand in strict mode',
        StrictReservedWord:  'Use of future reserved word in strict mode',
        NoFromAfterImport: 'Missing from after import',
        NoYieldInGenerator: 'Missing yield in generator',
        NoUnintializedConst: 'Const must be initialized',
        ComprehensionRequiresBlock: 'Comprehension must have at least one block',
        ComprehensionError:  'Comprehension Error',
        EachNotAllowed:  'Each is not supported',
        DefaultsNotLast: 'Default parameters must come last'
    };

    // See also tools/generate-unicode-regex.py.
    Regex = {
        NonAsciiIdentifierStart: new RegExp('[\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]'),
        NonAsciiIdentifierPart: new RegExp('[\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0300-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u0483-\u0487\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u05d0-\u05ea\u05f0-\u05f2\u0610-\u061a\u0620-\u0669\u066e-\u06d3\u06d5-\u06dc\u06df-\u06e8\u06ea-\u06fc\u06ff\u0710-\u074a\u074d-\u07b1\u07c0-\u07f5\u07fa\u0800-\u082d\u0840-\u085b\u08a0\u08a2-\u08ac\u08e4-\u08fe\u0900-\u0963\u0966-\u096f\u0971-\u0977\u0979-\u097f\u0981-\u0983\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bc-\u09c4\u09c7\u09c8\u09cb-\u09ce\u09d7\u09dc\u09dd\u09df-\u09e3\u09e6-\u09f1\u0a01-\u0a03\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a59-\u0a5c\u0a5e\u0a66-\u0a75\u0a81-\u0a83\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abc-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ad0\u0ae0-\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3c-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b5c\u0b5d\u0b5f-\u0b63\u0b66-\u0b6f\u0b71\u0b82\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd0\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c58\u0c59\u0c60-\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbc-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0cde\u0ce0-\u0ce3\u0ce6-\u0cef\u0cf1\u0cf2\u0d02\u0d03\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d-\u0d44\u0d46-\u0d48\u0d4a-\u0d4e\u0d57\u0d60-\u0d63\u0d66-\u0d6f\u0d7a-\u0d7f\u0d82\u0d83\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e01-\u0e3a\u0e40-\u0e4e\u0e50-\u0e59\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb9\u0ebb-\u0ebd\u0ec0-\u0ec4\u0ec6\u0ec8-\u0ecd\u0ed0-\u0ed9\u0edc-\u0edf\u0f00\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e-\u0f47\u0f49-\u0f6c\u0f71-\u0f84\u0f86-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u1049\u1050-\u109d\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u135d-\u135f\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176c\u176e-\u1770\u1772\u1773\u1780-\u17d3\u17d7\u17dc\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u1820-\u1877\u1880-\u18aa\u18b0-\u18f5\u1900-\u191c\u1920-\u192b\u1930-\u193b\u1946-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u19d0-\u19d9\u1a00-\u1a1b\u1a20-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1aa7\u1b00-\u1b4b\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1bf3\u1c00-\u1c37\u1c40-\u1c49\u1c4d-\u1c7d\u1cd0-\u1cd2\u1cd4-\u1cf6\u1d00-\u1de6\u1dfc-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u200c\u200d\u203f\u2040\u2054\u2071\u207f\u2090-\u209c\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d7f-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2de0-\u2dff\u2e2f\u3005-\u3007\u3021-\u302f\u3031-\u3035\u3038-\u303c\u3041-\u3096\u3099\u309a\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua62b\ua640-\ua66f\ua674-\ua67d\ua67f-\ua697\ua69f-\ua6f1\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua827\ua840-\ua873\ua880-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f7\ua8fb\ua900-\ua92d\ua930-\ua953\ua960-\ua97c\ua980-\ua9c0\ua9cf-\ua9d9\uaa00-\uaa36\uaa40-\uaa4d\uaa50-\uaa59\uaa60-\uaa76\uaa7a\uaa7b\uaa80-\uaac2\uaadb-\uaadd\uaae0-\uaaef\uaaf2-\uaaf6\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabea\uabec\uabed\uabf0-\uabf9\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\ufe70-\ufe74\ufe76-\ufefc\uff10-\uff19\uff21-\uff3a\uff3f\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]')
    };

    // Ensure the condition is true, otherwise throw an error.
    // This is only to have a better contract semantic, i.e. another safety net
    // to catch a logic error. The condition shall be fulfilled in normal case.
    // Do NOT use this to enforce a certain condition on any user input.

    function assert(condition, message) {
        if (!condition) {
            throw new Error('ASSERT: ' + message);
        }
    }

    function sliceSource(from, to) {
        return source.slice(from, to);
    }

    if (typeof 'esprima'[0] === 'undefined') {
        sliceSource = function sliceArraySource(from, to) {
            return source.slice(from, to).join('');
        };
    }

    function isDecimalDigit(ch) {
        return '0123456789'.indexOf(ch) >= 0;
    }

    function isHexDigit(ch) {
        return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
    }

    function isOctalDigit(ch) {
        return '01234567'.indexOf(ch) >= 0;
    }


    // 7.2 White Space

    function isWhiteSpace(ch) {
        return (ch === ' ') || (ch === '\u0009') || (ch === '\u000B') ||
            (ch === '\u000C') || (ch === '\u00A0') ||
            (ch.charCodeAt(0) >= 0x1680 &&
             '\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\uFEFF'.indexOf(ch) >= 0);
    }

    // 7.3 Line Terminators

    function isLineTerminator(ch) {
        return (ch === '\n' || ch === '\r' || ch === '\u2028' || ch === '\u2029');
    }

    // 7.6 Identifier Names and Identifiers

    function isIdentifierStart(ch) {
        return (ch === '$') || (ch === '_') || (ch === '\\') ||
            (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') ||
            ((ch.charCodeAt(0) >= 0x80) && Regex.NonAsciiIdentifierStart.test(ch));
    }

    function isIdentifierPart(ch) {
        return (ch === '$') || (ch === '_') || (ch === '\\') ||
            (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') ||
            ((ch >= '0') && (ch <= '9')) ||
            ((ch.charCodeAt(0) >= 0x80) && Regex.NonAsciiIdentifierPart.test(ch));
    }

    // 7.6.1.2 Future Reserved Words

    function isFutureReservedWord(id) {
        switch (id) {

        // Future reserved words.
        case 'class':
        case 'enum':
        case 'export':
        case 'extends':
        case 'import':
        case 'super':
            return true;
        }

        return false;
    }

    function isStrictModeReservedWord(id) {
        switch (id) {

        // Strict Mode reserved words.
        case 'implements':
        case 'interface':
        case 'package':
        case 'private':
        case 'protected':
        case 'public':
        case 'static':
        case 'yield':
        case 'let':
            return true;
        }

        return false;
    }

    function isRestrictedWord(id) {
        return id === 'eval' || id === 'arguments';
    }

    // 7.6.1.1 Keywords

    function isKeyword(id) {
        var keyword = false;
        switch (id.length) {
        case 2:
            keyword = (id === 'if') || (id === 'in') || (id === 'do');
            break;
        case 3:
            keyword = (id === 'var') || (id === 'for') || (id === 'new') || (id === 'try');
            break;
        case 4:
            keyword = (id === 'this') || (id === 'else') || (id === 'case') || (id === 'void') || (id === 'with');
            break;
        case 5:
            keyword = (id === 'while') || (id === 'break') || (id === 'catch') || (id === 'throw');
            break;
        case 6:
            keyword = (id === 'return') || (id === 'typeof') || (id === 'delete') || (id === 'switch') || (id === 'public');
            break;
        case 7:
            keyword = (id === 'default') || (id === 'finally') || (id === 'private');
            break;
        case 8:
            keyword = (id === 'function') || (id === 'continue') || (id === 'debugger');
            break;
        case 10:
            keyword = (id === 'instanceof');
            break;
        }

        if (keyword) {
            return true;
        }

        switch (id) {
        // Future reserved words.
        // 'const' is specialized as Keyword in V8.
        case 'const':
            return true;

        // For compatiblity to SpiderMonkey and ES.next
        case 'yield':
        case 'let':
            return true;
        }

        if (strict && isStrictModeReservedWord(id)) {
            return true;
        }

        return isFutureReservedWord(id);
    }

    // Return the next character and move forward.

    function nextChar() {
        return source[index++];
    }

    // 7.4 Comments

    function skipComment() {
        var ch, blockComment, lineComment;

        blockComment = false;
        lineComment = false;

        while (index < length) {
            ch = source[index];

            if (lineComment) {
                ch = nextChar();
                if (isLineTerminator(ch)) {
                    lineComment = false;
                    if (ch === '\r' && source[index] === '\n') {
                        ++index;
                    }
                    ++lineNumber;
                    lineStart = index;
                }
            } else if (blockComment) {
                if (isLineTerminator(ch)) {
                    if (ch === '\r' && source[index + 1] === '\n') {
                        ++index;
                    }
                    ++lineNumber;
                    ++index;
                    lineStart = index;
                    if (index >= length) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                } else {
                    ch = nextChar();
                    if (index >= length) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                    if (ch === '*') {
                        ch = source[index];
                        if (ch === '/') {
                            ++index;
                            blockComment = false;
                        }
                    }
                }
            } else if (ch === '/') {
                ch = source[index + 1];
                if (ch === '/') {
                    index += 2;
                    lineComment = true;
                } else if (ch === '*') {
                    index += 2;
                    blockComment = true;
                    if (index >= length) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                } else {
                    break;
                }
            } else if (isWhiteSpace(ch)) {
                ++index;
            } else if (isLineTerminator(ch)) {
                ++index;
                if (ch ===  '\r' && source[index] === '\n') {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
            } else {
                break;
            }
        }
    }

    function scanHexEscape(prefix) {
        var i, len, ch, code = 0;

        len = (prefix === 'u') ? 4 : 2;
        for (i = 0; i < len; ++i) {
            if (index < length && isHexDigit(source[index])) {
                ch = nextChar();
                code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
            } else {
                return '';
            }
        }
        return String.fromCharCode(code);
    }

    function scanUnicodeCodePointEscape() {
        var ch, code, cu1, cu2;

        ch = source[index];
        code = 0;

        // At least, one hex digit is required.
        if (ch === '}') {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        while (index < length) {
            ch = nextChar();
            if (!isHexDigit(ch)) {
                break;
            }
            code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
        }

        if (code > 0x10FFFF || ch !== '}') {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        // UTF-16 Encoding
        if (code <= 0xFFFF) {
            return String.fromCharCode(code);
        }
        cu1 = ((code - 0x10000) >> 10) + 0xD800;
        cu2 = ((code - 0x10000) & 1023) + 0xDC00;
        return String.fromCharCode(cu1, cu2);
    }

    function scanIdentifier() {
        var ch, atname, start, id, restore, internal;

        ch = source[index];

        if (ch === '@') {
            atname = true;
            ch = source[++index];
            if (ch === '@') {
                internal = true;
                ch = source[++index];
            }
        }

        if (!isIdentifierStart(ch)) {
            return;
        }

        start = index;
        if (ch === '\\') {
            ++index;
            if (source[index] !== 'u') {
                return;
            }
            ++index;
            restore = index;
            ch = scanHexEscape('u');
            if (ch) {
                if (ch === '\\' || !isIdentifierStart(ch)) {
                    return;
                }
                id = ch;
            } else {
                index = restore;
                id = 'u';
            }
        } else {
            id = nextChar();
        }

        while (index < length) {
            ch = source[index];
            if (!isIdentifierPart(ch)) {
                break;
            }
            if (ch === '\\') {
                ++index;
                if (source[index] !== 'u') {
                    return;
                }
                ++index;
                restore = index;
                ch = scanHexEscape('u');
                if (ch) {
                    if (ch === '\\' || !isIdentifierPart(ch)) {
                        return;
                    }
                    id += ch;
                } else {
                    index = restore;
                    id += 'u';
                }
            } else {
                id += nextChar();
            }
        }

        if (atname) {
            return {
                type: Token.AtSymbol,
                value: id,
                lineNumber: lineNumber,
                lineStart: lineStart,
                internal: internal,
                range: [start, index]
            };
        }

        // There is no keyword or literal with only one character.
        // Thus, it must be an identifier.
        if (id.length === 1) {
            return {
                type: Token.Identifier,
                value: id,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (isKeyword(id)) {
            return {
                type: Token.Keyword,
                value: id,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        // 7.8.1 Null Literals

        if (id === 'null') {
            return {
                type: Token.NullLiteral,
                value: id,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        // 7.8.2 Boolean Literals

        if (id === 'true' || id === 'false') {
            return {
                type: Token.BooleanLiteral,
                value: id,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        return {
            type: Token.Identifier,
            value: id,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    // 7.7 Punctuators

    function scanPunctuator() {
        var start = index,
            ch1 = source[index],
            ch2,
            ch3,
            ch4;

        // Check for most common single-character punctuators.

        if (ch1 === ';' || ch1 === '{' || ch1 === '}') {
            ++index;
            return {
                type: Token.Punctuator,
                value: ch1,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (ch1 === ',' || ch1 === '(' || ch1 === ')') {
            ++index;
            return {
                type: Token.Punctuator,
                value: ch1,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        // Dot (.) can also start a floating-point number and ellipsis, hence
        // the need to check the next character.

        ch2 = source[index + 1];
        if (ch1 === '.' && !isDecimalDigit(ch2) && ch2 !== '.') {
            return {
                type: Token.Punctuator,
                value: nextChar(),
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        // Peek more characters.

        ch3 = source[index + 2];
        ch4 = source[index + 3];

        // 4-character punctuator: >>>=

        if (ch1 === '>' && ch2 === '>' && ch3 === '>') {
            if (ch4 === '=') {
                index += 4;
                return {
                    type: Token.Punctuator,
                    value: '>>>=',
                    lineNumber: lineNumber,
                    lineStart: lineStart,
                    range: [start, index]
                };
            }
        }

        // 3-character punctuators: === !== >>> <<= >>= ...

        if (ch1 === '=' && ch2 === '=' && ch3 === '=') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: '===',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (ch1 === '!' && ch2 === '=' && ch3 === '=') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: '!==',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (ch1 === '>' && ch2 === '>' && ch3 === '>') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: '>>>',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (ch1 === '<' && ch2 === '<' && ch3 === '=') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: '<<=',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (ch1 === '>' && ch2 === '>' && ch3 === '=') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: '>>=',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (ch1 === '.' && ch2 === '.' && ch3 === '.') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: '...',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        // 2-character punctuators: <= >= == != ++ -- << >> && ||
        // += -= *= %= &= |= ^= /=

        if (ch2 === '=') {
            if ('<>=!+-*%&|^/'.indexOf(ch1) >= 0) {
                index += 2;
                return {
                    type: Token.Punctuator,
                    value: ch1 + ch2,
                    lineNumber: lineNumber,
                    lineStart: lineStart,
                    range: [start, index]
                };
            }
        }

        if (ch1 === ch2 && ('+-<>&|'.indexOf(ch1) >= 0)) {
            if ('+-<>&|'.indexOf(ch2) >= 0) {
                index += 2;
                return {
                    type: Token.Punctuator,
                    value: ch1 + ch2,
                    lineNumber: lineNumber,
                    lineStart: lineStart,
                    range: [start, index]
                };
            }
        }

        if (ch1 === '=' && ch2 === '>') {
            index += 2;
            return {
                type: Token.Punctuator,
                value: '=>',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        // The remaining 1-character punctuators.

        if ('[]<>+-*%&|^!~?:=/'.indexOf(ch1) >= 0) {
            return {
                type: Token.Punctuator,
                value: nextChar(),
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }
    }

    // 7.8.3 Numeric Literals

    function scanNumericLiteral() {
        var number, start, ch, octal;

        ch = source[index];
        assert(isDecimalDigit(ch) || (ch === '.'),
            'Numeric literal must start with a decimal digit or a decimal point');

        start = index;
        number = '';
        if (ch !== '.') {
            number = nextChar();
            ch = source[index];

            // Hex number starts with '0x'.
            // Octal number starts with '0'.
            // Octal number in ES6 starts with '0o'.
            // Binary number in ES6 starts with '0b'.
            if (number === '0') {
                if (ch === 'x' || ch === 'X') {
                    number += nextChar();
                    while (index < length) {
                        ch = source[index];
                        if (!isHexDigit(ch)) {
                            break;
                        }
                        number += nextChar();
                    }

                    if (number.length <= 2) {
                        // only 0x
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }

                    if (index < length) {
                        ch = source[index];
                        if (isIdentifierStart(ch)) {
                            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                        }
                    }
                    return {
                        type: Token.NumericLiteral,
                        value: parseInt(number, 16),
                        lineNumber: lineNumber,
                        lineStart: lineStart,
                        range: [start, index]
                    };
                } else if (ch === 'b' || ch === 'B') {
                    nextChar();
                    number = '';

                    while (index < length) {
                        ch = source[index];
                        if (ch !== '0' && ch !== '1') {
                            break;
                        }
                        number += nextChar();
                    }

                    if (number.length === 0) {
                        // only 0b or 0B
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }

                    if (index < length) {
                        ch = source[index];
                        if (isIdentifierStart(ch) || isDecimalDigit(ch)) {
                            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                        }
                    }
                    return {
                        type: Token.NumericLiteral,
                        value: parseInt(number, 2),
                        lineNumber: lineNumber,
                        lineStart: lineStart,
                        range: [start, index]
                    };
                } else if (ch === 'o' || ch === 'O' || isOctalDigit(ch)) {
                    if (isOctalDigit(ch)) {
                        octal = true;
                        number = nextChar();
                    } else {
                        octal = false;
                        nextChar();
                        number = '';
                    }

                    while (index < length) {
                        ch = source[index];
                        if (!isOctalDigit(ch)) {
                            break;
                        }
                        number += nextChar();
                    }

                    if (number.length === 0) {
                        // only 0o or 0O
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }

                    if (index < length) {
                        ch = source[index];
                        if (isIdentifierStart(ch) || isDecimalDigit(ch)) {
                            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                        }
                    }

                    return {
                        type: Token.NumericLiteral,
                        value: parseInt(number, 8),
                        octal: octal,
                        lineNumber: lineNumber,
                        lineStart: lineStart,
                        range: [start, index]
                    };
                }

                // decimal number starts with '0' such as '09' is illegal.
                if (isDecimalDigit(ch)) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
            }

            while (index < length) {
                ch = source[index];
                if (!isDecimalDigit(ch)) {
                    break;
                }
                number += nextChar();
            }
        }

        if (ch === '.') {
            number += nextChar();
            while (index < length) {
                ch = source[index];
                if (!isDecimalDigit(ch)) {
                    break;
                }
                number += nextChar();
            }
        }

        if (ch === 'e' || ch === 'E') {
            number += nextChar();

            ch = source[index];
            if (ch === '+' || ch === '-') {
                number += nextChar();
            }

            ch = source[index];
            if (isDecimalDigit(ch)) {
                number += nextChar();
                while (index < length) {
                    ch = source[index];
                    if (!isDecimalDigit(ch)) {
                        break;
                    }
                    number += nextChar();
                }
            } else {
                ch = 'character ' + ch;
                if (index >= length) {
                    ch = '<end>';
                }
                throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
        }

        if (index < length) {
            ch = source[index];
            if (isIdentifierStart(ch)) {
                throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
        }

        return {
            type: Token.NumericLiteral,
            value: parseFloat(number),
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    // 7.8.4 String Literals

    function scanStringLiteral() {
        var str = '', quote, start, ch, code, unescaped, restore, octal = false;

        quote = source[index];
        assert((quote === '\'' || quote === '"'),
            'String literal must starts with a quote');

        start = index;
        ++index;

        while (index < length) {
            ch = nextChar();

            if (ch === quote) {
                quote = '';
                break;
            } else if (ch === '\\') {
                ch = nextChar();
                if (!isLineTerminator(ch)) {
                    switch (ch) {
                    case 'n':
                        str += '\n';
                        break;
                    case 'r':
                        str += '\r';
                        break;
                    case 't':
                        str += '\t';
                        break;
                    case 'u':
                    case 'x':
                        if (source[index] === '{') {
                            ++index;
                            str += scanUnicodeCodePointEscape();
                        } else {
                            restore = index;
                            unescaped = scanHexEscape(ch);
                            if (unescaped) {
                                str += unescaped;
                            } else {
                                index = restore;
                                str += ch;
                            }
                        }
                        break;
                    case 'b':
                        str += '\b';
                        break;
                    case 'f':
                        str += '\f';
                        break;
                    case 'v':
                        str += '\v';
                        break;

                    default:
                        if (isOctalDigit(ch)) {
                            code = '01234567'.indexOf(ch);

                            // \0 is not octal escape sequence
                            if (code !== 0) {
                                octal = true;
                            }

                            if (index < length && isOctalDigit(source[index])) {
                                octal = true;
                                code = code * 8 + '01234567'.indexOf(nextChar());

                                // 3 digits are only allowed when string starts
                                // with 0, 1, 2, 3
                                if ('0123'.indexOf(ch) >= 0 &&
                                        index < length &&
                                        isOctalDigit(source[index])) {
                                    code = code * 8 + '01234567'.indexOf(nextChar());
                                }
                            }
                            str += String.fromCharCode(code);
                        } else {
                            str += ch;
                        }
                        break;
                    }
                } else {
                    ++lineNumber;
                    if (ch ===  '\r' && source[index] === '\n') {
                        ++index;
                    }
                }
            } else if (isLineTerminator(ch)) {
                break;
            } else {
                str += ch;
            }
        }

        if (quote !== '') {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        return {
            type: Token.StringLiteral,
            value: str,
            octal: octal,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    function scanTemplate() {
        var cooked = '', ch, start, terminated, tail, restore, unescaped, code, octal;

        terminated = false;
        tail = false;
        start = index;

        ++index;

        while (index < length) {
            ch = nextChar();
            if (ch === '`') {
                tail = true;
                terminated = true;
                break;
            } else if (ch === '$') {
                if (source[index] === '{') {
                    ++index;
                    terminated = true;
                    break;
                }
                cooked += ch;
            } else if (ch === '\\') {
                ch = nextChar();
                if (!isLineTerminator(ch)) {
                    switch (ch) {
                    case 'n':
                        cooked += '\n';
                        break;
                    case 'r':
                        cooked += '\r';
                        break;
                    case 't':
                        cooked += '\t';
                        break;
                    case 'u':
                    case 'x':
                        if (source[index] === '{') {
                            ++index;
                            cooked += scanUnicodeCodePointEscape();
                        } else {
                            restore = index;
                            unescaped = scanHexEscape(ch);
                            if (unescaped) {
                                cooked += unescaped;
                            } else {
                                index = restore;
                                cooked += ch;
                            }
                        }
                        break;
                    case 'b':
                        cooked += '\b';
                        break;
                    case 'f':
                        cooked += '\f';
                        break;
                    case 'v':
                        cooked += '\v';
                        break;

                    default:
                        if (isOctalDigit(ch)) {
                            code = '01234567'.indexOf(ch);

                            // \0 is not octal escape sequence
                            if (code !== 0) {
                                octal = true;
                            }

                            if (index < length && isOctalDigit(source[index])) {
                                octal = true;
                                code = code * 8 + '01234567'.indexOf(nextChar());

                                // 3 digits are only allowed when string starts
                                // with 0, 1, 2, 3
                                if ('0123'.indexOf(ch) >= 0 &&
                                        index < length &&
                                        isOctalDigit(source[index])) {
                                    code = code * 8 + '01234567'.indexOf(nextChar());
                                }
                            }
                            cooked += String.fromCharCode(code);
                        } else {
                            cooked += ch;
                        }
                        break;
                    }
                } else {
                    ++lineNumber;
                    if (ch ===  '\r' && source[index] === '\n') {
                        ++index;
                    }
                }
            } else if (isLineTerminator(ch)) {
                ++lineNumber;
                if (ch ===  '\r' && source[index] === '\n') {
                    ++index;
                }
            } else {
                cooked += ch;
            }
        }

        if (!terminated) {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        return {
            type: Token.Template,
            value: {
                cooked: cooked,
                raw: sliceSource(start + 1, index - ((tail) ? 1 : 2))
            },
            tail: tail,
            octal: octal,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    function scanTemplateElement(option) {
        var startsWith;

        buffer = null;
        skipComment();

        startsWith = (option.head) ? '`' : '}';

        if (source[index] !== startsWith) {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        return scanTemplate();
    }

    function scanRegExp() {
        var str = '', ch, start, pattern, flags, value, classMarker = false, restore, terminated = false;

        buffer = null;
        skipComment();

        start = index;
        ch = source[index];
        assert(ch === '/', 'Regular expression literal must start with a slash');
        str = nextChar();

        while (index < length) {
            ch = nextChar();
            str += ch;
            if (classMarker) {
                if (ch === ']') {
                    classMarker = false;
                }
            } else {
                if (ch === '\\') {
                    ch = nextChar();
                    // ECMA-262 7.8.5
                    if (isLineTerminator(ch)) {
                        throwError({}, Messages.UnterminatedRegExp);
                    }
                    str += ch;
                } else if (ch === '/') {
                    terminated = true;
                    break;
                } else if (ch === '[') {
                    classMarker = true;
                } else if (isLineTerminator(ch)) {
                    throwError({}, Messages.UnterminatedRegExp);
                }
            }
        }

        if (!terminated) {
            throwError({}, Messages.UnterminatedRegExp);
        }

        // Exclude leading and trailing slash.
        pattern = str.substr(1, str.length - 2);

        flags = '';
        while (index < length) {
            ch = source[index];
            if (!isIdentifierPart(ch)) {
                break;
            }

            ++index;
            if (ch === '\\' && index < length) {
                ch = source[index];
                if (ch === 'u') {
                    ++index;
                    restore = index;
                    ch = scanHexEscape('u');
                    if (ch) {
                        flags += ch;
                        str += '\\u';
                        for (; restore < index; ++restore) {
                            str += source[restore];
                        }
                    } else {
                        index = restore;
                        flags += 'u';
                        str += '\\u';
                    }
                } else {
                    str += '\\';
                }
            } else {
                flags += ch;
                str += ch;
            }
        }

        try {
            value = new RegExp(pattern, flags);
        } catch (e) {
            throwError({}, Messages.InvalidRegExp);
        }

        return {
            literal: str,
            value: value,
            range: [start, index]
        };
    }

    function isIdentifierName(token) {
        return token.type === Token.Identifier ||
            token.type === Token.Keyword ||
            token.type === Token.BooleanLiteral ||
            token.type === Token.NullLiteral ||
            token.type === Token.AtSymbol;
    }

    function advance() {
        var ch, token;

        skipComment();

        if (index >= length) {
            return {
                type: Token.EOF,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [index, index]
            };
        }

        token = scanPunctuator();
        if (typeof token !== 'undefined') {
            return token;
        }

        ch = source[index];

        if (ch === '\'' || ch === '"') {
            return scanStringLiteral();
        }

        if (ch === '.' || isDecimalDigit(ch)) {
            return scanNumericLiteral();
        }

        if (ch === '`') {
            return scanTemplate();
        }

        token = scanIdentifier();
        if (typeof token !== 'undefined') {
            return token;
        }

        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
    }

    function lex() {
        var token;

        if (buffer) {
            index = buffer.range[1];
            lineNumber = buffer.lineNumber;
            lineStart = buffer.lineStart;
            token = buffer;
            buffer = null;
            return token;
        }

        buffer = null;
        return advance();
    }

    function lookahead() {
        var pos, line, start;

        if (buffer !== null) {
            return buffer;
        }

        pos = index;
        line = lineNumber;
        start = lineStart;
        buffer = advance();
        index = pos;
        lineNumber = line;
        lineStart = start;

        return buffer;
    }

    function lookahead2() {
        var adv, pos, line, start, result;

        // If we are collecting the tokens, don't grab the next one yet.
        adv = (typeof extra.advance === 'function') ? extra.advance : advance;

        pos = index;
        line = lineNumber;
        start = lineStart;

        // Scan for the next immediate token.
        if (buffer === null) {
            buffer = adv();
        }
        index = buffer.range[1];
        lineNumber = buffer.lineNumber;
        lineStart = buffer.lineStart;

        // Grab the token right after.
        result = adv();
        index = pos;
        lineNumber = line;
        lineStart = start;

        return result;
    }

    // Return true if there is a line terminator before the next token.

    function peekLineTerminator() {
        var pos, line, start, found;

        pos = index;
        line = lineNumber;
        start = lineStart;
        skipComment();
        found = lineNumber !== line;
        index = pos;
        lineNumber = line;
        lineStart = start;

        return found;
    }

    // Throw an exception

    function throwError(token, messageFormat) {
        var error,
            args = Array.prototype.slice.call(arguments, 2),
            msg = messageFormat.replace(
                /%(\d)/g,
                function (whole, index) {
                    return args[index] || '';
                }
            );

        if (typeof token.lineNumber === 'number') {
            error = new Error('Line ' + token.lineNumber + ': ' + msg);
            error.index = token.range[0];
            error.lineNumber = token.lineNumber;
            error.column = token.range[0] - lineStart + 1;
        } else {
            error = new Error('Line ' + lineNumber + ': ' + msg);
            error.index = index;
            error.lineNumber = lineNumber;
            error.column = index - lineStart + 1;
        }

        throw error;
    }

    function throwErrorTolerant() {
        try {
            throwError.apply(null, arguments);
        } catch (e) {
            if (extra.errors) {
                extra.errors.push(e);
            } else {
                throw e;
            }
        }
    }


    // Throw an exception because of the token.

    function throwUnexpected(token) {
        if (token.type === Token.EOF) {
            throwError(token, Messages.UnexpectedEOS);
        }

        if (token.type === Token.NumericLiteral) {
            throwError(token, Messages.UnexpectedNumber);
        }

        if (token.type === Token.StringLiteral) {
            throwError(token, Messages.UnexpectedString);
        }

        if (token.type === Token.Identifier) {
            throwError(token, Messages.UnexpectedIdentifier);
        }

        if (token.type === Token.Keyword) {
            if (isFutureReservedWord(token.value)) {
                throwError(token, Messages.UnexpectedReserved);
            } else if (strict && isStrictModeReservedWord(token.value)) {
                throwErrorTolerant(token, Messages.StrictReservedWord);
                return;
            }
            throwError(token, Messages.UnexpectedToken, token.value);
        }

        if (token.type === Token.Template) {
            throwError(token, Messages.UnexpectedTemplate, token.value.raw);
        }

        if (token.type === Token.AtSymbol) {
            throwError(token, Messages.UnexpectedIdentifier);
        }

        // BooleanLiteral, NullLiteral, or Punctuator.
        throwError(token, Messages.UnexpectedToken, token.value);
    }

    // Expect the next token to match the specified punctuator.
    // If not, an exception will be thrown.

    function expect(value) {
        var token = lex();
        if (token.type !== Token.Punctuator || token.value !== value) {
            throwUnexpected(token);
        }
    }

    // Expect the next token to match the specified keyword.
    // If not, an exception will be thrown.

    function expectKeyword(keyword) {
        var token = lex();
        if (token.type !== Token.Keyword || token.value !== keyword) {
            throwUnexpected(token);
        }
    }

    // Return true if the next token matches the specified punctuator.

    function match(value) {
        var token = lookahead();
        return token.type === Token.Punctuator && token.value === value;
    }

    // Return true if the next token matches the specified keyword

    function matchKeyword(keyword) {
        var token = lookahead();
        return token.type === Token.Keyword && token.value === keyword;
    }


    // Return true if the next token matches the specified contextual keyword

    function matchContextualKeyword(keyword) {
        var token = lookahead();
        return token.value === keyword && token.type === Token.Identifier || token.type === Token.AtSymbol;
    }

    // Return true if the next token is an assignment operator

    function matchAssign() {
        var token = lookahead(),
            op = token.value;

        if (token.type !== Token.Punctuator) {
            return false;
        }
        return op === '=' ||
            op === '*=' ||
            op === '/=' ||
            op === '%=' ||
            op === '+=' ||
            op === '-=' ||
            op === '<<=' ||
            op === '>>=' ||
            op === '>>>=' ||
            op === '&=' ||
            op === '^=' ||
            op === '|=';
    }

    function consumeSemicolon() {
        var token, line;

        // Catch the very common case first.
        if (source[index] === ';') {
            lex();
            return;
        }

        line = lineNumber;
        skipComment();
        if (lineNumber !== line) {
            return;
        }

        if (match(';')) {
            lex();
            return;
        }

        token = lookahead();
        if (token.type !== Token.EOF && !match('}')) {
            throwUnexpected(token);
        }
        return;
    }

    // Return true if provided expression is LeftHandSideExpression

    function isLeftHandSide(expr) {
        return expr.type === Syntax.Identifier || expr.type === Syntax.MemberExpression;
    }

    function isAssignableLeftHandSide(expr) {
        return isLeftHandSide(expr) || expr.type === Syntax.ObjectPattern || expr.type === Syntax.ArrayPattern;
    }

    // 11.1.4 Array Initialiser

    function parseArrayInitialiser() {
        var elements = [], blocks = [], filter = null, token, tmp, possiblecomprehension = true, body;

        expect('[');
        while (!match(']')) {
            token = lookahead();
            switch (token.value) {
            case 'for':
                if (!possiblecomprehension) {
                    throwError({}, Messages.ComprehensionError);
                }
                matchKeyword('for');
                tmp = parseForStatement({ignore_body: true});
                tmp.of = tmp.type === Syntax.ForOfStatement;
                tmp.type = Syntax.ComprehensionBlock;
                if (tmp.left.kind) { // can't be let or const
                    throwError({}, Messages.ComprehensionError);
                }
                blocks.push(tmp);
                break;
            case 'if':
                if (!possiblecomprehension) {
                    throwError({}, Messages.ComprehensionError);
                }
                expectKeyword('if');
                expect('(');
                filter = parseExpression();
                expect(')');
                break;
            case ',':
                possiblecomprehension = false; // no longer allowed.
                lex();
                elements.push(null);
                break;
            default:
                tmp = parseSpreadOrAssignmentExpression();
                elements.push(tmp);
                if (tmp && tmp.type === Syntax.SpreadElement) {
                    if (!match(']')) {
                        throwError({}, Messages.ElementAfterSpreadElement);
                    }
                } else if (!(match(']') || matchKeyword('for') || matchKeyword('if'))) {
                    expect(','); // this lexes.
                    possiblecomprehension = false;
                }
            }
        }

        expect(']');

        if (filter && !blocks.length) {
            throwError({}, Messages.ComprehensionRequiresBlock);
        }

        if (blocks.length) {
            if (elements.length !== 1) {
                throwError({}, Messages.ComprehensionError);
            }
            return {
                type:  Syntax.ComprehensionExpression,
                filter: filter,
                blocks: blocks,
                body: elements[0]
            };
        } else {
            return {
                type: Syntax.ArrayExpression,
                elements: elements
            };
        }
    }

    // 11.1.5 Object Initialiser

    function parsePropertyFunction(options) {
        var previousStrict, previousYieldAllowed, params, body;

        previousStrict = strict;
        previousYieldAllowed = yieldAllowed;
        yieldAllowed = options.generator;
        params = options.params || [];

        body = parseConciseBody();
        if (options.name && strict && isRestrictedWord(params[0].name)) {
            throwErrorTolerant(options.name, Messages.StrictParamName);
        }
        if (yieldAllowed && !yieldFound) {
            throwError({}, Messages.NoYieldInGenerator);
        }
        strict = previousStrict;
        yieldAllowed = previousYieldAllowed;

        return {
            type: Syntax.FunctionExpression,
            id: null,
            params: params,
            defaults: options.defaults || [],
            body: body,
            rest: options.rest || null,
            generator: options.generator,
            expression: body.type !== Syntax.BlockStatement
        };
    }


    function parsePropertyMethodFunction(options) {
        var token, previousStrict, tmp, method, firstRestricted, message;

        previousStrict = strict;
        strict = true;

        tmp = parseParams();

        if (tmp.firstRestricted) {
            throwError(tmp.firstRestricted, tmp.message);
        }
        if (tmp.stricted) {
            throwErrorTolerant(tmp.stricted, tmp.message);
        }


        method = parsePropertyFunction({
            defaults: tmp.defaults,
            params: tmp.params,
            rest: tmp.rest,
            generator: options.generator
        });

        strict = previousStrict;

        return method;
    }


    function parseObjectPropertyKey() {
        var token = lex();

        // Note: This function is called only from parseObjectProperty(), where
        // EOF and Punctuator tokens are already filtered out.

        if (token.type === Token.StringLiteral || token.type === Token.NumericLiteral) {
            if (strict && token.octal) {
                throwErrorTolerant(token, Messages.StrictOctalLiteral);
            }
            return createLiteral(token);
        }

        if (token.type === Token.AtSymbol) {
            if (token.internal) {
                return {
                    internal: true,
                    type: Syntax.AtSymbol,
                    name: token.value
                };
            }
            return {
                type: Syntax.AtSymbol,
                name: token.value
            };
        }

        return {
            type: Syntax.Identifier,
            name: token.value
        };
    }

    function parseObjectProperty() {
        var token, key, id, param;

        token = lookahead();

        if (token.type === Token.Identifier || token.type === Token.AtSymbol) {

            id = parseObjectPropertyKey();

            // Property Assignment: Getter and Setter.

            if (token.value === 'get' && !(match(':') || match('('))) {
                key = parseObjectPropertyKey();
                expect('(');
                expect(')');
                return {
                    type: Syntax.Property,
                    key: key,
                    value: parsePropertyFunction({ generator: false }),
                    kind: 'get'
                };
            } else if (token.value === 'set' && !(match(':') || match('('))) {
                key = parseObjectPropertyKey();
                param = parseParams();
                param.name = token;
                param.generator = false;
                return {
                    type: Syntax.Property,
                    key: key,
                    value: parsePropertyFunction(param),
                    kind: 'set'
                };
            } else {
                if (match(':')) {
                    lex();
                    return {
                        type: Syntax.Property,
                        key: id,
                        value: parseAssignmentExpression(),
                        kind: 'init'
                    };
                } else if (match('(')) {
                    return {
                        type: Syntax.Property,
                        key: id,
                        value: parsePropertyMethodFunction({ generator: false }),
                        kind: 'init',
                        method: true
                    };
                } else {
                    return {
                        type: Syntax.Property,
                        key: id,
                        value: id,
                        kind: 'init',
                        shorthand: true
                    };
                }
            }
        } else if (token.type === Token.EOF || token.type === Token.Punctuator) {
            if (!match('*')) {
                throwUnexpected(token);
            }
            lex();

            id = parseObjectPropertyKey();

            if (!match('(')) {
                throwUnexpected(lex());
            }

            return {
                type: Syntax.Property,
                key: id,
                value: parsePropertyMethodFunction({ generator: true }),
                kind: 'init',
                method: true
            };
        } else {
            key = parseObjectPropertyKey();
            if (match(':')) {
                lex();
                return {
                    type: Syntax.Property,
                    key: key,
                    value: parseAssignmentExpression(),
                    kind: 'init'
                };
            } else if (match('(')) {
                return {
                    type: Syntax.Property,
                    key: key,
                    value: parsePropertyMethodFunction({ generator: false }),
                    kind: 'init',
                    method: true
                };
            }
            throwUnexpected(lex());
        }
    }

    function parseObjectInitialiser() {
        var properties = [], property, name, kind, map = {}, toString = String;

        expect('{');

        while (!match('}')) {
            property = parseObjectProperty();

            if (property.key.type === Syntax.Identifier || property.key.type === Syntax.AtSymbol) {
                name = property.key.name;
            } else {
                name = toString(property.key.value);
            }
            kind = (property.kind === 'init') ? PropertyKind.Data : (property.kind === 'get') ? PropertyKind.Get : PropertyKind.Set;
            if (Object.prototype.hasOwnProperty.call(map, name)) {
                if (map[name] === PropertyKind.Data) {
                    if (strict && kind === PropertyKind.Data) {
                        throwErrorTolerant({}, Messages.StrictDuplicateProperty);
                    } else if (kind !== PropertyKind.Data) {
                        throwErrorTolerant({}, Messages.AccessorDataProperty);
                    }
                } else {
                    if (kind === PropertyKind.Data) {
                        throwErrorTolerant({}, Messages.AccessorDataProperty);
                    } else if (map[name] & kind) {
                        throwErrorTolerant({}, Messages.AccessorGetSet);
                    }
                }
                map[name] |= kind;
            } else {
                map[name] = kind;
            }

            properties.push(property);

            if (!match('}')) {
                expect(',');
            }
        }

        expect('}');

        return {
            type: Syntax.ObjectExpression,
            properties: properties
        };
    }

    function parseTemplateElement(option) {
        var token = scanTemplateElement(option);
        if (strict && token.octal) {
            throwError(token, Messages.StrictOctalLiteral);
        }
        return {
            type: Syntax.TemplateElement,
            value: {
                raw: token.value.raw,
                cooked: token.value.cooked
            },
            tail: token.tail
        };
    }

    function parseTemplateLiteral() {
        var template, templates, expressions;

        template = parseTemplateElement({ head: true });
        templates = [ template ];
        expressions = [];

        while (!template.tail) {
            expressions.push(parseExpression());
            template = parseTemplateElement({ head: false });
            templates.push(template);
        }

        return {
            type: Syntax.TemplateLiteral,
            templates: templates,
            expressions: expressions
        };
    }

    // 11.1.6 The Grouping Operator

    function parseGroupExpression() {
        var expr;

        expect('(');

        ++state.parenthesizedCount;

        state.allowArrowFunction = !state.allowArrowFunction;
        expr = parseExpression();
        state.allowArrowFunction = false;

        if (expr.type !== Syntax.ArrowFunctionExpression) {
            expect(')');
        }

        return expr;
    }


    // 11.1 Primary Expressions

    function parsePrimaryExpression() {
        var expr,
            token = lookahead(),
            type = token.type;

        if (type === Token.Identifier) {
            return {
                type: Syntax.Identifier,
                name: lex().value
            };
        }

        if (type === Token.StringLiteral || type === Token.NumericLiteral) {
            if (strict && token.octal) {
                throwErrorTolerant(token, Messages.StrictOctalLiteral);
            }
            return createLiteral(lex());
        }

        if (type === Token.Keyword) {
            if (matchKeyword('this')) {
                lex();
                return {
                    type: Syntax.ThisExpression
                };
            }

            if (matchKeyword('function')) {
                return parseFunctionExpression();
            }

            if (matchKeyword('class')) {
                return parseClassExpression();
            }

            if (matchKeyword('super')) {
                lex();
                return {
                    type: Syntax.Identifier,
                    name: 'super'
                };
            }
        }

        if (type === Token.BooleanLiteral) {
            lex();
            token.value = (token.value === 'true');
            return createLiteral(token);
        }

        if (type === Token.NullLiteral) {
            lex();
            token.value = null;
            return createLiteral(token);
        }

        if (match('[')) {
            return parseArrayInitialiser();
        }

        if (match('{')) {
            return parseObjectInitialiser();
        }

        if (match('(')) {
            return parseGroupExpression();
        }

        if (match('/') || match('/=')) {
            return createLiteral(scanRegExp());
        }

        if (type === Token.Template) {
            return parseTemplateLiteral();
        }

        if (type === Token.AtSymbol) {
            return {
                internal: token.internal,
                type: Syntax.AtSymbol,
                name: lex().value
            };
        }

        return throwUnexpected(lex());
    }

    // 11.2 Left-Hand-Side Expressions

    function parseArguments() {
        var args = [], arg;

        expect('(');

        if (!match(')')) {
            while (index < length) {
                arg = parseSpreadOrAssignmentExpression();
                args.push(arg);

                if (match(')')) {
                    break;
                } else if (arg.type === Syntax.SpreadElement) {
                    throwError({}, Messages.ElementAfterSpreadElement);
                }

                expect(',');
            }
        }

        expect(')');

        return args;
    }

    function parseSpreadOrAssignmentExpression() {
        if (match('...')) {
            lex();
            return {
                type: Syntax.SpreadElement,
                argument: parseAssignmentExpression()
            };
        } else {
            return parseAssignmentExpression();
        }
    }

    function parseNonComputedProperty() {
        var token = lex();

        if (!isIdentifierName(token)) {
            throwUnexpected(token);
        }

        if (token.type === Token.AtSymbol) {
            return {
                internal: token.internal,
                type: Syntax.AtSymbol,
                name: token.value
            };
        }

        return {
            type: Syntax.Identifier,
            name: token.value
        };
    }

    function parseNonComputedMember() {
        expect('.');

        return parseNonComputedProperty();
    }

    function parseComputedMember() {
        var expr;

        expect('[');

        expr = parseExpression();

        expect(']');

        return expr;
    }

    function parseNewExpression() {
        var expr;

        expectKeyword('new');

        expr = {
            type: Syntax.NewExpression,
            callee: parseLeftHandSideExpression(),
            'arguments': []
        };

        if (match('(')) {
            expr['arguments'] = parseArguments();
        }

        return expr;
    }

    function parseLeftHandSideExpressionAllowCall() {
        var expr;

        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();

        while (match('.') || match('[') || match('(') || lookahead().type === Token.Template) {
            if (match('(')) {
                expr = {
                    type: Syntax.CallExpression,
                    callee: expr,
                    'arguments': parseArguments()
                };
            } else if (match('[')) {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: true,
                    object: expr,
                    property: parseComputedMember()
                };
            } else if (match('.')) {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: false,
                    object: expr,
                    property: parseNonComputedMember()
                };
            } else {
                expr = {
                    type: Syntax.TaggedTemplateExpression,
                    tag: expr,
                    template: parseTemplateLiteral()
                };
            }
        }

        return expr;
    }


    function parseLeftHandSideExpression() {
        var expr;

        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();

        while (match('.') || match('[') || lookahead().type === Token.Template) {
            if (match('[')) {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: true,
                    object: expr,
                    property: parseComputedMember()
                };
            } else if (match('.')) {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: false,
                    object: expr,
                    property: parseNonComputedMember()
                };
            } else {
                expr = {
                    type: Syntax.TaggedTemplateExpression,
                    tag: expr,
                    template: parseTemplateLiteral()
                };
            }
        }

        return expr;
    }

    // 11.3 Postfix Expressions

    function parsePostfixExpression() {
        var expr = parseLeftHandSideExpressionAllowCall(),
            token = lookahead();

        if (token.type !== Token.Punctuator) {
            return expr;
        }

        if ((match('++') || match('--')) && !peekLineTerminator()) {
            // 11.3.1, 11.3.2
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                throwErrorTolerant({}, Messages.StrictLHSPostfix);
            }

            if (!isLeftHandSide(expr)) {
                throwError({}, Messages.InvalidLHSInAssignment);
            }

            expr = {
                type: Syntax.UpdateExpression,
                operator: lex().value,
                argument: expr,
                prefix: false
            };
        }

        return expr;
    }

    // 11.4 Unary Operators

    function parseUnaryExpression() {
        var token, expr;

        token = lookahead();
        if (token.type !== Token.Punctuator && token.type !== Token.Keyword) {
            return parsePostfixExpression();
        }

        if (match('++') || match('--')) {
            token = lex();
            expr = parseUnaryExpression();
            // 11.4.4, 11.4.5
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                throwErrorTolerant({}, Messages.StrictLHSPrefix);
            }

            if (!isLeftHandSide(expr)) {
                throwError({}, Messages.InvalidLHSInAssignment);
            }

            expr = {
                type: Syntax.UpdateExpression,
                operator: token.value,
                argument: expr,
                prefix: true
            };
            return expr;
        }

        if (match('+') || match('-') || match('~') || match('!')) {
            expr = {
                type: Syntax.UnaryExpression,
                operator: lex().value,
                argument: parseUnaryExpression()
            };
            return expr;
        }

        if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
            expr = {
                type: Syntax.UnaryExpression,
                operator: lex().value,
                argument: parseUnaryExpression()
            };
            if (strict && expr.operator === 'delete' && expr.argument.type === Syntax.Identifier) {
                throwErrorTolerant({}, Messages.StrictDelete);
            }
            return expr;
        }

        return parsePostfixExpression();
    }

    // 11.5 Multiplicative Operators

    function parseMultiplicativeExpression() {
        var expr = parseUnaryExpression();

        while (match('*') || match('/') || match('%')) {
            expr = {
                type: Syntax.BinaryExpression,
                operator: lex().value,
                left: expr,
                right: parseUnaryExpression()
            };
        }

        return expr;
    }

    // 11.6 Additive Operators

    function parseAdditiveExpression() {
        var expr = parseMultiplicativeExpression();

        while (match('+') || match('-')) {
            expr = {
                type: Syntax.BinaryExpression,
                operator: lex().value,
                left: expr,
                right: parseMultiplicativeExpression()
            };
        }

        return expr;
    }

    // 11.7 Bitwise Shift Operators

    function parseShiftExpression() {
        var expr = parseAdditiveExpression();

        while (match('<<') || match('>>') || match('>>>')) {
            expr = {
                type: Syntax.BinaryExpression,
                operator: lex().value,
                left: expr,
                right: parseAdditiveExpression()
            };
        }

        return expr;
    }
    // 11.8 Relational Operators

    function parseRelationalExpression() {
        var expr, previousAllowIn;

        previousAllowIn = state.allowIn;
        state.allowIn = true;

        expr = parseShiftExpression();

        while (match('<') || match('>') || match('<=') || match('>=') || (previousAllowIn && matchKeyword('in')) || matchKeyword('instanceof')) {
            expr = {
                type: Syntax.BinaryExpression,
                operator: lex().value,
                left: expr,
                right: parseShiftExpression()
            };
        }

        state.allowIn = previousAllowIn;
        return expr;
    }

    // 11.9 Equality Operators

    function parseEqualityExpression() {
        var expr = parseRelationalExpression();

        while ((!peekLineTerminator() && (matchContextualKeyword('is') || matchContextualKeyword('isnt'))) || match('==') || match('!=') || match('===') || match('!==')) {
            expr = {
                type: Syntax.BinaryExpression,
                operator: lex().value,
                left: expr,
                right: parseRelationalExpression()
            };
        }

        return expr;
    }

    // 11.10 Binary Bitwise Operators

    function parseBitwiseANDExpression() {
        var expr = parseEqualityExpression();

        while (match('&')) {
            lex();
            expr = {
                type: Syntax.BinaryExpression,
                operator: '&',
                left: expr,
                right: parseEqualityExpression()
            };
        }

        return expr;
    }

    function parseBitwiseXORExpression() {
        var expr = parseBitwiseANDExpression();

        while (match('^')) {
            lex();
            expr = {
                type: Syntax.BinaryExpression,
                operator: '^',
                left: expr,
                right: parseBitwiseANDExpression()
            };
        }

        return expr;
    }

    function parseBitwiseORExpression() {
        var expr = parseBitwiseXORExpression();

        while (match('|')) {
            lex();
            expr = {
                type: Syntax.BinaryExpression,
                operator: '|',
                left: expr,
                right: parseBitwiseXORExpression()
            };
        }

        return expr;
    }

    // 11.11 Binary Logical Operators

    function parseLogicalANDExpression() {
        var expr = parseBitwiseORExpression();

        while (match('&&')) {
            lex();
            expr = {
                type: Syntax.LogicalExpression,
                operator: '&&',
                left: expr,
                right: parseBitwiseORExpression()
            };
        }

        return expr;
    }

    function parseLogicalORExpression() {
        var expr = parseLogicalANDExpression();

        while (match('||')) {
            lex();
            expr = {
                type: Syntax.LogicalExpression,
                operator: '||',
                left: expr,
                right: parseLogicalANDExpression()
            };
        }

        return expr;
    }

    // 11.12 Conditional Operator

    function parseConditionalExpression() {
        var expr, previousAllowIn, consequent;

        expr = parseLogicalORExpression();

        if (match('?')) {
            lex();
            previousAllowIn = state.allowIn;
            state.allowIn = true;
            consequent = parseAssignmentExpression();
            state.allowIn = previousAllowIn;
            expect(':');

            expr = {
                type: Syntax.ConditionalExpression,
                test: expr,
                consequent: consequent,
                alternate: parseAssignmentExpression()
            };
        }

        return expr;
    }

    // 11.13 Assignment Operators

    function reinterpretAsAssignmentBindingPattern(expr) {
        var i, len, property, element;

        if (expr.type === Syntax.ObjectExpression) {
            expr.type = Syntax.ObjectPattern;
            for (i = 0, len = expr.properties.length; i < len; i += 1) {
                property = expr.properties[i];
                if (property.kind !== 'init') {
                    throwError({}, Messages.InvalidLHSInAssignment);
                }
                reinterpretAsAssignmentBindingPattern(property.value);
            }
        } else if (expr.type === Syntax.ArrayExpression) {
            expr.type = Syntax.ArrayPattern;
            for (i = 0, len = expr.elements.length; i < len; i += 1) {
                element = expr.elements[i];
                if (element) {
                    reinterpretAsAssignmentBindingPattern(element);
                }
            }
        } else if (expr.type === Syntax.Identifier) {
            if (isRestrictedWord(expr.name)) {
                throwError({}, Messages.InvalidLHSInAssignment);
            }
        } else if (expr.type === Syntax.SpreadElement) {
            reinterpretAsAssignmentBindingPattern(expr.argument);
            if (expr.argument.type === Syntax.ObjectPattern) {
                throwError({}, Messages.ObjectPatternAsSpread);
            }
        } else {
            if (expr.type !== Syntax.MemberExpression && expr.type !== Syntax.CallExpression && expr.type !== Syntax.NewExpression) {
                throwError({}, Messages.InvalidLHSInAssignment);
            }
        }
    }


    function reinterpretAsDestructuredParameter(options, expr) {
        var i, len, property, element;

        if (expr.type === Syntax.ObjectExpression || expr.type === Syntax.ObjectPattern) {
            expr.type = Syntax.ObjectPattern;
            for (i = 0, len = expr.properties.length; i < len; i += 1) {
                property = expr.properties[i];
                if (property.kind !== 'init') {
                    throwError({}, Messages.InvalidLHSInFormalsList);
                }
                reinterpretAsDestructuredParameter(options, property.value);
            }
        } else if (expr.type === Syntax.ArrayExpression || expr.type === Syntax.ArrayPattern) {
            expr.type = Syntax.ArrayPattern;
            for (i = 0, len = expr.elements.length; i < len; i += 1) {
                element = expr.elements[i];
                if (element) {
                    reinterpretAsDestructuredParameter(options, element);
                }
            }
        } else if (expr.type === Syntax.Identifier) {
            validateParam(options, expr, expr.name);
        } else {
            if (expr.type !== Syntax.MemberExpression) {
                throwError({}, Messages.InvalidLHSInFormalsList);
            }
        }
    }

    function reinterpretAsCoverFormalsList(expressions) {
        var i, len, param, params, options, rest, defaults;

        params = [];
        defaults = [];
        rest = null;
        options = {
            paramSet: {}
        };

        for (i = 0, len = expressions.length; i < len; i += 1) {
            param = expressions[i];
            if (param.type === Syntax.AssignmentExpression && param.operator === '=') {
                defaults.push(param.right);
                param = param.left;
            } else if (defaults.length && param.type !== Syntax.SpreadElement) {
                throwErrorTolerant({}, Messages.DefaultsNotLast);
            }

            if (param.type === Syntax.Identifier) {
                params.push(param);
                validateParam(options, param, param.name);
            } else if (param.type === Syntax.ObjectPattern || param.type === Syntax.ArrayPattern) {
                reinterpretAsDestructuredParameter(options, param);
                params.push(param);
            } else if (param.type === Syntax.ObjectExpression || param.type === Syntax.ArrayExpression) {
                reinterpretAsDestructuredParameter(options, param);
                params.push(param);
            } else if (param.type === Syntax.SpreadElement) {
                if (i !== len - 1) {
                    throwErrorTolerant({}, Messages.ParameterAfterRestParameter);
                }
                reinterpretAsDestructuredParameter(options, param.argument);
                rest = param.argument;
            } else {
                return null;
            }
        }

        if (options.firstRestricted) {
            throwError(options.firstRestricted, options.message);
        }
        if (options.stricted) {
            throwErrorTolerant(options.stricted, options.message);
        }

        return { params: params, rest: rest, defaults: defaults };
    }

    function parseArrowFunctionExpression(options) {
        var previousStrict, previousYieldAllowed, body;

        expect('=>');

        previousStrict = strict;
        previousYieldAllowed = yieldAllowed;
        strict = true;
        yieldAllowed = false;
        body = parseConciseBody();
        strict = previousStrict;
        yieldAllowed = previousYieldAllowed;

        return {
            type: Syntax.ArrowFunctionExpression,
            id: null,
            params: options.params,
            defaults: options.defaults || [],
            body: body,
            rest: options.rest,
            generator: false,
            expression: body.type !== Syntax.BlockStatement
        };
    }

    function parseAssignmentExpression() {
        var expr, token, params, oldParenthesizedCount, coverFormalsList;

        if (matchKeyword('yield')) {
            return parseYieldExpression();
        }

        oldParenthesizedCount = state.parenthesizedCount;

        if (match('(')) {
            token = lookahead2();
            if (token.type === Token.Punctuator && token.value === ')' || token.value === '...') {
                params = parseParams();
                if (!match('=>')) {
                    throwUnexpected(lex());
                }
                return parseArrowFunctionExpression(params);
            }
        }

        token = lookahead();
        expr = parseConditionalExpression();

        if (match('=>') && expr.type === Syntax.Identifier) {
            if (state.parenthesizedCount === oldParenthesizedCount || state.parenthesizedCount === (oldParenthesizedCount + 1)) {
                if (isRestrictedWord(expr.name)) {
                    throwError({}, Messages.StrictParamName);
                }
                return parseArrowFunctionExpression({ params: [ expr ], rest: null });
            }
        }

        if (matchAssign()) {
            // 11.13.1
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                throwErrorTolerant(token, Messages.StrictLHSAssignment);
            }

            // ES.next draf 11.13 Runtime Semantics step 1
            if (match('=') && (expr.type === Syntax.ObjectExpression || expr.type === Syntax.ArrayExpression)) {
                reinterpretAsAssignmentBindingPattern(expr);
            } else if (!isLeftHandSide(expr)) {
                throwError({}, Messages.InvalidLHSInAssignment);
            }

            expr = {
                type: Syntax.AssignmentExpression,
                operator: lex().value,
                left: expr,
                right: parseAssignmentExpression()
            };
        }

        return expr;
    }

    // 11.14 Comma Operator

    function parseExpression() {
        var expr, sequence, coverFormalsList, spreadFound, token;

        expr = parseAssignmentExpression();

        if (match(',')) {
            sequence = {
                type: Syntax.SequenceExpression,
                expressions: [ expr ]
            };

            while (index < length) {
                if (!match(',')) {
                    break;
                }

                lex();
                expr = parseSpreadOrAssignmentExpression();
                sequence.expressions.push(expr);

                if (expr.type === Syntax.SpreadElement) {
                    spreadFound = true;
                    if (!match(')')) {
                        throwError({}, Messages.ElementAfterSpreadElement);
                    }
                    break;
                }
            }
        }

        if (state.allowArrowFunction && match(')')) {
            token = lookahead2();
            if (token.value === '=>') {
                lex();

                state.allowArrowFunction = false;
                expr = sequence ? sequence.expressions : [ expr ];
                coverFormalsList = reinterpretAsCoverFormalsList(expr);
                if (coverFormalsList) {
                    return parseArrowFunctionExpression(coverFormalsList);
                }

                throwUnexpected(token);
            }
        }

        if (spreadFound) {
            throwError({}, Messages.IllegalSpread);
        }

        return sequence || expr;
    }

    // 12.1 Block

    function parseStatementList() {
        var list = [],
            statement;

        while (index < length) {
            if (match('}')) {
                break;
            }
            statement = parseSourceElement();
            if (typeof statement === 'undefined') {
                break;
            }
            list.push(statement);
        }

        return list;
    }

    function parseBlock() {
        var block;

        expect('{');

        block = parseStatementList();

        expect('}');

        return {
            type: Syntax.BlockStatement,
            body: block
        };
    }

    // 12.2 Variable Statement

    function parseVariableIdentifier() {
        var token = lex();

        if (token.type !== Token.Identifier) {
            throwUnexpected(token);
        }

        return {
            type: Syntax.Identifier,
            name: token.value
        };
    }


    function parseVariableDeclaration(kind) {
        var id,
            init = null;
        if (match('{')) {
            id = parseObjectInitialiser();
            reinterpretAsAssignmentBindingPattern(id);
        } else if (match('[')) {
            id = parseArrayInitialiser();
            reinterpretAsAssignmentBindingPattern(id);
        } else {
            id = parseVariableIdentifier();
            // 12.2.1
            if (strict && isRestrictedWord(id.name)) {
                throwErrorTolerant({}, Messages.StrictVarName);
            }
        }

        if (kind === 'const') {
            if (!match('=')) {
                throwError({}, Messages.NoUnintializedConst);
            }
            expect('=');
            init = parseAssignmentExpression();
        } else if (match('=')) {
            lex();
            init = parseAssignmentExpression();
        }

        return {
            type: Syntax.VariableDeclarator,
            id: id,
            init: init
        };
    }

    function parseVariableDeclarationList(kind) {
        var list = [];

        while (index < length) {
            list.push(parseVariableDeclaration(kind));
            if (!match(',')) {
                break;
            }
            lex();
        }

        return list;
    }

    function parseVariableStatement() {
        var declarations;

        expectKeyword('var');

        declarations = parseVariableDeclarationList();

        consumeSemicolon();

        return {
            type: Syntax.VariableDeclaration,
            declarations: declarations,
            kind: 'var'
        };
    }

    // kind may be `const` or `let`
    // Both are experimental and not in the specification yet.
    // see http://wiki.ecmascript.org/doku.php?id=harmony:const
    // and http://wiki.ecmascript.org/doku.php?id=harmony:let
    function parseConstLetDeclaration(kind) {
        var declarations;

        expectKeyword(kind);

        declarations = parseVariableDeclarationList(kind);

        consumeSemicolon();

        return {
            type: Syntax.VariableDeclaration,
            declarations: declarations,
            kind: kind
        };
    }


    function parseAtSymbol() {
        var token = lex();

        if (token.type !== Token.AtSymbol) {
            throwUnexpected(token);
        }

        return {
            internal: token.internal,
            type: Syntax.AtSymbol,
            name: token.value
        };
    }

    function parsePrivateStatement() {
        var declarations;

        expectKeyword('private');

        declarations = parseSymbolDeclarationList();

        consumeSemicolon();

        return {
            type: Syntax.SymbolDeclaration,
            declarations: declarations,
            kind: 'private'
        };
    }

    function parseSymbolStatement() {
        var declarations;

        matchContextualKeyword('symbol');
        lex();


        declarations = parseSymbolDeclarationList();

        consumeSemicolon();

        return {
            type: Syntax.SymbolDeclaration,
            declarations: declarations,
            kind: 'symbol'
        };
    }

    function parseSymbolDeclarationList() {
        var list = [];

        while (index < length) {
            list.push(parseSymbolDeclaration());
            if (!match(',')) {
                break;
            }
            lex();
        }

        return list;
    }

    function parseSymbolDeclaration() {
        var id, init = null;

        id = parseAtSymbol();

        if (match('=')) {
            lex();
            init = parseAssignmentExpression();
        }

        return {
            type: Syntax.SymbolDeclarator,
            id: id,
            init: init
        };
    }


    // http://wiki.ecmascript.org/doku.php?id=harmony:modules

    function parsePath() {
        var result, id;

        result = {
            type: Syntax.Path,
            body: []
        };

        while (true) {
            if (lookahead().type === Token.AtSymbol) {
                id = parseAtSymbol();
            } else {
                id = parseVariableIdentifier();
            }
            result.body.push(id);
            if (!match('.')) {
                break;
            }
            lex();
        }

        return result;
    }

    function parseGlob() {
        expect('*');
        return {
            type: Syntax.Glob
        };
    }

    function parseModuleDeclaration() {
        var id, token, declaration;

        lex();

        id = parseVariableIdentifier();

        if (match('{')) {
            return {
                type: Syntax.ModuleDeclaration,
                id: id,
                body: parseModuleBlock()
            };
        }

        expect('=');

        token = lookahead();
        if (token.type === Token.StringLiteral) {
            declaration = {
                type: Syntax.ModuleDeclaration,
                id: id,
                from: parsePrimaryExpression()
            };
        } else {
            declaration = {
                type: Syntax.ModuleDeclaration,
                id: id,
                from: parsePath()
            };
        }

        consumeSemicolon();

        return declaration;
    }

    function parseExportSpecifierSetProperty() {
        var specifier;

        specifier = {
            type: Syntax.ExportSpecifier,
            id: parseVariableIdentifier(),
            from: null
        };

        if (match(':')) {
            lex();
            specifier.from = parsePath();
        }

        return specifier;
    }

    function parseExportSpecifier() {
        var specifier, specifiers;

        if (match('{')) {
            lex();
            specifiers = [];

            do {
                specifiers.push(parseExportSpecifierSetProperty());
            } while (match(',') && lex());

            expect('}');

            return {
                type: Syntax.ExportSpecifierSet,
                specifiers: specifiers
            };
        }

        if (match('*')) {
            specifier = {
                type: Syntax.ExportSpecifier,
                id: parseGlob(),
                from: null
            };

            if (matchContextualKeyword('from')) {
                lex();
                specifier.from = parsePath();
            }
        } else {
            specifier = {
                type: Syntax.ExportSpecifier,
                id: parseVariableIdentifier(),
                from: null
            };
        }
        return specifier;
    }

    function parseExportDeclaration() {
        var token, specifiers, key, param, expression;

        expectKeyword('export');

        token = lookahead();

        if (token.type === Token.Keyword || (token.type === Token.Identifier && token.value === 'module')) {
            switch (token.value) {
            case 'function':
                return {
                    type: Syntax.ExportDeclaration,
                    declaration: parseFunctionDeclaration()
                };
            case 'module':
                return {
                    type: Syntax.ExportDeclaration,
                    declaration: parseModuleDeclaration()
                };
            case 'let':
            case 'const':
                return {
                    type: Syntax.ExportDeclaration,
                    declaration: parseConstLetDeclaration(token.value)
                };
            case 'var':
                return {
                    type: Syntax.ExportDeclaration,
                    declaration: parseStatement()
                };
            case 'class':
                return {
                    type: Syntax.ExportDeclaration,
                    declaration: parseClassDeclaration()
                };
            }

            throwUnexpected(lex());
        }

        if (token.type === Token.Identifier && token.value === 'get' || token.value === 'set') {
            lex();
            key = parseObjectPropertyKey();

            if (token.value === 'get') {
                expect('(');
                expect(')');
                return {
                    type: Syntax.ExportDeclaration,
                    kind: 'get',
                    key: key,
                    value: parsePropertyFunction({ generator: false })
                };
            } else {
                param = parseParams();
                param.name = token;
                param.generator = false;
                return {
                    type: Syntax.ExportDeclaration,
                    kind: 'set',
                    key: key,
                    value: parsePropertyFunction(param)
                };
            }
        }

        if (token.type === Token.Punctuator && token.value === '=') {
            lex();
            expression = parseExpression();
            expect(';');
            return {
                type: Syntax.ExportDeclaration,
                value: expression
            };
        }

        specifiers = [ parseExportSpecifier() ];
        if (match(',')) {
            while (index < length) {
                if (!match(',')) {
                    break;
                }
                lex();
                specifiers.push(parseExportSpecifier());
            }
        }

        consumeSemicolon();

        return {
            type: Syntax.ExportDeclaration,
            specifiers: specifiers
        };
    }

    function parseImportDeclaration() {
        var specifiers, from;

        expectKeyword('import');

        if (match('*')) {
            specifiers = [parseGlob()];
        } else if (match('{')) {
            lex();
            specifiers = [];

            do {
                specifiers.push(parseImportSpecifier());
            } while (match(',') && lex());

            expect('}');
        } else {
            specifiers = [parseVariableIdentifier()];
        }

        if (!matchContextualKeyword('from')) {
            throwError({}, Messages.NoFromAfterImport);
        }

        lex();

        if (lookahead().type === Token.StringLiteral) {
            from = parsePrimaryExpression();
        } else {
            from = parsePath();
        }

        consumeSemicolon();

        return {
            type: Syntax.ImportDeclaration,
            specifiers: specifiers,
            from: from
        };
    }

    function parseImportSpecifier() {
        var id, specifier;

        if (lookahead().type === Token.AtSymbol) {
            id = parseAtSymbol();
        } else {
            id = parseVariableIdentifier();
        }

        specifier = {
            type: Syntax.ImportSpecifier,
            id: id,
            from: null
        };

        if (match(':')) {
            lex();
            specifier.from = parsePath();
        }

        return specifier;
    }

    // 12.3 Empty Statement

    function parseEmptyStatement() {
        expect(';');

        return {
            type: Syntax.EmptyStatement
        };
    }

    // 12.4 Expression Statement

    function parseExpressionStatement() {
        var expr = parseExpression();

        consumeSemicolon();

        return {
            type: Syntax.ExpressionStatement,
            expression: expr
        };
    }

    // 12.5 If statement

    function parseIfStatement() {
        var test, consequent, alternate;

        expectKeyword('if');

        expect('(');

        test = parseExpression();

        expect(')');

        consequent = parseStatement();

        if (matchKeyword('else')) {
            lex();
            alternate = parseStatement();
        } else {
            alternate = null;
        }

        return {
            type: Syntax.IfStatement,
            test: test,
            consequent: consequent,
            alternate: alternate
        };
    }

    // 12.6 Iteration Statements

    function parseDoWhileStatement() {
        var body, test, oldInIteration;

        expectKeyword('do');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        if (match(';')) {
            lex();
        }

        return {
            type: Syntax.DoWhileStatement,
            body: body,
            test: test
        };
    }

    function parseWhileStatement() {
        var test, body, oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        return {
            type: Syntax.WhileStatement,
            test: test,
            body: body
        };
    }

    function parseForVariableDeclaration() {
        var token = lex();

        return {
            type: Syntax.VariableDeclaration,
            declarations: parseVariableDeclarationList(),
            kind: token.value
        };
    }

    function parseForStatement(opts) {
        var init, test, update, left, right, body, operator, oldInIteration;
        init = test = update = null;
        expectKeyword('for');

        // http://wiki.ecmascript.org/doku.php?id=proposals:iterators_and_generators&s=each
        if (matchContextualKeyword("each")) {
            lex();//throwError({}, Messages.EachNotAllowed);
        }

        expect('(');

        if (match(';')) {
            lex();
        } else {
            if (matchKeyword('var') || matchKeyword('let') || matchKeyword('const')) {
                state.allowIn = false;
                init = parseForVariableDeclaration();
                state.allowIn = true;

                if (init.declarations.length === 1) {
                    if (matchKeyword('in') || matchContextualKeyword('of')) {
                        operator = lookahead();
                        if (!((operator.value === 'in' || init.kind !== 'var') && init.declarations[0].init)) {
                            lex();
                            left = init;
                            right = parseExpression();
                            init = null;
                        }
                    }
                }
            } else {
                state.allowIn = false;
                init = parseExpression();
                state.allowIn = true;

                if (matchContextualKeyword('of')) {
                    operator = lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                } else if (matchKeyword('in')) {
                    // LeftHandSideExpression
                    if (!isAssignableLeftHandSide(init)) {
                        throwError({}, Messages.InvalidLHSInForIn);
                    }
                    operator = lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                }
            }

            if (typeof left === 'undefined') {
                expect(';');
            }
        }

        if (typeof left === 'undefined') {

            if (!match(';')) {
                test = parseExpression();
            }
            expect(';');

            if (!match(')')) {
                update = parseExpression();
            }
        }

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        if (!(opts !== undefined && opts.ignore_body)) {
            body = parseStatement();
        }

        state.inIteration = oldInIteration;

        if (typeof left === 'undefined') {
            return {
                type: Syntax.ForStatement,
                init: init,
                test: test,
                update: update,
                body: body
            };
        }

        if (operator.value === 'in') {
            return {
                type: Syntax.ForInStatement,
                left: left,
                right: right,
                body: body,
                each: false
            };
        } else {
            return {
                type: Syntax.ForOfStatement,
                left: left,
                right: right,
                body: body
            };
        }
    }

    // 12.7 The continue statement

    function parseContinueStatement() {
        var token, label = null;

        expectKeyword('continue');

        // Optimize the most common form: 'continue;'.
        if (source[index] === ';') {
            lex();

            if (!state.inIteration) {
                throwError({}, Messages.IllegalContinue);
            }

            return {
                type: Syntax.ContinueStatement,
                label: null
            };
        }

        if (peekLineTerminator()) {
            if (!state.inIteration) {
                throwError({}, Messages.IllegalContinue);
            }

            return {
                type: Syntax.ContinueStatement,
                label: null
            };
        }

        token = lookahead();
        if (token.type === Token.Identifier) {
            label = parseVariableIdentifier();

            if (!Object.prototype.hasOwnProperty.call(state.labelSet, label.name)) {
                throwError({}, Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !state.inIteration) {
            throwError({}, Messages.IllegalContinue);
        }

        return {
            type: Syntax.ContinueStatement,
            label: label
        };
    }

    // 12.8 The break statement

    function parseBreakStatement() {
        var token, label = null;

        expectKeyword('break');

        // Optimize the most common form: 'break;'.
        if (source[index] === ';') {
            lex();

            if (!(state.inIteration || state.inSwitch)) {
                throwError({}, Messages.IllegalBreak);
            }

            return {
                type: Syntax.BreakStatement,
                label: null
            };
        }

        if (peekLineTerminator()) {
            if (!(state.inIteration || state.inSwitch)) {
                throwError({}, Messages.IllegalBreak);
            }

            return {
                type: Syntax.BreakStatement,
                label: null
            };
        }

        token = lookahead();
        if (token.type === Token.Identifier) {
            label = parseVariableIdentifier();

            if (!Object.prototype.hasOwnProperty.call(state.labelSet, label.name)) {
                throwError({}, Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !(state.inIteration || state.inSwitch)) {
            throwError({}, Messages.IllegalBreak);
        }

        return {
            type: Syntax.BreakStatement,
            label: label
        };
    }

    // 12.9 The return statement

    function parseReturnStatement() {
        var token, argument = null;

        expectKeyword('return');

        if (!state.inFunctionBody) {
            throwErrorTolerant({}, Messages.IllegalReturn);
        }

        // 'return' followed by a space and an identifier is very common.
        if (source[index] === ' ') {
            if (isIdentifierStart(source[index + 1])) {
                argument = parseExpression();
                consumeSemicolon();
                return {
                    type: Syntax.ReturnStatement,
                    argument: argument
                };
            }
        }

        if (peekLineTerminator()) {
            return {
                type: Syntax.ReturnStatement,
                argument: null
            };
        }

        if (!match(';')) {
            token = lookahead();
            if (!match('}') && token.type !== Token.EOF) {
                argument = parseExpression();
            }
        }

        consumeSemicolon();

        return {
            type: Syntax.ReturnStatement,
            argument: argument
        };
    }

    // 12.10 The with statement

    function parseWithStatement() {
        var object, body;

        if (strict) {
            throwErrorTolerant({}, Messages.StrictModeWith);
        }

        expectKeyword('with');

        expect('(');

        object = parseExpression();

        expect(')');

        body = parseStatement();

        return {
            type: Syntax.WithStatement,
            object: object,
            body: body
        };
    }

    // 12.10 The swith statement

    function parseSwitchCase() {
        var test,
            consequent = [],
            statement;

        if (matchKeyword('default')) {
            lex();
            test = null;
        } else {
            expectKeyword('case');
            test = parseExpression();
        }
        expect(':');

        while (index < length) {
            if (match('}') || matchKeyword('default') || matchKeyword('case')) {
                break;
            }
            statement = parseSourceElement();
            if (typeof statement === 'undefined') {
                break;
            }
            consequent.push(statement);
        }

        return {
            type: Syntax.SwitchCase,
            test: test,
            consequent: consequent
        };
    }

    function parseSwitchStatement() {
        var discriminant, cases, clause, oldInSwitch, defaultFound;

        expectKeyword('switch');

        expect('(');

        discriminant = parseExpression();

        expect(')');

        expect('{');

        if (match('}')) {
            lex();
            return {
                type: Syntax.SwitchStatement,
                discriminant: discriminant
            };
        }

        cases = [];

        oldInSwitch = state.inSwitch;
        state.inSwitch = true;
        defaultFound = false;

        while (index < length) {
            if (match('}')) {
                break;
            }
            clause = parseSwitchCase();
            if (clause.test === null) {
                if (defaultFound) {
                    throwError({}, Messages.MultipleDefaultsInSwitch);
                }
                defaultFound = true;
            }
            cases.push(clause);
        }

        state.inSwitch = oldInSwitch;

        expect('}');

        return {
            type: Syntax.SwitchStatement,
            discriminant: discriminant,
            cases: cases
        };
    }

    // 12.13 The throw statement

    function parseThrowStatement() {
        var argument;

        expectKeyword('throw');

        if (peekLineTerminator()) {
            throwError({}, Messages.NewlineAfterThrow);
        }

        argument = parseExpression();

        consumeSemicolon();

        return {
            type: Syntax.ThrowStatement,
            argument: argument
        };
    }

    // 12.14 The try statement

    function parseCatchClause() {
        var param;

        expectKeyword('catch');

        expect('(');
        if (!match(')')) {
            param = parseExpression();
            // 12.14.1
            if (strict && param.type === Syntax.Identifier && isRestrictedWord(param.name)) {
                throwErrorTolerant({}, Messages.StrictCatchVariable);
            }
        }
        expect(')');

        return {
            type: Syntax.CatchClause,
            param: param,
            body: parseBlock()
        };
    }

    function parseTryStatement() {
        var block, handlers = [], finalizer = null;

        expectKeyword('try');

        block = parseBlock();

        if (matchKeyword('catch')) {
            handlers.push(parseCatchClause());
        }

        if (matchKeyword('finally')) {
            lex();
            finalizer = parseBlock();
        }

        if (handlers.length === 0 && !finalizer) {
            throwError({}, Messages.NoCatchOrFinally);
        }

        return {
            type: Syntax.TryStatement,
            block: block,
            guardedHandlers: [],
            handlers: handlers,
            finalizer: finalizer
        };
    }

    // 12.15 The debugger statement

    function parseDebuggerStatement() {
        expectKeyword('debugger');

        consumeSemicolon();

        return {
            type: Syntax.DebuggerStatement
        };
    }

    // 12 Statements

    function parseStatement() {
        var token = lookahead(),
            expr,
            labeledBody;

        if (token.type === Token.EOF) {
            throwUnexpected(token);
        }

        if (token.type === Token.Punctuator) {
            switch (token.value) {
            case ';':
                return parseEmptyStatement();
            case '{':
                return parseBlock();
            case '(':
                return parseExpressionStatement();
            default:
                break;
            }
        }


        if (token.type === Token.Keyword) {
            switch (token.value) {
            case 'break':
                return parseBreakStatement();
            case 'continue':
                return parseContinueStatement();
            case 'debugger':
                return parseDebuggerStatement();
            case 'do':
                return parseDoWhileStatement();
            case 'for':
                return parseForStatement();
            case 'function':
                return parseFunctionDeclaration();
            case 'class':
                return parseClassDeclaration();
            case 'if':
                return parseIfStatement();
            case 'private':
                return parsePrivateStatement();
            case 'return':
                return parseReturnStatement();
            case 'switch':
                return parseSwitchStatement();
            case 'throw':
                return parseThrowStatement();
            case 'try':
                return parseTryStatement();
            case 'var':
                return parseVariableStatement();
            case 'while':
                return parseWhileStatement();
            case 'with':
                return parseWithStatement();
            default:
                break;
            }
        }

        if (token.type === Token.Identifier && token.value === 'symbol' && lookahead2().type === Token.AtSymbol) {
            return parseSymbolStatement();
        }

        expr = parseExpression();

        // 12.12 Labelled Statements
        if ((expr.type === Syntax.Identifier) && match(':')) {
            lex();

            if (Object.prototype.hasOwnProperty.call(state.labelSet, expr.name)) {
                throwError({}, Messages.Redeclaration, 'Label', expr.name);
            }

            state.labelSet[expr.name] = true;
            labeledBody = parseStatement();
            delete state.labelSet[expr.name];

            return {
                type: Syntax.LabeledStatement,
                label: expr,
                body: labeledBody
            };
        }

        consumeSemicolon();

        return {
            type: Syntax.ExpressionStatement,
            expression: expr
        };
    }

    // 13 Function Definition

    function parseConciseBody() {
        if (match('{')) {
            return parseFunctionSourceElements();
        } else {
            return parseAssignmentExpression();
        }
    }

    function parseFunctionSourceElements() {
        var sourceElement, sourceElements = [], token, directive, firstRestricted,
            oldLabelSet, oldInIteration, oldInSwitch, oldInFunctionBody, oldParenthesizedCount;

        expect('{');

        while (index < length) {
            token = lookahead();
            if (token.type !== Token.StringLiteral) {
                break;
            }

            sourceElement = parseSourceElement();
            sourceElements.push(sourceElement);
            if (sourceElement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = sliceSource(token.range[0] + 1, token.range[1] - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    throwErrorTolerant(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        oldLabelSet = state.labelSet;
        oldInIteration = state.inIteration;
        oldInSwitch = state.inSwitch;
        oldInFunctionBody = state.inFunctionBody;
        oldParenthesizedCount = state.parenthesizedCount;

        state.labelSet = {};
        state.inIteration = false;
        state.inSwitch = false;
        state.inFunctionBody = true;
        state.parenthesizedCount = 0;

        while (index < length) {
            if (match('}')) {
                break;
            }
            sourceElement = parseSourceElement();
            if (typeof sourceElement === 'undefined') {
                break;
            }
            sourceElements.push(sourceElement);
        }

        expect('}');

        state.labelSet = oldLabelSet;
        state.inIteration = oldInIteration;
        state.inSwitch = oldInSwitch;
        state.inFunctionBody = oldInFunctionBody;
        state.parenthesizedCount = oldParenthesizedCount;

        return {
            type: Syntax.BlockStatement,
            body: sourceElements
        };
    }


    function validateParam(options, param, name) {
        if (strict) {
            if (isRestrictedWord(name)) {
                options.stricted = param;
                options.message = Messages.StrictParamName;
            }
            if (Object.prototype.hasOwnProperty.call(options.paramSet, name)) {
                options.stricted = param;
                options.message = Messages.StrictParamDupe;
            }
        } else if (!options.firstRestricted) {
            if (isRestrictedWord(name)) {
                options.firstRestricted = param;
                options.message = Messages.StrictParamName;
            } else if (isStrictModeReservedWord(name)) {
                options.firstRestricted = param;
                options.message = Messages.StrictReservedWord;
            } else if (Object.prototype.hasOwnProperty.call(options.paramSet, name)) {
                options.firstRestricted = param;
                options.message = Messages.StrictParamDupe;
            }
        }
        options.paramSet[name] = true;
    }


    function parseParam(options) {
        var token, rest, param;

        token = lookahead();
        if (token.value === '...') {
            token = lex();
            rest = true;
        }

        if (match('[')) {
            param = parseArrayInitialiser();
            reinterpretAsDestructuredParameter(options, param);
        } else if (match('{')) {
            if (rest) {
                throwError({}, Messages.ObjectPatternAsRestParameter);
            }
            param = parseObjectInitialiser();
            reinterpretAsDestructuredParameter(options, param);
        } else {
            param = parseVariableIdentifier();
            validateParam(options, token, token.value);
        }

        if (rest) {
            if (!match(')')) {
                throwError({}, Messages.ParameterAfterRestParameter);
            }
            options.rest = param;
            return false;
        }

        if (match('=')) {
            lex();
            options.defaults.push(parseAssignmentExpression());
        } else if (options.defaults.length) {
            throwError({}, Messages.DefaultsNotLast);
        }

        options.params.push(param);
        return !match(')');
    }


    function parseParams(firstRestricted) {
        var options;

        options = {
            params: [],
            defaults: [],
            rest: null,
            firstRestricted: firstRestricted
        }

        expect('(');

        if (!match(')')) {
            options.paramSet = {};
            while (index < length) {
                if (!parseParam(options)) {
                    break;
                }
                expect(',');
            }
        }

        expect(')');

        return options;
    }


    function parseFunctionDeclaration() {
        var id, body, token, tmp, firstRestricted, message, previousStrict, previousYieldAllowed, generator, expression;

        expectKeyword('function');

        generator = false;
        if (match('*')) {
            lex();
            generator = true;
        }

        token = lookahead();

        id = parseVariableIdentifier();
        if (strict) {
            if (isRestrictedWord(token.value)) {
                throwErrorTolerant(token, Messages.StrictFunctionName);
            }
        } else {
            if (isRestrictedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictFunctionName;
            } else if (isStrictModeReservedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictReservedWord;
            }
        }

        tmp = parseParams(firstRestricted);
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }

        previousStrict = strict;
        previousYieldAllowed = yieldAllowed;
        yieldAllowed = generator;

        // here we redo some work in order to set 'expression'
        expression = !match('{');
        body = parseConciseBody();

        if (strict && firstRestricted) {
            throwError(firstRestricted, message);
        }
        if (strict && tmp.stricted) {
            throwErrorTolerant(tmp.stricted, message);
        }
        if (yieldAllowed && !yieldFound) {
            throwError({}, Messages.NoYieldInGenerator);
        }
        strict = previousStrict;
        yieldAllowed = previousYieldAllowed;

        return {
            type: Syntax.FunctionDeclaration,
            id: id,
            params: tmp.params,
            defaults: tmp.defaults,
            body: body,
            rest: tmp.rest,
            generator: generator,
            expression: expression
        };
    }

    function parseFunctionExpression() {
        var token, id = null, firstRestricted, message, tmp, body, previousStrict, previousYieldAllowed, generator, expression;

        expectKeyword('function');

        generator = false;

        if (match('*')) {
            lex();
            generator = true;
        }

        if (!match('(')) {
            token = lookahead();
            id = parseVariableIdentifier();
            if (strict) {
                if (isRestrictedWord(token.value)) {
                    throwErrorTolerant(token, Messages.StrictFunctionName);
                }
            } else {
                if (isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                } else if (isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                }
            }
        }

        tmp = parseParams(firstRestricted);
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }

        previousStrict = strict;
        previousYieldAllowed = yieldAllowed;
        yieldAllowed = generator;

        // here we redo some work in order to set 'expression'
        expression = !match('{');
        body = parseConciseBody();

        if (strict && firstRestricted) {
            throwError(firstRestricted, message);
        }
        if (strict && tmp.stricted) {
            throwErrorTolerant(tmp.stricted, message);
        }
        if (yieldAllowed && !yieldFound) {
            throwError({}, Messages.NoYieldInGenerator);
        }
        strict = previousStrict;
        yieldAllowed = previousYieldAllowed;


        return {
            type: Syntax.FunctionExpression,
            id: id,
            params: tmp.params,
            defaults: tmp.defaults,
            body: body,
            rest: tmp.rest,
            generator: generator,
            expression: expression
        };
    }

    function parseYieldExpression() {
        var delegate, expr, previousYieldAllowed;

        expectKeyword('yield');

        if (!yieldAllowed) {
            throwErrorTolerant({}, Messages.IllegalYield);
        }

        delegate = false;
        if (match('*')) {
            lex();
            delegate = true;
        }

        // It is a Syntax Error if any AssignmentExpression Contains YieldExpression.
        previousYieldAllowed = yieldAllowed;
        yieldAllowed = false;
        expr = parseAssignmentExpression();
        yieldAllowed = previousYieldAllowed;
        yieldFound = true;

        return {
            type: Syntax.YieldExpression,
            argument: expr,
            delegate: delegate
        };
    }

    // 14 Classes

    function parseMethodDefinition() {
        var token, key, param;

        if (match('*')) {
            lex();
            return {
                type: Syntax.MethodDefinition,
                key: parseObjectPropertyKey(),
                value: parsePropertyMethodFunction({ generator: true }),
                kind: ''
            };
        }

        token = lookahead();
        key = parseObjectPropertyKey();

        if (token.value === 'get' && !match('(')) {
            key = parseObjectPropertyKey();
            expect('(');
            expect(')');
            return {
                type: Syntax.MethodDefinition,
                key: key,
                value: parsePropertyFunction({ generator: false }),
                kind: 'get'
            };
        } else if (token.value === 'set' && !match('(')) {
            key = parseObjectPropertyKey();
            param = parseParams();
            param.name = token;
            param.generator = false;
            return {
                type: Syntax.MethodDefinition,
                key: key,
                value: parsePropertyFunction(param),
                kind: 'set'
            };
        } else {
            return {
                type: Syntax.MethodDefinition,
                key: key,
                value: parsePropertyMethodFunction({ generator: false }),
                kind: ''
            };
        }
    }

    function parseClassElement() {
        if (match(';')) {
            lex();
            return;
        } else if (lookahead().value === 'private' && lookahead2().type === Token.AtSymbol) {
            return parsePrivateStatement();
        } else if (lookahead().value === 'symbol' && lookahead2().type === Token.AtSymbol) {
            return parseSymbolStatement();
        } else {
            return parseMethodDefinition();
        }
    }

    function parseClassBody() {
        var classElement, classElements = [];

        expect('{');

        while (index < length) {
            if (match('}')) {
                break;
            }
            classElement = parseClassElement();
            if (typeof classElement !== 'undefined') {
                classElements.push(classElement);
            }
        }

        expect('}');

        return {
            type: Syntax.ClassBody,
            body: classElements
        };
    }

    function parseClassExpression() {
        var id, body, previousYieldAllowed, superClass;

        expectKeyword('class');

        if (!matchKeyword('extends') && !match('{')) {
            id = parseVariableIdentifier();
        }

        if (matchKeyword('extends')) {
            expectKeyword('extends');
            previousYieldAllowed = yieldAllowed;
            yieldAllowed = false;
            superClass = parseAssignmentExpression();
            yieldAllowed = previousYieldAllowed;
        }

        body = parseClassBody();
        return {
            id: id,
            type: Syntax.ClassExpression,
            body: body,
            superClass: superClass
        };
    }

    function parseClassDeclaration() {
        var token, id, body, previousYieldAllowed, superClass;

        expectKeyword('class');

        token = lookahead();
        id = parseVariableIdentifier();

        if (matchKeyword('extends')) {
            expectKeyword('extends');
            previousYieldAllowed = yieldAllowed;
            yieldAllowed = false;
            superClass = parseAssignmentExpression();
            yieldAllowed = previousYieldAllowed;
        }

        body = parseClassBody();
        return {
            id: id,
            type: Syntax.ClassDeclaration,
            body: body,
            superClass: superClass
        };
    }

    // 15 Program

    function parseSourceElement() {
        var token = lookahead();

        if (token.type === Token.Keyword) {
            switch (token.value) {
            case 'const':
            case 'let':
                return parseConstLetDeclaration(token.value);
            case 'function':
                return parseFunctionDeclaration();
            default:
                return parseStatement();
            }
        }

        if (token.type !== Token.EOF) {
            return parseStatement();
        }
    }

    function parseProgramElement() {
        var token = lookahead(), lineNumber;

        if (token.type === Token.Keyword) {
            switch (token.value) {
            case 'export':
                return parseExportDeclaration();
            case 'import':
                return parseImportDeclaration();
            }
        }

        if (token.value === 'module' && token.type === Token.Identifier) {
            lineNumber = token.lineNumber;
            token = lookahead2();
            if (token.type === Token.Identifier && token.lineNumber === lineNumber) {
                return parseModuleDeclaration();
            }
        }

        return parseSourceElement();
    }

    function parseProgramElements() {
        var sourceElement, sourceElements = [], token, directive, firstRestricted;

        while (index < length) {
            token = lookahead();
            if (token.type !== Token.StringLiteral) {
                break;
            }

            sourceElement = parseProgramElement();
            sourceElements.push(sourceElement);
            if (sourceElement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = sliceSource(token.range[0] + 1, token.range[1] - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    throwErrorTolerant(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        while (index < length) {
            sourceElement = parseProgramElement();
            if (typeof sourceElement === 'undefined') {
                break;
            }
            sourceElements.push(sourceElement);
        }
        return sourceElements;
    }

    function parseModuleElement() {
        return parseProgramElement();
    }

    function parseModuleElements() {
        var list = [],
            statement;

        while (index < length) {
            if (match('}')) {
                break;
            }
            statement = parseModuleElement();
            if (typeof statement === 'undefined') {
                break;
            }
            list.push(statement);
        }

        return list;
    }

    function parseModuleBlock() {
        var block;

        expect('{');

        block = parseModuleElements();

        expect('}');

        return {
            type: Syntax.BlockStatement,
            body: block
        };
    }

    function parseProgram() {
        var program;
        strict = false;
        yieldAllowed = false;
        yieldFound = false;
        program = {
            type: Syntax.Program,
            body: parseProgramElements()
        };
        return program;
    }

    // The following functions are needed only when the option to preserve
    // the comments is active.

    function addComment(type, value, start, end, loc) {
        assert(typeof start === 'number', 'Comment must have valid position');

        // Because the way the actual token is scanned, often the comments
        // (if any) are skipped twice during the lexical analysis.
        // Thus, we need to skip adding a comment if the comment array already
        // handled it.
        if (extra.comments.length > 0) {
            if (extra.comments[extra.comments.length - 1].range[1] > start) {
                return;
            }
        }

        extra.comments.push({
            type: type,
            value: value,
            range: [start, end],
            loc: loc
        });
    }

    function scanComment() {
        var comment, ch, loc, start, blockComment, lineComment;

        comment = '';
        blockComment = false;
        lineComment = false;

        while (index < length) {
            ch = source[index];

            if (lineComment) {
                ch = nextChar();
                if (isLineTerminator(ch)) {
                    loc.end = {
                        line: lineNumber,
                        column: index - lineStart - 1
                    };
                    lineComment = false;
                    addComment('Line', comment, start, index - 1, loc);
                    if (ch === '\r' && source[index] === '\n') {
                        ++index;
                    }
                    ++lineNumber;
                    lineStart = index;
                    comment = '';
                } else if (index >= length) {
                    lineComment = false;
                    comment += ch;
                    loc.end = {
                        line: lineNumber,
                        column: length - lineStart
                    };
                    addComment('Line', comment, start, length, loc);
                } else {
                    comment += ch;
                }
            } else if (blockComment) {
                if (isLineTerminator(ch)) {
                    if (ch === '\r' && source[index + 1] === '\n') {
                        ++index;
                        comment += '\r\n';
                    } else {
                        comment += ch;
                    }
                    ++lineNumber;
                    ++index;
                    lineStart = index;
                    if (index >= length) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                } else {
                    ch = nextChar();
                    if (index >= length) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                    comment += ch;
                    if (ch === '*') {
                        ch = source[index];
                        if (ch === '/') {
                            comment = comment.substr(0, comment.length - 1);
                            blockComment = false;
                            ++index;
                            loc.end = {
                                line: lineNumber,
                                column: index - lineStart
                            };
                            addComment('Block', comment, start, index, loc);
                            comment = '';
                        }
                    }
                }
            } else if (ch === '/') {
                ch = source[index + 1];
                if (ch === '/') {
                    loc = {
                        start: {
                            line: lineNumber,
                            column: index - lineStart
                        }
                    };
                    start = index;
                    index += 2;
                    lineComment = true;
                    if (index >= length) {
                        loc.end = {
                            line: lineNumber,
                            column: index - lineStart
                        };
                        lineComment = false;
                        addComment('Line', comment, start, index, loc);
                    }
                } else if (ch === '*') {
                    start = index;
                    index += 2;
                    blockComment = true;
                    loc = {
                        start: {
                            line: lineNumber,
                            column: index - lineStart - 2
                        }
                    };
                    if (index >= length) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                } else {
                    break;
                }
            } else if (isWhiteSpace(ch)) {
                ++index;
            } else if (isLineTerminator(ch)) {
                ++index;
                if (ch ===  '\r' && source[index] === '\n') {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
            } else {
                break;
            }
        }
    }

    function filterCommentLocation() {
        var i, entry, comment, comments = [];

        for (i = 0; i < extra.comments.length; ++i) {
            entry = extra.comments[i];
            comment = {
                type: entry.type,
                value: entry.value
            };
            if (extra.range) {
                comment.range = entry.range;
            }
            if (extra.loc) {
                comment.loc = entry.loc;
            }
            comments.push(comment);
        }

        extra.comments = comments;
    }

    function collectToken() {
        var start, loc, token, range, value;

        skipComment();
        start = index;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        token = extra.advance();
        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        if (token.type !== Token.EOF) {
            range = [token.range[0], token.range[1]];
            value = sliceSource(token.range[0], token.range[1]);
            extra.tokens.push({
                type: TokenName[token.type],
                value: value,
                range: range,
                loc: loc
            });
        }

        return token;
    }

    function collectRegex() {
        var pos, loc, regex, token;

        skipComment();

        pos = index;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        regex = extra.scanRegExp();
        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        // Pop the previous token, which is likely '/' or '/='
        if (extra.tokens.length > 0) {
            token = extra.tokens[extra.tokens.length - 1];
            if (token.range[0] === pos && token.type === 'Punctuator') {
                if (token.value === '/' || token.value === '/=') {
                    extra.tokens.pop();
                }
            }
        }

        extra.tokens.push({
            type: 'RegularExpression',
            value: regex.literal,
            range: [pos, index],
            loc: loc
        });

        return regex;
    }

    function filterTokenLocation() {
        var i, entry, token, tokens = [];

        for (i = 0; i < extra.tokens.length; ++i) {
            entry = extra.tokens[i];
            token = {
                type: entry.type,
                value: entry.value
            };
            if (extra.range) {
                token.range = entry.range;
            }
            if (extra.loc) {
                token.loc = entry.loc;
            }
            tokens.push(token);
        }

        extra.tokens = tokens;
    }

    function createLiteral(token) {
        return {
            type: Syntax.Literal,
            value: token.value
        };
    }

    function createRawLiteral(token) {
        return {
            type: Syntax.Literal,
            value: token.value,
            raw: sliceSource(token.range[0], token.range[1])
        };
    }

    function createLocationMarker() {
        var marker = {};

        marker.range = [index, index];
        marker.loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            },
            end: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        marker.end = function () {
            this.range[1] = index;
            this.loc.end.line = lineNumber;
            this.loc.end.column = index - lineStart;
        };

        marker.applyGroup = function (node) {
            if (extra.range) {
                node.groupRange = [this.range[0], this.range[1]];
            }
            if (extra.loc) {
                node.groupLoc = {
                    start: {
                        line: this.loc.start.line,
                        column: this.loc.start.column
                    },
                    end: {
                        line: this.loc.end.line,
                        column: this.loc.end.column
                    }
                };
            }
        };

        marker.apply = function (node) {
            if (node === true || node === false) return;
            if (extra.range) {
                node.range = [this.range[0], this.range[1]];
            }
            if (extra.loc) {
                node.loc = {
                    start: {
                        line: this.loc.start.line,
                        column: this.loc.start.column
                    },
                    end: {
                        line: this.loc.end.line,
                        column: this.loc.end.column
                    }
                };
            }
        };

        return marker;
    }

    function trackGroupExpression() {
        var marker, expr;

        skipComment();
        marker = createLocationMarker();
        expect('(');

        ++state.parenthesizedCount;

        state.allowArrowFunction = !state.allowArrowFunction;
        expr = parseExpression();
        state.allowArrowFunction = false;

        if (expr.type === 'ArrowFunctionExpression') {
            marker.end();
            marker.apply(expr);
        } else {
            expect(')');
            marker.end();
            marker.applyGroup(expr);
        }

        return expr;
    }

    function trackLeftHandSideExpression() {
        var marker, expr;

        skipComment();
        marker = createLocationMarker();

        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();

        while (match('.') || match('[') || lookahead().type === Token.Template) {
            if (match('[')) {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: true,
                    object: expr,
                    property: parseComputedMember()
                };
                marker.end();
                marker.apply(expr);
            } else if (match('.')) {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: false,
                    object: expr,
                    property: parseNonComputedMember()
                };
                marker.end();
                marker.apply(expr);
            } else {
                expr = {
                    type: Syntax.TaggedTemplateExpression,
                    tag: expr,
                    template: parseTemplateLiteral()
                };
                marker.end();
                marker.apply(expr);
            }
        }

        return expr;
    }

    function trackLeftHandSideExpressionAllowCall() {
        var marker, expr;

        skipComment();
        marker = createLocationMarker();

        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();

        while (match('.') || match('[') || match('(') || lookahead().type === Token.Template) {
            if (match('(')) {
                expr = {
                    type: Syntax.CallExpression,
                    callee: expr,
                    'arguments': parseArguments()
                };
                marker.end();
                marker.apply(expr);
            } else if (match('[')) {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: true,
                    object: expr,
                    property: parseComputedMember()
                };
                marker.end();
                marker.apply(expr);
            } else if (match('.')) {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: false,
                    object: expr,
                    property: parseNonComputedMember()
                };
                marker.end();
                marker.apply(expr);
            } else {
                expr = {
                    type: Syntax.TaggedTemplateExpression,
                    tag: expr,
                    template: parseTemplateLiteral()
                };
                marker.end();
                marker.apply(expr);
            }
        }

        return expr;
    }

    function filterGroup(node) {
        var n, i, entry;

        n = (Object.prototype.toString.apply(node) === '[object Array]') ? [] : {};
        for (i in node) {
            if (node.hasOwnProperty(i) && i !== 'groupRange' && i !== 'groupLoc') {
                entry = node[i];
                if (entry === null || typeof entry !== 'object' || entry instanceof RegExp) {
                    n[i] = entry;
                } else {
                    n[i] = filterGroup(entry);
                }
            }
        }
        return n;
    }

    function wrapTrackingFunction(range, loc) {

        return function (parseFunction) {

            function isBinary(node) {
                return node.type === Syntax.LogicalExpression ||
                    node.type === Syntax.BinaryExpression;
            }

            function visit(node) {
                var start, end;

                if (isBinary(node.left)) {
                    visit(node.left);
                }
                if (isBinary(node.right)) {
                    visit(node.right);
                }

                if (range) {
                    if (node.left.groupRange || node.right.groupRange) {
                        start = node.left.groupRange ? node.left.groupRange[0] : node.left.range[0];
                        end = node.right.groupRange ? node.right.groupRange[1] : node.right.range[1];
                        node.range = [start, end];
                    } else if (typeof node.range === 'undefined') {
                        start = node.left.range[0];
                        end = node.right.range[1];
                        node.range = [start, end];
                    }
                }
                if (loc) {
                    if (node.left.groupLoc || node.right.groupLoc) {
                        start = node.left.groupLoc ? node.left.groupLoc.start : node.left.loc.start;
                        end = node.right.groupLoc ? node.right.groupLoc.end : node.right.loc.end;
                        node.loc = {
                            start: start,
                            end: end
                        };
                    } else if (typeof node.loc === 'undefined') {
                        node.loc = {
                            start: node.left.loc.start,
                            end: node.right.loc.end
                        };
                    }
                }
            }

            return function () {
                var marker, node;

                skipComment();

                marker = createLocationMarker();
                node = parseFunction.apply(null, arguments);
                marker.end();

                if (range && typeof node.range === 'undefined') {
                    marker.apply(node);
                }

                if (loc && typeof node.loc === 'undefined') {
                    marker.apply(node);
                }

                if (isBinary(node)) {
                    visit(node);
                }

                return node;
            };
        };
    }

    function patch() {

        var wrapTracking;

        if (extra.comments) {
            extra.skipComment = skipComment;
            skipComment = scanComment;
        }

        if (extra.raw) {
            extra.createLiteral = createLiteral;
            createLiteral = createRawLiteral;
        }

        if (extra.range || extra.loc) {

            extra.parseGroupExpression = parseGroupExpression;
            extra.parseLeftHandSideExpression = parseLeftHandSideExpression;
            extra.parseLeftHandSideExpressionAllowCall = parseLeftHandSideExpressionAllowCall;
            parseGroupExpression = trackGroupExpression;
            parseLeftHandSideExpression = trackLeftHandSideExpression;
            parseLeftHandSideExpressionAllowCall = trackLeftHandSideExpressionAllowCall;

            wrapTracking = wrapTrackingFunction(extra.range, extra.loc);

            extra.parseAdditiveExpression = parseAdditiveExpression;
            extra.parseAssignmentExpression = parseAssignmentExpression;
            extra.parseAtSymbol = parseAtSymbol;
            extra.parseBitwiseANDExpression = parseBitwiseANDExpression;
            extra.parseBitwiseORExpression = parseBitwiseORExpression;
            extra.parseBitwiseXORExpression = parseBitwiseXORExpression;
            extra.parseBlock = parseBlock;
            extra.parseFunctionSourceElements = parseFunctionSourceElements;
            extra.parseCatchClause = parseCatchClause;
            extra.parseComputedMember = parseComputedMember;
            extra.parseConditionalExpression = parseConditionalExpression;
            extra.parseConstLetDeclaration = parseConstLetDeclaration;
            extra.parseEqualityExpression = parseEqualityExpression;
            extra.parseExportDeclaration = parseExportDeclaration;
            extra.parseExportSpecifier = parseExportSpecifier;
            extra.parseExportSpecifierSetProperty = parseExportSpecifierSetProperty;
            extra.parseExpression = parseExpression;
            extra.parseForVariableDeclaration = parseForVariableDeclaration;
            extra.parseFunctionDeclaration = parseFunctionDeclaration;
            extra.parseFunctionExpression = parseFunctionExpression;
            extra.parseParam = parseParam;
            extra.parseGlob = parseGlob;
            extra.parseImportDeclaration = parseImportDeclaration;
            extra.parseImportSpecifier = parseImportSpecifier;
            extra.parseLogicalANDExpression = parseLogicalANDExpression;
            extra.parseLogicalORExpression = parseLogicalORExpression;
            extra.parseMultiplicativeExpression = parseMultiplicativeExpression;
            extra.parseModuleDeclaration = parseModuleDeclaration;
            extra.parseModuleBlock = parseModuleBlock;
            extra.parseNewExpression = parseNewExpression;
            extra.parseNonComputedProperty = parseNonComputedProperty;
            extra.parseObjectProperty = parseObjectProperty;
            extra.parseObjectPropertyKey = parseObjectPropertyKey;
            extra.parseParam = parseParam;
            extra.parsePath = parsePath;
            extra.parsePostfixExpression = parsePostfixExpression;
            extra.parsePrimaryExpression = parsePrimaryExpression;
            extra.parsePrivateStatement = parsePrivateStatement;
            extra.parseProgram = parseProgram;
            extra.parsePropertyFunction = parsePropertyFunction;
            extra.parseRelationalExpression = parseRelationalExpression;
            extra.parseSpreadOrAssignmentExpression = parseSpreadOrAssignmentExpression;
            extra.parseSymbolStatement = parseSymbolStatement;
            extra.parseSymbolDeclarationList = parseSymbolDeclarationList;
            extra.parseSymbolDeclaration = parseSymbolDeclaration;
            extra.parseTemplateElement = parseTemplateElement;
            extra.parseTemplateLiteral = parseTemplateLiteral;
            extra.parseStatement = parseStatement;
            extra.parseShiftExpression = parseShiftExpression;
            extra.parseSwitchCase = parseSwitchCase;
            extra.parseUnaryExpression = parseUnaryExpression;
            extra.parseVariableDeclaration = parseVariableDeclaration;
            extra.parseVariableIdentifier = parseVariableIdentifier;
            extra.parseMethodDefinition = parseMethodDefinition;
            extra.parseClassDeclaration = parseClassDeclaration;
            extra.parseClassExpression = parseClassExpression;
            extra.parseClassBody = parseClassBody;

            parseAdditiveExpression = wrapTracking(extra.parseAdditiveExpression);
            parseAssignmentExpression = wrapTracking(extra.parseAssignmentExpression);
            parseAtSymbol = wrapTracking(extra.parseAtSymbol);
            parseBitwiseANDExpression = wrapTracking(extra.parseBitwiseANDExpression);
            parseBitwiseORExpression = wrapTracking(extra.parseBitwiseORExpression);
            parseBitwiseXORExpression = wrapTracking(extra.parseBitwiseXORExpression);
            parseBlock = wrapTracking(extra.parseBlock);
            parseFunctionSourceElements = wrapTracking(extra.parseFunctionSourceElements);
            parseCatchClause = wrapTracking(extra.parseCatchClause);
            parseComputedMember = wrapTracking(extra.parseComputedMember);
            parseConditionalExpression = wrapTracking(extra.parseConditionalExpression);
            parseConstLetDeclaration = wrapTracking(extra.parseConstLetDeclaration);
            parseExportDeclaration = wrapTracking(parseExportDeclaration);
            parseExportSpecifier = wrapTracking(parseExportSpecifier);
            parseExportSpecifierSetProperty = wrapTracking(parseExportSpecifierSetProperty);
            parseEqualityExpression = wrapTracking(extra.parseEqualityExpression);
            parseExpression = wrapTracking(extra.parseExpression);
            parseForVariableDeclaration = wrapTracking(extra.parseForVariableDeclaration);
            parseFunctionDeclaration = wrapTracking(extra.parseFunctionDeclaration);
            parseFunctionExpression = wrapTracking(extra.parseFunctionExpression);
            parseParam = wrapTracking(extra.parseParam);
            parseGlob = wrapTracking(extra.parseGlob);
            parseImportDeclaration = wrapTracking(extra.parseImportDeclaration);
            parseImportSpecifier = wrapTracking(extra.parseImportSpecifier);
            parseLogicalANDExpression = wrapTracking(extra.parseLogicalANDExpression);
            parseLogicalORExpression = wrapTracking(extra.parseLogicalORExpression);
            parseMultiplicativeExpression = wrapTracking(extra.parseMultiplicativeExpression);
            parseModuleDeclaration = wrapTracking(extra.parseModuleDeclaration);
            parseModuleBlock = wrapTracking(extra.parseModuleBlock);
            parseNewExpression = wrapTracking(extra.parseNewExpression);
            parseNonComputedProperty = wrapTracking(extra.parseNonComputedProperty);
            parseObjectProperty = wrapTracking(extra.parseObjectProperty);
            parseObjectPropertyKey = wrapTracking(extra.parseObjectPropertyKey);
            parseParam = wrapTracking(extra.parseParam);
            parsePath = wrapTracking(extra.parsePath);
            parsePostfixExpression = wrapTracking(extra.parsePostfixExpression);
            parsePrivateStatement = wrapTracking(extra.parsePrivateStatement);
            parsePrimaryExpression = wrapTracking(extra.parsePrimaryExpression);
            parseProgram = wrapTracking(extra.parseProgram);
            parsePropertyFunction = wrapTracking(extra.parsePropertyFunction);
            parseSymbolStatement = wrapTracking(extra.parseSymbolStatement);
            parseSymbolDeclarationList = wrapTracking(extra.parseSymbolDeclarationList);
            parseSymbolDeclaration = wrapTracking(extra.parseSymbolDeclaration);
            parseTemplateElement = wrapTracking(extra.parseTemplateElement);
            parseTemplateLiteral = wrapTracking(extra.parseTemplateLiteral);
            parseRelationalExpression = wrapTracking(extra.parseRelationalExpression);
            parseSpreadOrAssignmentExpression = wrapTracking(extra.parseSpreadOrAssignmentExpression);
            parseStatement = wrapTracking(extra.parseStatement);
            parseShiftExpression = wrapTracking(extra.parseShiftExpression);
            parseSwitchCase = wrapTracking(extra.parseSwitchCase);
            parseUnaryExpression = wrapTracking(extra.parseUnaryExpression);
            parseVariableDeclaration = wrapTracking(extra.parseVariableDeclaration);
            parseVariableIdentifier = wrapTracking(extra.parseVariableIdentifier);
            parseMethodDefinition = wrapTracking(extra.parseMethodDefinition);
            parseClassDeclaration = wrapTracking(extra.parseClassDeclaration);
            parseClassExpression = wrapTracking(extra.parseClassExpression);
            parseClassBody = wrapTracking(extra.parseClassBody);
        }

        if (typeof extra.tokens !== 'undefined') {
            extra.advance = advance;
            extra.scanRegExp = scanRegExp;

            advance = collectToken;
            scanRegExp = collectRegex;
        }
    }

    function unpatch() {
        if (typeof extra.skipComment === 'function') {
            skipComment = extra.skipComment;
        }

        if (extra.raw) {
            createLiteral = extra.createLiteral;
        }

        if (extra.range || extra.loc) {
            parseAdditiveExpression = extra.parseAdditiveExpression;
            parseAssignmentExpression = extra.parseAssignmentExpression;
            parseAtSymbol = extra.parseAtSymbol;
            parseBitwiseANDExpression = extra.parseBitwiseANDExpression;
            parseBitwiseORExpression = extra.parseBitwiseORExpression;
            parseBitwiseXORExpression = extra.parseBitwiseXORExpression;
            parseBlock = extra.parseBlock;
            parseFunctionSourceElements = extra.parseFunctionSourceElements;
            parseCatchClause = extra.parseCatchClause;
            parseComputedMember = extra.parseComputedMember;
            parseConditionalExpression = extra.parseConditionalExpression;
            parseConstLetDeclaration = extra.parseConstLetDeclaration;
            parseEqualityExpression = extra.parseEqualityExpression;
            parseExportDeclaration = extra.parseExportDeclaration;
            parseExportSpecifier = extra.parseExportSpecifier;
            parseExportSpecifierSetProperty = extra.parseExportSpecifierSetProperty;
            parseExpression = extra.parseExpression;
            parseForVariableDeclaration = extra.parseForVariableDeclaration;
            parseFunctionDeclaration = extra.parseFunctionDeclaration;
            parseFunctionExpression = extra.parseFunctionExpression;
            parseParam = extra.parseParam;
            parseGlob = extra.parseGlob;
            parseImportDeclaration = extra.parseImportDeclaration;
            parseImportSpecifier = extra.parseImportSpecifier;
            parseGroupExpression = extra.parseGroupExpression;
            parseLeftHandSideExpression = extra.parseLeftHandSideExpression;
            parseLeftHandSideExpressionAllowCall = extra.parseLeftHandSideExpressionAllowCall;
            parseLogicalANDExpression = extra.parseLogicalANDExpression;
            parseLogicalORExpression = extra.parseLogicalORExpression;
            parseMultiplicativeExpression = extra.parseMultiplicativeExpression;
            parseModuleDeclaration = extra.parseModuleDeclaration;
            parseModuleBlock = extra.parseModuleBlock;
            parseNewExpression = extra.parseNewExpression;
            parseNonComputedProperty = extra.parseNonComputedProperty;
            parseObjectProperty = extra.parseObjectProperty;
            parseObjectPropertyKey = extra.parseObjectPropertyKey;
            parsePath = extra.parsePath;
            parsePostfixExpression = extra.parsePostfixExpression;
            parsePrimaryExpression = extra.parsePrimaryExpression;
            parsePrivateStatement = extra.parsePrivateStatement;
            parseProgram = extra.parseProgram;
            parsePropertyFunction = extra.parsePropertyFunction;
            parseTemplateElement = extra.parseTemplateElement;
            parseTemplateLiteral = extra.parseTemplateLiteral;
            parseRelationalExpression = extra.parseRelationalExpression;
            parseSpreadOrAssignmentExpression = extra.parseSpreadOrAssignmentExpression;
            parseStatement = extra.parseStatement;
            parseShiftExpression = extra.parseShiftExpression;
            parseSymbolStatement = extra.parseSymbolStatement;
            parseSymbolDeclarationList = extra.parseSymbolDeclarationList;
            parseSymbolDeclaration = extra.parseSymbolDeclaration;
            parseSwitchCase = extra.parseSwitchCase;
            parseUnaryExpression = extra.parseUnaryExpression;
            parseVariableDeclaration = extra.parseVariableDeclaration;
            parseVariableIdentifier = extra.parseVariableIdentifier;
            parseMethodDefinition = extra.parseMethodDefinition;
            parseClassDeclaration = extra.parseClassDeclaration;
            parseClassExpression = extra.parseClassExpression;
            parseClassBody = extra.parseClassBody;
        }

        if (typeof extra.scanRegExp === 'function') {
            advance = extra.advance;
            scanRegExp = extra.scanRegExp;
        }
    }

    function stringToArray(str) {
        var length = str.length,
            result = [],
            i;
        for (i = 0; i < length; ++i) {
            result[i] = str.charAt(i);
        }
        return result;
    }

    function parse(code, options) {
        var program, toString;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }

        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        length = source.length;
        buffer = null;
        state = {
            allowIn: true,
            labelSet: {},
            parenthesizedCount: 0,
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false
        };

        extra = {};
        if (typeof options !== 'undefined') {
            extra.range = (typeof options.range === 'boolean') && options.range;
            extra.loc = (typeof options.loc === 'boolean') && options.loc;
            extra.raw = (typeof options.raw === 'boolean') && options.raw;
            if (typeof options.tokens === 'boolean' && options.tokens) {
                extra.tokens = [];
            }
            if (typeof options.comment === 'boolean' && options.comment) {
                extra.comments = [];
            }
            if (typeof options.tolerant === 'boolean' && options.tolerant) {
                extra.errors = [];
            }
        }

        if (length > 0) {
            if (typeof source[0] === 'undefined') {
                // Try first to convert to a string. This is good as fast path
                // for old IE which understands string indexing for string
                // literals only and not for string object.
                if (code instanceof String) {
                    source = code.valueOf();
                }

                // Force accessing the characters via an array.
                if (typeof source[0] === 'undefined') {
                    source = stringToArray(code);
                }
            }
        }

        patch();
        try {
            program = parseProgram();
            if (typeof extra.comments !== 'undefined') {
                filterCommentLocation();
                program.comments = extra.comments;
            }
            if (typeof extra.tokens !== 'undefined') {
                filterTokenLocation();
                program.tokens = extra.tokens;
            }
            if (typeof extra.errors !== 'undefined') {
                program.errors = extra.errors;
            }
            if (extra.range || extra.loc) {
                program.body = filterGroup(program.body);
            }
        } catch (e) {
            throw e;
        } finally {
            unpatch();
            extra = {};
        }

        return program;
    }

    // Sync with package.json.
    exports.version = '1.1.0-dev-harmony';

    exports.parse = parse;

    // Deep copy.
    exports.Syntax = (function () {
        var name, types = {};

        if (typeof Object.create === 'function') {
            types = Object.create(null);
        }

        for (name in Syntax) {
            if (Syntax.hasOwnProperty(name)) {
                types[name] = Syntax[name];
            }
        }

        if (typeof Object.freeze === 'function') {
            Object.freeze(types);
        }

        return types;
    }());

}));
/* vim: set sw=4 ts=4 et tw=80 : */

return exports;
})({});

exports.functions = (function(exports){
  var _slice = [].slice,
      _concat = [].concat,
      _push = [].push;

  function toArray(o){
    var len = o.length;
    if (!len) return [];
    if (len === 1) return [o[0]];
    if (len === 2) return [o[0], o[1]];
    if (len === 3) return [o[0], o[1], o[2]];
    if (len > 9)   return _slice.call(o);
    if (len === 4) return [o[0], o[1], o[2], o[3]];
    if (len === 5) return [o[0], o[1], o[2], o[3], o[4]];
    if (len === 6) return [o[0], o[1], o[2], o[3], o[4], o[5]];
    if (len === 7) return [o[0], o[1], o[2], o[3], o[4], o[5], o[6]];
    if (len === 8) return [o[0], o[1], o[2], o[3], o[4], o[5], o[6], o[7]];
    if (len === 9) return [o[0], o[1], o[2], o[3], o[4], o[5], o[6], o[7], o[8]];
  }
  exports.toArray = toArray;

  function slice(o, start, end){
    if (!o.length) {
      return [];
    } else if (!end && !start) {
      return toArray(o);
    } else {
      return _slice.call(o, start, end);
    }
  }
  exports.slice = slice;


  var _call, _apply, _bind;

  if (typeof Function.prototype.bind === 'function' && !('prototype' in Function.prototype.bind)) {
    _bind = Function.prototype.bind;
    _call = Function.prototype.call;
    _apply = Function.prototype.apply;
  } else {
    void function(){
      var construct = (function(){
        var ctors = new Array(6),
            template = ['return function(F,_,$){ return new F(', ') }'];

        void function(){
          var pre = '';

          for (var i=0; i < 6; i++) {
            var post = '';
            ctors[i] = new Array(6);
            for (var j=0; j < 6; j++) {
              ctors[i][j] = new Function(template[0]+(pre+post).slice(0, -1)+template[1])();
              post += '$['+j+'],';
            }
            pre += '_['+i+'],';
          }
        }();

        return function construct(Ctor, boundArgs, args){
          var boundArgsCount = boundArgs.length,
              argsCount = args.length,
              subset = boundArgsCount in ctors ? ctors[boundArgsCount] : (ctors[boundArgsCount] = []);

          if (argsCount in subset) {
            var constructs = subset[argsCount];
          } else {
            var params = '';
            for (var i=0; i < boundArgsCount; i++) {
              params += '_['+i+'],';
            }
            for (var i=0; i < argsCount; i++) {
              params += '$['+i+'],';
            }
            var constructs = subset[argsCount] = new Function(template[0]+params.slice(0, -1)+template[1])();
          }

          return constructs(Ctor, boundArgs, args);
        };
      })();


      var iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      iframe.src = 'javascript:';
      _call = iframe.contentWindow.Function.prototype.call;
      _apply = _call.apply;
      iframe = null;
      _bind = function bind(receiver){
        if (typeof this !== 'function') {
          throw new TypeError("Function.prototype.bind called on non-callable");
        }

        var boundTarget = this,
            boundArgs = toArray(arguments);

        var bound = function(){
          if (this instanceof bound) {
            return construct(boundTarget, boundArgs, arguments);
          }

          var args = toArray(boundArgs);
          for (var i=0; i < arguments.length; i++) {
            args[args.length] = arguments[i];
          }

          return _call.apply(boundTarget, args);
        };

        return bound;
      };
    }();
  }

  var __ = partial.__ = {};

  function partial(f){
    var argv = [],
        argc = 0,
        holes = 0;

    for (var i=1; i < arguments.length; i++) {
      if (arguments[i] === __) {
        holes++;
      }
      argv[argc++] = arguments[i];
    }

    if (holes) {
      return function(){
        var extra = arguments.length > holes ? arguments.length - holes : 0,
            args = [],
            j = 0;

        for (var i=0; i < argc; i++) {
          args[i] = argv[i] === __ ? arguments[j++] : argv[i];
        }

        while (extra--) {
          args[i++] = arguments[j++];
        }

        return f.apply(this, args);
      };
    } else if (argc) {
      return function(){
        return f.apply(this, _concat.apply(argv, arguments));
      };
    } else {
      return function(){
        return f.apply(this, arguments);
      };
    }
  }
  exports.partial = partial;


  function bind(f, receiver){
    var argv = [],
        argc = 0;

    for (var i=2; i < arguments.length; i++) {
      argv[argc++] = arguments[i];
    }

    if (argc) {
      return function(){
        return f.apply(receiver, _concat.apply(argv, arguments));
      };
    } else {
      return function(){
        return f.apply(receiver, arguments);
      };
    }
  }
  exports.bind = bind;


  var bindbind  = exports.bindbind  = bind(_bind, _bind),
      callbind  = exports.callbind  = partial(bind, _call),
      applybind = exports.applybind = partial(bind, _apply),
      bindapply = exports.bindapply = applybind(_bind),
      call      = exports.call      = callbind(_call),
      apply     = exports.apply     = callbind(_apply);

  var nil = [null];

  exports.applyNew = function applyNew(Ctor, args){
    return new (bindapply(Ctor, nil.concat(args)));
  }

  exports.pushable = bindbind([].push);

  var hasOwn   = callbind({}.hasOwnProperty),
      toSource = callbind(function(){}.toString);

  var hidden = { configurable: true,
                 enumerable: false,
                 writable: true,
                 value: undefined }

  var defineProperty = Object.getOwnPropertyNames && !('prototype' in Object.getOwnPropertyNames)
                       ? Object.defineProperty
                       : function defineProperty(o, k, d){ o[k] = d.value };

  exports.fname = (function(){
    if (Function.name === 'Function') {
      return function fname(f){
        return f ? f.name || '' : '';
      };
    }
    return function fname(f){
      if (typeof f !== 'function') {
        return '';
      }

      if (!hasOwn(f, 'name')) {
        var match = toSource(f).match(/^\n?function\s?([\w\$]*)?_?\(/);
        if (match) {
          hidden.value = match[1];
          defineProperty(f, 'name', hidden);
        }
      }

      return f.name || '';
    };
  })();

  return exports;
})(typeof module !== 'undefined' ? module.exports : {});



exports.objects = (function(exports){
  var functions = require('./functions'),
      callbind  = functions.callbind,
      bind      = functions.bind,
      fname     = functions.fname;

  var toBrand = callbind({}.toString),
      hasOwn = callbind({}.hasOwnProperty);

  exports.hasOwn = hasOwn;

  var hasDunderProto = { __proto__: [] } instanceof Array,
      isES5 = !(!Object.getOwnPropertyNames || 'prototype' in Object.getOwnPropertyNames);

  var hidden = {
    configurable: true,
    enumerable: false,
    writable: true,
    value: undefined
  };


  function getBrandOf(o){
    if (o === null) {
      return 'Null';
    } else if (o === undefined) {
      return 'Undefined';
    } else {
      return toBrand(o).slice(8, -1);
    }
  }

  exports.getBrandOf = getBrandOf;

  function ensureObject(name, o){
    if (typeof o === 'object' ? o === null : typeof o !== 'function') {
      throw new TypeError(name + ' called with non-object ' + getBrandOf(o));
    }
  }


  function is(x, y){
    return x === y ? x !== 0 || 1 / x === 1 / y : x !== x && y !== y;
  }

  exports.is = is;


  function isObject(v){
    var type = typeof v;
    return type === 'object' ? v !== null : type === 'function';
  }

  exports.isObject = isObject;



  if (isES5) {
    var create = exports.create = Object.create;
  } else {
    var Null = function(){};
    var hiddens = ['constructor', 'hasOwnProperty', 'propertyIsEnumerable',
                   'isPrototypeOf', 'toLocaleString', 'toString', 'valueOf'];

    var create = exports.create = (function(F){
      var iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      iframe.src = 'javascript:';
      Null.prototype = iframe.contentWindow.Object.prototype;
      document.body.removeChild(iframe);

      while (hiddens.length) {
        delete Null.prototype[hiddens.pop()];
      }

      return function create(object){
        if (object === null) {
          return new Null;
        } else {
          F.prototype = object;
          object = new F;
          F.prototype = null;
          return object;
        }
      };
    })(function(){});
  }

  var ownKeys = exports.keys = (function(){
    if (isES5) return Object.keys;
    return function keys(o){
      var out = [], i=0;
      for (var k in o) {
        if (hasOwn(o, k)) {
          out[i++] = k;
        }
      }
      return out;
    };
  })();

  var getPrototypeOf = exports.getPrototypeOf = (function(){
    if (isES5) {
      return Object.getPrototypeOf;
    } else if (hasDunderProto) {
      return function getPrototypeOf(o){
        ensureObject('getPrototypeOf', o);
        return o.__proto__;
      };
    } else {
      return function getPrototypeOf(o){
        ensureObject('getPrototypeOf', o);

        var ctor = o.constructor;

        if (typeof ctor === 'function') {
          var proto = ctor.prototype;
          if (o !== proto) {
            return proto;
          } else if (ctor._super) {
            return ctor._super.prototype;
          } else {
            delete o.constructor;
            var _super = ctor._super = o.constructor;
            o.constructor = ctor;
            if (_super) {
              return _super.prototype;
            } else if (o instanceof Object) {
              return Object.prototype;
            } else {
              return null;
            }
          }
        } else if (o instanceof Null) {
          return null;
        } else if (o instanceof Object) {
          return Object.prototype;
        }
      };
    }
  })();

  var setPrototypeOf = exports.setPrototypeOf = (function(){
    if (hasDunderProto) {
      return function setPrototypeOf(o, proto){
        ensureObject('setPrototypeOf', o);
        o.__proto__ = proto;
      };
    }
    return function setPrototypeOf(o, proto){};
  })();

  var defineProperty = exports.defineProperty = (function(){
    if (isES5) return Object.defineProperty;
    return function defineProperty(o, k, desc){
      try { o[k] = desc.value } catch (e) {}
      return o;
    };
  })();


  var describeProperty = exports.describeProperty = (function(){
    if (isES5) return Object.getOwnPropertyDescriptor;
    return function getOwnPropertyDescriptor(o, k){
      ensureObject('getOwnPropertyDescriptor', o);
      if (hasOwn(o, k)) {
        return { value: o[k] };
      }
    };
  })();

  var ownProperties = exports.properties = isES5 ? Object.getOwnPropertyNames : ownKeys;

  exports.isExtensible = isES5 ? Object.isExtensible : function isExtensible(){ return true };


  function enumerate(o){
    var out = [], i = 0;
    for (out[i++] in o);
    return out;
  }

  exports.enumerate = enumerate;


  function copy(o){
    return assign(create(getPrototypeOf(o)), o);
  }

  exports.copy = copy;


  function define(o, p, v){
    switch (typeof p) {
      case 'function':
        v = p;
        p = fname(v);
      case 'string':
        hidden.value = v;
        defineProperty(o, p, hidden);
        break;
      case 'object':
        if (p instanceof Array) {
          for (var i=0; i < p.length; i++) {
            var f = p[i];
            if (typeof f === 'function') {
              var name = fname(f);
            } else if (typeof f === 'string' && typeof p[i+1] !== 'function' || !fname(p[i+1])) {
              var name = f;
              f = p[i + 1];
            }
            if (name) {
              hidden.value = f;
              defineProperty(o, name, hidden);
            }
          }
        } else if (p) {
          var keys = ownKeys(p)

          for (var i=0; i < keys.length; i++) {
            var desc = describeProperty(p, keys[i]);
            if (desc) {
              desc.enumerable = 'get' in desc;
              defineProperty(o, keys[i], desc);
            }
          }
        }
    }

    hidden.value = undefined;
    return o;
  }

  exports.define = define;



  function safeDefine(o, p, v){
    try {
      switch (typeof p) {
        case 'function':
          v = p;
          p = fname(v);
        case 'string':
          hidden.value = v;
          defineProperty(o, p, hidden);
          break;
        case 'object':
          if (p instanceof Array) {
            for (var i=0; i < p.length; i++) {
              var f = p[i];
              if (typeof f === 'function') {
                var name = fname(f);
              } else if (typeof f === 'string' && typeof p[i+1] !== 'function' || !fname(p[i+1])) {
                var name = f;
                f = p[i+1];
              }
              if (name) {
                hidden.value = f;
                try {
                  defineProperty(o, name, hidden);
                } catch (e) {}
              }
            }
          } else if (p) {
            var keys = ownKeys(p)

            for (var i=0; i < keys.length; i++) {
              try {
                var desc = describeProperty(p, keys[i]);
                if (desc) {
                  desc.enumerable = 'get' in desc;
                  defineProperty(o, keys[i], desc);
                }
              } catch (e) {}
            }
          }
      }
    } catch (e) {}

    hidden.value = undefined;
    return o;
  }

  exports.safeDefine = safeDefine;


  function assign(o, p, v){
    switch (typeof p) {
      case 'function':
        o[fname(p)] = p;
        break;
      case 'string':
        o[p] = v;
        break;
      case 'object':
        if (p instanceof Array) {
          for (var i=0; i < p.length; i++) {
            var f = p[i];
            if (typeof f === 'function' && fname(f)) {
              var name = fname(f);
            } else if (typeof f === 'string' && typeof p[i+1] !== 'function' || !fname(p[i+1])) {
              var name = f;
              f = p[i+1];
            }
            if (name) {
              o[name] = f;
            }
          }
        } else if (p) {
          var keys = ownKeys(p)

          for (var i=0; i < keys.length; i++) {
            var k = keys[i];
            o[k] = p[k];
          }
        }
    }
    return o;
  }

  exports.assign = assign;


  function assignAll(o, array){
    for (var i=0; i < array.length; i++) {
      assign(o, array[i]);
    }
    return o;
  }

  exports.assignAll = assignAll;


  var hide = exports.hide = (function(){
    if (isES5) {
      var nonEnumerable = { enumerable: false };
      return function hide(o, k){
        defineProperty(o, k, nonEnumerable);
      };
    }
    return function hide(){};
  })();


  function inherit(Ctor, Super, properties, methods){
    define(Ctor, 'inherits', Super);
    Ctor.prototype = create(Super.prototype);
    define(Ctor.prototype, 'constructor', Ctor);
    properties && define(Ctor.prototype, properties);
    methods && define(Ctor.prototype, methods);
    return Ctor;
  }

  exports.inherit = inherit;


  function Hash(){}

  exports.Hash = Hash;

  Hash.prototype = create(null);

  return exports;
})(typeof module !== 'undefined' ? module.exports : {});


exports.iteration = (function(exports){
  var objects   = require('./objects'),
      functions = require('./functions');

  var define   = objects.define,
      ownKeys  = objects.keys,
      isObject = objects.isObject,
      call     = functions.call,
      apply    = functions.apply;


  var StopIteration = exports.StopIteration = global.StopIteration || {};

  function Iterator(){}

  define(Iterator.prototype, [
    function __iterator__(){
      return this;
    }
  ]);

  exports.Iterator = Iterator;


  function Item(key, value){
    this[0] = key;
    this[1] = value;
  }

  exports.Item = Item;


  define(Item.prototype, {
    isItem: true,
    length: 2
  }, [
    function toString(){
      return this[0] + '';
    },
    function valueOf(){
      return this[1];
    }
  ]);


  function createItem(key, value){
    return new Item(key, value);
  }

  exports.createItem = createItem;


  function iterate(o, callback, context){
    if (o == null) return;
    var type = typeof o;
    context = context || o;
    if (type === 'number' || type === 'boolean') {
      callback.call(context, new Item(0, o));
    } else {
      o = Object(o);
      var iterator = o.__iterator__ || o.iterator;

      if (typeof iterator === 'function') {
        var iter = iterator.call(o);
        if (iter && typeof iter.next === 'function') {
          try {
            while (1) callback.call(context, iter.next());
          } catch (e) {
            if (e === StopIteration) return;
            throw e;
          }
        }
      }

      if (type !== 'function' && o.length) {
        try {
          for (var i=0; i < o.length; i++) {
            callback.call(context, new Item(i, o[i]));
          }
        } catch (e) {
          if (e === StopIteration) return;
          throw e;
        }
      } else {
        var keys = ownKeys(o);
        try {
          for (var i=0; i < keys.length; i++) {
            var key = keys[i];
            callback.call(context, new Item(key, o[key]));
          }
        } catch (e) {
          if (e === StopIteration) return;
          throw e;
        }
      }
    }
  }

  exports.iterate = iterate;


  function each(o, callback, context){
    if (!o) return;
    if (context === undefined) {
      if (typeof o === 'object' && 'length' in o) {
        for (var i=0; i < o.length; i++) {
          callback(o[i], i, o);
        }
      } else if (isObject(o)) {
        var keys = ownKeys(o);
        for (var i=0; i < keys.length; i++) {
          var key = keys[i];
          callback(o[key], key, o);
        }
      }
    } else {
      if (typeof o === 'object' && 'length' in o) {
        for (var i=0; i < o.length; i++) {
          callback.call(context, o[i], i, o);
        }
      } else if (isObject(o)) {
        var keys = ownKeys(o);
        for (var i=0; i < keys.length; i++) {
          var key = keys[i];
          callback.call(context, o[key], key, o);
        }
      }
    }
  }

  exports.each = each;


  function filter(o, callback, context){
    if (!o) return;
    if (context === undefined) {
      if (typeof o === 'object' && 'length' in o) {
        var out = [];

        for (var i=0; i < o.length; i++) {
          var value = o[i];

          if (callback(value, i, o)) {
            out.push(value);
          }
        }
      } else if (isObject(o)) {
        var keys = ownKeys(o),
            out  = {};

        for (var i=0; i < keys.length; i++) {
          var key = keys[i],
              value = o[key];

          if (callback(value, key, o)) {
            out[key] = value;
          }
        }
      }
    } else {
      if (typeof o === 'object' && 'length' in o) {
        var out = [];

        for (var i=0; i < o.length; i++) {
          var value = o[i];

          if (callback.call(context, o[i], i, o)) {
            out.push(value);
          }
        }
      } else if (isObject(o)) {
        var keys = ownKeys(o),
            out  = {};

        for (var i=0; i < keys.length; i++) {
          var key   = keys[i],
              value = o[key];

          if (callback.call(context, value, key, o)) {
            out[key] = value;
          }
        }
      }
    }

    return out;
  }

  exports.filter = filter;


  function map(o, callback, context){
    if (context === undefined) {
      if (typeof o === 'object' && 'length' in o) {
        var out = new Array(o.length);

        for (var i=0; i < o.length; i++) {
          out[i] = callback(o[i], i, o);
        }
      } else if (isObject(o)) {
        var out = ownKeys(o);

        for (var i=0; i < out.length; i++) {
          var key = out[i];
          out[i] = callback(o[key], key, o);
        }
      }
    } else {
      if (typeof o === 'object' && 'length' in o) {
        var out = new Array(o.length);

        for (var i=0; i < o.length; i++) {
          out[i] = callback.call(context, o[i], i, o);
        }
      } else if (isObject(o)) {
        var out = ownKeys(o);

        for (var i=0; i < out.length; i++) {
          var key = out[i];
          out[i] = callback.call(context, o[key], key, o);
        }
      }
    }

    return out;
  }

  exports.map = map;


  function fold(o, initial, callback){
    if (callback) {
      var val = initial, i = 0;
    } else {
      if (typeof initial === 'string') {
        callback = fold[initial];
      } else {
        callback = initial;
      }

      var val = o[0], i = 1;
    }
    for (; i < o.length; i++) {
      val = callback(val, o[i], i, o);
    }
    return val;
  }

  exports.fold = fold;

  fold['+'] = function(a, b){ return a + b };
  fold['*'] = function(a, b){ return a - b };
  fold['-'] = function(a, b){ return a * b };
  fold['/'] = function(a, b){ return a / b };


  function repeat(n, args, callback){
    if (typeof args === 'function') {
      callback = args;
      for (var i=0; i < n; i++) {
        callback();
      }
    } else {
      for (var i=0; i < n; i++) {
        callback.apply(this, args);
      }
    }
  }

  exports.repeat = repeat;


  function generate(n, callback){
    var out = new Array(n);
    for (var i=0; i < n; i++) {
      out[i] = callback(i, n, out);
    }
    return out;
  }

  exports.generate = generate;


  return exports;
})(typeof module !== 'undefined' ? module.exports : {});



exports.utility = (function(exports){
  var objects   = require('./objects'),
      functions = require('./functions');

  var Hash      = objects.Hash,
      applybind = functions.applybind;

  var seed = Math.random().toString(36).slice(2),
      count = (Math.random() * (1 << 30)) | 0;

  exports.uid = function uid(){
    return seed + count++;
  };

  var counter = 0;
  exports.tag = function tag(o){
    if (o && o.id === undefined) {
      o.id = counter++;
    }
  };

  exports.pushAll = applybind([].push, []);

  exports.nextTick = typeof process !== 'undefined'
                    ? process.nextTick
                    : function nextTick(f){ setTimeout(f, 1) };


  exports.numbers = (function(cache){
    return function numbers(start, end){
      if (!isFinite(end)) {
        end = start;
        start = 0;
      }
      var length = end - start,
          curr;

      if (end > cache.length) {
        while (length--)
          cache[curr = length + start] = '' + curr;
      }
      return cache.slice(start, end);
    };
  })([]);


  exports.quotes = function quotes(s) {
    s = (''+s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n');
    var singles = 0,
        doubles = 0,
        i = s.length;

    while (i--) {
      if (s[i] === '"') {
        doubles++;
      } else if (s[i] === "'") {
        singles++;
      }
    }

    if (singles > doubles) {
      return '"' + s.replace(/"/g, '\\"') + '"';
    } else {
      return "'" + s.replace(/'/g, "\\'") + "'";
    }
  };


  exports.unique = function unique(strings){
    var seen = new Hash,
        out = [];

    for (var i=0; i < strings.length; i++) {
      if (!(strings[i] in seen)) {
        seen[strings[i]] = true;
        out.push(strings[i]);
      }
    }

    return out;
  };


  var MAX_INTEGER = 9007199254740992;

  exports.toInteger = function toInteger(v){
    if (v === Infinity) {
      return MAX_INTEGER;
    } else if (v === -Infinity) {
      return -MAX_INTEGER;
    } else {
      return v - 0 >> 0;
    }
  };


  exports.isNaN = function isNaN(number){
    return number !== number;
  };


  exports.isFinite = function isFinite(number){
    return typeof value === 'number'
               && value === value
               && value < Infinity
               && value > -Infinity;
  };


  exports.isInteger = function isInteger(value) {
    return typeof value === 'number'
               && value === value
               && value > -MAX_INTEGER
               && value < MAX_INTEGER
               && value >> 0 === value;
  };

  return exports;
})(typeof module !== 'undefined' ? module.exports : {});


exports.Queue = (function(module){
  var objects   = require('./objects'),
      functions = require('./functions'),
      iteration = require('./iteration');

  var isObject      = objects.isObject,
      define        = objects.define,
      inherit       = objects.inherit,
      toArray       = functions.toArray,
      pushable      = functions.pushable,
      iterate       = iteration.iterate,
      Iterator      = iteration.Iterator,
      StopIteration = iteration.StopIteration;


  function QueueIterator(queue){
    this.queue = queue;
    this.index = queue.index;
  }

  inherit(QueueIterator, Iterator, [
    function next(){
      if (this.index === this.queue.items.length) {
        throw StopIteration;
      }
      return this.queue.items[this.index++];
    }
  ]);

  function Queue(iterable){
    this.index = this.length = 0;
    if (iterable != null) {
      if (iterable instanceof Queue) {
        this.items = iterable.items.slice(iterable.front);
        this.length = this.items.length;
      } else {
        this.items = [];
        iterate(iterable, this.push, this);
      }
    } else {
      this.items = [];
    }
  }

  define(Queue.prototype, [
    function push(item){
      this.items[this.items.length] = item;
      this.length++;
      return this;
    },
    function shift(){
      if (this.length) {
        var item = this.items[this.index];
        this.items[this.index++] = null;
        this.length--;
        if (this.index === 500) {
          this.items = this.items.slice(this.index);
          this.index = 0;
        }
        return item;
      }
    },
    function empty(){
      this.length = 0;
      this.index = 0;
      this.items = [];
      return this;
    },
    function front(){
      return this.items[this.index];
    },
    function item(depth){
      return this.items[this.index + depth];
    },
    function __iterator__(){
      return new QueueIterator(this);
    }
  ]);

  return module.exports = Queue;
})(typeof module !== 'undefined' ? module : {});


exports.traversal = (function(exports){
  var objects   = require('./objects'),
      functions = require('./functions'),
      utility   = require('./utility'),
      iteration = require('./iteration'),
      Queue     = require('./Queue'),
      Stack     = require('./Stack');

  var isObject       = objects.isObject,
      hasOwn         = objects.hasOwn,
      create         = objects.create,
      define         = objects.define,
      ownKeys        = objects.keys,
      ownProperties  = objects.properties,
      getPrototypeOf = objects.getPrototypeOf,
      Hash           = objects.Hash,
      each           = iteration.each,
      iterate        = iteration.iterate,
      Item           = iteration.Item,
      StopIteration  = iteration.StopIteration,
      uid            = utility.uid,
      toArray        = functions.toArray,
      fname          = functions.fname,
      call           = functions.call;


  var _hasOwn = {}.hasOwnProperty;

  exports.clone = function clone(o, hidden){
    function recurse(from, to, key){
      try {
        var val = from[key];
        if (!isObject(val)) {
          return to[key] = val;
        }
        if (from[key] === val) {
          if (hasOwn(from[key], tag)) {
            return to[key] = from[key][tag];
          }
          to[key] = enqueue(from[key]);
        }
      } catch (e) {}
    }

    function enqueue(o){
      var out = o instanceof Array ? [] : create(getPrototypeOf(o));
      tagged.push(o);
      each(list(o), function(item){
        queue.push([o, out, item]);
      });
      o[tag] = out;
      return out;
    }

    var queue  = new Queue,
        tag    = uid(),
        tagged = [],
        list   = hidden ? ownProperties : ownKeys,
        out    = enqueue(o);

    while (queue.length) {
      recurse.apply(this, queue.shift());
    }

    each(tagged, function(item){
      delete item[tag];
    });

    return out;
  };

  // this function runs extremely hot
  var walk = exports.walk = (function(){
    if (typeof Set !== 'undefined' && typeof Set.prototype.add === 'function') {
      return function walk(root, callback){
        var stack   = [[root]],
            sp      = 1,
            branded = new Set;

        do {
          var node = stack[--sp],
              keys = ownKeys(node),
              len  = keys.length;

          for (var i=0; i < len; i++) {
            var item = node[keys[i]];

            if (item && typeof item === 'object' && !branded.has(item)) {
              branded.add(item);

              var result = callback(item, node);
              if (result === RECURSE) {
                stack[sp++] = item;
              } else if (result === BREAK) {
                return;
              }
            }
          }
        } while (sp)
      };
    }

    return function walk(root, callback){
      var stack   = [[root]],
          branded = [],
          count   = 0,
          sp      = 1,
          tag     = uid();

      do {
        var node = stack[--sp],
            keys = ownKeys(node),
            len  = keys.length;

        for (var i=0; i < len; i++) {
          var item = node[keys[i]];

          if (item && typeof item === 'object' && !_hasOwn.call(item, tag)) {
            item[tag] = true;
            branded[count++] = item;

            var result = callback(item, node);
            if (result === RECURSE) {
              stack[sp++] = item;
            } else if (result === BREAK) {
              sp = 0;
              break;
            }
          }
        }
      } while (sp)

      while (count--) {
        delete branded[count][tag];
      }
    };
  })();

  var BREAK    = walk.BREAK    = 0,
      CONTINUE = walk.CONTINUE = 1,
      RECURSE  = walk.RECURSE  = 2;

  exports.collector = (function(){
    function path(){
      var parts = toArray(arguments);

      for (var i=0; i < parts.length; i++) {
        if (typeof parts[i] === 'function') {
          return function(o){
            for (var i=0; i < parts.length; i++) {
              var part = parts[i],
                  type = typeof part;

              if (type === 'string') {
                o = o[part];
              } else if (type === 'function') {
                o = part(o);
              }
            }
            return o;
          };
        }
      }

      return function(o){
        for (var i=0; i < parts.length; i++) {
          o = o[parts[i]];
        }
        return o;
      };
    }


    function collector(o){
      var handlers = new Hash;

      for (var k in o) {
        if (o[k] instanceof Array) {
          handlers[k] = path(o[k]);
        } else if (typeof o[k] === 'function') {
          handlers[k] = o[k];
        } else {
          handlers[k] = o[k];
        }
      }

      return function(node){
        var items = [];

        function walker(node){
          if ('length' in node) return RECURSE;

          var handler = handlers[node.type];

          if (handler === true) {
            items[items.length] = node;
          } else if (handler === RECURSE || handler === CONTINUE) {
            return handler;
          } else if (typeof handler === 'string') {
            if (node[handler]) {
              walk(node[handler], walker);
            }
          } else if (typeof handler === 'function') {
            var item = handler(node);
            if (item !== undefined) {
              items[items.length] = item;
            }
          }
          return CONTINUE;
        }

        walk(node, walker);

        return items;
      };
    }

    return collector;
  })();



  var Visitor = exports.Visitor = (function(){
    function VisitorHandlers(handlers){
      var self = this;

      if (handlers instanceof Array) {
        each(handlers, function(handler){
          self[fname(handler)] = handler;
        });
      } else if (isObject(handlers)) {
        each(handlers, function(handler, name){
          self[name] = handler;
        });
      }
    }

    VisitorHandlers.prototype = create(null);

    function VisitorState(dispatcher, handlers, root){
      var stack = this.stack = [[root]];

      this.dispatcher = dispatcher;
      this.handlers = handlers;
      this.branded = [];
      this.tag = uid();
      this.context = {
        push: function push(node){
          stack.push(node);
        }
      };
    }

    define(VisitorState.prototype, [
      function cleanup(){
        each(this.branded, function(item){
          delete item[this.tag];
        }, this);
        this.branded = [];
        this.tag = uid();
      },
      function next(node){
        if (node instanceof Item) {
          node = node[1];
        }
        if (isObject(node) && !hasOwn(node, this.tag)) {
          define(node, this.tag, true);
          this.branded.push(node);

          if (node instanceof Array) {
            each(node.slice().reverse(), this.context.push);
          } else  {
            var type = this.dispatcher(node);

            if (type === CONTINUE) {
              return;
            } else if (type in this.handlers) {
              var result = this.handlers[type].call(this.context, node);
            } else if (this.handlers.__noSuchHandler__) {
              var result = this.handlers.__noSuchHandler__.call(this.context, node);
            }

            if (result == BREAK) {
              throw StopIteration;
            } else if (result === RECURSE) {
              var temp = [];
              iterate(node, temp.push, temp);
              each(temp.reverse(), this.context.push);
            }
          }
        }
      }
    ]);


    function Visitor(dispatcher, handlers){
      this.handlers = handlers instanceof VisitorHandlers ? handlers : new VisitorHandlers(handlers);
      this.dispatcher = dispatcher;
    }


    define(Visitor.prototype, [
      function visit(root){
        var visitor = root instanceof VisitorState ? root : new VisitorState(this.dispatcher, this.handlers, root);

        try {
          while (visitor.stack.length) {
            visitor.next(visitor.stack.pop());
          }
          visitor.cleanup();
        } catch (e) {
          if (e !== StopIteration) throw e;

          var self = this;

          function _resume(){
            _resume = function(){};
            return self.visit(visitor);
          }

          return function resume(){
            return _resume();
          };
        }
      }
    ]);


    return Visitor;
  })();


  exports.createVisitor = function createVisitor(handlers){
    return new Visitor(handlers);
  };


  exports.visit = function visit(node, handlers){
    return new Visitor(handlers).visit(node);
  };


  exports.jsonify = function jsonify(object, key){
    key || (key = '');

    if (!isObject(object)) {
      return object;
    }

    if (typeof object.toJSON === 'function') {
      return jsonify(object.toJSON(key), key);
    }

    var result = object instanceof Array ? [] : {};

    each(object, function(value, key){
      if (value && typeof value.toJSON === 'function') {
        value = value.toJSON(key);
      }
      result[key] = value;
    });

    return result;
  };


  return exports;
})(typeof module !== 'undefined' ? module.exports : {});



exports.Stack = (function(module){
  var objects   = require('./objects'),
      functions = require('./functions'),
      iteration = require('./iteration');

  var define        = objects.define,
      inherit       = objects.inherit,
      toArray       = functions.toArray,
      iterate       = iteration.iterate,
      Iterator      = iteration.Iterator,
      StopIteration = iteration.StopIteration;


  function StackIterator(stack){
    this.stack = stack;
    this.index = stack.length;
  }

  inherit(StackIterator, Iterator, [
    function next(){
      if (!this.index) {
        throw StopIteration;
      }
      return this.stack[--this.index];
    }
  ]);

  function Stack(iterable){
    this.empty();
    if (iterable != null) {
      iterate(iterable, this.push, this);
    }
  }

  define(Stack.prototype, [
    function push(item){
      this.items.push(item);
      this.length++;
      this.top = item;
      return this;
    },
    function pop(){
      this.length--;
      this.top = this.items[this.length - 1];
      return this.items.pop();
    },
    function empty(){
      this.length = 0;
      this.items = [];
      this.top = undefined;
    },
    function find(callback, context){
      var i = this.length;
      context || (context = this);
      while (i--) {
        if (callback.call(context, this.items[i], i, this)) {
          return this.items[i];
        }
      }
    },
    function filter(callback, context){
      var i = this.length,
          out = new Stack;

      context || (context = this);

      for (var i=0; i < this.length; i++) {
        if (callback.call(context, this[i], i, this)) {
          out.push(this[i]);
        }
      }

      return out;
    },
    function __iterator__(){
      return new StackIterator(this);
    }
  ]);

  return module.exports = Stack;
})(typeof module !== 'undefined' ? module : {});


exports.LinkedList = (function(module){
  var objects   = require('./objects'),
      iteration = require('./iteration');

  var define        = objects.define,
      inherit       = objects.inherit,
      Iterator      = iteration.Iterator,
      StopIteration = iteration.StopIteration;


  var LinkedListIterator = (function(){
    function LinkedListIterator(list){
      this.item = list.sentinel;
      this.sentinel = list.sentinel;
    }

    inherit(LinkedListIterator, Iterator, [
      function next(){
        this.item = this.item.next;
        if (this.item === this.sentinel) {
          throw StopIteration;
        }

        return this.item.data;
      }
    ]);

    return LinkedListIterator;
  })();


  var Item = (function(){
    function Item(data){
      this.data = data;
    }

    define(Item.prototype, [
      function link(item){
        item.next = this;

        return item;
      },
      function unlink(){
        var next = this.next;

        this.next = next.next;
        next.next = null;

        return this;
      },
      function clear(){
        var data = this.data;

        this.data = undefined;
        this.next = null;

        return data;
      }
    ]);

    return Item;
  })();


  var Sentinel = (function(){
    function Sentinel(){
      this.next = null;
    }

    inherit(Sentinel, Item, [
      function unlink(){
        return this;
      },
      function clear(){}
    ]);

    return Sentinel;
  })()

  return module.exports = (function(){
    function find(list, value){
      if (list.lastFind && list.lastFind.next.data === value) {
        return list.lastFind;
      }

      var item = list.tail;

      while ((item = item.next) !== list.sentinel) {
        if (item.next.data === value) {
          return list.lastFind = item;
        }
      }
    }

    function LinkedList(){
      var sentinel = new Sentinel;

      this.size = 0;
      define(this, {
        sentinel: sentinel,
        tail    : sentinel,
        lastFind: null
      });
    }

    define(LinkedList.prototype, [
      function push(value){
        this.tail = this.tail.link(new Item(value));

        return ++this.size;
      },
      function pop() {
        var tail = this.tail,
            data = tail.data;

        this.tail = tail.next;
        tail.next = null;
        tail.data = undefined;

        return data;
      },
      function insert(value, before){
        var item = find(this, before);

        if (item) {
          var inserted = new Item(value);

          inserted.next = item.next;
          item.next = inserted;

          return ++this.size;
        }

        return false;
      },
      function remove(value){
        var item = find(this, value);

        if (item) {
          item.unlink();

          return --this.size;
        }

        return false;
      },
      function replace(value, replacement){
        var item = find(this, value);

        if (item) {
          var replacer = new Item(replacement);

          replacer.next = item.next.next;
          item.next.next = null;
          item.next = replacer;
          return true;
        }

        return false;
      },
      function has(value) {
        return !!find(this, value);
      },
      function items(){
        var item = this.tail,
            array = [];

        while (item !== this.sentinel) {
          array.push(item.data);
          item = item.next;
        }

        return array;
      },
      function clear(){
        var next,
            item = this.tail;

        while (item !== this.sentinel) {
          next = item.next;
          item.clear();
          item = next;
        }

        this.tail = this.sentinel;
        this.size = 0;

        return this;
      },
      function clone(){
        var items = this.items(),
            list  = new LinkedList,
            index = items.length;

        while (index--) {
          list.push(items[index]);
        }

        return list;
      },
      function __iterator__(){
        return new LinkedListIterator(this);
      }
    ]);

    return LinkedList;
  })();
})(typeof module !== 'undefined' ? module : {});


exports.DoublyLinkedList = (function(module){
  var objects   = require('../lib/objects'),
      iteration = require('../lib/iteration');

  var define        = objects.define,
      inherit       = objects.inherit,
      Iterator      = iteration.Iterator,
      StopIteration = iteration.StopIteration;

  function DoublyLinkedListIterator(list){
    this.item = list.sentinel;
    this.sentinel = list.sentinel;
  }

  inherit(DoublyLinkedListIterator, Iterator, [
    function next(){
      this.item = this.item.next;
      if (this.item === this.sentinel) {
        throw StopIteration;
      }
      return this.item.data;
    }
  ]);


  function Item(data, prev){
    this.data = data;
    this.after(prev);
  }

  define(Item.prototype, [
    function after(item){
      this.relink(item);
      return this;
    },
    function before(item){
      this.prev.relink(item);
      return this;
    },
    function relink(prev){
      if (this.next) {
        this.next.prev = this.prev;
        this.prev.next = this.next;
      }
      this.prev = prev;
      this.next = prev.next;
      prev.next.prev = this;
      prev.next = this;
      return this;
    },
    function unlink(){
      if (this.next) {
        this.next.prev = this.prev;
      }
      if (this.prev) {
        this.prev.next = this.next;
      }
      this.prev = this.next = null;
      return this;
    },
    function clear(){
      var data = this.data;
      this.next = this.prev = this.data = null;
      return data;
    }
  ]);

  function Sentinel(list){
    this.next = this;
    this.prev = this;
  }

  inherit(Sentinel, Item, [
    function unlink(){
      return this;
    }
  ]);

  function find(list, value){
    if (list.lastFind && list.lastFind.data === value) {
      return list.lastFind;
    }

    var item = list.sentinel,
        i = 0;

    while ((item = item.next) !== list.sentinel) {
      if (item.data === value) {
        return list.lastFind = item;
      }
    }
  }

  function DoublyLinkedList(){
    this.size = 0;
    define(this, {
      sentinel: new Sentinel,
      lastFind: null
    });
  }

  define(DoublyLinkedList.prototype, [
    function first() {
      return this.sentinel.next.data;
    },
    function last() {
      return this.sentinel.prev.data;
    },
    function unshift(value){
      var item = new Item(value, this.sentinel);
      return this.size++;
    },
    function push(value){
      var item = new Item(value, this.sentinel.prev);
      return this.size++;
    },
    function insert(value, after){
      var item = find(this, after);
      if (item) {
        item = new Item(value, item);
        return this.size++;
      }
      return false;
    },
    function replace(value, replacement){
      var item = find(this, value);
      if (item) {
        new Item(replacement, item);
        item.unlink();
        return true;
      }
      return false;
    },
    function insertBefore(value, before){
      var item = find(this, before);
      if (item) {
        item = new Item(value, item.prev);
        return this.size++;
      }
      return false;
    },
    function pop(){
      if (this.size) {
        this.size--;
        return this.sentinel.prev.unlink().data;
      }
    },
    function shift() {
      if (this.size) {
        this.size--;
        return this.sentinel.next.unlink().data;
      }
    },
    function remove(value){
      var item = find(this, value);
      if (item) {
        item.unlink();
        return true;
      }
      return false;
    },
    function has(value) {
      return !!find(this, value);
    },
    function items(){
      var item = this.sentinel,
          array = [];

      while ((item = item.next) !== this.sentinel) {
        array.push(item.data);
      }

      return array;
    },
    function clear(){
      var next,
          item = this.sentinel.next;

      while (item !== this.sentinel) {
        next = item.next;
        item.clear();
        item = next;
      }

      this.lastFind = null;
      this.size = 0;
      return this;
    },
    function clone(){
      var item = this.sentinel,
          list = new DoublyLinkedList;

      while ((item = item.next) !== this.sentinel) {
        list.push(item.data);
      }
      return list;
    },
    function __iterator__(){
      return new DoublyLinkedListIterator(this);
    }
  ]);

  return module.exports = DoublyLinkedList;
})(typeof module !== 'undefined' ? module : {});


exports.HashMap = (function(module){
  var objects   = require('./objects'),
      functions = require('./functions'),
      iteration = require('./iteration'),
      DoublyLinkedList = require('./DoublyLinkedList');

  var define        = objects.define,
      inherit       = objects.inherit,
      assign        = objects.assign,
      Hash          = objects.Hash,
      bind          = functions.bind,
      iterate       = functions.iterate,
      Iterator      = iteration.Iterator,
      StopIteration = iteration.StopIteration;


  var types = assign(new Hash, {
    'string': 'strings',
    'number': 'numbers',
    'undefined': 'others',
    'boolean': 'others',
    'object': 'others'
  });


  function HashMapIterator(map, type){
    this.item = map.list.sentinel;
    this.sentinel = map.list.sentinel;
    this.type = type || 'items';
  }

  inherit(HashMapIterator, Iterator, [
    function next(){
      var item = this.item = this.item.next;

      if (item === this.sentinel) {
        throw StopIteration;
      } else if (this.type === 'key') {
        return item.key;
      } else if (this.type === 'value') {
        return item.data;
      } else {
        return [item.key, item.data];
      }
    }
  ]);

  function HashMap(iterable){
    define(this, 'list', new DoublyLinkedList);
    this.clear();
    if (iterable != null) {
      iterate(iterable, function(item){
        if (item && typeof item === 'object' && item.length  === 2) {
          this.set(item[0], item[1]);
        }
      }, this);
    }
  }

  define(HashMap.prototype, [
    function get(key){
      var item = this[types[typeof key]][key];
      if (item) {
        return item.data;
      }
    },
    function set(key, value){
      var data = this[types[typeof key]],
          item = data[key];

      if (item) {
        item.data = value;
      } else {
        this.list.push(value);
        item = this.list.sentinel.prev;
        item.key = key;
        data[key] = item;
      }
      this.size = this.list.size;
      return value;
    },
    function has(key){
      return key in this[types[typeof key]];
    },
    function remove(key){
      var data = this[types[typeof key]];

      if (key in data) {
        data[key].unlink();
        delete data[key];
        this.size = this.list.size;
        return true;
      }
      return false;
    },
    function clear(){
      define(this, {
        strings: new Hash,
        numbers: new Hash,
        others: new Hash
      });
      this.list.clear();
      this.size = 0;
    },
    function keys(){
      var out = [];
      iterate(this.__iterator__('key'), bind(_push, out));
      return out;
    },
    function values(){
      var out = [];
      iterate(this.__iterator__('value'), bind(_push, out));
      return out;
    },
    function items(){
      var out = [];
      iterate(this, bind(_push, out));
      return out;
    },
    function __iterator__(type){
      return new HashMapIterator(this, type);
    }
  ]);


  return module.exports = HashMap;
})(typeof module !== 'undefined' ? module : {});


exports.HashSet = (function(module){
  var objects   = require('./objects'),
      functions = require('./functions'),
      iteration = require('./iteration'),
      DoublyLinkedList = require('./DoublyLinkedList');

  var define        = objects.define,
      inherit       = objects.inherit,
      assign        = objects.assign,
      Hash          = objects.Hash,
      bind          = functions.bind,
      iterate       = functions.iterate,
      Iterator      = iteration.Iterator,
      StopIteration = iteration.StopIteration;


  var types = assign(new Hash, {
    'string': 'strings',
    'number': 'numbers',
    'undefined': 'others',
    'boolean': 'others',
    'object': 'others'
  });


  function HashSetIterator(set){
    this.item = set.list.sentinel;
    this.sentinel = set.list.sentinel;
  }

  inherit(HashSetIterator, Iterator, [
    function next(){
      var item = this.item = this.item.next;
      if (item === this.sentinel) {
        throw StopIteration;
      } else {
        return item.data;
      }
    }
  ]);

  function HashSet(){
    define(this, 'list', new DoublyLinkedList);
    this.clear();
  }

  define(HashSet.prototype, [
    function add(value){
      var data = this[types[typeof value]],
          item = data[value];

      if (!item) {
        this.list.push(value);
        data[value] = this.list.sentinel.prev;
        this.size = this.list.size;
      }
      return value;
    },
    function has(value){
      return value in this[types[typeof value]];
    },
    function remove(value){
      var data = this[types[typeof value]];

      if (value in data) {
        data[value].unlink();
        delete data[value];
        this.size = this.list.size;
        return true;
      }
      return false;
    },
    function clear(){
      define(this, {
        strings: new Hash,
        numbers: new Hash,
        others: new Hash
      });
      this.list.clear();
      this.size = 0;
    },
    function values(){
      var out = [];
      iterate(this, bind(_push, out));
      return out;
    },
    function __iterator__(){
      return new HashSetIterator(this);
    }
  ]);

  return module.exports = HashSet;
})(typeof module !== 'undefined' ? module : {});


exports.ObjectMap = (function(module){
  var objects          = require('./objects'),
      functions        = require('./functions'),
      iteration        = require('./iteration'),
      utility          = require('./utility'),
      DoublyLinkedList = require('./DoublyLinkedList');

  var define        = objects.define,
      inherit       = objects.inherit,
      assign        = objects.assign,
      hasOwn        = objects.hasOwn,
      Hash          = objects.Hash,
      uid           = utility.uid,
      bind          = functions.bind,
      iterate       = functions.iterate,
      Iterator      = iteration.Iterator,
      StopIteration = iteration.StopIteration;


  function ObjectMapIterator(map, type){
    this.item = map.list.sentinel;
    this.sentinel = map.list.sentinel;
    this.type = type || 'items';
  }

  inherit(ObjectMapIterator, Iterator, [
    function next(){
      var item = this.item = this.item.next;

      if (item === this.sentinel) {
        throw StopIteration;
      } else if (this.type === 'key') {
        return item.key;
      } else if (this.type === 'value') {
        return item.data;
      } else {
        return [item.key, item.data];
      }
    }
  ]);


  function tag(map, object){
    if (hasOwn(object, map.tag)) {
      return object[map.tag];
    }
    var id = uid();
    try {
      define(object, map.tag, id);
    } catch (e) {
      var index = map.frozenKeys.indexOf(object);
      if (~index) {
        return map.frozenIds[index];
      }
      map.frozenIds[index] = id;
    }
    return id;
  }

  function ObjectMap(iterable){
    define(this, {
      list: new DoublyLinkedList,
      tag: uid()
    });

    this.clear();
    if (iterable != null) {
      iterate(iterable, function(item){
        if (item && typeof item === 'object' && item.length  === 2) {
          this.set(item[0], item[1]);
        }
      }, this);
    }
  }

  define(ObjectMap.prototype, [
    function get(key){
      var item = this.objects[tag(this, key)];
      if (item) {
        return item.data;
      }
    },
    function set(key, value){
      var id = tag(this, key),
          item = this.objects[id];

      if (item) {
        item.data = value;
      } else {
        this.list.push(value);
        item = this.list.sentinel.prev;
        item.key = key;
        this.objects[id] = item;
      }
      this.size = this.list.size;
      return value;
    },
    function has(key){
      return !!this.objects[tag(this, key)];
    },
    function remove(key){
      var id = tag(this, key),
          item = this.objects[id];

      if (item) {
        item.unlink();
        this.objects[id] = null;
        this.size = this.list.size;
        return true;
      }
      return false;
    },
    function clear(){
      define(this, 'objects', new Hash);
      define(this, 'frozenKeys', []);
      define(this, 'frozenIds', []);
      this.list.clear();
      this.size = 0;
    },
    function forEach(callback, context){
      var item = this.list.sentinel,
          sentinel = item;

      context = context || this;
      while (item.next !== sentinel) {
        item = item.next;
        callback.call(context, item.data, item.key, this);
      }
    },
    function keys(){
      var out = [];
      iterate(this.__iterator__('key'), bind(_push, out));
      return out;
    },
    function values(){
      var out = [];
      iterate(this.__iterator__('value'), bind(_push, out));
      return out;
    },
    function items(){
      var out = [];
      iterate(this, bind(_push, out));
      return out;
    },
    function __iterator__(type){
      return new ObjectMapIterator(this, type);
    }
  ]);


  return module.exports = ObjectMap;
})(typeof module !== 'undefined' ? module : {});


exports.Emitter = (function(module){
  var objects   = require('./objects'),
      iteration = require('./iteration'),
      utility   = require('./utility'),
      ObjectMap = require('./ObjectMap');

  var define = objects.define,
      Hash   = objects.Hash,
      each   = iteration.each;



  function Emitter(){
    '_events' in this || define(this, '_events', new Hash);
  }

  define(Emitter.prototype, [
    function on(type, handler, context){
      var events = this._events;
      context = context || this;
      each(type.split(/\s+/), function(event){
        if (!(event in events)) {
          events[event] = new ObjectMap;
        }
        events[event].set(handler, context);
      });
    },
    function off(type, handler){
      var events = this._events;
      each(type.split(/\s+/), function(event){
        if (event in events) {
          events[event].remove(handler);
        }
      });
    },
    function once(type, handler, context){
      context = context || this;
      this.on(type, function one(){
        this.off(type, one);
        handler.apply(context, arguments);
      });
    },
    function emit(type, a, b, c, d){
      var handlers = this._events['*'];
      if (handlers) {
        handlers.forEach(function(context, handler){
          handler.call(context, type, a, b, c, d);
        });
      }

      handlers = this._events[type];
      if (handlers) {
        handlers.forEach(function(context, handler){
          handler.call(context, a, b, c, d);
        });
      }
    }
  ]);

  return module.exports = Emitter;
})(typeof module !== 'undefined' ? module : {});


exports.Feeder = (function(module){
  var objects = require('./objects'),
      Queue   = require('./Queue');

  var define = objects.define;


  function Feeder(callback, context, pace){
    var self = this;
    this.queue = new Queue;
    this.active = false;
    this.pace = pace || 5;
    this.feeder = function feeder(){
      var count = Math.min(self.pace, self.queue.length);

      while (self.active && count--) {
        callback.call(context, self.queue.shift());
      }

      if (!self.queue.length) {
        self.active = false;
      } else if (self.active) {
        setTimeout(feeder, 15);
      }
    };
  }

  define(Feeder.prototype, [
    function push(item){
      this.queue.push(item);
      if (!this.active) {
        this.active = true;
        setTimeout(this.feeder, 15);
      }
      return this;
    },
    function pause(){
      this.active = false;
    }
  ]);

  return module.exports = Feeder;
})(typeof module !== 'undefined' ? module.exports : {});


exports.PropertyList = (function(module){
  var objects   = require('./objects'),
      iteration = require('./iteration');

  var isObject      = objects.isObject,
      define        = objects.define,
      inherit       = objects.inherit,
      Hash          = objects.Hash,
      Iterator      = iteration.Iterator,
      StopIteration = iteration.StopIteration;


  var PropertyListIterator = (function(){
    var types = {
      keys: 0,
      values: 1,
      attributes: 2
    };

    function PropertyListIterator(list, type){
      this.list = list;
      this.type = type ? types[type] : 'items';
      this.index = 0;
    }

    inherit(PropertyListIterator, Iterator, [
      function next(){
        var props = this.list.props, property;
        while (!property) {
          if (this.index >= props.length) {
            throw StopIteration;
          }
          property = props[this.index++];
        }
        return this.type === 'items' ? property : property[this.type];
      }
    ]);

    return PropertyListIterator;
  })();


  function PropertyList(){
    this.hash = new Hash;
    this.props = [];
    this.holes = 0;
    this.length = 0;
  }

  define(PropertyList.prototype, [
    function get(key){
      var index = this.hash['$'+key];
      if (index !== undefined) {
        return this.props[index][1];
      }
    },
    function set(key, value){
      if (key == null) {
        throw new TypeError('Provided null or undefined key to PropertyList#set');
      }
      var name = '$'+key,
          index = this.hash[name];

      if (index === undefined) {
        index = this.hash[name] = this.props.length;
        this.props[index] = [key, value, 7];
        this.length++;
      } else {
        this.props[index][1] = value;
      }

      return true;
    },
    function query(key){
      var index = this.hash['$'+key];
      return index === undefined ? null : this.props[index][2];
    },
    function update(key, attr){
      var index = this.hash['$'+key];

      if (index !== undefined) {
        this.props[index][2] = attr;
        return true;
      }

      return false;
    },
    function describe(key){
      var index = this.hash['$'+key];
      return index === undefined ? null : this.props[index];
    },
    (function(){
      return function define(key, value, attr){
        if (key == null) {
          throw new TypeError('Provided null or undefined key to PropertyList#define');
        }

        var name = '$'+key,
            index = this.hash[name];

        if (index === undefined) {
          index = this.hash[name] = this.props.length;
          this.props[index] = [key, value, attr];
          this.length++;
        } else {
          var prop = this.props[index];
          prop[1] = value;
          prop[2] = attr;
        }

        return this;
      };
    })(),
    function remove(key){
      var name = '$'+key,
          index = this.hash[name];

      if (index !== undefined) {
        this.hash[name] = undefined;
        this.props[index] = undefined;
        this.length--;
        return true;
      }

      return false;
    },
    function has(key){
      return this.hash['$'+key] !== undefined;
    },
    function setProperty(prop){
      if (prop[0] == null) {
        throw new TypeError('Provided null or undefined key to PropertyList#setProperty');
      }

      var name = '$'+prop[0],
          index = this.hash[name];

      if (index === undefined) {
        index = this.hash[name] = this.props.length;
        this.length++;
      }

      this.props[index] = prop;
    },
    function hasAttribute(key, mask){
      var attr = this.query('$'+key);
      if (attr !== null) {
        return (attr & mask) > 0;
      }
    },
    function compact(){
      var props = this.props,
          len = props.length,
          index = 0,
          prop;

      this.hash = new Hash;
      this.props = [];
      this.holes = 0;

      for (var i=0; i < len; i++) {
        if (prop = props[i]) {
          this.props[index] = prop;
          this.hash['$'+prop[0]] = index++;
        }
      }
    },
    function each(callback, context){
      var len = this.props.length,
          index = 0,
          prop;

      context || (context = this);

      for (var i=0; i < len; i++) {
        if (prop = this.props[i]) {
          callback.call(context, prop);
        }
      }
    },
    function map(callback, context){
      var out = [],
          len = this.props.length,
          index = 0,
          prop;

      context || (context = this);

      for (var i=0; i < len; i++) {
        if (prop = this.props[i]) {
          out[index] = callback.call(context, prop);
        }
      }

      return out;
    },
    function translate(callback, context){
      var out = new PropertyList,
          index = 0;

      out.length = this.length;
      context || (context = this);

      this.each(function(prop){
        prop = callback.call(context, prop);
        out.props[index++] = prop;
        out.hash['$'+prop[0]] = index;
      });

      return out;
    },
    function filter(callback, context){
      var out = new PropertyList,
          index = 0;

      context || (context = this);

      this.each(function(prop){
        if (callback.call(context, prop)) {
          out.props[index] = prop;
          out.hash['$'+prop[0]] = index++;
        }
      });

      return out;
    },
    function clone(deep){
      return this.translate(function(prop){
        return deep ? prop.slice() : prop;
      });
    },
    function keys(){
      return this.map(function(prop){
        return prop[0];
      });
    },
    function values(){
      return this.map(function(prop){
        return prop[1];
      });
    },
    function items(){
      return this.map(function(prop){
        return prop.slice();
      });
    },
    function merge(list){
      iterate(list, this.define, this);
    },
    function __iterator__(type){
      return new PropertyListIterator(this, type);
    }
  ]);

  if (require('util')) {
    void function(){
      var insp = require('util').inspect;

      function Token(value){
        this.value = value + '';
      }

      Token.prototype.inspect = function(){ return this.value };

      define(PropertyList.prototype, function inspect(){
        var out = new Hash;

        this.each(function(prop){
          var attrs = []
          if (typeof prop[0] === 'string') {
            var key = prop[0];
            if (!(prop[2] & 0x01)) {
              attrs.push('hidden');
            }
          } else {
            var key = '_@_@'+prop[0].Name;
            if (prop[0].Private) {
              attrs.push('private');
            }
          }

          if (!(prop[2] & 0x02)) {
            attrs.push('frozen');
          }

          if (prop[2] & 0x08) {
            attrs.push('accessor');
          } else if (!(prop[2] & 0x04)) {
            attrs.push('readonly');
          }

          out[key] = new Token(attrs.join('/') + ' ' + (isObject(prop[1]) ? prop[1].BuiltinBrand : prop[1]));
        });

        return insp(out).replace(/'_@_@(\w+)'/g, '@$1');
      });
    }();
  }

  return module.exports = PropertyList;
})(typeof module !== 'undefined' ? module : {});


exports.buffers = (function(global, exports){
  if ('DataView' in global) {
    exports.DataView = global.DataView;
    exports.ArrayBuffer = global.ArrayBuffer;
    return exports;
  }

  var objects = require('./objects'),
      define = objects.define,
      create = objects.create,
      hide = objects.hide;

  var log = Math.log,
      pow = Math.pow,
      LN2 = Math.LN2,
      _slice = [].slice,
      chr = String.fromCharCode;

  var endian = {
    little: { 1: [0],
              2: [1, 0],
              4: [3, 2, 1, 0],
              8: [7, 6, 5, 4, 3, 2, 1, 0] },
    big:    { 1: [0],
              2: [0, 1],
              4: [0, 1, 2, 3],
              8: [0, 1, 2, 3, 4, 5, 6, 7] }
  };


  var chars = create(null),
      indices = [];

  void function(i){
    for (i = 0; i < 0x100; ++i) {
      chars[indices[i] = chr(i)] = i;
      if (i >= 0x80) {
        chars[chr(0xf700 + i)] = i;
      }
    }
  }();


  function DataView(buffer, byteOffset, byteLength){
    if (!(buffer instanceof ArrayBuffer)) {
      throw new TypeError('DataView must be initialized with an ArrayBuffer');
    }

    this.byteOffset = byteOffset === undefined ? buffer.byteOffset | 0 : byteOffset >>> 0;
    this.byteLength = byteLength === undefined ? (buffer.byteLength - this.byteOffset) | 0 : byteLength >>> 0;
    this.buffer = buffer;
  }

  exports.DataView = DataView;


  define(DataView.prototype, [
    function getUint8(byteOffset){
      var b = this.buffer._data,
          off = byteOffset + this.byteOffset;
      return b[off];
    },
    function getUint16(byteOffset, littleEndian){
      var b = this.buffer._data,
          o = (littleEndian ? endian.little : endian.big)[2],
          off = byteOffset + this.byteOffset;
      return (b[off + o[1]] << 8) | b[off + o[0]];
    },
    function getUint32(byteOffset, littleEndian){
      var b = this.buffer._data,
          o = (littleEndian ? endian.little : endian.big)[4],
          off = byteOffset + this.byteOffset;
      return (((((b[off + o[3]] << 8) | b[off + o[2]]) << 8) | b[off + o[1]]) << 8) | b[off + o[0]];
    },
    function getInt8(byteOffset){
      var b = this.getUint8(byteOffset);
      return b & 0x80 ? b - 0x100 : b;
    },
    function getInt16(byteOffset, littleEndian){
      var b = this.getUint16(byteOffset, littleEndian);
      return b & 0x8000 ? b - 0x10000 : b;
    },
    function getInt32(byteOffset, littleEndian){
      var b = this.getUint32(byteOffset, littleEndian);
      return b & 0x80000000 ? b - 0x100000000 : b;
    },
    function getFloat32(byteOffset, littleEndian){
      return readFloat(this.buffer._data, this.byteOffset + byteOffset, littleEndian, 23, 4);
    },
    function getFloat64(byteOffset, littleEndian){
      return readFloat(this.buffer._data, this.byteOffset + byteOffset, littleEndian, 52, 8);
    },

    function setUint8(byteOffset, value){
      var b = this.buffer._data,
          off = byteOffset + this.byteOffset;

      boundsCheck(off, 1, b.length);

      b[off] = value & 0xff;
    },
    function setUint16(byteOffset, value, littleEndian){
      var b = this.buffer._data,
          o = (littleEndian ? endian.little : endian.big)[2],
          off = byteOffset + this.byteOffset;

      boundsCheck(off, 2, b.length);

      b[off + o[0]] =  value & 0x00ff;
      b[off + o[1]] = (value & 0xff00) >>> 8;
    },
    function setUint32(byteOffset, value, littleEndian){
      var b = this.buffer._data,
          o = (littleEndian ? endian.little : endian.big)[4],
          off = byteOffset + this.byteOffset;

      boundsCheck(off, 4, b.length);

      b[off + o[0]] =  value & 0x000000ff;
      b[off + o[1]] = (value & 0x0000ff00) >>> 8;
      b[off + o[2]] = (value & 0x00ff0000) >>> 16;
      b[off + o[3]] = (value & 0xff000000) >>> 24;
    },
    function setInt8(byteOffset, value){
      if (value < 0) value |= 0x100;
      this.setUint8(byteOffset, value);
    },
    function setInt16(byteOffset, value, littleEndian){
      if (value < 0) value |= 0x10000;
      this.setUint16(byteOffset, value, littleEndian);
    },
    function setInt32(byteOffset, value, littleEndian){
      if (value < 0) value |= 0x100000000;
      this.setUint32(byteOffset, value, littleEndian);
    },
    function setFloat32(byteOffset, value, littleEndian){
      writeFloat(this.buffer._data, this.byteOffset + byteOffset, value, littleEndian, 23, 4);
    },
    function setFloat64(byteOffset, value, littleEndian){
      writeFloat(this.buffer._data, this.byteOffset + byteOffset, value, littleEndian, 52, 8);
    }
  ]);

  function boundsCheck(offset, size, max){
    if (offset < 0) {
      throw new RangeError('Tried to write to a negative index');
    } else if (offset + size > max) {
      throw new RangeError('Tried to write '+size+' bytes past the end of a buffer at index '+offset+' of '+max);
    }
  }

  var ArrayBuffer = exports.ArrayBuffer = (function(){
    function readString(string){
      var array = [],
          cycles = string.length % 8,
          i = 0;

      while (cycles--) {
        array[i] = chars[string[i++]];
      }

      cycles = string.length >> 3;

      while (cycles--) {
        array.push(chars[string[i++]],  // 1
                   chars[string[i++]],  // 2
                   chars[string[i++]],  // 3
                   chars[string[i++]],  // 4
                   chars[string[i++]],  // 5
                   chars[string[i++]],  // 6
                   chars[string[i++]],  // 7
                   chars[string[i++]]); // 8
      }

      return array;
    }

    function writeString(array){
      try {
        return chr.apply(null, array);
      } catch (err) {}

      var string = '',
          cycles = array.length % 8,
          i = 0;

      while (cycles--) {
        string += indices[array[i++]];
      }

      cycles = array.length >> 3;

      while (cycles--) {
        string += indices[array[i++]]  // 1
                + indices[array[i++]]  // 2
                + indices[array[i++]]  // 3
                + indices[array[i++]]  // 4
                + indices[array[i++]]  // 5
                + indices[array[i++]]  // 6
                + indices[array[i++]]  // 7
                + indices[array[i++]]; // 8
      }

      return string;
    }

    function zerodArray(size){
      var data = new Array(size);
      while (size--) {
        data[size] = 0;
      }
      return data;
    }


    function ArrayBuffer(len){
      if (len == null) {
        this._data = [];
      } else {
        var type = typeof len;
        if (type === 'number') {
          this._data = zerodArray(len);
        } else if (type === 'string') {
          this._data = readString(len);
        } else if (type === 'object') {
          if (len instanceof ArrayBuffer) {
            this._data = len._data.slice();
          } else if (len.length) {
            this._data = _slice.call(len);
          } else if ((len /= 1) > 0) {
            this._data = zerodArray(len);
          }
        }
      }

      if (!this._data) {
        throw new TypeError('unable to convert input to size or buffer');
      }

      hide(this, '_data');
      this.byteLength = this._data.length;
    }

    define(ArrayBuffer.prototype, [
      function slice(begin, end){
        if (begin == null) {
          begin = 0;
        } else if (begin < 0) {
          begin += this.byteLength;
          if (begin < 0) begin = 0;
        } else if (begin >= this.byteLength) {
          begin = this.byteLength;
        }

        if (end == null) {
          end = this.byteLength;
        } else if (end < 0) {
          end += this.byteLength;
          if (end < 0) end = 0;
        } else if (end >= this.byteLength) {
          end = this.byteLength;
        }


        var ab = new ArrayBuffer(0);
        ab._data = this._data.slice(begin, end);
        ab.byteLength = ab._data.length;
        return ab;
      }
    ]);

    return ArrayBuffer;
  })();


  // Copyright Joyent, Inc. and other Node contributors.
  //
  // Permission is hereby granted, free of charge, to any person obtaining a
  // copy of this software and associated documentation files (the
  // "Software"), to deal in the Software without restriction, including
  // without limitation the rights to use, copy, modify, merge, publish,
  // distribute, sublicense, and/or sell copies of the Software, and to permit
  // persons to whom the Software is furnished to do so, subject to the
  // following conditions:
  //
  // The above copyright notice and this permission notice shall be included
  // in all copies or substantial portions of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
  // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
  // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
  // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
  // USE OR OTHER DEALINGS IN THE SOFTWARE.

  function readFloat(buffer, offset, littleEndian, mLen, bytes){
    var e, m,
        eLen = bytes * 8 - mLen - 1,
        eMax = (1 << eLen) - 1,
        eBias = eMax >> 1,
        nBits = -7,
        i = littleEndian ? bytes - 1 : 0 ,
        d = littleEndian ? -1 : 1,
        s = buffer[offset + i];

    i += d;

    e = s & ((1 << (-nBits)) - 1);
    s >>= (-nBits);
    nBits += eLen;
    for (; nBits > 0; e = e * 0x100 + buffer[offset + i], i += d, nBits -= 8);

    m = e & ((1 << (-nBits)) - 1);
    e >>= (-nBits);
    nBits += mLen;
    for (; nBits > 0; m = m * 0x100 + buffer[offset + i], i += d, nBits -= 8);

    if (e === 0) {
      e = 1 - eBias;
    } else if (e === eMax) {
      return m ? NaN : s ? -Infinity : Infinity;
    } else {
      m = m + pow(2, mLen);
      e = e - eBias;
    }
    return (s ? -1 : 1) * m * pow(2, e - mLen);
  }

  function writeFloat(buffer, offset, value, littleEndian, mLen, bytes){
    var e, m, c,
        eLen = bytes * 8 - mLen - 1,
        eMax = (1 << eLen) - 1,
        eBias = eMax >> 1,
        rt = (mLen === 23 ? pow(2, -24) - pow(2, -77) : 0),
        i = littleEndian ? 0 : bytes - 1,
        d = littleEndian ? 1 : -1,
        s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

    value < 0 && (value = -value);

    if (isNaN(value) || value === Infinity) {
      m = isNaN(value) ? 1 : 0;
      e = eMax;
    } else {
      e = (log(value) / LN2) | 0;
      if (value * (c = pow(2, -e)) < 1) {
        e--;
        c *= 2;
      }
      if (e + eBias >= 1) {
        value += rt / c;
      } else {
        value += rt * pow(2, 1 - eBias);
      }
      if (value * c >= 2) {
        e++;
        c /= 2;
      }

      if (e + eBias >= eMax) {
        m = 0;
        e = eMax;
      } else if (e + eBias >= 1) {
        m = (value * c - 1) * pow(2, mLen);
        e = e + eBias;
      } else {
        m = value * pow(2, eBias - 1) * pow(2, mLen);
        e = 0;
      }
    }

    for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 0x100, mLen -= 8);

    e = (e << mLen) | m;
    eLen += mLen;
    for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 0x100, eLen -= 8);

    buffer[offset + i - d] |= s * 0x80;
  }

  return exports;
})(this, typeof module !== 'undefined' ? exports : {});


exports.engine = (function(exports){
  "use strict";
  var Emitter = require('./lib/Emitter');
  var inherit = require('./lib/objects').inherit;


  function Engine(){
    Emitter.call(this);
    this.realms = [];
    this.changeRealm(null);
    this.changeContext(null);
  }

  inherit(Engine, Emitter, [
    function addRealm(realm){
      this.realms.push(realm);
    },
    function changeRealm(realm){
      if (realm !== this.activeRealm) {
        if (this.activeRealm) {
          this.activeRealm.active = false;
          this.activeRealm.emit('deactivate');
        }

        this.activeRealm = realm;

        if (realm) {
          this.activeGlobal = realm.global;
          this.activeIntrinsics = realm.intrinsics;
          realm.active = true;
          realm.emit('activate');
        } else {
          this.activeGlobal = null;
          this.activeIntrinsics = null;
        }

        this.emit('realm-change', realm);
      }
    },
    function changeContext(context){
      if (context !== this.activeContext) {
        this.activeContext = context;
        this.emit('context-change', context);
      }
    }
  ]);

  exports.Engine = Engine;
  exports.engine = new Engine;

  return exports;
})(typeof module !== 'undefined' ? module.exports : {});


exports.constants = (function(exports){
  "use strict";
  var objects = require('./lib/objects');

  var create  = objects.create,
      define  = objects.define,
      ownKeys = objects.keys,
      Hash    = objects.Hash;

  function Constants(array){
    this.hash = new Hash;
    for (var i=0; i < array.length; i++) {
      this.hash[array[i]] = i;
    }
    this.array = array;
  }

  define(Constants.prototype, [
    function getIndex(key){
      return this.hash[key];
    },
    function getKey(index){
      return this.array[index];
    }
  ]);



  function Token(name){
    this.name = name;
  }

  define(Token.prototype, [
    function toString(){
      return this.name;
    },
    function inspect(){
      return '['+this.name+']';
    }
  ]);


  function BuiltinBrand(name){
    this.name = name;
    this.brand = '[object '+name+']';
  }

  define(BuiltinBrand.prototype, [
    function toString(){
      return this.name;
    },
    function inspect(){
      return this.name;
    }
  ]);

  exports.BINARYOPS = new Constants(['instanceof', 'in', '==', '!=', '===', '!==', '<', '>',
                                   '<=', '>=', '*', '/','%', '+', '-', '<<', '>>', '>>>', '|', '&', '^', 'string+']);
  exports.UNARYOPS = new Constants(['delete', 'void', 'typeof', '+', '-', '~', '!']);
  exports.FUNCTYPE = new Constants(['NORMAL', 'METHOD', 'ARROW' ]);
  exports.SCOPE = new Constants(['EVAL', 'FUNCTION', 'GLOBAL', 'MODULE' ]);

  exports.SYMBOLS = {
    Break            : new Token('Break'),
    Pause            : new Token('Pause'),
    Throw            : new Token('Throw'),
    Empty            : new Token('Empty'),
    Resume           : new Token('Resume'),
    Return           : new Token('Return'),
    Normal           : new Token('Normal'),
    Abrupt           : new Token('Abrupt'),
    Builtin          : new Token('Builtin'),
    Continue         : new Token('Continue'),
    Reference        : new Token('Reference'),
    Completion       : new Token('Completion'),
    Uninitialized    : new Token('Uninitialized')
  };

  var E = 0x1,
      C = 0x2,
      W = 0x4,
      A = 0x8;

  exports.ATTRIBUTES = {
    ENUMERABLE  : E,
    CONFIGURABLE: C,
    WRITABLE    : W,
    ACCESSOR    : A,
    ___: 0,
    E__: E,
    _C_: C,
    EC_: E | C,
    __W: W,
    E_W: E | W,
    _CW: C | W,
    ECW: E | C | W,
    __A: A,
    E_A: E | A,
    _CA: C | A,
    ECA: E | C | A
  };

  exports.AST = new Constants(ownKeys(require('esprima').Syntax));

  return exports;
})(typeof module !== 'undefined' ? module.exports : {});


exports.errors = (function(errors, messages, exports){
  "use strict";
  var objects   = require('./lib/objects'),
      constants = require('./constants');

  var define    = objects.define,
      inherit   = objects.inherit;

  function Exception(name, type, message){
    var args = {},
        argNames = [],
        src = '';

    for (var i=0; i < message.length; i++) {
      var str = message[i];
      if (str[0] === '$') {
        if (!args.hasOwnProperty(str))
          argNames.push(str);
        src += '+'+str;
      } else {
        src += '+"'+str.replace(/["\\\n]/g, '\\$0')+'"';
      }
    }

    this.name = name;
    this.type = type;
    return new Function('e', 'return function '+name+'('+argNames.join(', ')+'){ return '+src.slice(1)+'; }')(this);
  }



  for (var name in messages) {
    for (var type in messages[name]) {
      errors[type] = new Exception(name, type, messages[name][type]);
    }
  }




  // ##################
  // ### Completion ###
  // ##################

  function Completion(type, value, target){
    this.type = type;
    this.value = value;
    this.target = target;
  }

  exports.Completion = Completion;

  define(Completion.prototype, {
    Completion: true
  });

  define(Completion.prototype, [
    function toString(){
      return this.value;
    },
    function valueOf(){
      return this.value;
    }
  ]);


  function AbruptCompletion(type, value, target){
    this.type = type;
    this.value = value;
    this.target = target;
  }

  inherit(AbruptCompletion, Completion, {
    Abrupt: true
  });

  exports.AbruptCompletion = AbruptCompletion;

  function $$MakeException(type, args){
    if (!(args instanceof Array)) {
      args = [args];
    }
    var error = errors[type];
    return exports.createError(error.name, type, error.apply(null, args));
  }

  exports.$$MakeException = $$MakeException;


  function $$ThrowException(type, args){
    return new AbruptCompletion('throw', $$MakeException(type, args));
  }

  exports.$$ThrowException = $$ThrowException;


  return exports;
})({}, {
  TypeError: {
    assertion_failed               : ["$0", " failed"],
    bad_argument                   : ["$0", " received a bad argument, expecting a ", "$1"],
    cyclic_proto                   : ["Cyclic __proto__ value"],
    incompatible_method_receiver   : ["Method ", "$0", " called on incompatible receiver ", "$1"],
    invalid_lhs_in_assignment      : ["Invalid left-hand side in assignment"],
    invalid_lhs_in_for_in          : ["Invalid left-hand side in for-in"],
    invalid_lhs_in_postfix_op      : ["Invalid left-hand side expression in postfix operation"],
    invalid_lhs_in_prefix_op       : ["Invalid left-hand side expression in prefix operation"],
    redeclaration                  : ["$0", " '", "$1", "' has already been declared"],
    uncaught_exception             : ["Uncaught ", "$0"],
    stack_trace                    : ["Stack Trace:\n", "$0"],
    called_non_callable            : ["$0", " is not a function"],
    property_not_function          : ["Property '", "$0", "' is not a function"],
    not_constructor                : ["$0", " is not a constructor"],
    construct_non_constructor      : ["Cannot construct non-function ", "$0"],
    cannot_convert_to_primitive    : ["Cannot convert object to primitive value"],
    cannot_convert_to_primitive2   : ["$0", " cannot convert object to primitive value"],
    with_expression                : ["$0", " has no properties"],
    illegal_invocation             : ["Illegal invocation"],
    invalid_in_operator_use        : ["Cannot use 'in' operator to search for '", "$0", "' in ", "$1"],
    instanceof_function_expected   : ["Expecting a function in instanceof check, but got ", "$0"],
    instanceof_nonobject_proto     : ["Function has non-object prototype '", "$0", "' in instanceof check"],
    construct_nonobject_proto      : ["Function has non-object prototype ", "$0"],
    null_to_object                 : ["Cannot convert null to object"],
    undefined_to_object            : ["Cannot convert undefined to object"],
    object_not_coercible           : ["$0", " cannot convert ", "$1", " to an object"],
    reduce_no_initial              : ["Reduce of empty array with no initial value"],
    callback_must_be_callable      : ["$0", " requires a function callback"],
    getter_must_be_callable        : ["Getter must be a function: ", "$0"],
    setter_must_be_callable        : ["Setter must be a function: ", "$0"],
    value_and_accessor             : ["A property cannot both have accessors and be writable or have a value, ", "$0"],
    proto_object_or_null           : ["Object prototype may only be an Object or null"],
    property_desc_object           : ["Property description must be an object: ", "$0"],
    redefine_disallowed            : ["$0", " cannot redefine property '", "$1", "'"],
    delete_disallowed              : ["$0", " cannot delete property '", "$1", "'"],
    apply_wrong_args               : ["Invalid arguments used in apply"],
    define_disallowed              : ["Cannot define property:", "$0", ", object is not extensible."],
    non_extensible_proto           : ["$0", " is not extensible"],
    invalid_weakmap_key            : ["Invalid value used as weak map key"],
    invalid_json                   : ["String '", "$0", "' is not valid JSON"],
    circular_structure             : ["Converting circular structure to JSON"],
    called_on_non_function         : ["$0", " called on non-function"],
    called_on_non_object           : ["$0", " called on non-object"],
    called_on_null_or_undefined    : ["$0", " called on null or undefined"],
    delete_array_index             : ["$0", " cannot delete index '", "$1", "'"],
    strict_delete_property         : ["Cannot delete property '", "$0", "' of ", "$1", " in strict mode"],
    super_delete_property          : ["Cannot delete property '", "$0", "' from super"],
    strict_cannot_assign           : ["Cannot assign to read only property '", "$0", "' in strict mode"],
    strict_poison_pill             : ["'caller', 'callee', and 'arguments' properties may not be accessed on strict mode functions or the arguments objects for calls to them"],
    object_not_extensible          : ["Can't add property ", "$0", ", object is not extensible"],
    proxy_prototype_inconsistent        : ["Cannot report a prototype value that is inconsistent with target prototype value"],
    proxy_extensibility_inconsistent    : ["Cannot report a non-extensible object as extensible or vice versa"],
    proxy_configurability_inconsistent  : ["Cannot report innacurate configurability for property '", "$0"],
    proxy_enumerate_properties          : ["Enumerate trap failed to include non-configurable enumerable property '", "$0", "'"],
    proxy_non_callable_trap             : ["Proxy trap for ", "$0", " is not a function"],
    proxy_incompatible_descriptor       : ["Proxy trap ", "$0", " returned an incompatible descriptor"],
    proxy_inconsistent                  : ["Proxy trap ", "$0", " returned an invalid value for a non-configurable property"],
    proxy_non_extensible                : ["Proxy trap ", "$0", " returned an invalid value for a non-extensible object"],
    proxy_duplicate                     : ["Proxy trap ", "$0", " returned duplicate property"],
    proxy_non_object_result             : ["Proxy trap ", "$0", " returned non-object result"],
    missing_fundamental_trap            : ["Proxy handler is missing fundamental trap ", "$0"],
    non_object_superclass               : ["non-object super class"],
    non_object_superproto               : ["non-object super prototype"],
    invalid_super_binding               : ["object has no super binding"],
    not_generic                         : ["$0", " is not generic and was called on an invalid target"],
    spread_non_object                   : ["Expecting an object as spread argument, but got ", "$0"],
    called_on_incompatible_object       : ["$0", " called on incompatible object"],
    double_initialization               : ["Initializating an already initialized ", "$0"],
    construct_arrow_function            : ["Arrow functions cannot be constructed"],
    generator_executing                 : ["'", "$0", "' called on executing generator"],
    generator_closed                    : ["'", "$0", "' called on closed generator"],
    generator_send_newborn              : ["Sent value into newborn generator"],
    unnamed_symbol                      : ["Symbol must have a name"],
    symbol_redefine                     : ["Symbol '", "$0", "' defined multiple times"],
    missing_fundamental_handler         : ["Exotic object missing fundamental handler for '", "$0", "'"],
    buffer_unaligned_offset             : ["$0", " was called with an unalign offset"],
    buffer_out_of_bounds                : ["$0", " was was called with an out of bounds length and/or offset"],
    buffer_unaligned_length             : ["$0", " was called with an unaligned length"],
    import_not_symbol                   : ["Imported object is not a symbol ", "$0"]
  },
  ReferenceError: {
    unknown_internal_function      : ["Referenced non-existent internal function ", "$0"],
    unknown_wellknown_symbol       : ["Referenced unknown well known symbol ", "$0"],
    undefined_symbol               : ["Referenced undefined symbol @", "$0"],
    unknown_label                  : ["Undefined label '", "$0", "'"],
    undefined_method               : ["Object ", "$1", " has no method '", "$0", "'"],
    not_defined                    : ["$0", " is not defined"],
    uninitialized_const            : ["$0", " is not initialized"],
    non_object_property_load       : ["Cannot read property '", "$0", "' of ", "$1"],
    non_object_property_store      : ["Cannot set property '", "$0", "' of ", "$1"],
    non_object_property_call       : ["Cannot call method '", "$0", "' of ", "$1"],
    no_setter_in_callback          : ["Cannot set property ", "$0", " of ", "$1", " which has only a getter"]
  },
  RangeError: {
    invalid_radix                  : ["Radix must be a number between 2 and 36"],
    invalid_fraction               : ["Fraction must be a number between 0 and 20"],
    invalid_precision              : ["Precision must be a number between 1 and 21"],
    invalid_array_length           : ["Invalid array length"],
    invalid_repeat_count           : ["Invalid repeat count"],
    stack_overflow                 : ["Maximum call stack size exceeded"],
    invalid_time_value             : ["Invalid time value"]
  },
  SyntaxError : {
    multiple_defaults_in_switch    : ["More than one default clause in switch statement"],
    newline_after_throw            : ["Illegal newline after throw"],
    no_catch_or_finally            : ["Missing catch or finally after try"],
    malformed_regexp               : ["Invalid regular expression: /", "$0", "/: ", "$1"],
    unterminated_regexp            : ["Invalid regular expression: missing /"],
    regexp_flags                   : ["Cannot supply flags when constructing one RegExp from another"],
    unexpected_token               : ["Unexpected token ", "$0"],
    unexpected_token_number        : ["Unexpected number"],
    unexpected_token_string        : ["Unexpected string"],
    unexpected_token_identifier    : ["Unexpected identifier"],
    unexpected_reserved            : ["Unexpected reserved word"],
    unexpected_strict_reserved     : ["Unexpected strict mode reserved word"],
    unexpected_eos                 : ["Unexpected end of input"],
    invalid_regexp_flags           : ["Invalid flags supplied to RegExp constructor '", "$0", "'"],
    invalid_regexp                 : ["Invalid RegExp pattern /", "$0", "/"],
    illegal_break                  : ["Illegal break statement"],
    illegal_continue               : ["Illegal continue statement"],
    illegal_return                 : ["Illegal return statement"],
    illegal_let                    : ["Illegal let declaration outside extended mode"],
    illegal_access                 : ["Illegal access"],
    strict_mode_with               : ["Strict mode code may not include a with statement"],
    strict_catch_variable          : ["Catch variable may not be eval or arguments in strict mode"],
    strict_param_name              : ["Parameter name eval or arguments is not allowed in strict mode"],
    strict_param_dupe              : ["Strict mode function may not have duplicate parameter names"],
    strict_var_name                : ["Variable name may not be eval or arguments in strict mode"],
    strict_function_name           : ["Function name may not be eval or arguments in strict mode"],
    strict_octal_literal           : ["Octal literals are not allowed in strict mode."],
    strict_duplicate_property      : ["Duplicate data property in object literal not allowed in strict mode"],
    accessor_data_property         : ["Object literal may not have data and accessor property with the same name"],
    accessor_get_set               : ["Object literal may not have multiple get/set accessors with the same name"],
    strict_lhs_assignment          : ["Assignment to eval or arguments is not allowed in strict mode"],
    strict_lhs_postfix             : ["Postfix increment/decrement may not have eval or arguments operand in strict mode"],
    strict_lhs_prefix              : ["Prefix increment/decrement may not have eval or arguments operand in strict mode"],
    strict_reserved_word           : ["Use of future reserved word in strict mode"],
    strict_delete                  : ["Delete of an unqualified identifier in strict mode."],
    strict_caller                  : ["Illegal access to a strict mode caller function."],
    const_assign                   : ["Assignment to constant variable."],
    invalid_module_path            : ["Module does not export '", "$0", "', or export is not itself a module"],
    module_type_error              : ["Module '", "$0", "' used improperly"]
  }
}, typeof module !== 'undefined' ? module.exports : {});



exports.assembler = (function(exports){
  "use strict";
  var util      = require('util');

  var objects   = require('./lib/objects'),
      functions = require('./lib/functions'),
      iteration = require('./lib/iteration'),
      utility   = require('./lib/utility'),
      traversal = require('./lib/traversal'),
      Stack     = require('./lib/Stack'),
      HashMap   = require('./lib/HashMap');

  var walk          = traversal.walk,
      collector     = traversal.collector,
      clone         = traversal.clone,
      Visitor       = traversal.Visitor,
      fname         = functions.fname,
      define        = objects.define,
      assign        = objects.assign,
      create        = objects.create,
      copy          = objects.copy,
      inherit       = objects.inherit,
      ownKeys       = objects.keys,
      hasOwn        = objects.hasOwn,
      isObject      = objects.isObject,
      Hash          = objects.Hash,
      Iterator      = iteration.Iterator,
      StopIteration = iteration.StopIteration,
      each          = iteration.each,
      repeat        = iteration.repeat,
      map           = iteration.map,
      fold          = iteration.fold,
      generate      = iteration.generate,
      quotes        = utility.quotes,
      uid           = utility.uid,
      pushAll       = utility.pushAll;

  var CONTINUE = walk.CONTINUE,
      RECURSE  = walk.RECURSE,
      BREAK    = walk.BREAK;

  var proto = Math.random().toString(36).slice(2),
      context,
      _push = [].push,
      opcodes = 0;

  function StandardOpCode(params, name){
    var func = this.creator();
    this.id = func.id = opcodes++;
    this.params = func.params = params;
    this.name = func.opname = name;
    func.opcode = this;
    return func;
  }

  define(StandardOpCode.prototype, [
    function creator(){
      var opcode = this;
      return function(){
        return context.code.createDirective(opcode, arguments);
      };
    },
    function inspect(){
      return this.name;
    },
    function toString(){
      return this.name
    },
    function valueOf(){
      return this.id;
    },
    function toJSON(){
      return this.id;
    }
  ]);


  function InternedOpCode(params, name){
    return StandardOpCode.call(this, params, name);
  }

  inherit(InternedOpCode, StandardOpCode, [
    function creator(){
      var opcode = this;
      return function(a, b, c){
        //return context.code.createDirective(opcode, [context.intern(arg)]);
        return context.code.createDirective(opcode, [a, b, c]);
      };
    }
  ]);


  function macro(name){
    var params = [],
        ops = [];

    var body = map(arguments, function(arg, a){
      if (!a) return '';
      arg instanceof Array || (arg = [arg]);
      var opcode = arg.shift();
      ops.push(opcode);
      return opcode.opname + '('+generate(opcode.params, function(i){
        if (i in arg) {
          if (typeof arg[i] === 'string') {
            return quotes(arg[i]);
          }
          return arg[i] + '';
        } else {
          var param = '$'+String.fromCharCode(a + 96) + String.fromCharCode(i + 97);
          params.push(param);
          return param;
        }
      }).join(', ') + ');';
    }).join('');

    var src = 'return function '+name+'('+params.join(', ')+'){'+body+'}';
    var func = Function.apply(null, map(ops, function(op){ return op.opname }).concat(src)).apply(null, ops);
    func.params = func.length;
    func.opname = name;
    return func;
  }



  var ADD              = new StandardOpCode(1, 'ADD'),
      AND              = new StandardOpCode(1, 'AND'),
      ARRAY            = new StandardOpCode(0, 'ARRAY'),
      ARG              = new StandardOpCode(0, 'ARG'),
      ARGS             = new StandardOpCode(0, 'ARGS'),
      ARGUMENTS        = new StandardOpCode(0, 'ARGUMENTS'),
      ARRAY_DONE       = new StandardOpCode(0, 'ARRAY_DONE'),
      BINARY           = new StandardOpCode(1, 'BINARY'),
      BINDING          = new StandardOpCode(2, 'BINDING'),
      CALL             = new StandardOpCode(1, 'CALL'),
      CASE             = new StandardOpCode(1, 'CASE'),
      CLASS_DECL       = new StandardOpCode(1, 'CLASS_DECL'),
      CLASS_EXPR       = new StandardOpCode(1, 'CLASS_EXPR'),
      COMPLETE         = new StandardOpCode(0, 'COMPLETE'),
      CONST            = new StandardOpCode(1, 'CONST'),
      CONSTRUCT        = new StandardOpCode(0, 'CONSTRUCT'),
      DEBUGGER         = new StandardOpCode(0, 'DEBUGGER'),
      DEFAULT          = new StandardOpCode(1, 'DEFAULT'),
      DEFINE           = new StandardOpCode(1, 'DEFINE'),
      DUP              = new StandardOpCode(0, 'DUP'),
      ELEMENT          = new StandardOpCode(0, 'ELEMENT'),
      ENUM             = new StandardOpCode(0, 'ENUM'),
      EXTENSIBLE       = new StandardOpCode(1, 'EXTENSIBLE'),
      EVAL             = new StandardOpCode(0, 'EVAL'),
      FLIP             = new StandardOpCode(1, 'FLIP'),
      FUNCTION         = new StandardOpCode(3, 'FUNCTION'),
      GET              = new StandardOpCode(0, 'GET'),
      GET_GLOBAL       = new InternedOpCode(1, 'GET_GLOBAL'),
      HAS_BINDING      = new StandardOpCode(1, 'HAS_BINDING'),
      HAS_GLOBAL       = new InternedOpCode(1, 'HAS_GLOBAL'),
      INC              = new StandardOpCode(0, 'INC'),
      INDEX            = new StandardOpCode(1, 'INDEX'),
      INTERNAL_MEMBER  = new InternedOpCode(1, 'INTERNAL_MEMBER'),
      ITERATE          = new StandardOpCode(0, 'ITERATE'),
      JUMP             = new StandardOpCode(1, 'JUMP'),
      JEQ_NULL         = new StandardOpCode(1, 'JEQ_NULL'),
      JEQ_UNDEFINED    = new StandardOpCode(1, 'JEQ_UNDEFINED'),
      JFALSE           = new StandardOpCode(1, 'JFALSE'),
      JLT              = new StandardOpCode(2, 'JLT'),
      JLTE             = new StandardOpCode(2, 'JLTE'),
      JGT              = new StandardOpCode(2, 'JGT'),
      JGTE             = new StandardOpCode(2, 'JGTE'),
      JNEQ_NULL        = new StandardOpCode(1, 'JNEQ_NULL'),
      JNEQ_UNDEFINED   = new StandardOpCode(1, 'JNEQ_UNDEFINED'),
      JTRUE            = new StandardOpCode(1, 'JTRUE'),
      LET              = new StandardOpCode(1, 'LET'),
      LITERAL          = new StandardOpCode(1, 'LITERAL'),
      LOG              = new StandardOpCode(0, 'LOG'),
      LOOP             = new StandardOpCode(0, 'LOOP'),
      MEMBER           = new InternedOpCode(1, 'MEMBER'),
      METHOD           = new StandardOpCode(3, 'METHOD'),
      MOVE             = new StandardOpCode(1, 'MOVE'),
      NATIVE_CALL      = new StandardOpCode(1, 'NATIVE_CALL'),
      NATIVE_REF       = new InternedOpCode(1, 'NATIVE_REF'),
      OBJECT           = new StandardOpCode(0, 'OBJECT'),
      OR               = new StandardOpCode(1, 'OR'),
      POP              = new StandardOpCode(0, 'POP'),
      POPN             = new StandardOpCode(1, 'POPN'),
      PROPERTY         = new InternedOpCode(1, 'PROPERTY'),
      PROTO            = new StandardOpCode(0, 'PROTO'),
      PUT              = new StandardOpCode(0, 'PUT'),
      PUT_GLOBAL       = new StandardOpCode(2, 'PUT_GLOBAL'),
      REF              = new InternedOpCode(1, 'REF'),
      REFSYMBOL        = new InternedOpCode(1, 'REFSYMBOL'),
      REGEXP           = new StandardOpCode(1, 'REGEXP'),
      REST             = new StandardOpCode(1, 'REST'),
      RETURN           = new StandardOpCode(0, 'RETURN'),
      RETURN_CHECK     = new StandardOpCode(0, 'RETURN_CHECK'),
      RETURN_FINALLY   = new StandardOpCode(0, 'RETURN_FINALLY'),
      ROTATE           = new StandardOpCode(1, 'ROTATE'),
      SAVE             = new StandardOpCode(0, 'SAVE'),
      SCOPE_CLONE      = new StandardOpCode(0, 'SCOPE_CLONE'),
      SCOPE_POP        = new StandardOpCode(0, 'SCOPE_POP'),
      SCOPE_PUSH       = new StandardOpCode(0, 'SCOPE_PUSH'),
      SPREAD           = new StandardOpCode(1, 'SPREAD'),
      SPREAD_ARG       = new StandardOpCode(0, 'SPREAD_ARG'),
      SPREAD_ARRAY     = new StandardOpCode(1, 'SPREAD_ARRAY'),
      STRING           = new InternedOpCode(1, 'STRING'),
      SUPER_ELEMENT    = new StandardOpCode(0, 'SUPER_ELEMENT'),
      SUPER_MEMBER     = new StandardOpCode(1, 'SUPER_MEMBER'),
      SWAP             = new StandardOpCode(0, 'SWAP'),
      SYMBOL           = new InternedOpCode(3, 'SYMBOL'),
      TEMPLATE         = new StandardOpCode(1, 'TEMPLATE'),
      THIS             = new StandardOpCode(0, 'THIS'),
      THROW            = new StandardOpCode(0, 'THROW'),
      TO_OBJECT        = new StandardOpCode(0, 'TO_OBJECT'),
      UNARY            = new StandardOpCode(1, 'UNARY'),
      UNDEFINED        = new StandardOpCode(0, 'UNDEFINED'),
      UPDATE           = new StandardOpCode(1, 'UPDATE'),
      VAR              = new StandardOpCode(1, 'VAR'),
      WITH             = new StandardOpCode(0, 'WITH'),
      YIELD            = new StandardOpCode(1, 'YIELD');

  var ASSIGN = macro('ASSIGN', REF, [ROTATE, 1], PUT, POP);

  function serializeLocation(loc){
    if (loc) {
      if (loc.start) {
        if (loc.start.line === loc.end.line) {
          return [loc.start.line, loc.start.column, loc.end.column];
        } else {
          return [loc.start.line, loc.start.column, loc.end.line, loc.end.column];
        }
      } else if (loc.line) {
        return [loc.line, loc.column];
      }
    }
    return [];
  }

  var Code = exports.code = (function(){
    function Directives(){
      this.length = 0;
    }

    inherit(Directives, Array, [
      function toJSON(){
        return this.map(function(op){
          return op.toJSON ? op.toJSON() : null;
        });
      },
      Array.prototype.forEach || function forEach(callback, context){
        context || (context = this);
        for (var i=0; i < this.length; i++) {
          callback.call(context, this[i], i, this);
        }
      },
      Array.prototype.map || function map(callback, context){
        var result = [];
        context || (context = this);
        for (var i=0; i < this.length; i++) {
          result[i] = callback.call(context, this[i], i, this);
        }
        return result;
      },
      function inspect(){
        var space = new Array((''+this.length).length + 1).join(' ');
        return this.map(function(op, i){
          return (space + i).slice(-space.length) + ' ' + op.inspect();
        }).join('\n');
      }
    ]);

    var Directive = (function(){
      function Directive(op, args){
        this.op = op;
        this.loc = loc();
        this.range = range();
        for (var i=0; i < op.params; i++) {
          this[i] = args[i];
        }
      }

      define(Directive.prototype, [
        function toJSON(){
          var out = {
            op: this.op.name,
            range: this.range
          };

          for (var i=0; i < this.op.params; i++) {
            var item = this[i];
            out[i] = item && item.toJSON ? item.toJSON() : item;
          }

          return out;
        },
        function inspect(){
          var out = [];
          for (var i=0; i < this.op.params; i++) {
            out.push(util.inspect(this[i]));
          }
          return util.inspect(this.op)+'('+out.join(', ')+')';
        }
      ]);

      return Directive;
    })();

    var Parameters = (function(){
      function ParametersIterator(params){
        this.params = params;
        this.index = 0;
      }

      inherit(ParametersIterator, Iterator, [
        function next(){
          if (this.index >= this.params.length) {
            throw StopIteration;
          }
          return this.params[this.index++];
        }
      ]);

      function Parameters(node){
        this.length = 0;
        if (node.params) {
          pushAll(this, node.params);
          this.boundNames = boundNames(node.params);
          this.reduced = reducer(node);
        } else {
          this.reduced = [];
          this.boundNames = [];
        }
        if (node.rest) {
          this.boundNames.push(node.rest.name);
        }
        this.loc = node.loc;
        this.range = node.range;
        this.defaults = node.defaults || [];
        this.Rest = node.rest;
        this.ExpectedArgumentCount = this.length - this.defaults.length;
      }

      define(Parameters.prototype, [
        function getIndex(name){
          return this.boundNames.indexOf(name);
        },
        function __iterator__(){
          return new ParametersIterator(this);
        }
      ]);

      return Parameters;
    })();


    function Code(node, source, lexicalType, scopeType, strict){
      function Instruction(opcode, args){
        Directive.call(this, opcode, args);
      }

      inherit(Instruction, Directive, {
        code: this
      });

      var body = node;

      this.flags = {};
      if (node.type === 'Program') {
        this.flags.topLevel = true;
        this.imports = getImports(node);
        this.scope = scope.create('global');
      } else {
        this.flags.topLevel = false;
        body = body.body;
        if (node.type === 'ModuleDeclaration') {
          this.imports = getImports(body);
          this.scope = scope.create('module', context.currentScope);
          body = body.body;
        } else if (scopeType === 'eval') {
          this.scope = scope.create('eval', context.currentScope);
        } else {
          this.scope = scope.create('normal', context.currentScope);
        }
      }

      define(this, {
        body: body,
        source: source == null ? context.code.source : source,
        script: context.script,
        children: [],
        createDirective: function(opcode, args){
          var op = new Instruction(opcode, args);
          this.ops.push(op);
          return op;
        }
      });

      if (node.id) {
        this.name = node.id.name;
      }

      if (node.generator) {
        this.flags.generator = true;
      }

      this.path = [];
      this.range = node.range;
      this.loc = node.loc;
      this.unwinders = [];
      this.scopeType = scopeType;
      this.lexicalType = lexicalType || 'normal';
      this.flags.usesSuper = referencesSuper(this.body);

      this.LexicalDeclarations = lexDecls(body);
      this.VarScopedDeclarations = varDecls(body);
      this.LexicallyDeclaredNames = [];
      this.VarDeclaredNames = [];

      this.flags.strict = strict || (context.code && context.code.flags.strict) || isStrict(node);
      if (scopeType === 'module') {
        this.exportedNames = getExports(this.body);
        this.flags.strict = true;
      }
      this.ops = new Directives;
      if (node.params) {
        this.params = new Parameters(node);
        this.scope.varDeclare('arguments', 'arguments');
        each(this.params.boundNames, function(name){
          this.varDeclare(name, 'param');
        }, this.scope);
      }
    }


    define(Code.prototype, [
      function derive(code){
        if (code) {
          this.strings = code.strings;
          this.hash = code.hash;
          this.natives = code.natives;
          if (this.natives) {
            this.strict = false;
          }
        }
      },
      function lookup(id){
        return id;
        // if (typeof id === 'number') {
        //   return this.strings[id];
        // } else {
        //   return id;
        // }
      }
    ]);

    return Code;
  })();


  var ClassDefinition = (function(){
    var ctor = require('esprima').parse('class X { constructor(...args){ super(...args) } }').body[0].body.body[0];

    function ClassDefinition(node, name){
      var self = this;
      this.name = name || (node.id ? node.id.name : null);
      this.methods = [];
      this.symbols = [[], []];
      this.scope = scope.create('normal', context.currentScope);
      if (node.type === 'ClassExpression' && this.name) {
         this.scope.varDeclare(this.name);
       }

      each(node.body.body, function(node){
        if (node.type === 'SymbolDeclaration') {
          self.defineSymbols(node);
        } else {
          self.defineMethod(node);
        }
      });

      if (!this.ctor) {
        var constructor = clone(ctor);
        node.body.body.push(constructor);
        this.defineMethod(constructor);
      }

      this.hasSuper = !!node.superClass;
      if (this.hasSuper) {
        recurse(node.superClass);
        GET();
      }
    }

    define(ClassDefinition.prototype, [
      function defineSymbols(node){
        var isPublic = node.kind !== 'private',
            self = this;

        each(node.declarations, function(decl){
          var name = decl.id.name;
          self.symbols[0].push(name);
          self.symbols[1].push(isPublic);
        });
      },
      function defineMethod(node){
        var code = new Code(node.value, context.source, 'method', 'class', context.code.flags.strict),
            name = code.name = symbol(node.key);

        code.scope.outer = this.scope;
        code.range = node.range;
        code.loc = node.loc;

        context.queue(code);
        code.displayName = this.name ? this.name+'#'+name.join('') : name.join('');
        if (!name[0]) name = name[1];
        node.kind = node.kind || 'method';

        if (name === 'constructor') {
          this.ctor = code;
          code.classDefinition = this;
        } else {
          this.methods.push({
            kind: node.kind,
            code: code,
            name: name
          });
        }
      }
    ]);

    return ClassDefinition;
  })();

  var Unwinder = (function(){
    function Unwinder(type, begin, end){
      this.type = type;
      this.begin = begin;
      this.end = end;
    }

    define(Unwinder.prototype, [
    ]);

    return Unwinder;
  })();

  var ControlTransfer = (function(){
    function ControlTransfer(labels){
      this.labels = labels;
      this.breaks = [];
      this.continues = [];
    }

    define(ControlTransfer.prototype, {
      labels: null,
      breaks: null,
      continues: null
    });

    define(ControlTransfer.prototype, [
      function updateContinues(ip){
        if (ip !== undefined) {
          each(this.continues, function(item){ item[0] = ip });
        }
      },
      function updateBreaks(ip){
        if (ip !== undefined) {
          each(this.breaks, function(item){ item[0] = ip });
        }
      }
    ]);

    return ControlTransfer;
  })();


  var scope = (function(){
    var types = new Hash;

    var Scope = types.normal = (function(){
      function Scope(outer){
        this.varNames = new Hash;
        this.lexNames = new Hash;
        this.outer = outer;
        //this.children = [];
      }

      define(Scope.prototype, {
        type: 'normal'
      });

      define(Scope.prototype, [
        function varDeclare(name, type){
          this.varNames[name] = type;
        },
        function lexDeclare(name, type){
          if (type === 'function') {
            this.varNames[name] = type;
          } else {
            this.lexNames[name] = type;
          }
        },
        function has(name){
          return name in this.varNames || name in this.lexNames;
        },
        function pop(){
          if (this === context.currentScope) {
            context.currentScope = this.outer;
          }
        }
      ]);

      return Scope;
    })();


    var BlockScope = types.block = (function(){
      function BlockScope(outer){
        this.lexNames = new Hash;
        this.outer = outer;
        //this.children = [];
      }

      inherit(BlockScope, Scope, {
        type: 'block'
      }, [
        function varDeclare(name, type){
          this.outer.varDeclare(name, type);
        },
        function lexDeclare(name, type){
          this.lexNames[name] = type;
        },
        function has(name){
          return name in this.lexNames;
        }
      ]);

      return BlockScope;
    })();


    var GlobalScope = types.global = (function(){
      function GlobalScope(){
        Scope.call(this, null);
      }

      inherit(GlobalScope, Scope, {
        type: 'global'
      });

      return GlobalScope;
    })();

    var ModuleScope = types.module = (function(){
      function ModuleScope(outer){
        Scope.call(this, outer);
      }

      inherit(ModuleScope, GlobalScope, {
        type: 'module'
      });

      return ModuleScope;
    })();


    var EvalScope = types.eval = (function(){
      function EvalScope(outer){
        Scope.call(this, outer);
      }

      inherit(EvalScope, Scope, {
        type: 'eval'
      });

      return EvalScope;
    })();

    return define({}, [
      function resolve(scope, name){
        while (scope) {
          if (scope.has(name)) {
            return scope;
          }
          scope = scope.outer;
        }
      },
      (function(){
        return function create(type, outer){
          var child = new types[type](outer);
          if (outer) {
            //outer.children.push(child);
          }
          return child;
        };
      })()
    ]);
  })();


  function isSuperReference(node) {
    return !!node && node.type === 'Identifier' && node.name === 'super';
  }

  function isPattern(node){
    return !!node && node.type === 'ObjectPattern' || node.type === 'ArrayPattern';
  }

  function isLexicalDeclaration(node){
    return !!node && node.type === 'VariableDeclaration' && node.kind !== 'var';
  }

  function isFunction(node){
    return node.type === 'FunctionExpression'
        || node.type === 'FunctionDeclaration'
        || node.type === 'ArrowFunctionExpression';
  }

  function isDeclaration(node){
    return node.type === 'ClassDeclaration'
        || node.type === 'FunctionDeclaration'
        || node.type === 'VariableDeclaration';
  }

  function isAnonymous(node){
    return !!node && !(node.id && node.id.name)
        && node.type === 'ClassExpression'
        || node.type === 'FunctionExpression'
        || node.type === 'ArrowFunctionExpression';
  }

  var renameables = define({}, [FunctionExpression, ArrowFunctionExpression, ClassExpression]);

  function isUseStrictDirective(node){
    return node.type === 'ExpressionStatement'
        && node.expression.type === 'Literal'
        && node.expression.value === 'use strict';
  }

  function isStrict(node){
    if (isFunction(node)) {
      node = node.body.body;
    } else if (node.type === 'Program') {
      node = node.body;
    }
    if (node instanceof Array) {
      for (var i=0, element; element = node[i]; i++) {
        if (isUseStrictDirective(element)) {
          return true;
        } else if (element.type !== 'EmptyStatement' && element.type !== 'FunctionDeclaration') {
          return false;
        }
      }
    }
    return false;
  }

  function isGlobalOrEval(){
    return context.code.scopeType === 'eval' || context.code.scopeType === 'global';
  }

  var referencesSuper = (function(found){
    function nodeReferencesSuper(node){
      if (node.type === 'MemberExpression') {
        if (isSuperReference(node.object)) {
          found = true;
          return BREAK;
        }
        return RECURSE;
      } else if (node.type === 'CallExpression') {
        if (isSuperReference(node.callee)) {
          found = true;
          return BREAK;
        }
        return RECURSE;
      } else if (isFunction(node)) {
        return CONTINUE;
      } else {
        return RECURSE;
      }
    }

    return function referencesSuper(node){
      found = false;
      walk(node, nodeReferencesSuper);
      return found;
    };
  })()

  var boundNamesCollector = collector({
    ObjectPattern      : 'properties',
    ArrayPattern       : 'elements',
    VariableDeclaration: 'declarations',
    BlockStatement     : RECURSE,
    Program            : RECURSE,
    ForStatement       : RECURSE,
    Property           : 'value',
    ExportDeclaration  : 'declaration',
    ExportSpecifierSet : 'specifiers',
    ImportDeclaration  : 'specifiers',
    Identifier         : ['name'],
    ImportSpecifier    : 'id',
    VariableDeclarator : 'id',
    ModuleDeclaration  : 'id',
    SpreadElement      : 'argument',
    FunctionDeclaration: 'id',
    ClassDeclaration   : 'id'
  });


  function boundNames(node){
    return boundNamesCollector(node);
  }

  var lexDecls = (function(){
    var LexicalDeclarations = (function(lexical){
      return collector({
        ClassDeclaration: lexical(false),
        FunctionDeclaration: lexical(false),
        ExportDeclaration: RECURSE,
        SwitchCase: RECURSE,
        Program: RECURSE,
        VariableDeclaration: lexical(function(node){
          return node.kind === 'const';
        })
      });
    })(function(isConst){
      if (typeof isConst !== 'function') {
        isConst = (function(v){
          return function(){ return v };
        })(isConst);
      }
      return function(node){
        node.IsConstantDeclaration = isConst(node);
        node.boundNames || (node.boundNames = boundNames(node));
        if (node.kind !== 'var') {
          return node;
        }
      };
    });

    return function lexDecls(node){
      if (!node) return [];
      if (!node.LexicalDeclarations) {
        node.LexicalDeclarations = LexicalDeclarations(node);
      }
      return node.LexicalDeclarations;
    };
  })();

  var varDecls = (function(){
    var variableDeclarations = collector({
      VariableDeclaration: function(node){
        if (node.kind === 'var') {
          return node;
        }
      },
      BlockStatement   : RECURSE,
      CatchClause      : RECURSE,
      DoWhileStatement : RECURSE,
      ExportDeclaration: RECURSE,
      ForInStatement   : RECURSE,
      ForOfStatement   : RECURSE,
      ForStatement     : RECURSE,
      IfStatement      : RECURSE,
      SwitchCase       : RECURSE,
      SwitchStatement  : RECURSE,
      TryStatement     : RECURSE,
      WhileStatement   : RECURSE,
      WithStatement    : RECURSE
    });

    return function varDecls(node){
      var decls = variableDeclarations(node);
      each(node.body, function(statement){
        if (statement.type === 'FunctionDeclaration') {
          decls.push(statement);
        }
      });

      return decls;
    };
  })();


  var getExports = (function(){
    var collectExportDecls = collector({
      Program          : RECURSE,
      BlockStatement   : RECURSE,
      ExportDeclaration: true
    });

    var getExportedDecls = collector({
      ClassDeclaration   : true,
      ExportDeclaration  : RECURSE,
      ExportSpecifier    : true,
      ExportSpecifierSet : RECURSE,
      FunctionDeclaration: true,
      ModuleDeclaration  : true,
      VariableDeclaration: RECURSE,
      VariableDeclarator : true
    });


    var getExportedNames = collector({
      ArrayPattern       : 'elements',
      ObjectPattern      : 'properties',
      Property           : 'value',
      ClassDeclaration   : 'id',
      ExportSpecifier    : 'id',
      FunctionDeclaration: 'id',
      ModuleDeclaration  : 'id',
      VariableDeclarator : 'id',
      Glob               : true,
      Identifier         : ['name']
    });

    return function getExports(node){
      return getExportedNames(getExportedDecls(collectExportDecls(node)));
    };
  })();


  var getImports = (function(){
    var collectImportDecls = collector({
      Program          : RECURSE,
      BlockStatement   : RECURSE,
      ImportDeclaration: true,
      ModuleDeclaration: true
    });

    function Import(origin, name, specifiers, node){
      this.origin = origin;
      this.name = name;
      this.specifiers = specifiers;
      if (node) {
        node.imported = this;
      }
    }

    var handlers = {
      AtSymbol: function(node){
        return (node.internal ? '@@' : '@') + node.name;
      },
      Glob: function(){
        return ['*', '*'];
      },
      Path: function(node){
        return map(node.body, function(subpath){
          return handlers[subpath.type](subpath);
        });
      },
      ImportSpecifier: function(node){
        var name = handlers[node.id.type](node.id);
        var from = node.from === null ? name : handlers[node.from.type](node.from);
        return [name, from];
      },
      Identifier: function(node){
        return node.name;
      },
      Literal: function(node){
        return node.value;
      }
    };

    return function getImports(node){
      var decls = collectImportDecls(node),
          imported = [];

      each(decls, function(decl, i){
        if (decl.body) {
          var origin = name = decl.id.name;
          var code = decl;

        } else {
          var origin = handlers[decl.from.type](decl.from);

          if (decl.type === 'ModuleDeclaration') {
            var name = decl.id.name;
          } else {
            var specifiers = new Hash;
            each(decl.specifiers, function(specifier){
              var result = handlers[specifier.type](specifier);
              result = typeof result === 'string' ? [result, result] : result;
              if (!(result[1] instanceof Array)) {
                result[1] = [result[1]];
              }
              specifiers[result[0]] = result[1];
            });
          }
        }

        imported.push(new Import(origin, name, specifiers, code));
      });

      return imported;
    };
  })();


  var reducer = (function(){
    var _ = {};

    function convert(node){
      if (!node) return node;
      var handler = handlers[node.type];
      if (handler) return handler(node);
    }

    function functions(node){
      return {
        name: convert(node.id),
        params: map(node.params, convert),
        defaults: map(node.defaults || [], convert),
        rest: convert(node.rest)
      };
    }
    function objects(node){
      var out = {};
      each(node.properties, function(prop){
        out[convert(prop.key)] = convert(prop.value);
      });
      return out;
    }
    function arrays(node){
      return map(node.elements, convert);
    }
    function operation(left, right, operator){
      var result = { operator: operator };
      if (left !== _) result.left = convert(left);
      if (right !== _) result.right = convert(right);
      return result;
    }
    function binary(node){
      return { left: convert(node.left),
               right: convert(node.right),
               operator: node.operator };
    }

    var handlers = {
      ArrayExpression: arrays,
      ArrayPattern: arrays,
      BinaryExpression: binary,
      AssignmentExpression: binary,
      LogicalExpression: binary,
      UnaryExpression: function(node){
        return operation(_, node.argument, node.operator);
      },
      UpdateExpression: function(node){
        if (node.prefix) {
          return operation(_, node.argument, node.operator);
        } else {
          return operation(node.argument, _, node.operator);
        }
      },
      Identifier: function(node){
        return node.name;
      },
      Literal: function(node){
        return { value: node.value };
      },
      ObjectExpression: objects,
      ObjectPattern: objects,
      FunctionDeclaration: functions,
      FunctionExpression: functions,
      ArrowFunctionExpression: functions,
      CallExpression: function(node){
        return {
          callee: convert(node.callee),
          args: map(node.arguments, convert)
        }
      },
      MemberExpression: function(node){
        return {
          object: convert(node.object),
          member: convert(node.property)
        };
      },
      ThisExpression: function(node){
        return 'this';
      },
      SpreadElement: function(node){
        return { spread: convert(node.arguments) };
      },
      Program: function(node){
        var out = {
          functions: [],
          vars: []
        };
        each(node.body, function(node){
          if (node.type === 'FunctionDeclaration') {
            out.functions.push(convert(node));
          } else if (node.type === 'VariableDeclaration' && node.kind === 'var') {
            each(node.declarations, function(decl){
              out.vars.push({ binding: convert(decl.id), init: convert(decl.init) });
            });
          }
        });
        return out;
      }
    };

    return convert;
  })();


  var isWrapped, isntWrapped, isTail, isntTail, wrap, tail, copyWrap, copyTail;

  void function(){
    function set(name, value){
      return function(obj){
        if (isObject(obj)) {
          obj[name] = value;
        }
      };
    }

    function either(consequent, alternate){
      return function(test){
        return test ? consequent : alternate;
      };
    }

    function copier(field){
      return function(a, b){
        if (isObject(a) && isObject(b)) {
          b[field] = a[field];
        }
      };
    }

    isWrapped   = set('wrapped', true);
    isntWrapped = set('wrapped', false);
    isTail      = set('tail', true);
    isntTail    = set('tail', false);
    wrap        = either(isWrapped, isntWrapped);
    tail        = either(isTail, isntTail);
    copyWrap    = copier('wrapped');
    copyTail    = copier('tail');
  }();



  var nodeStack = [],
      currentNode;

  function pushNode(node){
    currentNode && nodeStack.push(currentNode);
    currentNode = node;
  }
  function popNode(){
    var node = nodeStack.pop();
    if (node) currentNode = node;
  }

  function recurse(node){
    if (node) {
      pushNode(node);
      if (node.type) {
        handlers[node.type](node);
      } else if (node.length) {
        each(node, recurse);
      }
      popNode();
    }
  }

  var emptyLoc = { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } },
      emptyRange = [0, 0];

  function loc(){
    var node = currentNode,
        index = nodeStack.length;
    while (node) {
      if (node.loc) {
        return node.loc;
      }
      node = nodeStack[--index];
    }
    return emptyLoc;
  }

  function range(){
    var node = currentNode,
        index = nodeStack.length;

    while (node) {
      if (node.range) {
        return node.range;
      }
      node = nodeStack[--index];
    }
    return emptyRange;
  }


  function intern(str){
    return str;//context.intern(string);
  }

  function current(){
    return context.code.ops.length;
  }

  function last(){
    return context.code.ops[context.code.ops.length - 1];
  }

  function pop(){
    return context.code.ops.pop();
  }

  function adjust(op){
    if (op) {
      return op[0] = context.code.ops.length;
    }
  }

  function initBindingIfNew(name){
    HAS_BINDING(name);
    var jump = JTRUE(0);
    BINDING(name, false);
    UNDEFINED();
    VAR(name);
    adjust(jump);
  }

  function createBindingIfNew(name){
    HAS_BINDING(name);
    var jump = JTRUE(0);
    BINDING(name, false);
    adjust(jump);
  }

  function initFunctionDecl(decl){
    pushNode(decl);
    FunctionDeclaration(decl);
    FUNCTION(false, decl.id.name, decl.code);
    VAR(decl.id.name);
    POP();
    popNode();
  }

  function bindingDestructuring(node){
    pushNode(node);
    if (node.type === 'Identifier') {
      initBindingIfNew(node.name);
    } else if (node.type === 'ObjectPattern') {
      each(node.properties, bindingDestructuring);
    } else if (node.type === 'Property') {
      bindingDestructuring(node.value);
    } else if (node.type === 'ArrayPattern') {
      each(node.elements, bindingDestructuring);
    }
    popNode();
  }

  var symbol = (function(){
    function Symbol(node){
      this[0] = '';
      if (!node) {
        this[1] = '';
      } else if (typeof node === 'string') {
        this[1] = node;
      } else if (node.type === 'AtSymbol') {
        this[0] = '@';
        this[1] = (node.internal ? '@' : '') + node.name;
      } else if (node.type === 'Literal') {
        this[1] = ''+node.value;
      } else {
        this[1] = node.name;
      }
    }

    define(Symbol.prototype, 'length', 2);
    define(Symbol.prototype, [
      Array.prototype.join
    ]);

    return function symbol(node){
      return new Symbol(node);
    };
  })();

  function TopLevelDeclarationInstantiation(code){
    var configurable = code.scopeType === 'eval',
        functions = new Hash;

    pushNode(code.body);

    each(code.VarScopedDeclarations, function(decl){
      if (decl.type === 'FunctionDeclaration') {
        pushNode(decl);
        var name = decl.id.name;
        functions[name] = true;
        HAS_BINDING(name);
        var jump = JTRUE(0);
        BINDING(name, configurable);
        var jump2 = JUMP();
        adjust(jump);
        HAS_GLOBAL(name);
        var jump3 = JTRUE(0);
        UNDEFINED();
        PUT_GLOBAL(name, configurable);
        adjust(jump2);
        adjust(jump3);
        FunctionDeclaration(decl);
        FUNCTION(false, decl.id.name, decl.code);
        VAR(decl.id.name);
        POP();
        popNode();
      } else {
        each(decl.boundNames, function(name){
          HAS_BINDING(name);
          var jump = JFALSE(0);
          BINDING(name);
          UNDEFINED();
          VAR(name);
          var jump2 = JUMP();
          adjust(jump);
          HAS_GLOBAL(name);
          var jump3 = JTRUE(0);
          UNDEFINED();
          PUT_GLOBAL(name, configurable);
          adjust(jump2);
          adjust(jump3);
        });
      }
    });

    popNode();
  }


  function FunctionDeclarationInstantiation(code){
    pushNode(code.body);
    var decls  = code.VarScopedDeclarations,
        len    = decls.length,
        strict = code.flags.strict,
        funcs  = [],
        noArgs = true;

    while (len--) {
      var decl = decls[len];
      pushNode(decl);
      if (decl.type === 'FunctionDeclaration') {
        funcs.push(decl);

        decl.boundNames || (decl.boundNames = boundNames(decl));
        var name = decl.boundNames[0];
        if (name === 'arguments') {
          noArgs = true;
        }
        HAS_BINDING(name);
        var jump = JTRUE(0);
        BINDING(name, false);
        adjust(jump);
      }
      popNode();
    }

    each(code.params, bindingDestructuring);

    //if (!noArgs) {
      BINDING('arguments', strict);
    //}

    each(code.VarDeclaredNames, initBindingIfNew);

    initLexicalDecls(code.body);

    each(funcs, initFunctionDecl);

    pushNode(code.params);
    ARGUMENTS();
    var defaultStart = code.params.length - code.params.defaults.length;
    each(code.params, function(param, i){
      pushNode(param);
      DUP();
      INTERNAL_MEMBER(i);
      if (i >= defaultStart) {
        var skipDefault = JNEQ_UNDEFINED(0);
        recurse(code.params.defaults[i - defaultStart]);
        GET();
        adjust(skipDefault);
      }
      ROTATE(1);
      ROTATE(2);
      if (param.type === 'Identifier') {
        VAR(param.name);
      } else {
        destructure(param, VAR);
        POP();
      }
      ROTATE(1);
      popNode();
    });

    var rest = code.params.Rest;
    if (rest) {
      pushNode(rest);
      REST(code.params.ExpectedArgumentCount);
      if (rest.type === 'Identifier') {
        VAR(rest.name);
      } else {
        destructure(rest, VAR);
        POP();
      }
      popNode();
    } else {
      POP();
    }

    VAR('arguments');
    popNode();
    popNode();
  }


  function initLexicalDecls(node){
    each(lexDecls(node), function(decl){
      pushNode(decl);
      each(decl.boundNames, function(name){
        BINDING(name, decl.IsConstantDeclaration);
      });
      popNode();
    });
  }

  function block(callback){
    var transfer = new ControlTransfer(context.labels);
    context.jumps.push(transfer);
    context.labels = new Hash;
    pushScope('block');
    callback();
    transfer.updateBreaks(current());
    context.jumps.pop();
    context.labels = transfer.labels;
    popScope();
  }

  function loop(callback){
    var transfer = new ControlTransfer(context.labels);
    context.jumps.push(transfer);
    context.labels = new Hash;
    transfer.updateContinues(callback());
    transfer.updateBreaks(current());
    context.jumps.pop();
    context.labels = transfer.labels;
  }

  function unwinder(type, callback){
    var begin = current();
    callback();
    context.code.unwinders.push(new Unwinder(type, begin, current()));
  }

  var scopeStack = [];

  function pushScope(type){
    context.currentScope = scope.create('block', context.currentScope);
    scopeStack.push(current());
    type === 'with' ? WITH() : SCOPE_PUSH();
  }


   function popScope(){
    context.currentScope.pop();
    context.code.unwinders.push(new Unwinder('scope', scopeStack.pop(), current()));
    SCOPE_POP();
  }


  function iter(node, KIND){
    unwinder('iteration', function(){
      loop(function(){
        if (isLexicalDeclaration(node.left)) {
          var lexical = true;
          pushScope('block');
          initLexicalDecls(node.left);
        }
        recurse(node.right);
        GET();
        KIND();
        MEMBER('next');
        var update = current();
        DUP();
        DUP();
        GET();
        ARGS();
        CALL();
        if (node.left.type === 'VariableDeclaration') {
          VariableDeclaration(node.left, true);
        } else {
          recurse(node.left);
          ROTATE(1);
          PUT();
          POP();
        }
        recurse(node.body);
        lexical && SCOPE_CLONE();
        JUMP(update);
        lexical && popScope();
        return update;
      });
    });
  }

  function move(node, set, pos){
    if (node.label) {
      var transfer = context.jumps.find(function(jump){
        return node.label.name in jump.labels;
      });
    } else {
      var transfer = context.jumps.find(function(jump){
        return jump.continues;
      });
    }
    transfer && transfer[set].push(pos);
  }

  var destructure = (function(){
    var elementAt = {
      elements: function(node, index){
        return node.elements[index];
      },
      properties: function(node, index){
        return node.properties[index].value;
      }
    };

    return function destructure(left, STORE){
      var key = left.type === 'ArrayPattern' ? 'elements' : 'properties';
      pushNode(left);
      TO_OBJECT();
      pushNode(left[key]);
      each(left[key], function(item, i){
        if (!item) return;
        pushNode(item);
        DUP();
        if (item.type === 'Property') {
          pushNode(item.key);
          MEMBER(symbol(item.key));
          GET();
          popNode();
          pushNode(item.value);
          if (isPattern(item.value)) {
            destructure(item.value, STORE);
          } else if (item.value.type === 'Identifier') {
            STORE(item.value.name);
          }
          popNode();
        } else if (item.type === 'ArrayPattern') {
          LITERAL(i);
          ELEMENT();
          GET();
          destructure(item, STORE);
        } else if (item.type === 'Identifier') {
          LITERAL(i);
          ELEMENT();
          GET();
          STORE(item.name);
        } else if (item.type === 'SpreadElement') {
          pushNode(item.argument);
          GET();
          SPREAD(i);
          STORE(item.argument.name);
          popNode();
        }
        popNode();
      });
      popNode();
      popNode();
    };
  })();


  function args(node){
    pushNode(node)
    ARGS();
    each(node, function(item, i){
      pushNode(item);
      if (item && item.type === 'SpreadElement') {
        recurse(item.argument);
        GET();
        SPREAD_ARG();
      } else {
        recurse(item);
        GET();
        ARG();
      }
      popNode();
    });
    popNode();
  }


  function AssignmentExpression(node){
    if (node.operator === '='){
      if (isPattern(node.left)){
        recurse(node.right);
        GET();
        destructure(node.left, ASSIGN);
      } else {
        recurse(node.left);
        recurse(node.right);
        GET();
        PUT();
      }
    } else {
      recurse(node.left);
      DUP();
      GET();
      recurse(node.right);
      GET();
      BINARY(node.operator.slice(0, -1));
      PUT();
    }
  }

  function ArrayExpression(node){
    ARRAY();
    var holes = 0;
    each(node.elements, function(item){
      if (!item){
        holes++;
      } else if (item.type === 'SpreadElement'){
        recurse(item.argument);
        GET();
        SPREAD_ARRAY(holes);
        holes = 0;
      } else {
        recurse(item);
        GET();
        INDEX(holes);
        holes = 0;
      }
    });
    ARRAY_DONE();
  }

  function ArrayPattern(node){}

  function ArrowFunctionExpression(node, name){
    isntWrapped(node.body);

    var code = new Code(node, null, 'arrow', 'function');
    if (name) {
      code.name = name.name || name;
    }
    context.queue(code);
    FUNCTION(false, null, code);
    return code;
  }

  function AtSymbol(node){
    if (node.internal) {
      if (!context.code.natives) {
        context.earlyError('illegal_internal_symbol', ['@@'+node.name]);
      } else {
        REFSYMBOL('@'+node.name);
      }
    } else {
      REFSYMBOL(node.name);
    }
  }

  function BinaryExpression(node){
    recurse(node.left);
    GET();
    recurse(node.right);
    GET();
    BINARY(node.operator);
  }

  function BreakStatement(node){
    move(node, 'breaks', JUMP());
  }

  function BlockStatement(node){
    pushNode(node.body);
    block(function(){
      initLexicalDecls(node.body);
      each(lexDecls(node.body), function(decl){
        pushNode(decl);
        each(decl.boundNames, function(name){
          if (decl.type === 'FunctionDeclaration') {
            FunctionDeclaration(decl);
            FUNCTION(false, decl.id.name, decl.code);
            LET(decl.id.name);
          }
        });
        popNode();
      });

      var wrapper = wrap(node.wrapped);
      each(node.body, function(child){
        wrapper(child);
        recurse(child);
      });
    });
    popNode();
  }

  function CallExpression(node){
    if (isSuperReference(node.callee)) {
      if (context.code.scopeType !== 'function') {
        context.earlyError(node, 'illegal_super');
      }
      SUPER_MEMBER(context.code.name);
    } else {
      recurse(node.callee);
    }
    DUP();
    GET();
    args(node.arguments);
    if (node.callee.type === 'Identifier' && node.callee.name === 'eval') {
      EVAL();
    } else {
      (node.callee.type === 'NativieIdentifier' ? NATIVE_CALL : CALL)(!!node.tail);
    }
  }

  function CatchClause(node){
    copyWrap(node, node.body);
    pushNode(node.body);
    pushScope('block');
    pushNode(node.param);
    context.currentScope.lexDeclare(node.param.name, 'catch');
    BINDING(node.param.name, false);
    LET(node.param.name);
    popNode();
    initLexicalDecls(node.body);
    each(node.body, recurse);
    popScope();
    popNode();
  }

  function ClassBody(node){}

  function ClassDeclaration(node){
    context.currentScope.lexDeclare(node.id.name, 'class');
    CLASS_DECL(new ClassDefinition(node));
  }

  function ClassExpression(node, methodName){
    var definition = new ClassDefinition(node, methodName);
    CLASS_EXPR(definition);
    return definition.ctor;
  }

  function ClassHeritage(node){}

  function comprehension(expression, index){
    var node = expression.blocks[index++];
    unwinder('iteration', function(){
      loop(function(){
        pushScope('block');
        var fakeLeft = {
          type: 'VariableDeclaration',
          declarations: [{
            type: 'VariableDeclarator',
            kind: 'let',
            id: node.left
          }]
        };
        initLexicalDecls(fakeLeft);
        recurse(node.right);
        GET();
        node.of ? ITERATE() : ENUM();
        MEMBER('next');
        var update = current();
        DUP();
        DUP();
        GET();
        ARGS();
        CALL(false);
        VariableDeclaration(fakeLeft, true);

        if (expression.blocks[index]) {
          comprehension(expression, index);
        } else {
          if (expression.filter) {
            recurse(expression.filter);
            GET();
            var test = JFALSE(0);
          }
          MOVE(false);
          MOVE(false);
          recurse(expression.body);
          GET();
          INDEX(0);
          MOVE(true);
          MOVE(true);
          expression.filter && adjust(test);
        }

        SCOPE_CLONE();
        JUMP(update);
        popScope();
        return update;
      });
    });
  }

  function ComprehensionExpression(node){
    ARRAY();
    MOVE(true);
    MOVE(true);
    comprehension(node, 0);
    MOVE(false);
    MOVE(false);
    POP();
  }

  function ComprehensionBlock(node){}

  function ConditionalExpression(node){
    copyTail(node, node.consequent);
    copyTail(node, node.alternate);
    each(node, wrap(node.wrapped));

    recurse(node.test);
    GET();
    var test = JFALSE(0);
    recurse(node.consequent)
    GET();
    var alt = JUMP();
    adjust(test);
    recurse(node.alternate);
    GET();
    adjust(alt);
  }

  function ContinueStatement(node){
    move(node, 'continues', JUMP());
  }

  function DoWhileStatement(node){
    loop(function(){
      isntTail(node.test);
      isntTail(node.body);
      copyWrap(node, node.body);

      var start = current();
      recurse(node.body);
      var cond = current();
      recurse(node.test);
      GET();
      JTRUE(start);
      return cond;
    });
  }

  function DebuggerStatement(node){
    DEBUGGER();
  }

  function EmptyStatement(node){}

  function ExportSpecifier(node){}

  function ExportSpecifierSet(node){}

  function ExportDeclaration(node){
    if (node.declaration) {
      recurse(node.declaration);
    }
  }

  function ExpressionStatement(node){
    copyWrap(node, node.expression);

    recurse(node.expression);
    GET();
    isGlobalOrEval() ? SAVE() : POP();
  }

  function ForStatement(node){
    copyWrap(node, node.body);

    loop(function(){
      if (node.init){
        if (node.init.type === 'VariableDeclaration') {
          if (node.init.kind !== 'var') {
            var lexical = true;
            pushScope('block');
            initLexicalDecls(node.init);
          }
          recurse(node.init);
        } else {
          recurse(node.init);
          GET();
          POP();
        }
      }

      var repeat = current();

      if (node.test) {
        recurse(node.test);
        GET();
        var test = JFALSE(0);
      }

      recurse(node.body);

      lexical && SCOPE_CLONE();
      if (node.update) {
        recurse(node.update);
        GET();
      }

      POP();
      JUMP(repeat);
      adjust(test);
      lexical && popScope();

      return repeat;
    });
  }

  function ForInStatement(node){
    copyWrap(node, node.body);
    iter(node, ENUM);
  }

  function ForOfStatement(node){
    copyWrap(node, node.body);
    iter(node, ITERATE);
  }

  function FunctionDeclaration(node){
    isntWrapped(node.body);
    if (!node.code) {
      context.currentScope.lexDeclare(node.id.name, 'function');
      node.code = new Code(node, null, 'normal', 'function');
      context.queue(node.code);
    }
    return node.code;
  }

  function FunctionExpression(node, methodName){
    isntWrapped(node.body);
    var code = new Code(node, null, 'normal', 'function');
    if (node.id) {
      code.scope.varDeclare(node.id.name, 'funcname');
    }
    if (methodName) {
      code.name = methodName.name || methodName;
    }
    context.queue(code);
    FUNCTION(true, intern(node.id ? node.id.name : ''), code);
    return code;
  }

  function Glob(node){}

  var nativeMatch = /^\$__/;

  function Identifier(node){
    if (context.code.natives && nativeMatch.test(node.name)) {
      node.type = 'NativeIdentifier';
      node.name = node.name.slice(3);
      NATIVE_REF(node.name);
    } else {
      REF(node.name);
    }
  }

  function IfStatement(node){
    copyWrap(node, node.consequent);
    copyWrap(node, node.alternate);

    recurse(node.test);
    GET();
    var test = JFALSE(0);
    recurse(node.consequent);

    if (node.alternate) {
      var alt = JUMP();
      adjust(test);
      recurse(node.alternate);
      adjust(alt);
    } else {
      adjust(test);
    }
  }

  function ImportDeclaration(node){}

  function ImportSpecifier(node){}

  function Literal(node){
    if (node.value instanceof RegExp) {
      REGEXP(node.value);
    } else if (typeof node.value === 'string') {
      STRING(node.value);
    } else {
      LITERAL(node.value);
    }
  }

  function LabeledStatement(node){
    copyWrap(node, node.statement);

    if (!context.labels){
      context.labels = new Hash;
    } else if (label in context.labels) {
      context.earlyError(node, 'duplicate_label');
    }
    context.labels[node.label.name] = true;
    recurse(node.body);
    context.labels = null;
  }

  function LogicalExpression(node){
    recurse(node.left);
    GET();
    var op = node.operator === '||' ? OR(0) : AND(0);
    recurse(node.right);
    GET();
    adjust(op);
  }

  function MemberExpression(node){
    var isSuper = isSuperReference(node.object);
    if (isSuper){
      if (context.code.scopeType !== 'function') {
        context.earlyError(node, 'illegal_super_reference');
      }
    } else {
      recurse(node.object);
      GET();
    }

    if (node.computed){
      recurse(node.property);
      GET();
      isSuper ? SUPER_ELEMENT() : ELEMENT();
    } else {
      var prop = symbol(node.property);
      isSuper ? SUPER_MEMBER(prop) : MEMBER(prop);
    }
  }

  function MethodDefinition(node){}

  function ModuleDeclaration(node){
    if (node.body) {
      each(node.body, isntWrapped);
      var code = node.imported.code = new Code(node, null, 'normal', 'module');
      code.path = context.code.path.concat(node.id.name);
      context.queue(code);
    }
  }

  function NativeIdentifier(node){
    NATIVE_REF(node.name);
  }

  function NewExpression(node){
    recurse(node.callee);
    GET();
    args(node.arguments);
    CONSTRUCT();
  }

  function ObjectExpression(node){
    OBJECT();
    each(node.properties, recurse);
  }

  function ObjectPattern(node){}

  function Path(node){}

  function Program(node){
    pushNode(node.body);
    each(node.body, function(child){
      isntWrapped(child);
      recurse(child);
    });
    popNode();
  }

  function Property(node){
    var value = node.value;
    if (node.kind === 'init'){
      var key  = node.key.type === 'Identifier' ? node.key : node.key.value,
          name = key && key.name || key;

      if (node.method) {
        pushNode(value);
        FunctionExpression(value, symbol(node.key));
        popNode();
      } else if (isAnonymous(value)) {
        renameables[value.type](value, key).flags.writableName = true;
      } else {
        recurse(value);
      }
      GET();
      if (name === '__proto__') {
        PROTO();
      } else {
        PROPERTY(symbol(node.key));
      }
    } else {
      var code = new Code(value, null, 'normal', 'function');
      context.queue(code);
      METHOD(node.kind, code, symbol(node.key));
    }
  }

  function ReturnStatement(node){
    if (node.argument){
      tail(!node.wrapped)(node.argument);
      recurse(node.argument);
      GET();
    } else {
      UNDEFINED();
    }

    context.code.inFinally ? RETURN_FINALLY() : RETURN();
  }

  function SequenceExpression(node){
    var wrapper = wrap(node.wrapped);

    each(node.expressions, function(item, i, a){
      wrapper(item);
      recurse(item)
      GET();
      if (i < a.length - 1) {
        POP();
      }
    });

    copyTail(node, node.expressions[node.expressions.length - 1]);
  }

  function SwitchStatement(node){
    block(function(){
      var defaultFound = null;
      recurse(node.discriminant);
      GET();

      pushScope('block');

      if (node.cases){
        each(node.cases, initLexicalDecls);
        var cases = [];
        each(node.cases, function(item, i){
          if (item.test){
            recurse(item.test);
            GET();
            cases.push(CASE(0));
          } else {
            defaultFound = i;
            cases.push(0);
          }
        });

        if (defaultFound !== null){
          DEFAULT(cases[defaultFound]);
        } else {
          POP();
          var last = JUMP();
        }

        var wrapper = wrap(node.wrapped);
        each(node.cases, function(item, i){
          adjust(cases[i]);
          wrapper(item);
          each(item.consequent, function(child){
            wrapper(child);
            recurse(child);
          });
        });

        last && adjust(last);
      } else {
        POP();
      }

    });
  }


  function SymbolDeclaration(node){
    // TODO early errors for duplicates
    var symbols = node.AtSymbols = [],
        pub = node.kind === 'symbol';

    each(node.declarations, function(item){
      var init = item.init;
      if (init) {
        recurse(init);
        GET();
      }

      if (item.id.internal) {
        if (!context.code.natives) {
          context.earlyError('illegal_internal_symbol', ['@@'+item.id.name]);
        } else {
          var name = '@'+item.id.name;
        }
      } else {
        var name = item.id.name;
      }
      SYMBOL(name, pub, !!init);
      symbols.push(name);
    });
  }

  function SymbolDeclarator(node){}

  function TemplateElement(node){}

  function TemplateLiteral(node, tagged){
    if (node.quasis) {
      node.templates = node.quasis;
      delete node.quasis;
    }
    each(node.templates, function(element, i){
      STRING(element.value.raw);
      if (!element.tail) {
        recurse(node.expressions[i]);
        GET();
        BINARY('string+');
      }
      i && BINARY('string+');
    });
  }


  function TaggedTemplateExpression(node){
    var template = [];
    if (node.quasi) {
      node.template = node.quasi;
      delete node.quasi;
    }
    each(node.template.templates, function(element){
      template.push(element.value);
    });

    UNDEFINED();
    recurse(node.tag);
    GET();
    ARGS();
    TEMPLATE(template);
    GET();
    ARG();
    each(node.template.expressions, function(node){
      recurse(node);
      GET();
      ARG();
    });
    CALL(false);
  }

  function ThisExpression(node){
    THIS();
  }

  function ThrowStatement(node){
    recurse(node.argument);
    GET();
    THROW();
  }

  function TryStatement(node){
    isWrapped(node.block);

    if (node.finalizer) {
      context.code.inFinally = true;
    }
    var begin = current();

    unwinder('try', function(){
      each(node.block.body, recurse);
    });

    var handlers = [JUMP()],
        wrapper  = wrap(node.finalizer || node.wrapped);

    each(node.handlers, function(handler){
      wrapper(handler);
      recurse(handler);
      handlers.push(JUMP());
    });

    each(handlers, adjust)

    if (node.finalizer) {
      context.code.inFinally = false;
      isntWrapped(node.finalizer);
      recurse(node.finalizer);
      RETURN_CHECK();
    }
  }

  function UnaryExpression(node){
    recurse(node.argument);
    UNARY(node.operator);
  }

  function UpdateExpression(node){
    recurse(node.argument);
    UPDATE(!!node.prefix | ((node.operator === '++') << 1));
  }

  function VariableDeclaration(node, forin){
    if (node.kind === 'var') {
      var DECLARE = function(name){
        context.currentScope.varDeclare(name, 'var');
        VAR(name);
      };
    } else {
      var OP = node.kind === 'const' ? CONST : LET;
      var DECLARE = function(name){
        context.currentScope.lexDeclare(name, node.kind);
        OP(name);
      };
    }


    each(node.declarations, function(item){
      if (node.kind === 'var') {
        pushAll(context.code.VarDeclaredNames, boundNames(item.id));
      }

      if (item.init) {
        if (item.id && item.id.type === 'Identifier' && isAnonymous(item.init)) {
          recurse(item.id);
          renameables[item.init.type](item.init, item.id.name).flags.writableName = true;
        } else {
          recurse(item.init);
          GET();
        }
      } else if (!forin) {
        UNDEFINED();
      }
      if (isPattern(item.id)){
        destructure(item.id, DECLARE);
        POP();
      } else {
        DECLARE(item.id.name);
      }
    });
  }

  function VariableDeclarator(node){}

  function WhileStatement(node){
    copyWrap(node, node.body);

    loop(function(){
      var start = current();
      recurse(node.test);
      GET();
      var test = JFALSE(0)
      recurse(node.body);
      JUMP(start);
      adjust(test);
      return start;
    });
  }

  function WithStatement(node){
    copyWrap(node, node.object);

    recurse(node.object);
    pushScope('with');
    recurse(node.body);
    popScope();
  }

  function YieldExpression(node){
    if (node.argument){
      recurse(node.argument);
      GET();
    } else {
      UNDEFINED();
    }

    YIELD(node.delegate);
  }

  var handlers = {};

  each([ArrayExpression, ArrayPattern, ArrowFunctionExpression, AssignmentExpression,
    AtSymbol, BinaryExpression, BlockStatement, BreakStatement, CallExpression, CatchClause,
    ClassBody, ClassDeclaration, ClassExpression, ClassHeritage, ComprehensionExpression,
    ConditionalExpression, ContinueStatement,
    DebuggerStatement, DoWhileStatement, EmptyStatement, ExportDeclaration, ExportSpecifier,
    ExportSpecifierSet, ExpressionStatement, ForInStatement, ForOfStatement, ForStatement,
    FunctionDeclaration, FunctionExpression, Glob, Identifier, IfStatement, ImportDeclaration,
    ImportSpecifier, LabeledStatement, Literal, LogicalExpression, MemberExpression, MethodDefinition,
    ModuleDeclaration, NativeIdentifier, NewExpression, ObjectExpression, ObjectPattern, Path, Program,
    Property, ReturnStatement, SequenceExpression, SwitchStatement, SymbolDeclaration, SymbolDeclarator,
    TaggedTemplateExpression, TemplateElement, TemplateLiteral, ThisExpression, ThrowStatement,
    TryStatement, UnaryExpression, UpdateExpression, VariableDeclaration, VariableDeclarator,
    WhileStatement, WithStatement, YieldExpression],
    function(handler){
    handlers[fname(handler)] = handler;
  });




  var Assembler = exports.Assembler = (function(){
    function annotateParent(node, parent){
      walk(node, function(node){
        if (isObject(node) && parent) {
          define(node, 'parent', parent);
        }
        return RECURSE;
      });
    }

    function reinterpretNatives(node){
      walk(node, function(node){
        if (node.type === 'Identifier' && /^\$__/.test(node.name)) {
          node.type = 'NativeIdentifier';
          node.name = node.name.slice(3);
        } else {
          return RECURSE;
        }
      });
    }


    function AssemblerOptions(o){
      o = Object(o);
      for (var k in this)
        this[k] = k in o ? o[k] : this[k];
    }

    AssemblerOptions.prototype = {
      scope: 'global',
      natives: false,
      filename: null
    };


    function Assembler(script){
      this.script = new AssemblerOptions(script);
      define(this, {
        strings: [],
        hash: new Hash
      });
    }

    define(Assembler.prototype, {
      source: null,
      node: null,
      code: null,
      pending: null,
      jumps: null,
      labels: null
    });

    define(Assembler.prototype, [
      function assemble(node, source){
        context = this;
        this.pending = new Stack;
        this.jumps = new Stack;
        this.labels = null;
        this.source = source;

        if (this.script.scope === 'function') {
          node = node.body[0].expression;
        }

        var code = new Code(node, source, 'normal', this.script.scope);
        define(code, {
          strings: this.strings,
          hash: this.hash
        });

        code.topLevel = true;

        if (this.script.natives) {
          code.natives = true;
          code.flags.strict = false;
        }

        this.queue(code);

        while (this.pending.length) {
          this.process(this.pending.pop(), this.code);
        }

        return code;
      },
      function process(code, parent){
        this.code = code;
        this.code.filename = this.filename;
        parent && code.derive(parent);
        this.currentScope = code.scope;

        if (code.params) {
          FunctionDeclarationInstantiation(code);
        }

        recurse(code.body);

        var lastOp = last();

        if (code.scopeType === 'global' || code.scopeType === 'eval'){
          COMPLETE();
        } else {
          if (lastOp && lastOp.op.name !== 'RETURN') {
            if (code.lexicalType === 'arrow' && code.body.type !== 'BlockStatement') {
              GET();
              RETURN();
            } else {
              UNDEFINED();
              RETURN();
            }
          }
        }
        this.currentScope = this.currentScope.outer;
      },
      function queue(code){
        if (this.code) {
          this.code.children.push(code);
        }
        this.pending.push(code);
      },
      function intern(name){
        return name;
        /*if (name === '__proto__') {
          if (!this.hash[proto]) {
            var index = this.hash[proto] = this.strings.length;
            this.strings[index] = '__proto__';
          }
          name = proto;
        }

        if (name in this.hash) {
          return this.hash[name];
        } else {
          var index = this.hash[name] = this.strings.length;
          this.strings[index] = name;
          return index;
        }*/
      },
      function earlyError(node, error){
        this.code.errors || (this.code.errors = []);
        this.code.errors.push(error);
        // TODO handle this
      }
    ]);

    return Assembler;
  })();

  exports.assemble = function assemble(script){
    var assembler = new Assembler(script);
    return assembler.assemble(script.ast, script.source);
  };

  return exports;
})(typeof module !== 'undefined' ? module.exports : {});


exports.$Symbol = (function(exports){
  var objects = require('../lib/objects'),
      utility = require('../lib/utility'),
      engine  = require('../engine').engine;

  var inherit = objects.inherit,
      define  = objects.define,
      assign  = objects.assign,
      Hash    = objects.Hash,
      tag     = utility.tag,
      uid     = utility.uid;


  // ###############
  // ### $Symbol ###
  // ###############

  var padding = ['', '0', '00', '000', '0000', '00000', '000000', '0000000', '00000000'];

  function zeroPad(number, places){
    var num  = ''+number,
        len  = num.length,
        diff = places - len;

    if (diff > 0) {
      return padding[diff] + num;
    }
    return num;
  }


  var $Symbol = exports.$Symbol = (function(){
    var postfix = uid();

    function $Symbol(name, isPublic){
      this.Name = name;
      this.Private = !isPublic;
      tag(this);
      this.gensym = '@@@'+zeroPad(this.id, 8)+postfix;
    }

    define($Symbol.prototype, {
      BuiltinBrand: 'BuiltinSymbol',
      Extensible: false,
      Private: true,
      Name: null,
      type: '$Symbol'
    });

    define($Symbol.prototype, [,
      function toStringTag(){
        return 'Symbol';
      },
      function each(){},
      function get(){},
      function set(){},
      function describe(){},
      function remove(){},
      function has(){
        return false;
      },
      function toString(){
        return this.gensym;
      },
      function GetInheritance(){
        return null;
      },
      function SetInheritance(v){
        return false;
      },
      function IsExtensible(){
        return false;
      },
      function PreventExtensions(){},
      function HasOwnProperty(){
        return false;
      },
      function GetOwnProperty(){},
      function Get(key){
      },
      function GetP(receiver, key){
        if (key === 'toString') {
          return intrinsics['%ObjProto_toString%'];
        }
      },
      function SetP(receiver, key, value){
        return false;
      },
      function Delete(key){
        return true;
      },
      function DefineOwnProperty(key, desc){
        return false;
      },
      function enumerator(){
        var iter = new (require('./$Object').$Enumerator)([]);
        define($Symbol.prototype, function enumerator(){
          return iter;
        });
        return iter;
      },
      function Keys(){
        return [];
      },
      function OwnPropertyKeys(){
        return [];
      },
      function Enumerate(){
        return []
      },
      function Freeze(){
        return true;
      },
      function Seal(){
        return true;
      },
      function IsFrozen(){
        return true;
      },
      function IsSealed(){
        return true;
      }
    ]);

    return $Symbol;
  })();

  var $WellKnownSymbol = exports.$WellKnownSymbol = (function(){
    function $WellKnownSymbol(name){
      $Symbol.call(this, '@'+name, true);
    }

    inherit($WellKnownSymbol, $Symbol);

    return $WellKnownSymbol;
  })();

  exports.wellKnownSymbols = assign(new Hash, {
    create     : new $WellKnownSymbol('create'),
    hasInstance: new $WellKnownSymbol('hasInstance'),
    iterator   : new $WellKnownSymbol('iterator'),
    ToPrimitive: new $WellKnownSymbol('ToPrimitive'),
    toStringTag: new $WellKnownSymbol('toStringTag')
  });

  var $InternalSymbol = exports.$InternalSymbol = (function(){
    function $InternalSymbol(name){
      $Symbol.call(this, '@'+name, false);
    }

    inherit($InternalSymbol, $Symbol);

    return $InternalSymbol;
  })();

  exports.internalSymbols = assign(new Hash, {
    BooleanValue: new $InternalSymbol('BooleanValue'),
    DateValue   : new $InternalSymbol('DateValue'),
    NumberValue : new $InternalSymbol('NumberValue'),
    StringValue : new $InternalSymbol('StringValue'),
    MISSING     : new $InternalSymbol('MISSING')
  });


  var realm, intrinsics;

  engine.on('realm-change', function(){
    realm = engine.activeRealm;
    intrinsics = engine.activeIntrinsics;
  });

  return exports;
})(typeof module !== 'undefined' ? exports : {});


exports.$Nil = (function(exports){
  var objects = require('../lib/objects'),
      utility = require('../lib/utility');

  var inherit = objects.inherit,
      define  = objects.define,
      tag     = utility.tag;

  var ToPrimitiveSymbol = require('./$Symbol').wellKnownSymbols.ToPrimitiveSymbol;


  function Undetectable(value){
    this.value = value;
  }

  define(Undetectable.prototype, {
    undetectable: true
  }, [
    function toString(){
      return 'undefined';
    },
    function valueOf(){
      return NaN;
    }
  ]);

  exports.Undetectable = Undetectable;

  exports.isUndetectable = function isUndetectable(value){
    return value instanceof Undetectable;
  };

  exports.isUndefined = function isUndefined(value){
    return value === undefined || value instanceof Undetectable;
  };

  exports.isNullish = function isNullish(value){
    return value == null || value instanceof Undetectable;
  };

  exports.isFalsey = function isFalsey(value){
    return !value || value instanceof Undetectable;
  };



  var nilToPrimitive = {
    Call: function(_, args){
      return args[0] === 'string' ? '' : 0;
    }
  };


  var desc = { Writable: false,
               Enumerable: false,
               Configurable: false };

  function $Nil(){
    this.value = this;
    tag(this);
  }

  exports.$Nil = $Nil;


  inherit($Nil, Undetectable, {
    type: '$Nil',
    BuiltinBrand: 'BuiltinNil'
  }, [
    function toString(){
      return '';
    },
    function valueOf(){
      return 0;
    },
    function toStringTag(){
      return 'Nil';
    },
    function each(){},
    function get(key){
      return this;
    },
    function set(){},
    function describe(key){
      return [key, this, 0];
    },
    function remove(){},
    function has(){
      return false;
    },
    function enumerator(){
      var iter = new (require('./$Object').$Enumerator)([]);
      define($Nil.prototype, function enumerator(){
        return iter;
      });
      return iter;
    },
    (function(){ return function define(){} })(),


    function GetInheritance(){
      return null;
    },
    function SetInheritance(){
      return true;
    },
    function IsExtensible(){
      return true;
    },
    function PreventExtensions(){
      return true;
    },
    function HasProperty(){
      return false;
    },
    function HasOwnProperty(){
      return false;
    },
    function GetOwnProperty(){
      desc.Value = this;
      return desc;
    },
    function Get(key){
      if (key === ToPrimitiveSymbol) {
        return nilToPrimitive;
      }
      return this;
    },
    function GetP(){
      return this;
    },
    function Put(){
      return true;
    },
    function SetP(){
      return true;
    },
    function Delete(){
      return true;
    },
    function DefineOwnProperty(){
      return true;
    },
    function Call(){
      return this;
    },
    function Construct(){
      return this;
    },
    function HasInstance(){
      return false;
    },
    function Keys(){
      return [];
    },
    function OwnPropertyKeys(){
      return [];
    },
    function Enumerate(){
      return [];
    }
  ]);

  return exports;
})(typeof module !== 'undefined' ? exports : {});


exports.descriptors = (function(exports){
  "use strict";
  var objects   = require('../lib/objects'),
      iteration = require('../lib/iteration'),
      errors    = require('../errors'),
      utility   = require('../lib/utility');


  var is      = objects.is,
      create  = objects.create,
      define  = objects.define,
      inherit = objects.inherit,
      each    = iteration.each,
      tag     = utility.tag,
      $$ThrowException = errors.$$ThrowException;

  var E = 0x1,
      C = 0x2,
      W = 0x4,
      A = 0x8,
      ___ = 0,
      E__ = 1,
      _C_ = 2,
      EC_ = 3,
      __W = 4,
      E_W = 5,
      _CW = 6,
      ECW = 7,
      __A = 8,
      E_A = 9,
      _CA = 10,
      ECA = 11;


  var descFields = ['value', 'writable', 'enumerable', 'configurable', 'get', 'set'],
      descProps = ['Value', 'Writable', 'Enumerable', 'Configurable', 'Get', 'Set'],
      standardFields = create(null);

  each(descFields, function(field){
    standardFields[field] = true;
  });


  function $Object(proto){
    $Object = require('./$Object').$Object;
    return new $Object(proto);
  }


  function PropertyDescriptor(){}

  PropertyDescriptor.prototype = define(create(null), {
    constructor: PropertyDescriptor,
    type: 'PropertyDescriptor',
    isDescriptor: true
  });

  exports.PropertyDescriptor = PropertyDescriptor;


  function EmptyDataDescriptor(){}

  exports.EmptyDataDescriptor = EmptyDataDescriptor;

  inherit(EmptyDataDescriptor, PropertyDescriptor, {
    type: 'DataDescriptor',
    isDataDescriptor: true,
    isAccessorDescriptor: false
  });


  function EmptyAccessorDescriptor(){}

  exports.EmptyAccessorDescriptor = EmptyAccessorDescriptor;

  inherit(EmptyAccessorDescriptor, PropertyDescriptor, {
    type: 'AccessorDescriptor',
    isDataDescriptor: false,
    isAccessorDescriptor: true
  }, [
     function getAccessor(){
      if (this.accessor) {
        return this.accessor;
      }
      return this.accessor = new Accessor(this.Get, this.Set);
    }
  ]);


  function DataDescriptor(value, attributes){
    this.Value = value;
    this.Writable = (attributes & W) > 0;
    this.Enumerable = (attributes & E) > 0;
    this.Configurable = (attributes & C) > 0;
  }

  exports.DataDescriptor = DataDescriptor;

  inherit(DataDescriptor, EmptyDataDescriptor, {
    Writable: undefined,
    Value: undefined
  });



  function AccessorDescriptor(accessor, attributes){
    this.accessor = accessor;
    this.Get = accessor.Get;
    this.Set = accessor.Set;
    this.Enumerable = (attributes & E) > 0;
    this.Configurable = (attributes & C) > 0;
  }

  exports.AccessorDescriptor = AccessorDescriptor;

  inherit(AccessorDescriptor, EmptyAccessorDescriptor, {
    Get: undefined,
    Set: undefined
  });


  function StringIndex(value){
    this.Value = value;
  }

  exports.StringIndex = StringIndex;

  StringIndex.prototype = new DataDescriptor(undefined, E__);


  function Value(value){
    this.Value = value;
  }

  exports.Value = Value;

  inherit(Value, EmptyDataDescriptor);


  function Accessor(get, set){
    this.Get = get;
    this.Set = set;
    tag(this);
  }

  exports.Accessor = Accessor;

  define(Accessor.prototype, {
    Get: undefined,
    Set: undefined
  });


  function BuiltinAccessor(get, set){
    tag(this);
    if (get) this.Get = { Call: get };
    if (set) this.Set = { Call: set };
  }

  exports.BuiltinAccessor = BuiltinAccessor;

  inherit(BuiltinAccessor, Accessor);


  function ArgAccessor(name, env){
    this.name = name;
    this.env = env;
    tag(this);
  }

  exports.ArgAccessor = ArgAccessor;

  inherit(ArgAccessor, Accessor, {
    type: 'ArgAccessor',
    Get: { Call: function(){ return this.env.GetBindingValue(this.name) } },
    Set: { Call: function(v){ this.env.SetMutableBinding(this.name, v) } }
  });




  function $$IsDescriptor(desc) {
    return desc ? desc.isDescriptor === true : false;
  }

  exports.$$IsDescriptor = $$IsDescriptor;


  function $$IsEmptyDescriptor(desc) {
    return !('Get' in desc
          || 'Set' in desc
          || 'Value' in desc
          || 'Writable' in desc
          || 'Enumerable' in desc
          || 'Configurable' in desc);
  }

  exports.$$IsEmptyDescriptor = $$IsEmptyDescriptor;


  function $$IsAccessorDescriptor(desc) {
    return desc === undefined ? false : 'Get' in desc || 'Set' in desc;
  }

  exports.$$IsAccessorDescriptor = $$IsAccessorDescriptor;

  function $$IsDataDescriptor(desc) {
    return desc === undefined ? false : 'Value' in desc || 'Writable' in desc;
  }

  exports.$$IsDataDescriptor = $$IsDataDescriptor;


  function $$IsGenericDescriptor(desc) {
    return desc === undefined ? false : !('Get' in desc || 'Set' in desc || 'Value' in desc || 'Writable' in desc);
  }

  exports.$$IsGenericDescriptor = $$IsGenericDescriptor;


  function $$IsEquivalentDescriptor(a, b) {
    return a.isDataDescriptor === b.isDataDescriptor
        && a.Get === b.Get
        && a.Set === b.Set
        && a.Writable === b.Writable
        && a.Enumerable === b.Enumerable
        && a.Configurable === b.Configurable
        && is(a.Value, b.Value);
  }

  exports.$$IsEquivalentDescriptor = $$IsEquivalentDescriptor;



  function $$FromPropertyDescriptor(desc){
    if (desc) {
      var obj = new $Object;
      obj.set('enumerable', desc.Enumerable);
      obj.set('configurable', desc.Configurable);
      if (desc.isDataDescriptor) {
        obj.set('writable', desc.Writable);
        obj.set('value', desc.Value);
      } else if (desc.isAccessorDescriptor)  {
        obj.set('get', desc.Get);
        obj.set('set', desc.Set);
      }
      return obj;
    }
  }

  exports.$$FromPropertyDescriptor = $$FromPropertyDescriptor;


  function $$ToPropertyDescriptor(obj) {
    if (typeof obj !== 'object') {
      return $$ThrowException('property_desc_object', [typeof obj]);
    }

    var fields = create(null);

    for (var i=0; i < 6; i++) {
      var field = descFields[i];
      if (obj.HasProperty(field)) {
        var result = fields[field] = obj.Get(field);
        if (result && result.Abrupt) return result;
      }
    }

    if ('get' in fields || 'set' in fields) {
      if ('value' in fields || 'writable' in fields) {
        return $$ThrowException('value_and_accessor', [fields]);
      }

      var desc = new EmptyAccessorDescriptor;

      if ('get' in fields) {
        var getter = desc.Get = fields.get;
        if (getter ? !getter.Call : getter !== undefined) {
          return $$ThrowException('getter_must_be_callable', [typeof getter]);
        }
      }

      if ('set' in fields) {
        var setter = desc.Set = fields.set;
        if (setter ? !setter.Call : setter !== undefined) {
          return $$ThrowException('setter_must_be_callable', [typeof setter]);
        }
      }
    } else if ('value' in fields || 'writable' in fields) {
      var desc = new EmptyDataDescriptor;
      if ('value' in fields) desc.Value = fields.value;
      if ('writable' in fields) desc.Writable = fields.writable;
    } else {
      var desc = new EmptyDataDescriptor;
    }

    if ('enumerable' in fields) desc.Enumerable = fields.enumerable;
    if ('configurable' in fields) desc.Configurable = fields.configurable;

    return desc;
  }

  exports.$$ToPropertyDescriptor = $$ToPropertyDescriptor;

  function $$FromGenericPropertyDescriptor(desc){
    if (desc === undefined) return;
    var obj = new $Object;
    for (var i=0, v; i < 6; i++) {
      if (descProps[i] in desc) {
        obj.define(descFields[i], desc[descProps[i]], ECW);
      }
    }
    return obj;
  }

  exports.$$FromGenericPropertyDescriptor = $$FromGenericPropertyDescriptor;


  function $$ToCompletePropertyDescriptor(obj){
    var desc = $$ToPropertyDescriptor(obj);
    if (desc && desc.Abrupt) return desc;

    if ('Value' in desc || 'Writable' in desc) {
      'Value' in desc    || (desc.Value = undefined);
      'Writable' in desc || (desc.Writable = false);
    } else if ('Get' in desc || 'Set' in desc) {
      'Get' in desc || (desc.Get = undefined);
      'Set' in desc || (desc.Set = undefined);
    } else {
      desc.isDataDescriptor = true;
      desc.Value = undefined;
      desc.Writable = false;
    }
    'Enumerable' in desc   || (desc.Enumerable = false);
    'Configurable' in desc || (desc.Configurable = false);
    return desc;
  }

  exports.$$ToCompletePropertyDescriptor = $$ToCompletePropertyDescriptor;


  function $$CopyAttributes(from, to){
    var props = from.Enumerate(true, true);
    for (var i=0; i < props.length; i++) {
      var field = props[i];
      if (!(field in standardFields)) {
        to.set(field, from.Get(field));
      }
    }
  }

  exports.$$CopyAttributes = $$CopyAttributes;

  return exports;
})(typeof module !== 'undefined' ? exports : {});


exports.collections = (function(exports){
  "use strict";
  var objects   = require('../lib/objects'),
      traversal = require('../lib/traversal'),
      utility   = require('../lib/utility'),
      constants = require('../constants');

  var Hash    = objects.Hash,
      create  = objects.create,
      define  = objects.define,
      inherit = objects.inherit,
      hasOwn  = objects.hasOwn,
      jsonify = traversal.jsonify,
      tag     = utility.tag,
      Empty   = constants.Empty;

  exports.MapData = (function(){
    function LinkedItem(key, next){
      this.key = key;
      this.next = next;
      this.previous = next.previous;
      next.previous = next.previous.next = this;
    }

    define(LinkedItem.prototype, [
      function unlink(){
        this.next.previous = this.previous;
        this.previous.next = this.next;
        this.next = this.previous = this.value = this.key = null;
        return this.value;
      }
    ]);


    function MapData(){
      tag(this);
      this.guard = create(LinkedItem.prototype);
      this.guard.key = {};
      this.reset();
    }

    MapData.sigil = create(null);

    define(MapData.prototype, {
      type: 'MapData'
    });

    define(MapData.prototype, [
      function toJSON(key){
        var entries = [];
        this.forEach(function(value, key){
          console.log(value, key);
          entries.push([jsonify(key), jsonify(value)]);
        });
        return { type: 'MapData',
                 entries: entries };
      },
      function reset(){
        this.size = 0;
        this.numbers = [];
        this.strings = new Hash;
        this.others = new Hash;
        this.lastLookup = this.guard.next = this.guard.previous = this.guard;
      },
      function clone(){
        var result = new MapData;
        this.forEach(function(value, key){
          result.set(key, value);
        });
        return result;
      },
      function forEach(callback, context){
        var item  = this.guard.next,
            index = 0;

        context = context || this;

        while (item !== this.guard) {
          callback.call(context, item.value, item.key, this);
          item = item.next;
        }
      },
      function clear(){
        var next, item = this.guard.next;

        while (item !== this.guard) {
          next = item.next;
          if (item.key !== null && typeof item.key === 'object') {
            delete item.key.storage[this.id];
          }
          item.next = item.previous = item.value = item.key = null;
          item = next;
        }

        this.reset();
      },
      function add(key){
        this.size++;
        return new LinkedItem(key, this.guard);
      },
      function lookup(key){
        var type = typeof key;
        if (key === this) {
          return this.guard;
        } else if (key !== null && type === 'object') {
          return key.storage[this.id];
        } else {
          var storage = this.getStorage(key);
          if (hasOwn(storage, key)) {
            return storage[key];
          }
        }
      },
      function getStorage(key){
        var type = typeof key;
        if (type === 'string') {
          return this.strings;
        } else if (type === 'number') {
          return key === 0 && 1 / key === -Infinity ? this.others : this.numbers;
        } else {
          return this.others;
        }
      },
      function set(key, value){
        var type = typeof key;
        if (key !== null && type === 'object') {
          var item = key.storage[this.id] || (key.storage[this.id] = this.add(key));
        } else {
          var items = this.getStorage(key),
              item  = items[key] || (items[key] = this.add(key));
        }
        item.value = value;
      },
      function get(key){
        var item = this.lookup(key);
        if (item) {
          return item.value;
        }
      },
      function has(key){
        return !!this.lookup(key);
      },
      function remove(key){
        if (key !== null && typeof key === 'object') {
          var item = key.storage[this.id];
          if (item) {
            delete key.storage[this.id];
          }
        } else {
          var items = this.getStorage(key),
              item  = items[key];

          if (item) {
            delete items[key];
          }
        }

        if (item) {
          item.unlink();
          this.size--;
          return true;
        }
        return false;
      },
      function after(key){
        if (key === MapData.sigil) {
          var item = this.guard;
        } else if (key === this.lastLookup.key) {
          var item = this.lastLookup;
        } else {
          var item = this.lookup(key);
        }
        if (item && item.next !== this.guard) {
          this.lastLookup = item.next;
          return [item.next.key, item.next.value];
        }
      }
    ]);

    return MapData;
  })();


  exports.WeakMapData = (function(){
    function WeakMapData(){
      tag(this);
    }

    define(WeakMapData.prototype, {
      type: 'WeakMapData'
    });
    define(WeakMapData.prototype, [
      function set(key, value){
        if (value === undefined) {
          value = Empty;
        }
        key.storage[this.id] = value;
      },
      function get(key){
        var value = key.storage[this.id];
        if (value !== Empty) {
          return value;
        }
      },
      function has(key){
        return key.storage[this.id] !== undefined;
      },
      function remove(key){
        var item = key.storage[this.id];
        if (item !== undefined) {
          key.storage[this.id] = undefined;
          return true;
        }
        return false;
      }
    ]);

    return WeakMapData;
  })();


  return exports;
})(typeof module !== 'undefined' ? exports : {});


exports.operators = (function(exports){
  "use strict";
  var constants        = require('../constants'),
      Nil              = require('./$Nil'),
      symbols          = require('./$Symbol').wellKnownSymbols,
      $$ThrowException = require('../errors').$$ThrowException,
      engine           = require('../engine').engine;

  var hasInstanceSymbol  = symbols.hasInstance,
      createSymbol       = symbols.create,
      ToPrimitiveSymbol  = symbols.ToPrimitive;

  var isFalsey       = Nil.isFalsey,
      isNullish      = Nil.isNullish,
      isUndefined    = Nil.isUndefined,
      isUndetectable = Nil.isUndetectable;


  function $$HasPrimitiveBase(v){
    var type = typeof v.base;
    return type === 'string' || type === 'number' || type === 'boolean';
  }

  exports.$$HasPrimitiveBase = $$HasPrimitiveBase;


  // ## $$GetValue

  function $$GetValue(v){
    if (!v || !v.Reference || v.Abrupt) return v;
    var base = v.base;

    if (base == null) {
      return $$ThrowException('not_defined', [v.name]);
    } else {
      var type = typeof base;

      if (type !== 'object') {
        if (type === 'string' && v.name === 'length' || v.name >= 0 && v.name < base.length) {
          return base[v.name];
        }
        base = $$ToObject(base);
      }

      if (base.Get) {
        if ('thisValue' in v) {
          return base.GetP($$GetThisValue(v), v.name);
        } else {
          return base.Get(v.name);
        }
      }

      if (base.GetBindingValue) {
        return base.GetBindingValue(v.name, v.strict);
      }
    }
  }

  exports.$$GetValue = $$GetValue;

  // ## $$PutValue

  function $$PutValue(v, w){
    if (!v) {
      return $$ThrowException('non_object_property_store', [TYPEOF(v), TYPEOF(w)]);
    } else if (v.Abrupt) {
      return v;
    } else if (!v.Reference) {
      return $$ThrowException('non_object_property_store', [v.name, v.base]);
    } else if (w && w.Abrupt) {
      return w;
    }

    var base = v.base;

    if (base == null) {
      if (v.strict) {
        return $$ThrowException('not_defined', [v.name, base]);
      }

      var global = engine.activeGlobal;
      return global ? global.Put(v.name, w, false) : false;
    }

    if (typeof base !== 'object') {
      base = $$ToObject(base);
    }

    if (base.Get) {
      if ('thisValue' in v) {
        return base.SetP(GetThisValue(v), v.name, w, v.strict);
      }
      return base.Put(v.name, w, v.strict);
    } else if (base.SetMutableBinding) {
      return base.SetMutableBinding(v.name, w, v.strict);
    }
  }
  exports.$$PutValue = $$PutValue;

  // ## GetThisValue

  function $$GetThisValue(v){
    if (!v || v.Abrupt || !v.Reference) {
      return v;
    }

    var base = v.base;

    if (base == null) {
      return $$ThrowException('non_object_property_load', [v.name, base]);
    }

    return 'thisValue' in v ? v.thisValue : base;
  }
  exports.$$GetThisValue = $$GetThisValue;

  var runtime;


  function $$ToObject(argument){
    switch (typeof argument) {
      case 'undefined':
        return $$ThrowException('undefined_to_object', []);
      case 'object':
        return argument === null ? $$ThrowException('null_to_object', []) : argument;
      case 'boolean':
        var name = '%Boolean%';
        break;
      case 'number':
        var name = '%Number%';
        break;
      case 'string':
        var name = '%String%';
    }

    return intrinsics[name].Construct([argument]);
  }

  exports.$$ToObject = $$ToObject;


  function $$Type(argument){
    if (argument === null) {
      return 'Null';
    }
    switch (typeof argument) {
      case 'undefined':
        return 'Undefined';
      case 'object':
        if (argument.Reference) {
          return $$Type($$GetValue(argument));
        } else if (argument.Completion){
          return 'Completion';
        } else if (isUndefined(argument)) {
          return 'Undefined'
        }
        return 'Object';
      case 'string':
        return 'String';
      case 'number':
        return 'Number';
      case 'boolean':
        return 'Boolean';
    }
  }

  exports.$$Type = $$Type;


  function $$IsCallable(argument){
    if (argument && argument.Abrupt) return argument;
    return !!(argument && typeof argument === 'object' ? argument.Call : false);
  }

  exports.$$IsCallable = $$IsCallable;


  function $$ToPrimitive(argument, PreferredType){
    if ($$Type(argument) !== 'Object') {
      return argument;
    }

    if (PreferredType === 'String') {
      var hint = 'string';
    } else if (PreferredType === 'Number') {
      var hint = 'number';
    } else {
      var hint = 'default';
    }

    var exoticToPrim = argument.Get(ToPrimitiveSymbol);
    if (exoticToPrim !== undefined) {
      if (!$$IsCallable(exoticToPrim)) {
        return $$ThrowException('cannot_convert_to_primitive', []);
      }
      var result = exoticToPrim.Call(argument, [hint]);
      if ($$Type(result) !== 'Object') {
        return result;
      }
      return $$ThrowException('cannot_convert_to_primitive', []);
    }

    if (hint === 'default') {
      hint = 'number';
    }

    return $$OrdinaryToPrimitive(argument, hint);
  }

  exports.$$ToPrimitive = $$ToPrimitive;


  function $$OrdinaryToPrimitive(O, hint){
    // Assert: $$Type(O) is Object
    // Assert: $$Type(hint) is String and its value is either "string" or "number"

    if (hint === 'string') {
      var tryFirst  = 'toString',
          trySecond = 'valueOf';
    } else {
      var tryFirst  = 'valueOf',
          trySecond = 'toString';
    }

    var first = O.Get(tryFirst);
    if ($$IsCallable(first)) {
      var result = first.Call(O);
      if ($$Type(result) !== 'Object') {
        return result;
      }
    }

    var second = O.Get(trySecond);
    if ($$IsCallable(second)) {
      var result = second.Call(O);
      if ($$Type(result) !== 'Object') {
        return result;
      }
    }

    return $$ThrowException('cannot_convert_to_primitive', []);
  }

  exports.$$OrdinaryToPrimitive = $$OrdinaryToPrimitive;


  function $$ToBoolean(argument){
    if (argument && argument.Completion) return argument;
    return !isFalsey(argument);
  }
  exports.$$ToBoolean = $$ToBoolean;


  function $$ToNumber(argument){
    if (!isFalsey(argument) && typeof argument === 'object') {
      if (argument.Abrupt) return argument;
      return $$ToNumber($$ToPrimitive(argument, 'Number'));
    }
    return +argument;
  }
  exports.$$ToNumber = $$ToNumber;


  function $$ToInteger(argument){
    argument = $$ToNumber(argument);

    if (argument && argument.Abrupt) return argument;

    if (argument !== argument) {
      return 0;
    }

    if (argument === 0 || argument === Infinity || argument === -Infinity) {
      return argument;
    }

    return argument >> 0;
  }
  exports.$$ToInteger = $$ToInteger;

  // ## $$ToUint32

  function $$ToUint32(argument){
    argument = $$ToNumber(argument);
    if (argument && argument.Abrupt) return argument;
    return argument >>> 0;
  }
  exports.$$ToUint32 = $$ToUint32;

  // ## $$ToInt32

  function $$ToInt32(argument){
    argument = $$ToNumber(argument);
    if (argument && argument.Abrupt) return argument;
    return argument >> 0;
  }
  exports.$$ToInt32 = $$ToInt32;

  // ## $$ToUint16

  function $$ToUint16(argument){
    argument = $$ToNumber(argument);
    if (argument && argument.Abrupt) return argument;
    return argument >>> 0 & 0xffff;
  }
  exports.$$ToUint16 = $$ToUint16;


  // ## $$ToPropertyKey

  function $$ToPropertyKey(argument){
    if (isFalsey(argument)) {
      return argument + '';
    }
    var type = typeof argument;
    if (type === 'string' || type === 'object' && argument.Abrupt || argument.BuiltinBrand === 'BuiltinSymbol') {
      return argument;
    }
    return $$ToString(argument);
  }
  exports.$$ToPropertyKey = $$ToPropertyKey;

  // ## $$ToString

  function $$ToString(argument){
    switch (typeof argument) {
      case 'string': return argument;
      case 'undefined':
      case 'number':
      case 'boolean': return ''+argument;
      case 'object':
        if (argument === null) {
          return 'null';
        } else if (argument.Abrupt) {
          return argument;
        } else if (isUndetectable(argument)) {
          return argument.toString();
        }
        return $$ToString($$ToPrimitive(argument, 'String'));
    }
  }
  exports.$$ToString = $$ToString;


  void function(createChanger){
    exports.PRE_INC  = createChanger(true, 1);
    exports.POST_INC = createChanger(false, 1);
    exports.PRE_DEC  = createChanger(true, -1);
    exports.POST_DEC = createChanger(false, -1);
  }(function(pre, change){
    return function(ref) {
      var val = $$ToNumber($$GetValue(ref));
      if (val && val.Abrupt) return val;

      var newVal = val + change,
          result = $$PutValue(ref, newVal);

      if (result && result.Abrupt) return result;
      return pre ? newVal : val;
    };
  });

  var MUL, DIV, MOD, SUB, BIT_OR, BIT_AND, BIT_XOR;
  void function(makeMathOp){
    exports.MUL     = MUL     = makeMathOp(function(l, r){ return l * r });
    exports.DIV     = DIV     = makeMathOp(function(l, r){ return l / r });
    exports.MOD     = MOD     = makeMathOp(function(l, r){ return l % r });
    exports.SUB     = SUB     = makeMathOp(function(l, r){ return l - r });
    exports.BIT_AND = BIT_AND = makeMathOp(function(l, r){ return l & r });
    exports.BIT_OR  = BIT_OR  = makeMathOp(function(l, r){ return l | r });
    exports.BIT_XOR = BIT_XOR = makeMathOp(function(l, r){ return l ^ r });
  }(function(finalize){
    return function(lval, rval) {
      lval = $$ToNumber(lval);
      if (lval && lval.Abrupt) return lval;
      rval = $$ToNumber(rval);
      if (rval && rval.Abrupt) return rval;
      return finalize(lval, rval);
    };
  });

  function convertAdd(a, b, type, converter){
    if (typeof a !== type) {
      a = converter(a);
      if (a && a.Abrupt) return a;
    } else if (typeof b !== type) {
      b = converter(b);
      if (b && b.Abrupt) return b;
    }
    return a + b;
  }



  function ADD(lval, rval) {
    lval = $$ToPrimitive(lval);
    if (lval && lval.Abrupt) return lval;

    rval = $$ToPrimitive(rval);
    if (rval && rval.Abrupt) return rval;

    if (typeof lval === 'string' || typeof rval === 'string') {
      return convertAdd(lval, rval, 'string', $$ToString);
    }
    return convertAdd(lval, rval, 'number', $$ToNumber);
  }
  exports.ADD = ADD;



  function STRING_ADD(lval, rval){
    return convertAdd(lval, rval, 'string', $$ToString);
  }
  exports.STRING_ADD = STRING_ADD;



  var SHL, SHR, SAR;
  void function(makeShifter){
    exports.SHL = SHL = makeShifter(function(l, r){ return l << r });
    exports.SHR = SHR = makeShifter(function(l, r){ return l >> r });
    exports.SAR = SAR = makeShifter(function(l, r){ return l >>> r });
  }(function(finalize){
    return function(lval, rval) {
      lval = $$ToInt32(lval);
      if (lval && lval.Abrupt) return lval;
      rval = $$ToUint32(rval);
      if (rval && rval.Abrupt) return rval;
      return finalize(lval, rval & 0x1f);
    };
  });



  function COMPARE(x, y, left){
    if (left === false) {
      var lval = x,
          rval = y;
    } else {
      var lval = y,
          rval = x;
    }

    lval = $$ToPrimitive(lval, 'Number');
    if (lval && lval.Abrupt) return lval;

    rval = $$ToPrimitive(rval, 'Number');
    if (rval && rval.Abrupt) return rval;

    var ltype = typeof lval,
        rtype = typeof rval;

    if (ltype === 'string' || rtype === 'string') {
      if (ltype !== 'string') {
        lval = $$ToString(lval);
        if (lval && lval.Abrupt) return lval;
      } else if (rtype !== 'string') {
        rval = $$ToString(rval);
        if (rval && rval.Abrupt) return rval;
      }
      if (typeof lval === 'string' && typeof rval === 'string') {
        return lval < rval;
      }
    } else {
      if (ltype !== 'number') {
        lval = $$ToNumber(lval);
        if (lval && lval.Abrupt) return lval;
      }
      if (rtype !== 'number') {
        rval = $$ToNumber(rval);
        if (rval && rval.Abrupt) return rval;
      }
      if (typeof lval === 'number' && typeof rval === 'number') {
        return lval < rval;
      }
    }
  }

  var LT, GT, LTE, GTE;
  void function(creatorComparer){
    exports.LT  = LT  = creatorComparer(true, false);
    exports.GT  = GT  = creatorComparer(false, false);
    exports.LTE = LTE = creatorComparer(true, true);
    exports.GTE = GTE = creatorComparer(false, true);
  }(function(reverse, left){
    return function(lval, rval){
      if (reverse) {
        var temp = lval;
        lval = rval;
        rval = temp;
      }

      var result = COMPARE(rval, lval, left);
      if (result && result.Abrupt) return result;

      if (isUndefined(result)) {
        return false;
      }
      return left ? !result : result;
    };
  });


  function $$OrdinaryHasInstance(C, O){
    $$OrdinaryHasInstance = require('./operations').$$OrdinaryHasInstance;
    return $$OrdinaryHasInstance(C, O);
  }


  function $$GetMethod(O, P){
    $$GetMethod = require('./operations').$$GetMethod;
    return $$GetMethod(O, P);
  }

  function INSTANCE_OF(O, C){
    var instOfHandler = $$GetMethod(C, hasInstanceSymbol);

    if (instOfHandler !== undefined) {
      return instOfHandler.Call(C, [O]);
    }

    if (!C || !C.Call) {
      return $$ThrowException('instanceof_function_expected', [TYPEOF(C)]);
    }

    return $$OrdinaryHasInstance(C, O);
  }
  exports.INSTANCE_OF = INSTANCE_OF;



  function EQUAL(lval, rval) {
    if (lval && lval.Abrupt) return lval;
    if (rval && rval.Abrupt) return rval;
    if (lval === rval) {
      return true;
    }
    if (lval === undefined) {
      return isUndetectable(rval);
    }
    if (rval === undefined) {
      return isUndetectable(lval);
    }
    return false;
  }
  exports.EQUAL = EQUAL;

  function NOT_EQUAL(lval, rval){
    return !EQUAL(lval, rval);
  }
  exports.NOT_EQUAL = NOT_EQUAL;


  function EQUIVALENT(lval, rval){
    if (lval && lval.Abrupt) return lval;
    if (rval && rval.Abrupt) return rval;

    var ltype = typeof lval,
        rtype = typeof rval;

    if (isNullish(lval)) {
      return isNullish(rval);
    } else if (isNullish(rval)) {
      return isNullish(lval);
    } else if (ltype === rtype) {
      return EQUAL(lval, rval);
    } else if (ltype === 'number' || rtype === 'string') {
      return EQUIVALENT(lval, $$ToNumber(rval));
    } else if (ltype === 'string' || rtype === 'number') {
      return EQUIVALENT($$ToNumber(lval), rval);
    } else if (rtype === 'boolean') {
      return EQUIVALENT(lval, $$ToNumber(rval));
    } else if (ltype === 'boolean') {
      return EQUIVALENT($$ToNumber(lval), rval);
    } else if (rtype === 'object' && ltype === 'number' || ltype === 'string') {
      return EQUIVALENT(lval, $$ToPrimitive(rval));
    } else if (ltype === 'object' && rtype === 'number' || rtype === 'object') {
      return EQUIVALENT($$ToPrimitive(lval), rval);
    }
    return false;
  }
  exports.EQUIVALENT = EQUIVALENT;

  function NOT_EQUIVALENT(lval, rval){
    var result = EQUIVALENT(lval, rval);
    return typeof result === 'boolean' ? !result : result

  }
  exports.NOT_EQUAL = NOT_EQUAL;



  function VOID(ref){
    var val = $$GetValue(ref);
    if (val && val.Abrupt) return val;
  }
  exports.VOID = VOID;

  function TYPEOF(val) {
    var type = typeof val;
    switch (type) {
      case 'undefined':
      case 'boolean':
      case 'number':
      case 'string': return type;
      case 'object':
        if (val === null) {
          return 'object';
        }

        if (val.Abrupt) return val;

        if (val.Reference) {
          if (isUndefined(val.base)) {
            return 'undefined';
          }
          return TYPEOF($$GetValue(val));
        }

        if ('Call' in val) {
          return 'function';
        }

        if (isUndefined(val)) {
          return 'undefined';
        }

        return 'object';
      }
  }
  exports.TYPEOF = TYPEOF;


  function POSITIVE(ref){
    return $$ToNumber($$GetValue(ref));
  }
  exports.POSITIVE = POSITIVE;


  var NEGATIVE, BIT_NOT, NOT;
  void function(createUnaryOp){
    exports.NEGATIVE = NEGATIVE = createUnaryOp($$ToNumber,  function(n){ return -n });
    exports.BIT_NOT  = BIT_NOT  = createUnaryOp($$ToInt32,   function(n){ return ~n });
    exports.NOT      = NOT      = createUnaryOp($$ToBoolean, function(n){ return isFalsey(n) });
  }(function(convert, finalize){
    return function(ref){
      if (isFalsey(ref) || typeof ref !== 'object') {
        return finalize(ref);
      }

      var val = convert($$GetValue(ref));
      if (val && val.Abrupt) return val;
      return finalize(val);
    }
  });


  function DELETE(ref){
    if (isFalsey(ref) || !ref.Reference) {
      return true;
    }

    var base = ref.base;
    if (isUndefined(base)) {
      if (ref.strict) {
        return $$ThrowException('strict_delete_property', [ref.name, base]);
      }
      return true;
    }

    if (base.Delete) {
      if ('thisValue' in ref) {
        return $$ThrowException('super_delete_property', ref.name);
      } else {
        return base.Delete(ref.name, ref.strict);
      }
    } else if (base.DeleteBinding) {
      return base.DeleteBinding(ref.name);
    }
    return true;
  }
  exports.DELETE = DELETE;


  function IN(lval, rval) {
    if (!rval || !rval.HasProperty) {
      return $$ThrowException('invalid_in_operator_use', [lval, TYPEOF(rval)]);
    }

    lval = $$ToPropertyKey(lval);
    if (lval && lval.Abrupt) return lval;

    return rval.HasProperty(lval);
  }
  exports.IN = IN;



  function UnaryOperation(operator, val) {
    switch (operator) {
      case 'delete': return DELETE(val);
      case 'void':   return VOID(val);
      case 'typeof': return TYPEOF(val);
      case '+':      return POSITIVE(val);
      case '-':      return NEGATIVE(val);
      case '~':      return BIT_NOT(val);
      case '!':      return NOT(val);
    }
  }
  exports.UnaryOperation = UnaryOperation;



  function BinaryOperation(operator, lval, rval) {
    switch (operator) {
      case 'instanceof': return INSTANCE_OF(lval, rval);
      case 'in':         return IN(lval, rval);
      case '==':         return EQUIVALENT(lval, rval);
      case '!=':         return NOT_EQUIVALENT(lval, rval);
      case '===':        return EQUAL(lval, rval);
      case '!==':        return NOT_EQUAL(lval, rval);
      case '<':          return LT(lval, rval);
      case '>':          return GT(lval, rval);
      case '<=':         return LTE(lval, rval);
      case '>=':         return GTE(lval, rval);
      case '*':          return MUL(lval, rval);
      case '/':          return DIV(lval, rval);
      case '%':          return MOD(lval, rval);
      case '+':          return ADD(lval, rval);
      case 'string+':    return STRING_ADD(lval, rval);
      case '-':          return SUB(lval, rval);
      case '<<':         return SHL(lval, rval);
      case '>>':         return SHR(lval, rval);
      case '>>>':        return SAR(lval, rval);
      case '|':          return BIT_OR(lval, rval);
      case '&':          return BIT_AND(lval, rval);
      case '^':          return BIT_XOR(lval, rval);
    }
  }
  exports.BinaryOperation = BinaryOperation;


  var realm, intrinsics;

  engine.on('realm-change', function(){
    realm = engine.activeRealm;
    intrinsics = engine.activeIntrinsics;
  });

  return exports;
})(typeof module !== 'undefined' ? module.exports : {});


exports.environments = (function(exports, undefined){
  "use strict";
  var objects = require('../lib/objects');

  var Hash     = objects.Hash,
      isObject = objects.isObject,
      ownKeys  = objects.keys,
      define   = objects.define,
      inherit  = objects.inherit,
      hide     = objects.hide,
      each     = require('../lib/iteration').each,
      tag      = require('../lib/utility').tag;

  var $$ThrowException = require('../errors').$$ThrowException,
      Uninitialized = require('../constants').SYMBOLS.Uninitialized;

  var normal = { Configurable: true,
                 Enumerable: true,
                 Writable: true,
                 Value: undefined };


  // #########################
  // ### EnvironmentRecord ###
  // #########################

  var EnvironmentRecord = exports.EnvironmentRecord = (function(){
    function EnvironmentRecord(bindings, outer){
      this.bindings = bindings;
      this.outer = outer || null;
      this.cache = new Hash;
      tag(this);
    }

    define(EnvironmentRecord.prototype, {
      bindings: null,
      withBase: undefined,
      type: 'Env',
      Environment: true
    });

    define(EnvironmentRecord.prototype, [
      function EnumerateBindings(){},
      function HasBinding(name){},
      function GetBindingValue(name, strict){},
      function SetMutableBinding(name, value, strict){},
      function DeleteBinding(name){},
      function WithBaseObject(){
        return this.withBase;
      },
      function HasThisBinding(){
        return false;
      },
      function HasSuperBinding(){
        return false;
      },
      function GetThisBinding(){},
      function GetSuperBase(){},
      function HasSymbolBinding(name){
        if (this.symbols) {
          return name in this.symbols;
        }
        return false;
      },
      function InitializeSymbolBinding(name, symbol){
        if (!this.symbols) {
          this.symbols = new Hash;
        } else if (name in this.symbols) {
          return $$ThrowException('symbol_redefine', name);
        }
        this.symbols[name] = symbol;
      },
      function GetSymbol(name){
        if (this.symbols && name in this.symbols) {
          return this.symbols[name];
        }
        return $$ThrowException('symbol_not_defined', name);
      }
    ]);

    return EnvironmentRecord;
  })();


  // ####################################
  // ### DeclarativeEnvironmentRecord ###
  // ####################################

  var DeclarativeEnvironmentRecord = exports.DeclarativeEnvironmentRecord = (function(){
    function DeclarativeEnvironmentRecord(outer){
      this.outer = outer || null;
      this.bindings = new Hash;
      this.consts = new Hash;
      this.deletables = new Hash;
      this.cache = new Hash;
      tag(this);
    }

    inherit(DeclarativeEnvironmentRecord, EnvironmentRecord, {
      type: 'DeclarativeEnv'
    }, [
      function destroy(){
        this.destroy = null;
        for (var k in this.bindings) {
          if (this.bindings[k] && this.bindings[k].destroy) {
            this.bindings[k].destroy();
          }
        }
      },
      function EnumerateBindings(){
        return ownKeys(this.bindings);
      },
      function HasBinding(name){
        return name in this.bindings;
      },
      function CreateMutableBinding(name, deletable){
        this.bindings[name] = undefined;
        if (deletable) {
          this.deletables[name] = true;
        }
      },
      function InitializeBinding(name, value){
        this.bindings[name] = value;
      },
      function GetBindingValue(name, strict){
        if (name in this.bindings) {
          var value = this.bindings[name];
          if (value === Uninitialized)
            return $$ThrowException('uninitialized_const', name);
          else
            return value;
        } else if (strict) {
          return $$ThrowException('not_defined', name);
        } else {
          return false;
        }
      },
      function SetMutableBinding(name, value, strict){
        if (name in this.consts) {
          if (this.bindings[name] === Uninitialized) {
            return $$ThrowException('uninitialized_const', name);
          } else if (strict) {
            return $$ThrowException('const_assign', name);
          }
        } else {
          this.bindings[name] = value;
        }
      },
      function CreateImmutableBinding(name){
        this.bindings[name] = Uninitialized;
        this.consts[name] = true;
      },
      function DeleteBinding(name){
        if (name in this.bindings) {
          if (name in this.deletables) {
            delete this.bindings[name];
            delete this.deletables[names];
            return true;
          } else {
            return false;
          }
        } else {
          return true;
        }
      }
    ]);

    return DeclarativeEnvironmentRecord;
  })();


  // #################################
  // ### FunctionEnvironmentRecord ###
  // #################################

  exports.FunctionEnvironmentRecord = (function(){
    function FunctionEnvironmentRecord(receiver, method){
      this.outer = method.Scope;
      this.bindings = new Hash;
      this.consts = new Hash;
      this.deletables = new Hash;
      this.cache = new Hash;
      this.thisValue = receiver;
      this.HomeObject = method.HomeObject;
      this.MethodName = method.MethodName;
      tag(this);
    }

    inherit(FunctionEnvironmentRecord, DeclarativeEnvironmentRecord, {
      HomeObject: undefined,
      MethodName: undefined,
      thisValue: undefined,
      type: 'FunctionEnv'
    }, [
      function HasThisBinding(){
        return true;
      },
      function HasSuperBinding(){
        return this.HomeObject !== undefined;
      },
      function GetThisBinding(){
        return this.thisValue;
      },
      function GetSuperBase(){
        return this.HomeObject ? this.HomeObject.GetInheritance() : undefined;
      },
      function GetMethodName() {
        return this.MethodName;
      }
    ]);

    return FunctionEnvironmentRecord;
  })();


  // ###############################
  // ### ObjectEnvironmentRecord ###
  // ###############################

  var ObjectEnvironmentRecord = exports.ObjectEnvironmentRecord = (function(){
    function ObjectEnvironmentRecord(object, outer){
      this.bindings = object;
      this.outer = outer || null;
      this.cache = new Hash;
      object.env = this;
      hide(object, 'env');
      tag(this);
    }

    inherit(ObjectEnvironmentRecord, EnvironmentRecord, {
      type: 'ObjectEnv'
    }, [
      function destroy(){
        this.destroy = null;
        this.bindings.destroy && this.bindings.destroy();
      },
      function EnumerateBindings(){
        return this.bindings.Enumerate(false, false);
      },
      function HasBinding(name){
        return this.bindings.HasProperty(name);
      },
      function CreateMutableBinding(name, deletable){
        return this.bindings.DefineOwnProperty(name, normal, true);
      },
      function InitializeBinding(name, value){
        normal.Value = value;
        var result = this.bindings.DefineOwnProperty(name, normal, true);
        normal.Value = undefined;
        return result;
      },
      function GetBindingValue(name, strict){
        if (this.bindings.HasProperty(name)) {
          return this.bindings.Get(name);
        } else if (strict) {
          return $$ThrowException('not_defined', name);
        }
      },
      function SetMutableBinding(name, value, strict){
        return this.bindings.Put(name, value, strict);
      },
      function DeleteBinding(name){
       return this.bindings.Delete(name, false);
      }
    ]);

    return ObjectEnvironmentRecord;
  })();


  // ###############################
  // ### GlobalEnvironmentRecord ###
  // ###############################

  exports.GlobalEnvironmentRecord = (function(){
    function GlobalEnvironmentRecord(global){
      ObjectEnvironmentRecord.call(this, global);
      this.thisValue = global;
      this.imports = new Hash;
      this.importedNames = [];
    }

    inherit(GlobalEnvironmentRecord, ObjectEnvironmentRecord, {
      outer: null,
      type: 'GlobalEnv'
    }, [
      function EnumerateBindings(){
        return this.bindings.Enumerate(false, false).concat(this.importedNames);
      },
      function HasBinding(name){
        return name in this.imports || this.bindings.HasProperty(name);
      },
      function GetBindingValue(name, strict){
        if (name in this.imports) {
          return this.imports[name].Get(name);
        } else if (this.bindings.HasProperty(name)) {
          return this.bindings.Get(name);
        } else if (strict) {
          return $$ThrowException('not_defined', name);
        }
      },
      function SetMutableBinding(name, value, strict){
        if (name in this.imports) {
          return this.imports[name].Put(name, value, strict);
        }

        return this.bindings.Put(name, value, strict);
      },
      function GetThisBinding(){
        return this.bindings;
      },
      function HasThisBinding(){
        return true;
      },
      function SetModuleBinding(name, module){
        if (name in this.imports) {
          // TODO duplicate import error
        }

        this.importedNames.push(name);
        this.imports[name] = module;
        return true;
      },
      function inspect(){
        return '[GlobalEnvironmentRecord]';
      }
    ]);

    return GlobalEnvironmentRecord;
  })();

  return exports;
})(typeof module !== 'undefined' ? module.exports : {});


exports.operations = (function(exports){
  "use strict";
  var environments = require('./environments'),
      operators    = require('./operators'),
      descriptors  = require('./descriptors'),
      objects      = require('../lib/objects'),
      iteration    = require('../lib/iteration'),
      errors       = require('../errors'),
      constants    = require('../constants'),
      Nil          = require('./$Nil'),
      MapData      = require('./collections').MapData,
      engine       = require('../engine').engine;

  var isFalsey               = Nil.isFalsey,
      isNullish              = Nil.isNullish,
      isUndefined            = Nil.isUndefined,
      isUndetectable         = Nil.isUndetectable,
      is                     = objects.is,
      create                 = objects.create,
      define                 = objects.define,
      inherit                = objects.inherit,
      Hash                   = objects.Hash,
      each                   = iteration.each,
      AbruptCompletion       = errors.AbruptCompletion,
      $$ThrowException       = errors.$$ThrowException,
      HAS_INSTANCE           = operators.HAS_INSTANCE,
      $$ToPropertyKey        = operators.$$ToPropertyKey,
      $$GetThisValue         = operators.$$GetThisValue,
      $$ToUint32             = operators.$$ToUint32,
      $$ToObject             = operators.$$ToObject,
      $$Type                 = operators.$$Type,
      $$IsDataDescriptor     = descriptors.$$IsDataDescriptor,
      $$IsAccessorDescriptor = descriptors.$$IsAccessorDescriptor,
      $$IsGenericDescriptor  = descriptors.$$IsGenericDescriptor,
      $$IsEmptyDescriptor    = descriptors.$$IsEmptyDescriptor,
      Accessor               = descriptors.Accessor,
      DataDescriptor         = descriptors.DataDescriptor,
      AccessorDescriptor     = descriptors.AccessorDescriptor;

  var E = 0x1,
      C = 0x2,
      W = 0x4,
      A = 0x8,
      ___ = 0,
      E__ = 1,
      _C_ = 2,
      EC_ = 3,
      __W = 4,
      E_W = 5,
      _CW = 6,
      ECW = 7,
      __A = 8,
      E_A = 9,
      _CA = 10,
      ECA = 11;



  function $Object(o){
    $Object = require('./$Object').$Object;
    return new $Object(o);
  }

  function $Array(o){
    $Array = require('./$Array').$Array;
    return new $Array(o);
  }


  var Reference = exports.Reference = (function(){
    function Reference(base, name, strict){
      this.base = base;
      this.name = name;
      this.strict = !!strict;
    }
    define(Reference.prototype, {
      Reference: constants.SYMBOLS.Reference
    });


    define(environments.EnvironmentRecord.prototype, [
      function reference(key, strict){
        var cache = this.cache;
        if (cache) {
          if (key in cache) {
            return cache[key];
          }
        } else {
          cache = this.cache = new Hash;
        }
        return cache[key] = new Reference(this, key, strict);
      }
    ]);

    return Reference;
  })();


  function $$CheckObjectCoercible(argument){
    if (argument === null) {
      return $$ThrowException('null_to_object');
    } else if (argument === undefined) {
      return $$ThrowException('undefined_to_object');
    }
    return argument;
  }

  exports.$$CheckObjectCoercible = $$CheckObjectCoercible;


  function $$IsArrayIndex(argument) {
    var n = argument >>> 0;
    return ''+n === argument && n !== 0xffffffff;
  }

  exports.$$IsArrayIndex = $$IsArrayIndex;


  function $$IsPropertyReference(v){
    var type = typeof v.base;
    return type === 'string' || type === 'number' || type === 'boolean'|| type === 'object' && !!v.base.GetP;
  }

  exports.$$IsPropertyReference = $$IsPropertyReference;


  function $$GetIdentifierReference(lex, name, strict){
    while (lex) {
      if (lex.HasBinding(name)) {
        return new Reference(lex, name, strict);
      }
      lex = lex.outer;
    }
    return new Reference(undefined, name, strict);
  }

  exports.$$GetIdentifierReference = $$GetIdentifierReference;


  function $$GetSymbol(context, name){
    var env = context.LexicalEnvironment;
    while (env) {
      if (env.HasSymbolBinding(name)) {
        return env.GetSymbol(name);
      }
      env = env.outer;
    }
  }

  exports.$$GetSymbol = $$GetSymbol;


  function $$Element(context, prop, base){
    var result = $$CheckObjectCoercible(base);
    if (result.Abrupt) return result;

    var name = $$ToPropertyKey(prop);
    if (name && name.Abrupt) return name;
    return new Reference(base, name, context.callee ? context.callee.Strict : context.Code.flags.strict);
  }

  exports.$$Element = $$Element;


  function $$SuperReference(context, prop){
    var env = $$GetThisEnvironment(context);
    if (!env.HasSuperBinding()) {
      return $$ThrowException('invalid_super_binding');
    } else if (prop === null) {
      return env;
    }

    var baseValue = env.GetSuperBase(),
        status = $$CheckObjectCoercible(baseValue);

    if (status.Abrupt) return status;

    var key = $$ToPropertyKey(prop);
    if (key && key.Abrupt) return key;

    var ref = new Reference(baseValue, key, context.callee ? context.callee.Strict : context.Code.flags.strict);
    ref.thisValue = env.GetThisBinding();
    return ref;
  }

  exports.$$SuperReference = $$SuperReference;


  function $$GetThisEnvironment(context){
    var env = context.LexicalEnvironment;
    while (env) {
      if (env.HasThisBinding()) {
        return env;
      }
      env = env.outer;
    }
  }

  exports.$$GetThisEnvironment = $$GetThisEnvironment;


  function $$ThisResolution(context){
    return $$GetThisEnvironment(context).GetThisBinding();
  }

  exports.$$ThisResolution = $$ThisResolution;


  function $$IdentifierResolution(context, name) {
    return $$GetIdentifierReference(context.LexicalEnvironment, name, context.callee ? context.callee.Strict : context.Code.flags.strict);
  }

  exports.$$IdentifierResolution = $$IdentifierResolution;


  function $$IsCallable(argument){
    if (argument && argument.Abrupt) return argument;
    return !!(argument && typeof argument === 'object' ? argument.Call : false);
  }

  exports.$$IsCallable = $$IsCallable;


  function $$IsConstructor(argument){
    if (argument && argument.Abrupt) return argument;
    return !!(argument && typeof argument === 'object' ? argument.Construct : false);
  }

  exports.$$IsConstructor = $$IsConstructor;


  function $$EvaluateConstruct(func, args) {
    if (typeof func !== 'object') {
      return $$ThrowException('not_constructor', func);
    }

    if ($$IsConstructor(func)) {
      func.constructCount = (func.constructCount || 0) + 1;
      return func.Construct(args);
    } else {
      return $$ThrowException('not_constructor', func);
    }
  }

  exports.$$EvaluateConstruct = $$EvaluateConstruct;


  function $$EvaluateCall(ref, func, args, tail){
    if (!func || !func.Call) {
      return $$ThrowException('called_non_callable', [ref && ref.name]);
    }

    if (ref && ref.Reference) {
      var receiver = $$IsPropertyReference(ref) ? $$GetThisValue(ref) : ref.base.WithBaseObject();
    }

    return func.Call(receiver, args);
  }

  exports.$$EvaluateCall = $$EvaluateCall;


  function $$GetMethod(object, key){
    var func = object.GetP(object, key);
    if (!isUndefined(func) && !$$IsCallable(func)) {
      return $$ThrowException('called_non_callable', [key]);
    }
    return func;
  }

  exports.$$GetMethod = $$GetMethod;


  var emptyArgs = [];

  function $$Invoke(receiver, key, args){
    var object = $$ToObject(receiver);
    if (object && object.Abrupt) return object;

    var func = $$GetMethod(object, key);
    if (func && func.Abrupt) return func;

    if (isUndefined(func)) {
      return $$ThrowException('property_not_function', [key]);
    }

    return func.Call(receiver, args || emptyArgs);
  }

  exports.$$Invoke = $$Invoke;



  function $$SpreadArguments(precedingArgs, spread){
    var obj = $$ToObject(spread);
    if (obj && obj.Abrupt) return obj;

    var len = $$ToUint32(obj.Get('length'));
    if (len && len.Abrupt) return len;

    var offset = precedingArgs.length;

    for (var i=0; i < len; i++) {
      var value = obj.Get(i);
      if (value && value.Abrupt) return value;
      precedingArgs[i + offset] = value;
    }
  }

  exports.$$SpreadArguments = $$SpreadArguments;


  function $$SpreadInitialization(array, offset, spread){
    var obj = $$ToObject(spread);
    if (obj && obj.Abrupt) return obj;

    var len = $$ToUint32(obj.Get('length'));
    if (len && len.Abrupt) return len;

    for (var i = offset; i < len; i++) {
      var value = obj.Get(i);
      if (value && value.Abrupt) return value;
      array.set(offset++ + '', value);
    }

    array.define('length', offset, _CW);
    return offset;
  }

  exports.$$SpreadInitialization = $$SpreadInitialization;


  function $$SpreadDestructuring(context, spread, index){
    var array = new $Array(0);

    if (isNullish(spread)) {
      return array;
    }

    var obj = $$ToObject(spread);
    if (obj && obj.Abrupt) return obj;

    var len = $$ToUint32(obj.Get('length'));
    if (len && len.Abrupt) return len;

    var count = len - index;

    for (var i=0; i < count; i++) {
      var value = obj.Get(index + i);
      if (value && value.Abrupt) return value;
      array.set(i+'', value);
    }

    array.define('length', i, _CW);

    return array;
  }

  exports.$$SpreadDestructuring = $$SpreadDestructuring;


  function $$GetTemplateCallSite(context, template){
    if (!('id' in template)) {
      $$GetTemplateCallSite.count = ($$GetTemplateCallSite.count || 0) + 1;
      template.id = $$GetTemplateCallSite.count;
    }
    if (template.id in realm.templates) {
      return context.Realm.templates[template.id];
    }

    var cooked = [],
        raw = [];

    each(template, function(item, index){
      cooked[index] = item.cooked;
      raw[index] = item.raw;
    });

    var cookedObj = new $Array(cooked),
        rawObj = new $Array(raw);

    cookedObj.set('raw', rawObj);
    intrinsics.freeze.Call(undefined, [cookedObj]);
    intrinsics.freeze.Call(undefined, [rawObj]);
    realm.templates[template.id] = cookedObj;
    return cookedObj;
  }

  exports.$$GetTemplateCallSite = $$GetTemplateCallSite;


  function $$EnqueueChangeRecord(record, changeObservers){
    changeObservers.forEach(function(callback){
      var changeRecords = callback.PendingChangeRecords || (callback.PendingChangeRecords = []);
      changeRecords.push(record);
    });
  }

  exports.$$EnqueueChangeRecord = $$EnqueueChangeRecord;


  function $$CreateChangeRecord(type, object, name, oldDesc){
    var changeRecord = new $Object;
    changeRecord.define('type', type, E__);
    changeRecord.define('object', object, E__);
    if (name !== null) {
      changeRecord.define('name', name, E__);
    }
    if ($$IsDataDescriptor(oldDesc)) {
      changeRecord.define('oldValue', oldDesc.Value, E__);
    }
    changeRecord.PreventExtensions();
    return changeRecord;
  }

  exports.$$CreateChangeRecord = $$CreateChangeRecord;


  function $$DeliverChangeRecords(callback){
    var changeRecords = callback.PendingChangeRecords;
    if (changeRecords && changeRecords.length) {
      callback.PendingChangeRecords = [];
      var result = callback.Call(undefined, [new $Array(changeRecords)]);
      if (result && result.Abrupt) return result;
      return true;
    }
    return false;
  }

  exports.$$DeliverChangeRecords = $$DeliverChangeRecords;


  function $$DeliverAllChangeRecords(realm){
    var anyWorkDone = false,
        callbacks = intrinsics.ObserverCallbacks,
        errors = [];

    if (callbacks && callbacks.size) {
      callbacks.forEach(function(callback){
        var result = $$DeliverChangeRecords(callback);
        if (result) {
          anyWorkDone = true;
          if (result.Abrupt) {
            errors.push(result);
          }
        }
      });
    }

    return errors.length ? errors : anyWorkDone;
  }

  exports.$$DeliverAllChangeRecords = $$DeliverAllChangeRecords;


  function $$GetNotifier(object){
    var notifier = object.Notifier;
    if (!notifier) {
      notifier = object.Notifier = new $Object(intrinsics['%NotifierPrototype%']);
      notifier.Target = object;
      notifier.ChangeObservers = new MapData;
    }
    return notifier;
  }

  exports.$$GetNotifier = $$GetNotifier;


  function $$ThrowStopIteration(){
    return new AbruptCompletion('throw', intrinsics.StopIteration);
  }

  exports.$$ThrowStopIteration = $$ThrowStopIteration;


  function $$IsStopIteration(o){
    return !!(o && o.Abrupt && o.value && o.value.BuiltinBrand === 'StopIteration');
  }

  exports.$$IsStopIteration = $$IsStopIteration;


  function $$GetKey(context, value){
    if (!value || typeof value === 'string') {
      return value;
    }
    return value[0] !== '@' ? value[1] : context.getSymbol(value[1]);
  }

  exports.$$GetKey = $$GetKey;


  function $$CreateListFromArray($array){
    if ($array.array) {
      return $array.array;
    }
    var array = [],
        len   = $array.Get('length');

    for (var i=0; i < len; i++) {
      array[i] = $array.Get(i+'');
    }
    return array;
  }

  exports.$$CreateListFromArray = $$CreateListFromArray;


  function $$CreateArrayFromList(elements){
    return new $Array(elements.slice());
  }

  exports.$$CreateArrayFromList = $$CreateArrayFromList;



  function $$OrdinaryCreateFromConstructor(constructor, intrinsicDefaultProto){
    if ($$Type(constructor) !== 'Object') {
      return $$ThrowException('construct_non_constructor', [$$Type(constructor)]);
    }

    var proto = constructor.Get('prototype');
    if ($$Type(proto) !== 'Object') {
      proto = (constructor.Realm || realm).intrinsics[intrinsicDefaultProto];
    }

    return new $Object(proto);
  }

  exports.$$OrdinaryCreateFromConstructor = $$OrdinaryCreateFromConstructor;



  function $$OrdinaryHasInstance(C, O){
    if (!$$IsCallable(C)) {
      return false;
    }

    if (C.BoundTargetFunction) {
      return INSTANCE_OF(O, C.BoundTargetFunction);
    }

    if ($$Type(O) !== 'Object') {
      return false;
    }

    var P = C.Get('prototype');
    if ($$Type(P) !== 'Object') {
      return $$ThrowException('instanceof_nonobject_proto');
    }

    do {
      O = O.GetInheritance();
      if (O === P) {
        return true;
      }
    } while (O)

    return false;
  }

  exports.$$OrdinaryHasInstance = $$OrdinaryHasInstance;




  var realm, intrinsics;

  engine.on('realm-change', function(){
    realm = engine.activeRealm;
    intrinsics = engine.activeIntrinsics;
  });

  return exports;
})(typeof module !== 'undefined' ? exports : {});


exports.$Object = (function(exports){
  var objects      = require('../lib/objects'),
      errors       = require('../errors'),
      constants    = require('../constants'),
      operators    = require('./operators'),
      descriptors  = require('./descriptors'),
      operations   = require('./operations'),
      PropertyList = require('../lib/PropertyList'),
      utility      = require('../lib/utility'),
      symbols      = require('./$Symbol').wellKnownSymbols,
      engine       = require('../engine').engine;

  var inherit = objects.inherit,
      define  = objects.define,
      create  = objects.create,
      hide    = objects.hide,
      is      = objects.is,
      Hash    = objects.Hash,
      tag     = utility.tag,
      AccessorDescriptor       = descriptors.AccessorDescriptor,
      DataDescriptor           = descriptors.DataDescriptor,
      Accessor                 = descriptors.Accessor,
      Value                    = descriptors.Value,
      $$IsDataDescriptor       = descriptors.$$IsDataDescriptor,
      $$IsAccessorDescriptor   = descriptors.$$IsAccessorDescriptor,
      $$IsEmptyDescriptor      = descriptors.$$IsEmptyDescriptor,
      $$IsEquivalentDescriptor = descriptors.$$IsEquivalentDescriptor,
      $$IsGenericDescriptor    = descriptors.$$IsGenericDescriptor,
      $$ThrowException         = errors.$$ThrowException,
      $$ToBoolean              = operators.$$ToBoolean,
      $$ToString               = operators.$$ToString,
      $$ToUint32               = operators.$$ToUint32,
      $$IsCallable             = operations.$$IsCallable,
      $$Invoke                 = operations.$$Invoke,
      $$ThrowStopIteration     = operations.$$ThrowStopIteration,
      $$CreateChangeRecord     = operations.$$CreateChangeRecord,
      $$EnqueueChangeRecord    = operations.$$EnqueueChangeRecord;

  var E = 0x1,
      C = 0x2,
      W = 0x4,
      A = 0x8,
      ___ = 0,
      E__ = 1,
      _C_ = 2,
      EC_ = 3,
      __W = 4,
      E_W = 5,
      _CW = 6,
      ECW = 7,
      __A = 8,
      E_A = 9,
      _CA = 10,
      ECA = 11;



  var normalDescriptor = { Value: undefined,
                           Writable: true,
                           Enumerable: true,
                           Configurable: true,
                           isDescriptor: true,
                           isDataDescriptor: true,
                           isAccessorDescriptor: false };

  function $$CreateOwnDataProperty(object, key, value){
    var extensible = object.IsExtensible();
    if (!extensible || extensible.Abrupt) return extensible;
    normalDescriptor.Value = value;
    return object.DefineOwnProperty(key, normalDescriptor);
  }

  exports.$$CreateOwnDataProperty = $$CreateOwnDataProperty;


  function $$OrdinaryGetOwnProperty(object, key){
    if (key === '__proto__') {
      var val = object.GetP(object, '__proto__');
      return typeof val === 'object' ? new DataDescriptor(val, _CW) : undefined;
    }

    var prop = object.describe(key);
    if (prop) {
      if (prop[2] & A) {
        var Descriptor = AccessorDescriptor,
            val = prop[1];
      } else {
        var val = prop[3] ? prop[3].Get.Call(object, []) : prop[1],
            Descriptor = DataDescriptor;
      }
      return new Descriptor(val, prop[2]);
    }
  }

  exports.$$OrdinaryGetOwnProperty = $$OrdinaryGetOwnProperty;


  function $$DefinePropertyOrThrow(object, key, desc){
    var success = object.DefineOwnProperty(key, value, desc);
    if (!success) {
      return $$ThrowException('redefine_disallowed', [key]);
    }
    return success;
  }

  exports.$$DefinePropertyOrThrow = $$DefinePropertyOrThrow;


  function $$DeletePropertyOrThrow(object, key){
    var success = object.DeleteProperty(key, value);
    if (!success) {
      return $$ThrowException('strict_delete_property', [key]);
    }
    return success;
  }

  exports.$$DeletePropertyOrThrow = $$DeletePropertyOrThrow;


  function $$HasProperty(object, key){
    if (object === null) return false;

    var obj = object;
    do {
      if (typeof obj !== 'object')  {
        return $$ThrowException('invalid_in_operator_use', [key, typeof obj]);
      }
      var has = obj.HasOwnProperty(key);
      if (has) return has;
      obj = obj.GetInheritance();
      if (obj && obj.Abrupt) return obj;
    } while (obj)
    return false;
  }

  exports.$$HasProperty = $$HasProperty;


  function $$OrdinaryDefineOwnProperty(object, key, desc){
    var current = $$OrdinaryGetOwnProperty(object, key),
        extensible = object.IsExtensible();
    return $$ValidateAndApplyPropertyDescriptor(object, key, extensible, desc, current);
  }

  exports.$$OrdinaryDefineOwnProperty = $$OrdinaryDefineOwnProperty;


  function $$IsCompatibleDescriptor(extensible, desc, current){
    return $$ValidateAndApplyPropertyDescriptor(undefined, undefined, extensible, desc, current);
  }

  exports.$$IsCompatibleDescriptor = $$IsCompatibleDescriptor;


  function $$ValidateAndApplyPropertyDescriptor(object, key, extensible, desc, current){
    var changeType = 'reconfigured';

    // New property
    if (current === undefined) {
      if (extensible && object !== undefined) {
        if ($$IsGenericDescriptor(desc) || $$IsDataDescriptor(desc)) {
          object.define(key, desc.Value, desc.Enumerable | (desc.Configurable << 1) | (desc.Writable << 2));
        } else {
          object.define(key, new Accessor(desc.Get, desc.Set), desc.Enumerable | (desc.Configurable << 1) | 8);
        }

        if (object.Notifier) {
          var changeObservers = object.Notifier.ChangeObservers;
          if (changeObservers.size) {
            var record = $$CreateChangeRecord('new', object, key);
            $$EnqueueChangeRecord(record, changeObservers);
          }
        }
      }
      return extensible === true;
    }

    // Empty descriptor
    if (!('Get' in desc || 'Set' in desc || 'Value' in desc)) {
      if (!('Writable' in desc || 'Enumerable' in desc || 'Configurable' in desc)) {
        return true;
      }
    }

    //Equal descriptor
    if (desc.Writable === current.Writable && desc.Enumerable === current.Enumerable && desc.Configurable === current.Configurable) {
      if (desc.Get === current.Get && desc.Set === current.Set && is(desc.Value, current.Value)) {
        return true;
      }
    }

    if (!current.Configurable) {
      if (desc.Configurable || 'Enumerable' in desc && desc.Enumerable !== current.Enumerable) {
        return false;
      } else {
        var currentIsData = $$IsDataDescriptor(current),
            descIsData = $$IsDataDescriptor(desc);

        if (currentIsData !== descIsData) {
          return false;
        } else if (currentIsData && descIsData) {
          if (!current.Writable && 'Value' in desc && !is(desc.Value, current.Value)) {
            return false;
          }
        } else if ('Set' in desc && desc.Set !== current.Set) {
          return false;
        } else if ('Get' in desc && desc.Get !== current.Get) {
          return false;
        }
      }
    }

    if (object === undefined) {
      return true;
    }

    'Configurable' in desc || (desc.Configurable = current.Configurable);
    'Enumerable' in desc || (desc.Enumerable = current.Enumerable);

    if ($$IsAccessorDescriptor(desc)) {
      object.update(key, desc.Enumerable | (desc.Configurable << 1) | 8);
      if ($$IsDataDescriptor(current)) {
        object.set(key, new Accessor(desc.Get, desc.Set));
      } else {
        var accessor = current.getAccessor();
        'Set' in desc && (accessor.Set = desc.Set);
        'Get' in desc && (accessor.Get = desc.Get);
        ('Set' in desc || 'Get' in desc) && object.set(key, accessor);
      }
    } else {
      if ($$IsAccessorDescriptor(current)) {
        current.Writable = true;
      }
      'Writable' in desc || (desc.Writable = current.Writable);
      object.update(key, desc.Enumerable | (desc.Configurable << 1) | (desc.Writable << 2));
      if ('Value' in desc) {
        object.set(key, desc.Value);
        changeType = 'updated';
      }
    }

    if (object.Notifier) {
      var changeObservers = object.Notifier.ChangeObservers;
      if (changeObservers.size) {
        var record = $$CreateChangeRecord(changeType, object, key, current);
        $$EnqueueChangeRecord(record, changeObservers);
      }
    }

    return true;
  }

  exports.$$ValidateAndApplyPropertyDescriptor = $$ValidateAndApplyPropertyDescriptor;



  var Proto = {
    Get: {
      Call: function(receiver){
        do {
          receiver = receiver.GetInheritance();
        } while (receiver && receiver.HiddenPrototype)
        return receiver;
      }
    },
    Set: {
      Call: function(receiver, args){
        var proto = receiver.Prototype;
        if (proto && proto.HiddenPrototype) {
          receiver = proto;
        }
        return receiver.SetInheritance(args[0]);
      }
    }
  };


  function $Object(proto){
    if (proto === undefined) {
      proto = intrinsics['%ObjectPrototype%'];
    }
    this.Realm = realm;
    this.Prototype = proto;
    this.properties = new PropertyList;
    this.storage = new Hash;
    tag(this);
    hide(this, 'Realm');
    hide(this, 'Prototype');
    hide(this, 'storage');
    hide(this, 'id');
    if (proto && proto.HiddenPrototype) {
      this.properties.setProperty(['__proto__', null, 6, Proto]);
    }
  }

  exports.$Object = $Object;


  define($Object.prototype, {
    Extensible: true,
    BuiltinBrand: 'BuiltinObject',
    type: '$Object'
  });

  void function(){
    define($Object.prototype, [
      (function(){ // IE6-8 leaks function expression names to surrounding scope
        return function define(key, value, attrs){
          return this.properties.define(key, value, attrs);
        };
      })(),
      function has(key){
        return this.properties.has(key);
      },
      function remove(key){
        return this.properties.remove(key);
      },
      function describe(key){
        return this.properties.describe(key);
      },
      function get(key){
        return this.properties.get(key);
      },
      function set(key, value){
        this.properties.set(key, value);
      },
      function query(key){
        return this.properties.query(key);
      },
      function update(key, attr){
        this.properties.update(key, attr);
      },
      function each(callback){
        this.properties.each(callback, this);
      },
      function destroy(){
        this.destroy = null;
        this.properties.each(function(prop){
          var val = prop[1];
          this.remove(prop[0]);
          prop.length = 0;
          if (val && val.destroy) {
            val.destroy();
          }
        });
        for (var k in this) {
          if (this[k] && this[k].destroy) {
            this[k].destroy();
          }
        }
      },
      function toStringTag(){
        return this.Get(symbols.toStringTag);
      }
    ]);
  }();


  define($Object.prototype, [
    function GetInheritance(){
      return this.Prototype;
    },
    function SetInheritance(value){
      if (typeof value === 'object' && this.IsExtensible()) {
        var proto = value;
        while (proto) {
          if (proto === this) {
            return $$ThrowException('cyclic_proto');
          }
          proto = proto.GetInheritance();
        }

        if (this.Notifier) {
          var changeObservers = this.Notifier.ChangeObservers;
          if (changeObservers.size) {
            var record = $$CreateChangeRecord('prototype', this, null, new Value(this.GetInheritance()));
            $$EnqueueChangeRecord(record, changeObservers);
          }
        }
        this.Prototype = value;
        return true;
      } else {
        return false;
      }
    },
    function IsExtensible(){
      return this.Extensible;
    },
    function PreventExtensions(v){
      v = !!v;
      if (this.Extensible) {
        this.Extensible = v;
      }
      return this.Extensible === v;
    },
    function GetOwnProperty(key){
      return $$OrdinaryGetOwnProperty(this, key);
    },
    function GetProperty(key){
      var desc = this.GetOwnProperty(key);
      if (desc) {
        return desc;
      } else {
        var proto = this.GetInheritence();
        if (proto) {
          return proto.GetProperty(key);
        }
      }
    },
    function Get(key){
      return this.GetP(this, key);
    },
    function Put(key, value, strict){
      if (!this.SetP(this, key, value) && strict) {
        return $$ThrowException('strict_cannot_assign', [key]);
      }
      return true;
    },
    function GetP(receiver, key){
      var prop = this.describe(key);
      if (!prop) {
        var parent = this.GetInheritance();
        if (parent && parent.Abrupt) return parent;

        if (parent) {
          return parent.GetP(receiver, key);
        }
      } else {
        if (prop[3]) {
          var getter = prop[3].Get;
        } else if (prop[2] & A) {
          var getter = prop[1].Get;
        }

        if (getter && $$IsCallable(getter)) {
          return getter.Call(receiver, []);
        }
        return prop[1];
      }
    },
    function SetP(receiver, key, value) {
      var prop = this.describe(key);
      if (!prop) {
        var parent = this.GetInheritance();
        if (parent && parent.Abrupt) return parent;

        if (parent) {
          return parent.SetP(receiver, key, value);
        } else if (typeof receiver === 'object') {
          return $$CreateOwnDataProperty(receiver, key, value);
        }
      } else {
        if (prop[3]) {
          var setter = prop[3].Set;
        } else if (prop[2] & A) {
          var setter = prop[1].Set;
        }

        if (setter && $$IsCallable(setter)) {
          var setterResult = setter.Call(receiver, [value]);
          if (setterResult && setterResult.Abrupt) return setterResult;

          return true;
        } else if (prop[2] & W) {
          if (this === receiver) {
            return $$OrdinaryDefineOwnProperty(this, key, { Value: value });
          } else if (typeof receiver === 'object') {
            return $$CreateOwnDataProperty(receiver, key, value);
          }
        }
      }
      return false;
    },
    function DefineOwnProperty(key, desc){
      return $$OrdinaryDefineOwnProperty(this, key, desc);
    },
    function HasOwnProperty(key){
      return this.has(key);
    },
    function HasProperty(key){
      if (this.has(key)) {
        return true;
      } else {
        var proto = this.GetInheritance();
        if (proto) {
          return proto.HasProperty(key);
        } else {
          return false;
        }
      }
    },
    function Delete(key, strict){
      if (!this.has(key)) {
        return true;
      } else if (this.query(key) & C) {
        if (this.Notifier) {
          var changeObservers = this.Notifier.ChangeObservers;
          if (changeObservers.size) {
            var record = $$CreateChangeRecord('deleted', this, key, this.GetOwnProperty(key));
            $$EnqueueChangeRecord(record, changeObservers);
          }
        }
        this.remove(key);
        return true;
      } else if (strict) {
        return $$ThrowException('strict_delete', []);
      } else {
        return false;
      }
    },
    function Iterate(){
      return $$Invoke(this, symbols.iterator);
    },
    function enumerator(){
      return new $Enumerator(this.Enumerate(true, true));
    },
    function Enumerate(includePrototype, onlyEnumerable){
      var props = [],
          seen = create(null);

      if (onlyEnumerable) {
        this.each(function(prop){
          var key = prop[0];
          if (typeof key === 'string' && !(key in seen) && (prop[2] & E)) {
            props.push(key);
            seen[key] = true;
          }
        });
      } else {
        this.each(function(prop){
          var key = prop[0];
          if (!(key in seen || key.Private)) {
            props.push(key);
            seen[key] = true;
          }
        });
      }

      if (includePrototype) {
        var proto = this.GetInheritance();
        if (proto) {
          var inherited = proto.Enumerate(includePrototype, onlyEnumerable);
          for (var i=0; i < inherited.length; i++) {
            var key = inherited[i];
            if (!(key in seen)) {
              props.push(key);
              seen[key] = true;
            }
          }
        }
      }

      return props;
    }
    // function Keys(){},
    // function OwnPropertyKeys(){},
    // function Freeze(){},
    // function Seal(){},
    // function IsFrozen(){},
    // function IsSealed(){}
  ]);


  var $Enumerator = (function(){
    function next(keys){
      this.keys = keys;
      this.index = 0;
      this.count = keys.length;
      this.depleted = false;
    }
    next.prototype.Call = function(obj){
      if (this.depleted || this.index >= this.count) {
        this.depleted = true;
        this.keys = null;
        return $$ThrowStopIteration();
      } else {
        return this.keys[this.index++];
      }
    }

    function $Enumerator(keys){
      this.next = ['next', new next(keys), 7];
    }

    exports.$Enumerator = $Enumerator;

    inherit($Enumerator, $Object, [
      function has(key){
        return key === 'next';
      },
      function describe(key){
        if (key === 'next') {
          return this.next;
        }
      },
      function get(key){
        if (key === 'next') {
          return this.next[1];
        }
      },
      function Get(key){
        return this.next[1];
      }
    ]);

    return $Enumerator;
  })();


  var realm, intrinsics;

  engine.on('realm-change', function(){
    realm = engine.activeRealm;
    intrinsics = engine.activeIntrinsics;
  });

  return exports;
})(typeof module !== 'undefined' ? exports : {});


exports.$Descriptor = (function(exports){
  var $Object = require('./$Object').$Object,
      MISSING = require('../constants').MISSING
      tag     = require('../lib/utility').tag,
      engine  = require('../engine').engine;

  var inherit = require('../lib/objects').inherit;

  var ECW = 7;

  var Configurable = ['configurable', undefined, ECW],
      Enumerable   = ['enumerable', undefined, ECW],
      Writable     = ['writable', undefined, ECW],
      Value        = ['value', undefined, ECW],
      Get          = ['get', undefined, ECW],
      Set          = ['set', undefined, ECW];


  function deoptimize(object){
    var id = object.id;
    $Object.call(object, object.Prototype);
    object.id = id;

    object.get = $Object.prototype.get;
    object.set = $Object.prototype.set;
    object.has = $Object.prototype.has;
    object.each = $Object.prototype.each;
    object.query = $Object.prototype.query;
    object.update = $Object.prototype.update;
    object.remove = $Object.prototype.remove;
    object.define = $Object.prototype.define;
    object.describe = $Object.prototype.describe;

    var desc = object.descriptor;
    object.set('configurable', desc.Configurable);
    object.set('enumerable', desc.Enumerable);
    if (desc.isDataDescriptor) {
      object.set('writable', desc.Writable);
      object.set('value', desc.Value);
    } else if (desc.isAccessorDescriptor) {
      object.set('get', desc.Get);
      object.set('set', desc.Set);
    }

    object.descriptor = undefined;
  }


  function $Descriptor(descriptor){
    this.descriptor = descriptor;
    this.Prototype = intrinsics['%ObjectPrototype%'];
    this.Realm = realm;
    tag(this);
  }

  exports.$Descriptor = $Descriptor;

  inherit($Descriptor, $Object, [
    function has(key){
      switch (key) {
        case 'configurable':
          return 'Configurable' in this.descriptor;
        case 'enumerable':
          return 'Enumerable' in this.descriptor;
        case 'writable':
          return 'Writable' in this.descriptor;
        case 'value':
          return 'Value' in this.descriptor;
        case 'get':
          return 'Get' in this.descriptor;
        case 'set':
          return 'Set' in this.descriptor;
      }
      return false;
    },
    function remove(key){
      switch (key) {
        case 'configurable':
          return delete this.descriptor.Configurable;
        case 'enumerable':
          return delete this.descriptor.Enumerable;
        case 'writable':
          return delete this.descriptor.Writable;
        case 'value':
          return delete this.descriptor.Value;
        case 'get':
          return delete this.descriptor.Get;
        case 'set':
          return delete this.descriptor.Set;
      }
      return false;
    },
    function get(key){
      switch (key) {
        case 'configurable':
          return this.descriptor.Configurable;
        case 'enumerable':
          return this.descriptor.Enumerable;
        case 'writable':
          return this.descriptor.Writable;
        case 'value':
          return this.descriptor.Value;
        case 'get':
          return this.descriptor.Get;
        case 'set':
          return this.descriptor.Set;
      }
    },
    function set(key, value){
      switch (key) {
        case 'configurable':
          this.descriptor.Configurable = value;
          return true;
        case 'enumerable':
          this.descriptor.Enumerable = value;
          return true;
        case 'writable':
          if (this.descriptor.isDataDescriptor) {
            this.descriptor.Writable = value;
            return true;
          }
          break;
        case 'value':
          if (this.descriptor.isDataDescriptor) {
            this.descriptor.Value = value;
            return true;
          }
          break;
        case 'get':
          if (this.descriptor.isAccessorDescriptor) {
            this.descriptor.Get = value;
            return true;
          }
          break;
        case 'set':
          if (this.descriptor.isAccessorDescriptor) {
            this.descriptor.Set = value;
            return true;
          }
          break;
      }

      deoptimize(this);
      return this.set(key, value);
    },
    function describe(key){
      switch (key) {
        case 'configurable':
          if ('Configurable' in this.descriptor) {
            Configurable[1] = this.descriptor.Configurable;
            return Configurable;
          }
          return;
        case 'enumerable':
          if ('Enumerable' in this.descriptor) {
            Enumerable[1] = this.descriptor.Enumerable;
            return Enumerable;
          }
          return;
        case 'writable':
          if ('Writable' in this.descriptor) {
            Writable[1] = this.descriptor.Writable;
            return Writable;
          }
          return;
        case 'value':
          if ('Value' in this.descriptor) {
            Value[1] = this.descriptor.Value;
            return Value;
          }
          return;
        case 'get':
          if ('Get' in this.descriptor) {
            Get[1] = this.descriptor.Get;
            return Get;
          }
          return;
        case 'set':
          if ('Set' in this.descriptor) {
            Set[1] = this.descriptor.Set;
            return Set;
          }
          return;
      }
    },
    function query(key){
      return ECW;
    },
    function update(key, attr){
      if (attr !== ECW) {
        deoptimize(this);
        return this.update(key, attr);
      }
      return true;
    },
    function each(callback){
      if ('Configurable' in this.descriptor) {
        Configurable[1] = this.descriptor.Configurable;
        callback.call(this, Configurable);
      }

      if ('Enumerable' in this.descriptor) {
        Enumerable[1] = this.descriptor.Enumerable;
        callback.call(this, Enumerable);
      }

      if ('Writable' in this.descriptor) {
        Writable[1] = this.descriptor.Writable;
        callback.call(this, Writable);
      }

      if ('Value' in this.descriptor) {
        Value[1] = this.descriptor.Value;
        callback.call(this, Value);
      }

      if ('Get' in this.descriptor) {
        Get[1] = this.descriptor.Get;
        callback.call(this, Get);
      }

      if ('Set' in this.descriptor) {
        Set[1] = this.descriptor.Set;
        callback.call(this, Set);
      }
    },
    function define(key, value, attrs){
      var ret = this.set(key, value);
      return this.update(key, attrs) && ret;
    }
  ]);



  var realm, intrinsics;

  engine.on('realm-change', function(){
    realm = engine.activeRealm;
    intrinsics = engine.activeIntrinsics;
  });


  return exports;
})(typeof module !== 'undefined' ? exports : {});


exports.$Arguments = (function(exports){
  var objects     = require('../lib/objects'),
      utility     = require('../lib/utility'),
      errors      = require('../errors'),
      descriptors = require('./descriptors'),
      operations  = require('./operations'),
      $Object     = require('./$Object').$Object,
      engine      = require('../engine').engine,
      toStringTag = require('./$Symbol').wellKnownSymbols.toStringTag;

  var Hash    = objects.Hash,
      inherit = objects.inherit,
      define  = objects.define,
      ArgAccessor            = descriptors.ArgAccessor,
      $$ThrowException       = errors.$$ThrowException,
      $$IsCallable           = operations.$$IsCallable,
      $$IsAccessorDescriptor = descriptors.$$IsAccessorDescriptor;


  var _CW = 6,
      ECW = 7,
      __A = 8,
      _CA = 10;

  var $Arguments = exports.$Arguments = (function(){
    function $Arguments(length){
      $Object.call(this);
      this.define(toStringTag, 'Arguments');
      this.define('length', length, _CW);
    }

    inherit($Arguments, $Object, {
      BuiltinBrand: 'BuiltinArguments',
      ParameterMap: null
    });

    return $Arguments;
  })();


  var $StrictArguments = exports.$StrictArguments = (function(){
    function $StrictArguments(args){
      $Arguments.call(this, args.length);
      for (var i=0; i < args.length; i++) {
        this.define(i+'', args[i], ECW);
      }

      this.define('arguments', intrinsics.ThrowTypeError, __A);
      this.define('caller', intrinsics.ThrowTypeError, __A);
    }

    inherit($StrictArguments, $Arguments);

    return $StrictArguments;
  })();



  var $MappedArguments = exports.$MappedArguments = (function(){
    function $MappedArguments(args, env, names, func){
      var mapped = new Hash;
      $Arguments.call(this, args.length);

      this.ParameterMap = new $Object;
      this.isMapped = false;

      for (var i=0; i < args.length; i++) {
        this.define(i+'', args[i], ECW);
        var name = names[i];
        if (i < names.length && !(name in mapped)) {
          this.isMapped = true;
          mapped[name] = true;
          this.ParameterMap.define(name, new ArgAccessor(name, env), _CA);
        }
      }

      this.define('callee', func, _CW);
    }

    inherit($MappedArguments, $Arguments, {
      ParameterMap: null
    }, [
      function Get(key){
        if (this.isMapped && this.ParameterMap.has(key)) {
          return this.ParameterMap.Get(key);
        } else {
          var val = this.GetP(this, key);
          if (key === 'caller' && $$IsCallable(val) && val.Strict) {
            return $$ThrowException('strict_poison_pill');
          }
          return val;
        }
      },
      function GetOwnProperty(key){
        var desc = $Object.prototype.GetOwnProperty.call(this, key);
        if (desc === undefined) {
          return desc;
        }
        if (this.isMapped && this.ParameterMap.has(key)) {
          desc.Value = this.ParameterMap.Get(key);
        }
        return desc;
      },
      function DefineOwnProperty(key, desc, strict){
        if (!DefineOwn.call(this, key, desc, false) && strict) {
          return $$ThrowException('strict_lhs_assignment');
        }

        if (this.isMapped && this.ParameterMap.has(key)) {
          if ($$IsAccessorDescriptor(desc)) {
            this.ParameterMap.Delete(key, false);
          } else {
            if ('Value' in desc) {
              this.ParameterMap.Put(key, desc.Value, strict);
            }
            if ('Writable' in desc) {
              this.ParameterMap.Delete(key, false);
            }
          }
        }

        return true;
      },
      function Delete(key, strict){
        var result = $Object.prototype.Delete.call(this, key, strict);
        if (result.Abrupt) return result;

        if (result && this.isMapped && this.ParameterMap.has(key)) {
          this.ParameterMap.Delete(key, false);
        }

        return result;
      }
    ]);

    return $MappedArguments;
  })();



  var realm, intrinsics;

  engine.on('realm-change', function(){
    realm = engine.activeRealm;
    intrinsics = engine.activeIntrinsics;
  });

  return exports;
})(typeof module !== 'undefined' ? exports : {});


exports.$Array = (function(exports){
  var objects      = require('../lib/objects'),
      utility      = require('../lib/utility'),
      errors       = require('../errors'),
      constants    = require('../constants'),
      operators    = require('./operators'),
      operations   = require('./operations'),
      PropertyList = require('../lib/PropertyList'),
      $Object      = require('./$Object').$Object,
      engine       = require('../engine').engine;

  var inherit          = objects.inherit,
      define           = objects.define,
      copy             = objects.copy,
      Hash             = objects.Hash,
      tag              = utility.tag,
      $$IsArrayIndex   = operations.$$IsArrayIndex,
      $$ThrowException = errors.$$ThrowException,
      $$ToBoolean      = operators.$$ToBoolean,
      $$ToUint32       = operators.$$ToUint32,
      $$ToNumber       = operators.$$ToNumber;

  var __W = 4,
      ECW = 7;

  var DefineOwn = $Object.prototype.DefineOwnProperty;

  function $Array(array){
    this.Prototype = intrinsics['%ArrayPrototype%'];
    this.Realm = realm;
    this.properties = new PropertyList;
    this.storage = new Hash;
    tag(this);

    if (typeof array === 'number') {
      this.array = new Array(array);
    } else if (array) {
      this.array = array;
    } else {
      this.array = [];
    }
    this.length = ['length', this.array.length, __W];
  }

  exports.$Array = $Array;

  inherit($Array, $Object, {
    BuiltinBrand: 'BuiltinArray'
  }, [
    function has(key){
      if (key === 'length') {
        return true;
      } else if ((key >>> 0) == key && key < this.array.length) {
        return key in this.array;
      }
      return this.properties.has(key);
    },
    function remove(key){
      if (key === 'length') {
        return false;
      } else if ((key >>> 0) == key && key < this.array.length) {
        return delete this.array[key];
      }
      return this.properties.remove(key);
    },
    function get(key){
      if (key === 'length') {
        return this.array.length;
      } else if ((key >>> 0) == key) {
        return this.array[key];
      }
      return this.properties.get(key);
    },
    function set(key, value){
      if (key === 'length') {
        this.length[1] = this.array.length = value;
        return true;
      } else if ((key >>> 0) == key) {
        this.array[key] = value;
        return true;
      }
      return this.properties.set(key, value);
    },
    function describe(key){
      if (key === 'length') {
        this.length[1] = this.array.length;
        return this.length;
      } else if ((key >>> 0) == key && key < this.array.length) {
        if (key in this.array) {
          return [key, this.array[key], ECW];
        }
      } else {
        return this.properties.describe(key);
      }
    },
    function query(key){
      if (key === 'length') {
        return __W;
      } else if ((key >>> 0) == key) {
        return key in this.array ? ECW : null;
      }
      return this.properties.query(key);
    },
    function update(key, attr){
      if (attr === __W && key === 'length') {
        return true;
      } else if ((key >>> 0) == key && key in this.array) {
        if (attr === ECW) {
          return true;
        }
        deoptimize(this);
      }
      return this.properties.update(key, attr);
    },
    function each(callback){
      var len = this.length[1] = this.array.length;
      callback(this.length);

      for (var i=0; i < len; i++) {
        if (i in this.array) {
          callback([i+'', this.array[i], ECW]);
        }
      }

      this.properties.each(callback);
    },
    (function(){
      return function define(key, value, attr){
        if (key === 'length' && attr === __W) {
          this.length[1] = this.array.length = value;
          return true;
        } else if ((key >>> 0) == key) {
          if (attr === ECW) {
            this.array[key] = value;
            return true;
          }
          deoptimize(this);
        }
        return this.properties.define(key, value, attr);
      };
    })(),
    function DefineOwnProperty(key, desc, strict){
      var oldLenDesc = this.GetOwnProperty('length'),
          oldLen = oldLenDesc.Value,
          reject = strict ? $$ThrowException : function(e, a){ return false };


      if (key === 'length') {
        if (!('Value' in desc)) {
          return DefineOwn.call(this, 'length', desc, strict);
        }

        var newLenDesc = copy(desc),
            newLen = $$ToUint32(desc.Value);

        if (newLen.Abrupt) return newLen;

        var value = $$ToNumber(desc.Value);
        if (value.Abrupt) return value;

        if (newLen !== value) {
          return reject('invalid_array_length');
        }

        newLen = newLenDesc.Value;
        if (newLen >= oldLen) {
          return DefineOwn.call(this, 'length', newLenDesc, strict);
        }

        if (oldLenDesc.Writable === false) {
          return reject('strict_cannot_assign')
        }

        if (!('Writable' in newLenDesc) || newLenDesc.Writable) {
          var newWritable = true;
        } else {
          newWritable = false;
          newLenDesc.Writable = true;
        }

        var success = DefineOwn.call(this, 'length', newLenDesc, strict);
        if (success.Abrupt) return success;

        if (success === false) {
          return false;
        }

        while (newLen < oldLen) {
          oldLen = oldLen - 1;
          var deleted = this.Delete(''+oldLen, false);
          if (deleted.Abrupt) return deleted;

          if (!deleted) {
            newLenDesc.Value = oldLen + 1;
            if (!newWritable) {
              newLenDesc.Writable = false;
            }
            DefineOwn.call(this, 'length', newLenDesc, false);
            return reject('strict_delete_property');
          }
        }
        if (!newWritable) {
          DefineOwn.call(this, 'length', { Writable: false }, false);
        }

        return true;
      }  else if ($$IsArrayIndex(key)) {
        var index = $$ToUint32(key);
        if (index.Abrupt) return index;

        if (index >= oldLen && oldLenDesc.Writable === false) {
          return reject('strict_cannot_assign');
        }

        success = DefineOwn.call(this, key, desc, false);
        if (success.Abrupt) return success;

        if (success === false) {
          return reject('strict_cannot_assign');
        }

        if (index >= oldLen) {
          oldLenDesc.Value = index + 1;
          DefineOwn.call(this, 'length', oldLenDesc, false);
        }
        return true;
      }

      return DefineOwn.call(this, key, desc, key);
    }
  ]);

  var deoptimize = (function(){
    var deoptimized = [
      function each(callback){
        var len = this.array.length;

        for (var i=0; i < len; i++) {
          if (i in this.array) {
            this.properties.set(i+'', this.array[i]);
          } else {
            this.properties.remove(i);
          }
        }

        this.properties.set('length', this.array.length);
        this.properties.each(callback);
      },
      function remove(key){
        if ((key >>> 0) == key && key < this.array.length) {
          delete this.array[key];
        }
        return this.properties.remove(key);
      },
      function update(key, attr){
        if (!this.properties.has(key) && (key >>> 0) == key && key in this.array) {
          return this.properties.define(key, this.array[i], attr);
        }
        return this.properties.update(key, attr);
      },
      function query(key){
        var result = this.properties.query(key);
        if (result === null && (key >>> 0) == key && key in this.array) {
          this.properties.define(key, this.array[key], result = ECW);
        }
        return result;
      },
      function describe(key){
        if (key === 'length') {
          var index = this.properties.get('length'),
              len = this.array.length;

          if (index !== len) {
            for (; index < len; index++) {
              if (index in this.array) {
                this.properties.set(index, this.array[index]);
              }
            }
            this.properties.set('length', len);
          }
        } else if ((key >>> 0) == key && key < this.array.length) {
          if (key in this.array) {
            var prop = this.properties.describe(key);
            if (prop) {
              if (prop[1] !== this.array[key]) {
                this.properties.set(key, this.array[key]);
                prop[1] = this.array[key];
              }
            } else {
              prop = [i+'', this.array[i], ECW];
              this.properties.setProperty(i, prop);
            }
            return prop;
          }
          if (this.properties.has(key)) {
            this.properties.remove(key);
          }
          return;
        }
        return this.properties.describe(key);
      },
      (function(){
        return function define(key, value, attr){
          if (key === 'length' || (key >>> 0) == key) {
            this.array[key] = value;
          }
          return this.properties.define(key, value, attr);
        };
      })()
    ];

    return function deoptimize(target){
      var len = target.array.length;
      target.properties.define('length', len, __W);

      for (var i=0; i < len; i++) {
        if (i in target.array) {
          target.properties.define(i+'', target.array[i], ECW);
        }
      }

      define(target, deoptimized);
    };
  })();

  var realm, intrinsics;

  engine.on('realm-change', function(){
    realm = engine.activeRealm;
    intrinsics = engine.activeIntrinsics;
  });


  return exports;
})(typeof module !== 'undefined' ? exports : {});


exports.$Proxy = (function(module){
  "use strict";
  var objects     = require('../lib/objects'),
      errors      = require('../errors'),
      constants   = require('../constants'),
      operators   = require('./operators'),
      descriptors = require('./descriptors'),
      operations  = require('./operations'),
      $$Object    = require('./$Object'),
      $Array      = require('./$Array').$Array;

  var inherit     = objects.inherit,
      is          = objects.is,
      define      = objects.define,
      Hash        = objects.Hash,
      isUndefined = constants.isUndefined,
      $Object     = $$Object.$Object,
      $$IsCompatibleDescriptor        = $$Object.$$IsCompatibleDescriptor,
      $$CopyAttributes                = descriptors.$$CopyAttributes,
      $$FromGenericPropertyDescriptor = descriptors.$$FromGenericPropertyDescriptor,
      $$FromPropertyDescriptor        = descriptors.$$FromPropertyDescriptor,
      $$IsAccessorDescriptor          = descriptors.$$IsAccessorDescriptor,
      $$IsDataDescriptor              = descriptors.$$IsDataDescriptor,
      $$ToCompletePropertyDescriptor  = descriptors.$$ToCompletePropertyDescriptor,
      $$ToPropertyDescriptor          = descriptors.$$ToPropertyDescriptor,
      $$ThrowException                = errors.$$ThrowException,
      $$ToBoolean                     = operators.$$ToBoolean,
      $$ToString                      = operators.$$ToString,
      $$ToUint32                      = operators.$$ToUint32,
      $$IsCallable                    = operations.$$IsCallable,
      $$GetMethod                     = operations.$$GetMethod,
      $$CreateListFromArray           = operations.$$CreateListFromArray;



  function $$TrapDefineOwnProperty(proxy, key, descObj, strict){
    var handler = proxy.ProxyHandler,
        target = proxy.ProxyTarget;

    var trap = $$GetMethod(handler, 'defineProperty');
    if (trap && trap.Abrupt) return trap;

    var normalizedDesc = $$ToPropertyDescriptor(descObj);


    if (trap === undefined) {
      return target.DefineOwnProperty(key, normalizedDesc, strict);
    } else {
      var normalizedDescObj = $$FromGenericPropertyDescriptor(normalizedDesc);
      $$CopyAttributes(descObj, normalizedDescObj);

      var trapResult = trap.Call(handler, [target, key, normalizedDescObj]),
          success    = $$ToBoolean(trapResult),
          targetDesc = target.GetOwnProperty(key),
          extensible = target.IsExtensible();

      if (!extensible && targetDesc === undefined) {
        return $$ThrowException('proxy_extensibility_inconsistent', ['defineProperty']);
      } else if (targetDesc !== undefined && !$$IsCompatibleDescriptor(extensible, targetDesc, normalizedDesc)) {
        return $$ThrowException('proxy_incompatible_descriptor', ['defineProperty']);
      } else if (!normalizedDesc.Configurable) {
        if (targetDesc === undefined || targetDesc.Configurable) {
          return $$ThrowException('proxy_configurability_inconsistent', ['defineProperty']);
        }
      } else if (strict) {
        return $$ThrowException('strict_property_redefinition', ['defineProperty']);
      }
      return false;
    }
  }


  function $$TrapGetOwnProperty(proxy, key){
    var handler = proxy.ProxyHandler,
        target = proxy.ProxyTarget;

    var trap = $$GetMethod(handler, 'getOwnPropertyDescriptor');
    if (trap && trap.Abrupt) return trap;

    if (trap === undefined) {
      return target.GetOwnProperty(key);
    } else {
      var trapResult = trap.Call(handler, [target, key]);
      if (trapResult && trapResult.Abrupt) return trapResult;

      if (trapResult) {
        var desc = $$ToCompletePropertyDescriptor(trapResult);
        desc.Origin = new $Object;
        $$CopyAttributes(trapResult, desc.Origin);
      }

      var targetDesc = target.GetOwnProperty(key);
      if (targetDesc && targetDesc.Abrupt) return targetDesc;

      if (desc === undefined && targetDesc !== undefined) {
        if (!targetDesc.Configurable) {
          return $$ThrowException('proxy_configurability_inconsistent', ['getOwnPropertyDescriptor']);
        } else if (!target.IsExtensible()) {
          return $$ThrowException('proxy_extensibility_inconsistent', ['getOwnPropertyDescriptor']);
        }
        return;
      }

      var extensible = target.IsExtensible();
      if (!extensible && targetDesc === undefined) {
        return $$ThrowException('proxy_extensibility_inconsistent', ['getOwnPropertyDescriptor']);
      } else if (targetDesc !== undefined && !$$IsCompatibleDescriptor(extensible, targetDesc, desc)) {
        return $$ThrowException('proxy_incompatible_descriptor', ['getOwnPropertyDescriptor']);
      } else if (desc !== undefined && !desc.Configurable && targetDesc !== undefined && targetDesc.Configurable) {
        return $$ThrowException('proxy_configurability_inconsistent', ['getOwnPropertyDescriptor'])
      }

      return desc;
    }
  }


  var proto = require('../lib/utility').uid();

  function checkDuplicates(array, type){
    var seen = new Hash;

    for (var i=0; i < array.length; i++) {
      var element = array[i] === '__proto__' ? proto : array[i];
      if (element in seen) {
        return $$ThrowException('proxy_duplicate', type);
      }
      seen[element] = true;
    }

    return seen;
  }

  function $Proxy(target, handler){
    this.ProxyHandler = handler;
    this.ProxyTarget = target;
    this.BuiltinBrand = target.BuiltinBrand;

    if (target.Call) {
      this.Call = ProxyCall;
      this.Construct = ProxyConstruct;
      this.getName = ProxyGetName;
    }
  }

  inherit($Proxy, $Object, {
    Proxy: true
  }, [
    function toStringTag(){
      return this.Get(symbols.toStringTag);
    },
    function GetInheritance(){
      var trap = $$GetMethod(this.ProxyHandler, 'getPrototypeOf');
      if (trap && trap.Abrupt) return trap;

      if (trap === undefined) {
        return this.ProxyTarget.GetInheritance();
      } else {
        var trapResult = trap.Call(this.ProxyHandler, [this.ProxyTarget]);
        if (trapResult && trapResult.Abrupt) return trapResult;

        var targetProto = this.ProxyTarget.GetInheritance();
        if (targetProto && targetProto.Abrupt) return targetProto;

        if (trapResult !== targetProto) {
          return $$ThrowException('proxy_inconsistent', 'getPrototypeOf');
        } else {
          return targetProto;
        }
      }
    },
    function IsExtensible(){
      var trap = $$GetMethod(this.ProxyHandler, 'isExtensible');
      if (trap && trap.Abrupt) return trap;

      if (trap === undefined) {
        return this.ProxyTarget.IsExtensible();
      }

      var proxyIsExtensible = $$ToBoolean(trap.Call(this.ProxyHandler, [this.ProxyTarget]));
      if (proxyIsExtensible && proxyIsExtensible.Abrupt) return proxyIsExtensible;

      var targetIsExtensible = this.ProxyTarget.IsExtensible();
      if (targetIsExtensible && targetIsExtensible.Abrupt) return targetIsExtensible;

      if (proxyIsExtensible !== targetIsExtensible) {
        return $$ThrowException('proxy_extensibility_inconsistent');
      }
      return targetIsExtensible;
    },
    function GetP(receiver, key){
      var trap = $$GetMethod(this.ProxyHandler, 'get');
      if (trap && trap.Abrupt) return trap;

      if (trap === undefined) {
        return this.ProxyTarget.GetP(receiver, key);
      }

      var trapResult = trap.Call(this.ProxyHandler, [this.ProxyTarget, key, receiver]);
      if (trapResult && trapResult.Abrupt) return trapResult;

      var desc = this.ProxyTarget.GetOwnProperty(key);
      if (desc && desc.Abrupt) return desc;

      if (desc !== undefined) {
        if ($$IsDataDescriptor(desc) && desc.Configurable === false && desc.Writable === false) {
          if (!is(trapResult, desc.Value)) {
            return $$ThrowException('proxy_inconsistent', 'get');
          }
        } else if ($$IsAccessorDescriptor(desc) && desc.Configurable === false && desc.Get === undefined) {
          if (trapResult !== undefined) {
            return $$ThrowException('proxy_inconsistent', 'get');
          }
        }
      }

      return trapResult;
    },
    function SetP(receiver, key, value){
      var trap = $$GetMethod(this.ProxyHandler, 'set');
      if (trap && trap.Abrupt) return trap;

      if (trap === undefined) {
        return this.ProxyTarget.SetP(receiver, key, value);
      }

      var trapResult = trap.Call(this.ProxyHandler, [this.ProxyTarget, key, value, receiver]);
      if (trapResult && trapResult.Abrupt) {
        return trapResult;
      }

      var success = $$ToBoolean(trapResult);

      if (success) {
        var desc = this.ProxyTarget.GetOwnProperty(key);
        if (desc && desc.Abrupt) return desc;

        if (desc !== undefined) {
          if ($$IsDataDescriptor(desc) && desc.Configurable === false && desc.Writable === false) {
            if (!is(value, desc.Value)) {
              return $$ThrowException('proxy_inconsistent', 'set');
            }
          }
        } else if ($$IsAccessorDescriptor(desc) && desc.Configurable === false) {
          if (desc.Set !== undefined) {
            return $$ThrowException('proxy_inconsistent', 'set');
          }
        }
      }

      return success;
    },
    function GetOwnProperty(key){
      return $$TrapGetOwnProperty(this, key);
    },
    function DefineOwnProperty(key, desc, strict){
      var descObj = $$FromGenericPropertyDescriptor(desc);
      if (descObj && descObj.Abrupt) return descObj;

      return $$TrapDefineOwnProperty(this, key, descObj, strict);
    },
    function HasOwnProperty(key){
      var trap = $$GetMethod(this.ProxyHandler, 'hasOwn');
      if (trap && trap.Abrupt) return trap;

      if (trap === undefined) {
        return this.ProxyTarget.HasOwnProperty(key);
      }

      var trapResult = trap.Call(this.ProxyHandler, [this.ProxyTarget, key]);
      if (trapResult && trapResult.Abrupt) return trapResult;

      var success = $$ToBoolean(trapResult);

      if (success === false) {
        var targetDesc = this.ProxyTarget.GetOwnProperty(key);
        if (targetDesc && targetDesc.Abrupt) return targetDesc;

        if (desc !== undefined && targetDesc.Configurable === false) {
          return $$ThrowException('proxy_inconsistent', 'hasOwn');
        } else if (!this.ProxyTarget.IsExtensible() && targetDesc !== undefined) {
          return $$ThrowException('proxy_non_extensible', 'hasOwn');
        }
      }
      return success;
    },
    function HasProperty(key){
      var trap = $$GetMethod(this.ProxyHandler, 'has');
      if (trap && trap.Abrupt) return trap;

      if (trap === undefined) {
        return this.ProxyTarget.HasProperty(key);
      }

      var trapResult = trap.Call(this.ProxyHandler, [this.ProxyTarget, key]);
      if (trapResult && trapResult.Abrupt) return trapResult;

      var success = $$ToBoolean(trapResult);

      if (success === false) {
        var targetDesc = this.ProxyTarget.GetOwnProperty(key);
        if (targetDesc && targetDesc.Abrupt) return targetDesc;

        if (targetDesc !== undefined && targetDesc.Configurable === false) {
          return $$ThrowException('proxy_inconsistent', 'has');
        } else if (!this.ProxyTarget.IsExtensible() && targetDesc !== undefined) {
          return $$ThrowException('proxy_non_extensible', 'has');
        }
      }
      return success;
    },
    function Delete(key, strict){
      var trap = $$GetMethod(this.ProxyHandler, 'deleteProperty');
      if (trap && trap.Abrupt) return trap;

      if (trap === undefined) {
        return this.ProxyTarget.Delete(key, strict);
      }
      var trapResult = trap.Call(this.ProxyHandler, [this.ProxyTarget, key]);
      if (trapResult && trapResult.Abrupt) return trapResult;

      var success = $$ToBoolean(trapResult);

      if (success === true) {
        var targetDesc = this.ProxyTarget.GetOwnProperty(key);
        if (targetDesc && targetDesc.Abrupt) return targetDesc;

        if (targetDesc !== undefined && targetDesc.Configurable === false) {
          return $$ThrowException('proxy_inconsistent', 'delete');
        } else if (!this.ProxyTarget.IsExtensible() && targetDesc !== undefined) {
          return $$ThrowException('proxy_non_extensible', 'delete');
        }
        return true;
      } else if (strict) {
        return $$ThrowException('strict_delete_failure');
      }
      return false;
    },
    function Enumerate(includePrototype, onlyEnumerable){
      if (onlyEnumerable) {
        var type = includePrototype ? 'enumerate' : 'keys';
      } else {
        var type = 'getOwnPropertyNames',
            recurse = includePrototype;
      }

      var trap = $$GetMethod(this.ProxyHandler, type);
      if (trap && trap.Abrupt) return trap;

      if (trap === undefined) {
        return this.ProxyTarget.Enumerate(includePrototype, onlyEnumerable);
      }

      var trapResult = trap.Call(this.ProxyHandler, [this.ProxyTarget]);
      if (trapResult && trapResult.Abrupt) return trapResult;

      if (typeof trapResult !== 'object' || trapResult === null) {
        return $$ThrowException('proxy_non_object_result', type);
      }

      if (trapResult.array) {
        var array = trapResult.array;
      } else {
        var len = $$ToUint32(trapResult.Get('length'));
        if (len && len.Abrupt) return len;

        var array = new Array(len);

        for (var i = 0; i < len; i++) {
          var element = $$ToPropertyKey(trapResult.Get(i+''));
          if (element && element.Abrupt) return element;

          if (!includePrototype && !this.ProxyTarget.IsExtensible() && !this.ProxyTarget.HasOwnProperty(element)) {
            return $$ThrowException('proxy_non_extensible', type);
          }

          array[i] = element;
        }
      }

      var seen = checkDuplicates(array, type);
      if (seen.Abrupt) return seen;

      var props = this.ProxyTarget.Enumerate(includePrototype, onlyEnumerable);
      if (props && props.Abrupt) return props;

      for (var i=0; i < props.length; i++) {
        var element = props[i] === '__proto__' ? proto : props[i];
        if (!(element in seen)) {
          var targetDesc = this.ProxyTarget.GetOwnProperty(props[i]);
          if (targetDesc && targetDesc.Abrupt) return targetDesc;

          if (targetDesc) {
            if (!targetDesc.Configurable) {
              return $$ThrowException('proxy_inconsistent', type);
            }

            if (!this.ProxyTarget.IsExtensible()) {
              return $$ThrowException('proxy_non_extensible', type);
            }
          }
        }
      }

      return array;
    }
  ]);

  function ProxyCall(thisValue, args){
    var trap = $$GetMethod(this.ProxyHandler, 'apply');
    if (trap && trap.Abrupt) return trap;

    if (trap === undefined) {
      return this.ProxyTarget.Call(thisValue, args);
    }

    return trap.Call(this.ProxyHandler, [this.ProxyTarget, thisValue, new $Array(args)]);
  }

  function ProxyConstruct(args){
    var trap = $$GetMethod(this.ProxyHandler, 'construct');
    if (trap && trap.Abrupt) return trap;

    if (trap === undefined) {
      return this.ProxyTarget.Construct(args);
    }

    return trap.Call(this.ProxyHandler, [this.ProxyTarget, new $Array(args)]);
  }

  function ProxyGetName(){
    return this.ProxyTarget.getName();
  }

  return module.exports = $Proxy;
})(typeof module !== 'undefined' ? module : {});


exports.$TypedArray = (function(module){
  "use strict";
  var objects          = require('../lib/objects'),
      buffers          = require('../lib/buffers'),
      $Array           = require('./$Array').$Array,
      $Object          = require('./$Object').$Object,
      $$ThrowException = require('../errors').$$ThrowException,
      DataDescriptor   = require('./descriptors').DataDescriptor,
      engine           = require('../engine').engine;

  var inherit     = objects.inherit,
      define      = objects.define,
      Hash        = objects.Hash,
      DataView    = buffers.DataView,
      ArrayBuffer = buffers.ArrayBuffer;

  var types     = new Hash,
      DefineOwn = $Object.prototype.DefineOwnProperty,
      GetOwn    = $Object.prototype.GetOwnProperty;



  function hasIndex(key, max){
    var index = key >>> 0;
    return index < max && index == key;
  }


  function ArrayBufferIndex(value){
    this.Value = value;
  }

  ArrayBufferIndex.prototype = new DataDescriptor(undefined, 5);


  function Type(options){
    this.name  = options.name
    this.size  = options.size;
    this.cast  = options.cast;
    this.set   = options.set;
    this.get   = options.get;
    this.brand = 'Builtin'+this.name+'Array';
    types[this.name+'Array'] = this;
  }

  var Int8 = new Type({
    name: 'Int8',
    size: 1,
    cast: function(x){
      return (x &= 0xff) & 0x80 ? x - 0x100 : x & 0x7f;
    },
    set: DataView.prototype.setInt8,
    get: DataView.prototype.getInt8
  });

  var Int16 = new Type({
    name: 'Int16',
    size: 2,
    cast: function(x){
      return (x &= 0xffff) & 0x8000 ? x - 0x10000 : x & 0x7fff;
    },
    set: DataView.prototype.setInt16,
    get: DataView.prototype.getInt16
  });

  var Int32 = new Type({
    name: 'Int32',
    size: 4,
    cast: function(x){
      return x >> 0;
    },
    set: DataView.prototype.setInt32,
    get: DataView.prototype.getInt32
  });

  var Uint8 = new Type({
    name: 'Uint8',
    size: 1,
    cast: function(x){
      return x & 0xff;
    },
    set: DataView.prototype.setUint8,
    get: DataView.prototype.getUint8
  });

  var Uint16 = new Type({
    name: 'Uint16',
    size: 2,
    cast: function(x){
      return x & 0xffff;
    },
    set: DataView.prototype.setUint16,
    get: DataView.prototype.getUint16
  });

  var Uint32 = new Type({
    name: 'Uint32',
    size: 4,
    cast: function(x){
      return x >>> 0;
    },
    set: DataView.prototype.setUint32,
    get: DataView.prototype.getUint32
  });

  var Float32 = new Type({
    name: 'Float32',
    size: 4,
    cast: function(x){
      return +x || 0;
    },
    set: DataView.prototype.setFloat32,
    get: DataView.prototype.getFloat32
  });

  var Float64 = new Type({
    name: 'Float64',
    size: 8,
    cast: function(x){
      return +x || 0;
    },
    set: DataView.prototype.setFloat64,
    get: DataView.prototype.getFloat64
  });

  function $TypedArray(type, buffer, byteLength, byteOffset){
    $Object.call(this, intrinsics['%'+type+'Prototype%']);
    this.Buffer = buffer;
    this.ByteOffset = byteOffset;
    this.ByteLength = byteLength;
    this.Type = types[type];
    this.BuiltinBrand = this.Type.brand;
    this.Length = byteLength / this.Type.size;
    this.define('buffer', buffer, 0);
    this.define('byteLength', byteLength, 0);
    this.define('byteOffset', byteOffset, 0);
    this.define('length', this.Length, 0);
    this.init();
  }

  inherit($TypedArray, $Object, (function(){
    if (typeof Uint8Array !== 'undefined') {
      Uint8.Array   = Uint8Array;
      Uint16.Array  = Uint16Array;
      Uint32.Array  = Uint32Array;
      Int8.Array    = Int8Array;
      Int16.Array   = Int16Array;
      Int32.Array   = Int32Array;
      Float32.Array = Float32Array;
      Float64.Array = Float64Array;

      return [
        function init(){
          this.data = new this.Type.Array(this.Buffer.NativeBuffer, this.ByteOffset, this.Length);
        },
        function each(callback){
          for (var i=0; i < this.Length; i++) {
            callback([i+'', this.data[i], 5]);
          }
          this.properties.each(callback, this);
        },
        function get(key){
          if (hasIndex(key, this.Length)) {
            return this.data[+key];
          } else {
            return this.properties.get(key);
          }
        },
        function describe(key){
          if (hasIndex(key, this.Length)) {
            return [key, this.data[+key], 5];
          } else {
            return this.properties.describe(key);
          }
        },
        function set(key, value){
          if (hasIndex(key, this.Length)) {
            this.data[+key] = value;
          } else {
            return this.properties.set(key, value);
          }
        },
        (function(){ // IE6-8 leaks function expression names to surrounding scope
          return function define(key, value, attr){
            if (hasIndex(key, this.Length)) {
              this.data[+key] = value;
            } else {
              return this.properties.define(key, value, attr);
            }
          };
        })()
      ];
    }
    return [
      function init(){
        this.data = new DataView(this.Buffer.NativeBuffer, this.ByteOffset, this.ByteLength);
        this.data.get = this.Type.get;
        this.data.set = this.Type.set;
        this.bytesPer = this.Type.size;
      },
      function each(callback){
        for (var i=0; i < this.Length; i++) {
          callback([i+'', this.data.get(i * this.bytesPer, true), 5]);
        }
        this.properties.each(callback, this);
      },
      function get(key){
        if (hasIndex(key, this.Length)) {
          return this.data.get(key * this.bytesPer, true);
        } else {
          return this.properties.get(key);
        }
      },
      function describe(key){
        if (hasIndex(key, this.Length)) {
          return [key, this.data.get(key * this.bytesPer, true), 5];
        } else {
          return this.properties.describe(key);
        }
      },
      function set(key, value){
        if (hasIndex(key, this.Length)) {
          this.data.set(key * this.bytesPer, value, true);
        } else {
          return this.properties.set(key, value);
        }
      },
      (function(){ // IE6-8 leaks function expression names to surrounding scope
        return function define(key, value, attr){
          if (hasIndex(key, this.Length)) {
            this.data.set(key * this.bytesPer, value, true);
          } else {
            return this.properties.define(key, value, attr);
          }
        };
      })()
    ];
  })());

  define($TypedArray.prototype, [
    function has(key){
      return hasIndex(key, this.Length) || this.properties.has(key);
    },
    function GetOwnProperty(key){
      if (hasIndex(key, this.Length)) {
        return new ArrayBufferIndex(this.get(key));
      }

      return GetOwn.call(this, key);
    },
    function DefineOwnProperty(key, desc, strict){
      if (hasIndex(key, this.Length)) {
        if ('Value' in desc) {
          this.set(key, desc.Value);
          return true;
        }
        return false;
      }

      return DefineOwn.call(this, key, desc, strict);
    }
  ]);

  var realm, intrinsics;

  engine.on('realm-change', function(){
    realm = engine.activeRealm;
    intrinsics = engine.activeIntrinsics;
  });

  return module.exports = $TypedArray;
})(typeof module !== 'undefined' ? module : {});


exports.thunk = (function(exports){
  "use strict";
  var objects   = require('./lib/objects'),
      constants = require('./constants'),
      operators = require('./object-model/operators'),
      Nil       = require('./object-model/$Nil'),
      Emitter   = require('./lib/Emitter'),
      errors    = require('./errors');

  var isFalsey        = Nil.isFalsey,
      isNullish       = Nil.isNullish,
      isUndefined     = Nil.isUndefined,
      define          = objects.define,
      inherit         = objects.inherit,
      Hash            = objects.Hash,
      UnaryOperation  = operators.UnaryOperation,
      BinaryOperation = operators.BinaryOperation,
      ToObject        = operators.$$ToObject,
      $$GetValue      = operators.$$GetValue,
      $$PutValue      = operators.$$PutValue,
      EQUAL           = operators.EQUAL,
      PRE_INC         = operators.PRE_INC,
      POST_INC        = operators.POST_INC,
      PRE_DEC         = operators.PRE_DEC,
      POST_DEC        = operators.POST_DEC,
      Pause           = constants.SYMBOLS.Pause,
      Empty           = constants.SYMBOLS.Empty,
      Resume          = constants.SYMBOLS.Resume;

  var AbruptCompletion = errors.AbruptCompletion,
      $$ThrowException = errors.$$ThrowException;

  var push = [].push;

  function Desc(v){
    this.Value = v;
  }

  Desc.prototype = {
    isDataDescriptor: true,
    isDescriptor: true,
    Configurable: true,
    Enumerable: true,
    Writable: true
  };



  var D = (function(d, i){
    while (i--) {
      d[i] = new Function('return function '+
        ((i & 1) ? 'E' : '_') +
        ((i & 2) ? 'C' : '_') +
        ((i & 4) ? 'W' : '_') +
        '(v){ this.Value = v }')();

      d[i].prototype = {
        Enumerable  : (i & 1) > 0,
        Configurable: (i & 2) > 0,
        Writable    : (i & 4) > 0
      };
    }
    return d;
  })([], 8);


  function getKey(context, v){
    if (typeof v === 'string') {
      return v;
    }
    if (v[0] !== '@') {
      return v[1];
    }

    return context.getSymbol(v[1]);
  }


  function unwind(context){
    var error = context.error;

    for (var i = 0, entry; entry = context.Code.unwinders[i]; i++) {
      if (entry.begin <= context.ip && context.ip <= entry.end) {
        if (entry.type === 'scope') {
          context.stacktrace || (context.stacktrace = []);
          context.stacktrace.push(context.popScope());
        } else if (entry.type === 'try') {
          context.stack[context.sp++] = error.value;
          context.error = undefined;
          context.ip = entry.end + 1;
          return context.cmds[context.ip];
        } else if (entry.type === 'iteration') {
          if (error && error.value && error.value.BuiltinBrand === 'StopIteration') {
            context.ip = entry.end;
            context.error = undefined;
            return context.cmds[context.ip];
          }
        }
      }
    }


    if (error && error.value && error.value.set && error.value.BuiltinBrand !== 'StopIteration') {
      var code  = context.Code,
          range = code.ops[context.ip].range,
          loc   = code.ops[context.ip].loc,
          err   = error.value;

      if (!err.hasLocation) {
        err.hasLocation = true;
        setCode(err, loc, code.source);
        var name = code.displayName || code.name;
        setOrigin(err, code.filename, name);

        name = name ? 'in '+name+' ' : '';

        console.log('Uncaught Exception '+name+'at line '+err.Get('line')+'\n'+
                    err.Get('name')+': '+err.Get('message')+'\n'+
                    err.Get('code'));
        console.dir(err);
      }

      if (context.stacktrace) {
        if (err.trace) {
          push.apply(err.trace, context.stacktrace);
        } else {
          err.trace = context.stacktrace;
        }
        err.context || (err.context = context);
      }
    }

    context.completion = error;
    context.error = undefined;
    return false;
  }


  function setOrigin(obj, filename, origin){
    filename && obj.set('filename', filename);
    origin && obj.set('origin', origin);
  }

  function setCode(obj, loc, code){
    var line = code.split('\n')[loc.start.line - 1];
    var pad = new Array(loc.start.column).join('-') + '^';
    obj.set('line', loc.start.line);
    obj.set('column', loc.start.column);
    obj.set('code', line + '\n' + pad);
  }




  function ADD(context){
    context.stack[context.sp - 1] += context.ops[context.ip][0];
    return context.cmds[++context.ip];
  }

  function AND(context){
    if (isFalsey(context.stack[context.sp - 1])) {
      context.ip = context.ops[context.ip][0];
      return context.cmds[context.ip];
    }
    context.sp--;
    return context.cmds[++context.ip];
  }

  function ARGS(context){
    context.stack[context.sp++] = [];
    return context.cmds[++context.ip];
  }

  function ARG(context){
    var arg = context.stack[--context.sp];
    context.stack[context.sp - 1].push(arg);
    return context.cmds[++context.ip];
  }

  function ARGUMENTS(context){
    if (context.callee ? context.callee.Strict : context.Code.flags.strict) {
      var args = context.args;
      context.stack[context.sp++] = context.createArguments(args);
      context.stack[context.sp++] = args;
    } else {
      var params = context.Code.params.boundNames,
          env    = context.LexicalEnvironment,
          args   = context.args,
          func   = context.callee;

      context.stack[context.sp++] = context.arguments = context.createArguments(args, env, params, func);
      context.stack[context.sp++] = args;
    }

    return context.cmds[++context.ip];
  }

  function ARRAY(context){
    context.stack[context.sp++] = context.createArray(0);
    context.stack[context.sp++] = 0;
    return context.cmds[++context.ip];
  }

  function ARRAY_DONE(context){
    var len = context.stack[--context.sp];
    context.stack[context.sp - 1].set('length', len);
    return context.cmds[++context.ip];
  }

  function BINARY(context){
    var right  = context.stack[--context.sp],
        left   = context.stack[--context.sp],
        result = BinaryOperation(context.ops[context.ip][0], $$GetValue(left), $$GetValue(right));

    if (result && result.Abrupt) {
      context.error = result;
      return unwind;
    }

    context.stack[context.sp++] = result;
    return context.cmds[++context.ip];
  }

  function BINDING(context){
    var result = context.createBinding(context.ops[context.ip][0], context.ops[context.ip][1]);

    if (result && result.Abrupt) {
      context.error = result;
      return unwind;
    }

    return context.cmds[++context.ip];
  }


  function $$EvaluateCall(ref, func, args, tail){
    if (!func || !func.Call) {
      return $$ThrowException('called_non_callable', [ref && ref.name]);
    }

    if (ref && ref.Reference) {
      var receiver = $$IsPropertyReference(ref) ? $$GetThisValue(ref) : ref.base.WithBaseObject();
    }

    return
  }


  function CALL(context){
    var args = context.stack[--context.sp],
        func = context.stack[--context.sp],
        ref  = context.stack[--context.sp],
        tail = context.ops[context.ip][0];

    if (!func || !func.Call) {
      context.error = $$ThrowException('called_non_callable', [ref && ref.name]);
      return unwind;
    }

    var receiver = context.resolveReceiver(ref);

    if (tail && func.Code && !func.generator) {
      func.prepare(receiver, args, context);
      return context.cmds[context.ip];
    } else {
      var result = func.Call(receiver, args);

      if (result && result.Abrupt) {
        context.error = result;
        return unwind;
      }

      context.stack[context.sp++] = result;
    }

    return context.cmds[++context.ip];
  }

  function CASE(context){
    var result = EQUAL(context.stack[--context.sp], context.stack[context.sp - 1]);

    if (result) {
      if (result.Abrupt) {
        context.error = result;
        return unwind;
      }
      context.sp--;
      context.ip = context.ops[context.ip][0];
      return context.cmds[context.ip];
    }

    return context.cmds[++context.ip];
  }

  function CLASS_DECL(context){
    var def    = context.ops[context.ip][0],
        sup    = def.hasSuper ? context.stack[--context.sp] : undefined,
        result = context.createClass(def, sup);

    if (result && result.Abrupt) {
      context.error = result;
      return unwind;
    }

    result = context.initializeBinding(getKey(context, def.name), result);
    if (result && result.Abrupt) {
      context.error = result;
      return unwind;
    }

    return context.cmds[++context.ip];
  }

  function CLASS_EXPR(context){
    var def    = context.ops[context.ip][0],
        sup    = def.hasSuper ? context.stack[--context.sp] : undefined,
        result = context.createClass(def, sup);

    if (result && result.Abrupt) {
      context.error = result;
      return unwind;
    }

    context.stack[context.sp++] = result;
    return context.cmds[++context.ip];
  }

  function COMPLETE(context){
    return false;
  }

  function CONST(context){
    context.initializeBinding(context.Code.lookup(context.ops[context.ip][0]), context.stack[--context.sp], true);
    return context.cmds[++context.ip];
  }

  function CONSTRUCT(context){
    var args   = context.stack[--context.sp],
        func   = context.stack[--context.sp],
        result = context.constructFunction(func, args);

    if (result && result.Abrupt) {
      context.error = result;
      return unwind;
    }
    context.stack[context.sp++] = result;
    return context.cmds[++context.ip];
  }

  function DEBUGGER(context){
    context.ip++;
    context.completion = Pause;
    console.log(context);
    return false;
  }

  function DEFAULT(context){
    context.sp--;
    context.ip = context.ops[context.ip][0];
    return context.cmds[++context.ip];
  }

  function DEFINE(context){
    var attrs  = context.ops[context.ip][0],
        val    = context.stack[--context.sp],
        key    = context.stack[context.sp - 1],
        obj    = context.stack[context.sp - 2],
        result = obj.DefineOwnProperty(key, new D[attrs](val));

    if (result && result.Abrupt) {
      context.error = result;
      return unwind;
    }

    context.stack[context.sp++] = result;
    return context.cmds[++context.ip];
  }

  function DUP(context){
    context.stack[context.sp] = context.stack[context.sp++ - 1];
    return context.cmds[++context.ip];
  }

  function ELEMENT(context){
    var key    = context.stack[--context.sp],
        obj    = context.stack[--context.sp],
        result = context.getPropertyReference(key, obj);

    if (result && result.Abrupt) {
      context.error = result;
      return unwind;
    }

    context.stack[context.sp++] = result;
    return context.cmds[++context.ip];
  }

  function ENUM(context){
    context.stack[context.sp - 1] = context.stack[context.sp - 1].enumerator();
    return context.cmds[++context.ip];
  }

  function EXTENSIBLE(context){
    context.stack[context.sp - 1].SetExtensible(!!context.ops[context.ip][0]);
    return context.cmds[++context.ip];
  }


  function EVAL(context){
    var args     = context.stack[--context.sp],
        func     = context.stack[--context.sp],
        receiver = context.stack[--context.sp];

    if (func && func.Call && func.Call.isBuiltinEval) {
      if (context.callee ? context.callee.Strict : context.Code.flags.strict) {
        var scope = context.cloneScope();
      }
      var result = func.Call(null, args, true);
      scope && context.replaceScope(scope);
    } else {
      var result = context.callFunction(receiver, func, args, context.ops[context.ip][0]);
    }

    if (result && result.Abrupt) {
      context.error = result;
      return unwind;
    }

    context.stack[context.sp++] = result;
    return context.cmds[++context.ip];
  }

  function FUNCTION(context){
    var op     = context.ops[context.ip],
        isExpr = op[0],
        name   = op[1],
        code   = op[2];

    context.stack[context.sp++] = context.createFunction(isExpr, name, code);
    return context.cmds[++context.ip];
  }

  function FLIP(context){
    var buffer = [],
        index  = 0,
        count  = context.ops[context.ip][0];

    while (index < count) {
      buffer[index] = context.stack[context.sp - index++];
    }

    index = 0;
    while (index < count) {
      context.stack[context.sp - index] = buffer[count - ++index];
    }

    return context.cmds[++context.ip];
  }


  function GET(context){
    var result = $$GetValue(context.stack[--context.sp]);

    if (result && result.Abrupt) {
      context.error = result;
      return unwind;
    }

    context.stack[context.sp++] = result;
    return context.cmds[++context.ip];
  }

  function HAS_BINDING(context){
    context.stack[context.sp++] = context.hasBinding(context.ops[context.ip][0]);
    return context.cmds[++context.ip];
  }

  function GET_GLOBAL(context){
    var result = context.getOwnGlobal(context.ops[context.ip][0]);

    if (result && result.Abrupt) {
      context.error = result;
      return unwind;
    }

    context.stack[context.sp++] = result;
    return context.cmds[++context.ip];
  }

  function HAS_GLOBAL(context){
    var result = context.hasOwnGlobal(context.ops[context.ip][0]);

    if (result && result.Abrupt) {
      context.error = result;
      return unwind;
    }

    context.stack[context.sp++] = result;
    return context.cmds[++context.ip];
  }

  function PUT_GLOBAL(context){
    var val    = context.stack[--context.sp],
        result = context.putOwnGlobal(context.ops[context.ip][0], val, context.ops[context.ip][1]);

    if (result && result.Abrupt) {
      context.error = result;
      return unwind;
    }

    context.stack[context.sp++] = result;
    return context.cmds[++context.ip];
  }

  function INC(context){
    context.stack[context.sp - 1]++;
    return context.cmds[++context.ip];
  }

  function INDEX(context){
    var val   = context.stack[--context.sp],
        index = context.stack[--context.sp] + context.ops[context.ip][0],
        array = context.stack[context.sp - 1];

    array.DefineOwnProperty(index+'', new Desc(val));
    context.stack[context.sp++] = index + 1;

    return context.cmds[++context.ip];
  }

  function INTERNAL_MEMBER(context){
    var item = context.stack[--context.sp];
    context.stack[context.sp++] = item[context.ops[context.ip][0]];
    return context.cmds[++context.ip];
  }

  function ITERATE(context){
    context.stack[context.sp - 1] = context.stack[context.sp - 1].Iterate();
    return context.cmds[++context.ip];
  }

  function LITERAL(context){
    context.stack[context.sp++] = context.ops[context.ip][0];
    return context.cmds[++context.ip];
  }

  function JUMP(context){
    context.ip = context.ops[context.ip][0];
    return context.cmds[context.ip];
  }

  function JTRUE(context){
    var cmp = context.stack[--context.sp];
    if (!isFalsey(cmp)) {
      context.ip = context.ops[context.ip][0];
      return context.cmds[context.ip];
    }
    return context.cmds[++context.ip];
  }

  function JFALSE(context){
    var cmp = context.stack[--context.sp];
    if (isFalsey(cmp)) {
      context.ip = context.ops[context.ip][0];
      return context.cmds[context.ip];
    }
    return context.cmds[++context.ip];
  }

  function JEQ_UNDEFINED(context){
    if (isUndefined(context.stack[context.sp - 1])) {
      context.sp--;
      context.ip = context.ops[context.ip][0];
      return context.cmds[context.ip];
    }
    return context.cmds[++context.ip];
  }

  function JNEQ_UNDEFINED(context){
    if (!isUndefined(context.stack[context.sp - 1])) {
      context.ip = context.ops[context.ip][0];
      return context.cmds[context.ip];
    }
    context.sp--;
    return context.cmds[++context.ip];
  }

  function JEQ_NULL(context){
    if (context.stack[context.sp - 1] === null) {
      context.sp--;
      context.ip = context.ops[context.ip][0];
      return context.cmds[context.ip];
    }
    return context.cmds[++context.ip];
  }

  function JNEQ_NULL(context){
    if (context.stack[context.sp - 1] !== null) {
      context.ip = context.ops[context.ip][0];
      return context.cmds[context.ip];
    }
    context.sp--;
    return context.cmds[++context.ip];
  }

  function JLT(context){
    var cmp = context.stack[--context.sp];
    if (cmp < context.ops[context.ip][1]) {
      context.ip = context.ops[context.ip][0];
      return context.cmds[context.ip];
    }
    return context.cmds[++context.ip];
  }

  function JLTE(context){
    var cmp = context.stack[--context.sp];
    if (cmp <= context.ops[context.ip][1]) {
      context.ip = context.ops[context.ip][0];
      return context.cmds[context.ip];
    }
    return context.cmds[++context.ip];
  }

  function JGT(context){
    var cmp = context.stack[--context.sp];
    if (cmp > context.ops[context.ip][1]) {
      context.ip = context.ops[context.ip][0];
      return context.cmds[context.ip];
    }
    return context.cmds[++context.ip];
  }

  function JGTE(context){
    var cmp = context.stack[--context.sp];
    if (cmp >= context.ops[context.ip][1]) {
      context.ip = context.ops[context.ip][0];
      return context.cmds[context.ip];
    }
    return context.cmds[++context.ip];
  }

  function LET(context){
    context.initializeBinding(context.Code.lookup(context.ops[context.ip][0]), context.stack[--context.sp], true);
    return context.cmds[++context.ip];
  }

  function LOG(context){
    context.Realm.emit('debug', context.sp, context.stack.slice(0, context.sp));
    return context.cmds[++context.ip];
  }

  function LOOP(context){
    var jump = context.cmds[++context.ip];
    return jump;

    if (jump.count++ > 50) {
      jump.total += jump.count;
      jump.count = 0;
      return TRACE_STACK;
    }
    return jump;
  }

  function MEMBER(context){
    var obj = context.stack[--context.sp],
        key = getKey(context, context.ops[context.ip][0]);

    if (key && key.Abrupt) {
      context.error = key;
      return unwind;
    }

    var result = context.getPropertyReference(key, obj);
    if (result && result.Abrupt) {
      context.error = result;
      return unwind;
    }

    context.stack[context.sp++] = result;
    return context.cmds[++context.ip];
  }

  function METHOD(context){
    var kind = context.ops[context.ip][0],
        obj  = context.stack[context.sp - 1],
        code = context.ops[context.ip][1],
        key  = getKey(context, context.ops[context.ip][2]);

    if (key && key.Abrupt) {
      context.error = key;
      return unwind;
    }

    var status = context.defineMethod(kind, obj, key, context.Code);

    if (status && status.Abrupt) {
      context.error = status;
      return unwind;
    }
    return context.cmds[++context.ip];
  }

  function MOVE(context){
    if (!context.stackB) {
      context.stackB = [];
      context.spB = 0;
    }

    if (context.ops[context.ip][0]) {
      context.stackB[context.spB++] = context.stack[--context.sp];
    } else {
      context.stack[context.sp++] = context.stackB[--context.spB];
    }

    return context.cmds[++context.ip];
  }

  function NATIVE_CALL(context){
    return CALL();
  }

  function NATIVE_REF(context){
    if (!context.Code.natives) {
      context.error = 'invalid native reference';
      return unwind;
    }
    context.stack[context.sp++] = context.Realm.natives.reference(context.Code.lookup(context.ops[context.ip][0]), false);
    return context.cmds[++context.ip];
  }

  function OBJECT(context){
    context.stack[context.sp++] = context.createObject();
    return context.cmds[++context.ip];
  }

  function OR(context){
    if (isFalsey(context.stack[context.sp - 1])) {
      context.sp--;
      return context.cmds[++context.ip];
    }
    context.ip = context.ops[context.ip][0];
    return context.cmds[context.ip];
  }

  function POP(context){
    context.sp--;
    return context.cmds[++context.ip];
  }

  function POPN(context){
    context.sp -= context.ops[context.ip][0];
    return context.cmds[++context.ip];
  }

  function PROPERTY(context){
    var val = context.stack[--context.sp],
        obj = context.stack[context.sp - 1],
        key = getKey(context, context.ops[context.ip][0]);

    if (key && key.Abrupt) {
      context.error = key;
      return unwind;
    }

    if (val && val.Abrupt) {
      context.error = val;
      return unwind;
    }

    var status = obj.DefineOwnProperty(key, new Desc(val), false);

    if (status && status.Abrupt) {
      context.error = status;
      return unwind;
    }

    return context.cmds[++context.ip];
  }

  function PROTO(context){
    var proto = context.stack[--context.sp],
        obj   = context.stack[context.sp - 1];

    if (proto && proto.Abrupt) {
      context.error = proto;
      return unwind;
    }

    if (obj && obj.Abrupt) {
      context.error = obj;
      return unwind;
    }

    var status = obj.SetInheritance(proto);
    if (status && status.Abrupt) {
      context.error = status;
      return unwind;
    }

    return context.cmds[++context.ip];
  }

  function PUT(context){
    var val    = context.stack[--context.sp],
        ref    = context.stack[--context.sp],
        status = $$PutValue(ref, val);

    if (status && status.Abrupt) {
      context.error = status;
      return unwind;
    }

    context.stack[context.sp++] = val;
    return context.cmds[++context.ip];
  }

  function REGEXP(context){
    context.stack[context.sp++] = context.createRegExp(context.ops[context.ip][0]);
    return context.cmds[++context.ip];
  }

  function REF(context){
    var ident = context.Code.lookup(context.ops[context.ip][0]);
    context.stack[context.sp++] = context.getReference(ident);
    return context.cmds[++context.ip];
  }


  function REFSYMBOL(context){
    var symbol = context.Code.lookup(context.ops[context.ip][0]);
    context.stack[context.sp++] = context.getSymbol(symbol);
    return context.cmds[++context.ip];
  }

  function REST(context){
    var args   = context.stack[--context.sp],
        offset = context.ops[context.ip][0],
        count  = args.length - offset,
        array  = context.createArray(0);

    for (var i=0; i < count; i++) {
      array.set(i+'', args[offset + i]);
    }
    array.set('length', i);
    context.stack[context.sp++] = array;

    return context.cmds[++context.ip];
  }

  function RETURN(context){
    context.completion = context.stack[--context.sp];
    context.ip++;

    if (context.Code.flags.generator) {
      context.currentGenerator.ExecutionContext = context;
      context.currentGenerator.State = 'closed';
      context.error = new AbruptCompletion('throw', context.Realm.intrinsics.StopIteration);
      unwind(context);
    }

    return false;
  }

  function RETURN_CHECK(context){
    if (context.returning) {
      return false;
    }

    return context.cmds[++context.ip];
  }

  function RETURN_FINALLY(context){
    RETURN(context);
    context.returning = true;
    return context.cmds[++context.ip];
  }

  function ROTATE(context){
    var buffer = [],
        item   = context.stack[--context.sp],
        index  = 0,
        count  = context.ops[context.ip][0];

    while (index < count) {
      buffer[index++] = context.stack[--context.sp];
    }

    buffer[index++] = item;

    while (index--) {
      context.stack[context.sp++] = buffer[index];
    }

    return context.cmds[++context.ip];
  }

  function SAVE(context){
    context.completion = context.stack[--context.sp];
    return context.cmds[++context.ip];
  }

  function SCOPE_CLONE(context){
    context.cloneScope();
    return context.cmds[++context.ip];
  }

  function SCOPE_POP(context){
    context.popScope();
    return context.cmds[++context.ip];
  }

  function SCOPE_PUSH(context){
    context.pushScope();
    return context.cmds[++context.ip];
  }

  function SPREAD(context){
    var obj    = context.stack[--context.sp],
        index  = context.ops[context.ip][0],
        result = context.destructureSpread(obj, index);

    if (result && result.Abrupt) {
      context.error = result;
      return unwind;
    }

    context.stack[context.sp++] = result;
    return context.cmds[++context.ip];
  }

  function SPREAD_ARG(context){
    var spread = context.stack[--context.sp],
        args   = context.stack[context.sp - 1],
        status = context.spreadArguments(args, spread);

    if (status && status.Abrupt) {
      context.error = status;
      return unwind;
    }

    return context.cmds[++context.ip];
  }

  function SPREAD_ARRAY(context){
    var val    = context.stack[--context.sp],
        index  = context.stack[--context.sp] + context.ops[context.ip][0],
        array  = context.stack[context.sp - 1],
        status = context.spreadArray(array, index, val);

    if (status && status.Abrupt) {
      context.error = status;
      return unwind;
    }

    context.stack[context.sp++] = status;
    return context.cmds[++context.ip];
  }


  function STRING(context){
    context.stack[context.sp++] = context.Code.lookup(context.ops[context.ip][0]);
    return context.cmds[++context.ip];
  }

  function SUPER_ELEMENT(context){
    var result = context.getSuperReference(context.stack[--context.sp]);

    if (result && result.Abrupt) {
      context.error = result;
      return unwind;
    }

    context.stack[context.sp++] = result;
    return context.cmds[++context.ip];
  }

  function SUPER_MEMBER(context){
    var key = getKey(context, context.ops[context.ip][0]);

    if (key && key.Abrupt) {
      context.error = key;
      return unwind;
    }

    var result = context.getSuperReference(key);

    if (result && result.Abrupt) {
      context.error = result;
      return unwind;
    }

    context.stack[context.sp++] = result;
    return context.cmds[++context.ip];
  }

  function SWAP(context){
    var stack = context.stack,
        sp    = context.sp;
    context.stack = context.stackB || [];
    context.sp = context.spB || 0;
    context.stackB = stack;
    context.spB = sp;
    return context.cmds[++context.ip];
  }

  function SYMBOL(context){
    var name = context.ops[context.ip][0],
        isPublic = context.ops[context.ip][1],
        hasInit = context.ops[context.ip][2];

    if (hasInit) {
      var init = context.stack[--context.sp];
      if (init && init.Abrupt) {
        context.error = init;
        return unwind;
      }
    } else {
      var init = context.createSymbol(name, isPublic);
    }

    var result = context.initializeSymbolBinding(name, init);

    if (result && result.Abrupt) {
      context.error = result;
      return unwind;
    }

    context.stack[context.sp++] = result;
    return context.cmds[++context.ip];
  }

  function TEMPLATE(context){
    context.stack[context.sp++] = context.getTemplateCallSite(context.ops[context.ip][0]);
    return context.cmds[++context.ip];
  }

  function THIS(context){
    var result = context.getThis();

    if (result && result.Abrupt) {
      context.error = result;
      return unwind;
    }

    context.stack[context.sp++] = result;
    return context.cmds[++context.ip];
  }

  function THROW(context){
    context.error = new AbruptCompletion('throw', context.stack[--context.sp]);
    return unwind;
  }

  function TO_OBJECT(context){
    var result = context.stack[context.sp - 1] = ToObject(context.stack[context.sp - 1]);

    if (result && result.Abrupt) {
      context.error = result;
      return unwind;
    }

    return context.cmds[++context.ip];
  }

  function UNARY(context){
    var result = UnaryOperation(context.ops[context.ip][0], context.stack[--context.sp]);

    if (result && result.Abrupt) {
      context.error = result;
      return unwind;
    }

    context.stack[context.sp++] = result;
    return context.cmds[++context.ip];
  }

  function UNDEFINED(context){
    context.stack[context.sp++] = undefined;
    return context.cmds[++context.ip];
  }

  var updaters = [POST_DEC, PRE_DEC, POST_INC, PRE_INC];

  function UPDATE(context){
    var update = updaters[context.ops[context.ip][0]],
        result = update(context.stack[--context.sp]);

    if (result && result.Abrupt) {
      context.error = result;
      return unwind;
    }

    context.stack[context.sp++] = result;
    return context.cmds[++context.ip];
  }

  function VAR(context){
    context.initializeBinding(context.Code.lookup(context.ops[context.ip][0]), context.stack[--context.sp], false);
    return context.cmds[++context.ip];
  }

  function WITH(context){
    var result = ToObject($$GetValue(context.stack[--context.sp]));

    if (result && result.Abrupt) {
      context.error = result;
      return unwind;
    }

    context.pushWith(result);
    return context.cmds[++context.ip];
  }

  function YIELD(context){
    context.currentGenerator.ExecutionContext = context;
    context.currentGenerator.State = 'suspended';
    context.completion = context.stack[--context.sp];
    context.ip++;
    context.pop();
    return false;
  }

  function trace(unwound){
    stacktrace || (stacktrace = []);
    stacktrace.push(unwound);
  }

  var opcodes = [ADD, AND, ARRAY, ARG, ARGS, ARGUMENTS, ARRAY_DONE, BINARY, BINDING, CALL, CASE, CLASS_DECL,
    CLASS_EXPR, COMPLETE, CONST, CONSTRUCT, DEBUGGER, DEFAULT, DEFINE, DUP, ELEMENT, ENUM, EXTENSIBLE, EVAL,
    FLIP, FUNCTION, GET, GET_GLOBAL, HAS_BINDING, HAS_GLOBAL, INC, INDEX, INTERNAL_MEMBER, ITERATE, JUMP,
    JEQ_NULL, JEQ_UNDEFINED, JFALSE, JLT, JLTE, JGT, JGTE, JNEQ_NULL, JNEQ_UNDEFINED, JTRUE, LET, LITERAL,
    LOG, LOOP, MEMBER, METHOD, MOVE, NATIVE_CALL, NATIVE_REF, OBJECT, OR, POP, POPN, PROPERTY, PROTO, PUT, PUT_GLOBAL,
    REF, REFSYMBOL, REGEXP, REST, RETURN, RETURN_CHECK, RETURN_FINALLY, ROTATE, SAVE, SCOPE_CLONE, SCOPE_POP, SCOPE_PUSH, SPREAD,
    SPREAD_ARG, SPREAD_ARRAY, STRING, SUPER_ELEMENT, SUPER_MEMBER, SWAP, SYMBOL, TEMPLATE, THIS, THROW, TO_OBJECT,
    UNARY, UNDEFINED, UPDATE, VAR, WITH, YIELD];

  exports.instructions = function instructions(ops){
    var out = [],
        traceNext;

    for (var i=0; i < ops.length; i++) {
      out[i] = opcodes[+ops[i].op];
      out[i].ip = i;
      if (out[i].name === 'LOG') {
        out.log = true;
      } else if (out[i].name === 'LOOP' ) {
        traceNext = true;
      } else if (traceNext) {
        out[i].count = out[i].total = 0;
        traceNext = false;
      }
    }
    return out;
  };

  return exports;
})(typeof module !== 'undefined' ? module.exports : {});



exports.runtime = (function(GLOBAL, exports, undefined){
  "use strict";
  var esprima          = require('../third_party/esprima'),
      objects          = require('./lib/objects'),
      functions        = require('./lib/functions'),
      iteration        = require('./lib/iteration'),
      utility          = require('./lib/utility'),
      errors           = require('./errors'),
      assemble         = require('./assembler').assemble,
      constants        = require('./constants'),
      collections      = require('./object-model/collections'),
      operators        = require('./object-model/operators'),
      environments     = require('./object-model/environments'),
      operations       = require('./object-model/operations'),
      descriptors      = require('./object-model/descriptors'),
      symbols          = require('./object-model/$Symbol').wellKnownSymbols,
      internalSymbols  = require('./object-model/$Symbol').internalSymbols,
      $Symbol          = require('./object-model/$Symbol').$Symbol,
      $WellKnownSymbol = require('./object-model/$Symbol').$WellKnownSymbol,
      $Object          = require('./object-model/$Object').$Object,
      $Descriptor      = require('./object-model/$Descriptor').$Descriptor,
      $StrictArguments = require('./object-model/$Arguments').$StrictArguments,
      $MappedArguments = require('./object-model/$Arguments').$MappedArguments,
      $Array           = require('./object-model/$Array').$Array,
      $Proxy           = require('./object-model/$Proxy'),
      $TypedArray      = require('./object-model/$TypedArray'),
      Nil              = require('./object-model/$Nil'),
      thunk            = require('./thunk'),
      engine           = require('./engine').engine,
      Emitter          = require('./lib/Emitter'),
      PropertyList     = require('./lib/PropertyList'),
      Stack            = require('./lib/Stack');

  var $Nil             = Nil.$Nil,
      Undetectable     = Nil.Undetectable,
      isUndetectable   = Nil.isUndetectable;

  var Hash           = objects.Hash,
      create         = objects.create,
      hasOwn         = objects.hasOwn,
      isObject       = objects.isObject,
      assign         = objects.assign,
      define         = objects.define,
      inherit        = objects.inherit,
      hide           = objects.hide,
      ownKeys        = objects.keys,
      properties     = objects.properties,
      getPrototypeOf = objects.getPrototypeOf,
      fname          = functions.fname,
      applyNew       = functions.applyNew,
      iterate        = iteration.iterate,
      each           = iteration.each,
      map            = iteration.map,
      uid            = utility.uid,
      nextTick       = utility.nextTick,
      tag            = utility.tag,
      MapData        = collections.MapData,
      WeakMapData    = collections.WeakMapData;

  var $$ThrowException = errors.$$ThrowException,
      $$MakeException  = errors.$$MakeException,
      Completion       = errors.Completion,
      AbruptCompletion = errors.AbruptCompletion;

  var $$GetValue     = operators.$$GetValue,
      $$ToObject     = operators.$$ToObject,
      $$Type         = operators.$$Type,
      $$GetThisValue = operators.$$GetThisValue;

  var Reference                 = operations.Reference,
      $$IsCallable              = operations.$$IsCallable,
      $$Invoke                  = operations.$$Invoke,
      $$EnqueueChangeRecord     = operations.$$EnqueueChangeRecord,
      $$DeliverAllChangeRecords = operations.$$DeliverAllChangeRecords,
      $$CreateListFromArray     = operations.$$CreateListFromArray,
      $$IsStopIteration         = operations.$$IsStopIteration,
      $$IsPropertyReference     = operations.$$IsPropertyReference,
      $$OrdinaryCreateFromConstructor = operations.$$OrdinaryCreateFromConstructor;

  var Value                    = descriptors.Value,
      Accessor                 = descriptors.Accessor,
      DataDescriptor           = descriptors.DataDescriptor,
      $$IsAccessorDescriptor   = descriptors.$$IsAccessorDescriptor,
      $$FromPropertyDescriptor = descriptors.$$FromPropertyDescriptor,
      $$ToPropertyDescriptor   = descriptors.$$ToPropertyDescriptor;

  var DeclarativeEnv = environments.DeclarativeEnvironmentRecord,
      ObjectEnv      = environments.ObjectEnvironmentRecord,
      FunctionEnv    = environments.FunctionEnvironmentRecord,
      GlobalEnv      = environments.GlobalEnvironmentRecord;

  var SYMBOLS = constants.SYMBOLS,
      Break   = SYMBOLS.Break,
      Pause   = SYMBOLS.Pause,
      Throw   = SYMBOLS.Throw,
      Return  = SYMBOLS.Return,
      Normal  = SYMBOLS.Normal;


  AbruptCompletion.prototype.Abrupt = SYMBOLS.Abrupt;
  Completion.prototype.Completion   = SYMBOLS.Completion;


  var E = 0x1,
      C = 0x2,
      W = 0x4,
      A = 0x8,
      ___ = 0,
      E__ = 1,
      _C_ = 2,
      EC_ = 3,
      __W = 4,
      E_W = 5,
      _CW = 6,
      ECW = 7,
      __A = 8,
      E_A = 9,
      _CA = 10,
      ECA = 11;


  errors.createError = function(name, type, message){
    return new $Error(name, type, message);
  };


  function noop(){}


  // ###############################
  // ### Specification Functions ###
  // ###############################

  function $$MakeConstructor(func, writable, prototype){
    var install = prototype === undefined;
    if (install) {
      prototype = new $Object;
    }
    prototype.isProto = true;
    if (writable === undefined) {
      writable = true;
    }
    if (install) {
      prototype.define('constructor', func, writable ? _CW : ___);
    }
    func.define('prototype', prototype, writable ? __W : ___);
  }

  var $$PropertyDefinitionEvaluation = (function(){
    function makeDefiner(constructs, field, desc){
      return function(obj, key, code) {

        var sup = code.flags.usesSuper,
            lex = context.LexicalEnvironment,
            home = sup ? obj : undefined,
            $F = code.flags.generator ? $GeneratorFunction : $Function,
            func = new $F('method', key, code.params, code, lex, code.flags.strict, undefined, home, sup);

        constructs && $$MakeConstructor(func);
        desc[field] = func;
        var result = obj.DefineOwnProperty(key, desc, false);
        desc[field] = undefined;

        return result && result.Abrupt ? result : func;
      };
    }

    var DefineMethod = makeDefiner(false, 'Value', {
      Value: undefined,
      Writable: true,
      Enumerable: true,
      Configurable: true
    });

    var DefineGetter = makeDefiner(true, 'Get', {
      Get: undefined,
      Enumerable: true,
      Configurable: true
    });

    var DefineSetter = makeDefiner(true, 'Set', {
      Set: undefined,
      Enumerable: true,
      Configurable: true
    });

    return function $$PropertyDefinitionEvaluation(kind, obj, key, code){
      if (key && key.Abrupt) return key;

      if (kind === 'get') {
        return DefineGetter(obj, key, code);
      } else if (kind === 'set') {
        return DefineSetter(obj, key, code);
      } else if (kind === 'method') {
        return DefineMethod(obj, key, code);
      }
    };
  })();


  var mutable = { Value: undefined,
                  Writable: true,
                  Enumerable: true,
                  Configurable: true };

  var immutable = { Value: undefined,
                    Writable: true,
                    Enumerable: true,
                    Configurable: false };

  function $$TopLevelDeclarationInstantiation(code){
    var env = context.VariableEnvironment,
        configurable = code.scopeType === 'eval',
        decls = code.LexicalDeclarations;

    var desc = configurable ? mutable : immutable;

    for (var i=0, decl; decl = decls[i]; i++) {
      if (decl.type === 'FunctionDeclaration') {
        var name = decl.id.name;
        if (env.HasBinding(name)) {
          env.CreateMutableBinding(name, configurable);
        } else if (env === realm.globalEnv) {
          var existing = global.GetOwnProperty(name);
          if (!existing) {
            global.DefineOwnProperty(name, desc, true);
          } else if ($$IsAccessorDescriptor(existing) || !existing.Writable && !existing.Enumerable) {
            return $$ThrowException('global invalid define');
          }
        }

        env.SetMutableBinding(name, $$InstantiateFunctionDeclaration(decl, context.LexicalEnvironment), code.flags.strict);
      }
    }

    for (var i=0; i < code.VarDeclaredNames.length; i++) {
      var name = code.VarDeclaredNames[i];
      if (!env.HasBinding(name)) {
        env.CreateMutableBinding(name, configurable);
        env.SetMutableBinding(name, undefined, code.flags.strict);
      } else if (env === realm.globalEnv) {
        var existing = global.GetOwnProperty(name);
        if (!existing) {
          global.DefineOwnProperty(name, desc, true);
        }
      }
    }
  }


  function getKey(v){
    if (!v || typeof v === 'string') {
      return v;
    }
    if (v[0] !== '@') {
      return v[1];
    }

    return context.getSymbol(v[1]);
  }
  // ## $$ClassDefinitionEvaluation

  function $$ClassDefinitionEvaluation(name, superclass, constructorCode, methods, symbolsDeclarations){
    if (superclass === undefined) {
      var superproto = intrinsics['%ObjectPrototype%'],
          superctor = intrinsics['%FunctionPrototype%'];
    } else {
      if (superclass && superclass.Abrupt) return superclass;

      if (superclass === null) {
        superproto = null;
        superctor = intrinsics['%FunctionPrototype%'];
      } else if (typeof superclass !== 'object') {
        return $$ThrowException('non_object_superclass');
      } else if (!('Construct' in superclass)) {
        superproto = superclass;
        superctor = intrinsics['%FunctionPrototype%'];
      } else {
        superproto = superclass.Get('prototype');
        if (superproto && superproto.Abrupt) return superproto;

        if (typeof superproto !== 'object') {
          return $$ThrowException('non_object_superproto');
        }
        superctor = superclass;
      }
    }

    var proto = new $Object(superproto),
        brand = getKey(name || '');

    for (var i=0; i < symbolsDeclarations[0].length; i++) {
      var symbol   = symbolsDeclarations[0][i],
          isPublic = symbolsDeclarations[1][i],
          result   = context.initializeSymbolBinding(symbol, context.createSymbol(symbol, isPublic));

      if (result && result.Abrupt) return result;
    }


    if (name) {
      context.LexicalEnvironment.CreateImmutableBinding(name);
    }

    var ctor = $$PropertyDefinitionEvaluation('method', proto, 'constructor', constructorCode);
    if (ctor && ctor.Abrupt) return ctor;

    if (name) {
      context.initializeBinding(name, ctor);
      proto.define(symbols.toStringTag, brand);
    }

    $$MakeConstructor(ctor, false, proto);
    ctor.isClass = true;
    ctor.isConstructor = true;
    ctor.SetInheritance(superctor);
    ctor.set('name', brand);
    ctor.define('prototype', proto, ___);
    proto.define('constructor', ctor, _CW);
    proto.isClassProto = true;

    each(methods, function(method){
      $$PropertyDefinitionEvaluation(method.kind, proto, getKey(method.name), method.code);
    });

    return ctor;
  }

  // ## $$InstantiateFunctionDeclaration

  function $$InstantiateFunctionDeclaration(decl, env){
    var code = decl.code,
        $F = code.flags.generator ? $GeneratorFunction : $Function,
        func = new $F('normal', decl.id.name, code.params, code, env, code.flags.strict);

    $$MakeConstructor(func);
    return func;
  }




  function createBoolean(value){
    return runtime.intrinsics['%Boolean%'].Construct([value]);
  }

  function createNumber(value){
    return runtime.intrinsics['%Number%'].Construct([value]);
  }

  function createString(value){
    return runtime.intrinsics['%String%'].Construct([value]);
  }

  function fromInternal(object){
    if (typeof object === 'function') {
      return new $InternalFunction(object);
    } else if (object === null || typeof object !== 'object') {
      return object;
    } else if (object instanceof RegExp) {
      return new $RegExp(object);
    } else if (object instanceof Number) {
      return createNumber(object);
    } else if (object instanceof String) {
      return createString(object);
    } else if (object instanceof Boolean) {
      return createBoolean(object);
    } else if (object instanceof Array) {
      var out = new $Array;
      each(object, function(item, index){
        out.set(index, fromInternal(item));
      });
      return out;
    }

    var out = new $Object;
    each(object, function(val, key){
      out.set(key, fromInternal(val));
    });
    return out;
  }

  function CollectionInitializer(Data, name){
    var data = name + 'Data';
    return function(_, args){
      var object = args[0],
          iterable = args[1];

      object[data] = new Data;

      if (iterable === undefined) {
        return object;
      }

      iterable = $$ToObject(iterable);
      if (iterable && iterable.Abrupt) return iterable;

      var iter = $$Invoke(iterable, symbols.iterator);
      if (iter && iter.Abrupt) return iter;

      var adder = object.Get('set');
      if (adder && adder.Abrupt) return adder;

      if (!$$IsCallable(adder)) {
        return $$ThrowException('called_on_incompatible_object', [name + '.prototype.set']);
      }

      var next;
      while (next = $$ToObject($$Invoke(iter, 'next'))) {
        if ($$IsStopIteration(next)) {
          return object;
        }

        if (next && next.Abrupt) return next;

        var key = next.Get(0);
        if (key && key.Abrupt) return key;

        var value = next.Get(1);
        if (value && value.Abrupt) return value;

        var status = adder.Call(object, [key, value]);
        if (status && status.Abrupt) return status;
      }
      return object;
    };
  }



  var DefineOwn = $Object.prototype.DefineOwnProperty;

  // #################
  // ### $Function ###
  // #################

  var $Function = (function(){
    function $Function(kind, name, params, code, scope, strict, proto, holder, method){
      if (proto === undefined) {
        proto = intrinsics['%FunctionPrototype%'];
      }

      $Object.call(this, proto);
      this.FormalParameters = params;
      this.ThisMode = kind === 'arrow' ? 'lexical' : strict ? 'strict' : 'global';
      this.Strict = !!strict;
      this.Realm = realm;
      this.Scope = scope;
      this.Code = code;
      tag(code);
      if (holder !== undefined) {
        this.HomeObject = holder;
      }
      if (method) {
        this.MethodName = getKey(name);
      }

      if (strict) {
        this.define('arguments', intrinsics.ThrowTypeError, __A);
        this.define('caller', intrinsics.ThrowTypeError, __A);
      } else {
        this.define('arguments', null, ___);
        this.define('caller', null, ___);
      }

      this.define('length', params ? params.ExpectedArgumentCount : 0, ___);
      this.define('name', getKey(code.name), code.name && !code.flags.writableName ? ___ : __W);
    }

    inherit($Function, $Object, {
      BuiltinBrand: 'BuiltinFunction',
      FormalParameters: null,
      code: null,
      Scope: null,
      Strict: false,
      ThisMode: 'global',
      Realm: null,
      type: '$Function'
    }, [
      function getName(){
        return this.get('name');
      },
      function prepare(receiver, args, ctx, isConstruct){
        if (realm !== this.Realm) {
          engine.changeRealm(this.Realm);
        }

        if (this.ThisMode === 'lexical') {
          var local = new DeclarativeEnv(this.Scope);
        } else {
          if (this.ThisMode !== 'strict') {
            if (receiver == null) {
              receiver = this.Realm.global;
            } else if (typeof receiver !== 'object') {
              receiver = $$ToObject(receiver);
              if (receiver.Abrupt) return receiver;
            }
          }
          var local = new FunctionEnv(receiver, this);
        }

        var caller = context ? context.callee : null;

        if (ctx) {
          ExecutionContext.call(ctx, ctx.caller, local, realm, this.Code, this, args, isConstruct);
        } else {
          ctx = new ExecutionContext(context, local, realm, this.Code, this, args, isConstruct);
        }

        if (this.define && !this.Strict) {
          this.define('arguments', local.arguments, ___);
          this.define('caller', caller, ___);
          local.arguments = null;
        }

        return ctx;
      },
      function cleanup(){
        if (this.define && !this.Strict) {
          this.define('arguments', null, ___);
          this.define('caller', null, ___);
        }
      },
      function Call(receiver, args, isConstruct){
        var ctx = this.prepare(receiver, args, null, isConstruct);
        ExecutionContext.push(ctx);
        var result = context.run();
        ctx === context && ExecutionContext.pop();
        this.cleanup();
        return result && result.type === Return ? result.value : result;
      },
      function Construct(args){
        return $$OrdinaryConstruct(this, args);
      }
    ]);


    function $$OrdinaryConstruct(F, argumentsList, fallBackProto){
      var creator = F.Get(symbols.create);
      if (creator && creator.Abrupt) return creator;

      var obj = creator ? creator.Call(F, argumentsList) : $$OrdinaryCreateFromConstructor(F, '%ObjectPrototype%');
      if (obj && obj.Abrupt) return obj;

      var result = F.Call(obj, argumentsList, true);
      if (result && result.Abrupt) return result;

      return $$Type(result) === 'Object' ? result : obj;
    }

    return $Function;
  })();



  var $BoundFunction = (function(){
    function $BoundFunction(target, boundThis, boundArgs){
      $Object.call(this, intrinsics['%FunctionPrototype%']);
      this.BoundTargetFunction = target;
      this.BoundThis = boundThis;
      this.BoundArgs = boundArgs;
      this.define('arguments', intrinsics.ThrowTypeError, __A);
      this.define('caller', intrinsics.ThrowTypeError, __A);
      this.define('length', target.get('length'), ___);
    }

    inherit($BoundFunction, $Function, {
      TargetFunction: null,
      BoundThis: null,
      BoundArgs: null,
      type: '$BoundFunction'
    }, [
      function getName(){
        return this.BoundTargetFunction.getName();
      },
      function Call(_, newArgs){
        return this.BoundTargetFunction.Call(this.BoundThis, this.BoundArgs.concat(newArgs));
      },
      function Construct(newArgs){
        var target = this.BoundTargetFunction;
        if (!target.Construct) {
          return $$ThrowException('not_constructor', target.name);
        }
        target.constructCount = (target.constructCount || 0) + 1;
        return target.Construct(this.BoundArgs.concat(newArgs));
      }
    ]);

    return $BoundFunction;
  })();

  var $GeneratorFunction = (function(){
    function $GeneratorFunction(){
      $Function.apply(this, arguments);
    }

    inherit($GeneratorFunction, $Function, {
      isGenerator: true
    }, [
      function Call(receiver, args, isConstruct){
        if (realm !== this.Realm) {
          engine.changeRealm(this.Realm);
        }
        if (this.ThisMode === 'lexical') {
          var local = new DeclarativeEnv(this.Scope);
        } else {
          if (this.ThisMode !== 'strict') {
            if (receiver == null) {
              receiver = this.Realm.global;
            } else if (typeof receiver !== 'object') {
              receiver = $$ToObject(receiver);
              if (receiver.Abrupt) return receiver;
            }
          }
          var local = new FunctionEnv(receiver, this);
        }

        var ctx = new ExecutionContext(context, local, this.Realm, this.Code, this, args, isConstruct);
        return new $Generator(this.Realm, local, ctx);
      }
    ]);

    return $GeneratorFunction;
  })();

  var $Generator = (function(){
    function setFunction(obj, name, func){
      obj.set(name, new $InternalFunction({
        name: name,
        length: func.length,
        call: func
      }));
    }


    function $$Resume(ctx, completionType, value){
      ExecutionContext.push(ctx);
      if (completionType !== 'normal') {
        value = new AbruptCompletion(completionType, value);
      }
      return ctx.send(value);
    }


    function $Generator(realm, scope, ctx){
      $Object.call(this);
      this.Realm = realm;
      this.Scope = scope;
      this.Code = ctx.Code;
      this.ExecutionContext = ctx;
      this.State = 'newborn';

      var self = this;
      ExecutionContext.push(ctx);
      setFunction(this, symbols.iterator, function(_, args){ return self });
      setFunction(this, 'next',         function(_, args){ return self.Send() });
      setFunction(this, 'close',        function(_, args){ return self.Close() });
      setFunction(this, 'send',         function(_, args){ return self.Send(args[0]) });
      setFunction(this, 'throw',        function(_, args){ return self.Throw(args[0]) });
      ctx.pop();
    }

    inherit($Generator, $Object, {
      Code: null,
      ExecutionContext: null,
      Scope: null,
      Handler: null,
      State: null
    }, [
      function Send(value){
        if (this.State === 'executing') {
          return $$ThrowException('generator_executing', 'send');
        } else if (this.State === 'closed') {
          return $$ThrowException('generator_closed', 'send');
        } else if (this.State === 'newborn') {
          if (value !== undefined) {
            return $$ThrowException('generator_send_newborn');
          }
          this.ExecutionContext.currentGenerator = this;
          this.State = 'executing';
          ExecutionContext.push(this.ExecutionContext);
          return this.ExecutionContext.run();
        }

        this.State = 'executing';
        return $$Resume(this.ExecutionContext, 'normal', value);
      },
      function Throw(value){
        if (this.State === 'executing') {
          return $$ThrowException('generator_executing', 'throw');
        } else if (this.State === 'closed') {
          return $$ThrowException('generator_closed', 'throw');
        } else if (this.State === 'newborn') {
          this.State = 'closed';
          this.Code = null;
          return new AbruptCompletion('throw', value);
        }

        this.State = 'executing';
        return $$Resume(this.ExecutionContext, 'throw', value);
      },
      function Close(value){
        if (this.State === 'executing') {
          return $$ThrowException('generator_executing', 'close');
        } else if (this.State === 'closed') {
          return;
        } else if (state === 'newborn') {
          this.State = 'closed';
          this.Code = null;
          return;
        }

        this.State = 'executing';
        var result = $$Resume(this.ExecutionContext, 'return', value);
        this.State = 'closed';

        return result;
      }
    ]);

    return $Generator;
  })();


  // ###############
  // ### $RegExp ###
  // ###############

  var $RegExp = (function(){
    function $RegExp(primitive){
      if (!this.properties) {
        $Object.call(this, intrinsics.RegExpProto);
      }
      this.PrimitiveValue = primitive;
    }

    var reflected = assign(new Hash, {
      global:     ['global', false, ___],
      ignoreCase: ['ignoreCase', false, ___],
      lastIndex:  ['lastIndex', 0, __W],
      multiline:  ['multiline', false, ___],
      source:     ['source', '', ___]
    });

    inherit($RegExp, $Object, {
      BuiltinBrand: 'BuiltinRegExp',
      Match: null
    }, [
      function describe(key){
        if (key in reflected) {
          var prop = reflected[key];
          prop[1] = this.PrimitiveValue[key];
          return prop;
        }
        return this.properties.describe(key);
      },
      function define(key, value, attr){
        if (key in reflected) {
          if (key === 'lastIndex') {
            this.PrimitiveValue.lastIndex = value;
          }
        } else {
          this.properties.define(key, value, attr);
        }
      },
      function get(key){
        if (key in reflected) {
          return this.PrimitiveValue[key];
        }
        return this.properties.get(key);
      },
      function set(key, value){
        if (key in reflected) {
          if (key === 'lastIndex') {
            this.PrimitiveValue.lastIndex = value;
          }
        } else {
          this.properties.set(key, value);
        }
      },
      function query(key){
        if (key in reflected) {
          return reflected[key][2];
        }
        return this.properties.query(key);
      },
      function update(key, attr){
        if (!(key in reflected)) {
          return this.properties.update(key, attr);
        }
      },
      function each(callback){
        for (var k in reflected) {
          var prop = reflected[k];
          prop[1] = this.PrimitiveValue[k];
          callback.call(this, prop);
        }
        this.properties.each(callback, this);
      }
    ]);

    return $RegExp;
  })();



  var $Module = (function(){
    var $Enumerator = require('./object-model/$Object').$Enumerator;

    function ModuleValue(value){
      this.Value = value;
    }

    define(ModuleValue, {
      Writable: false,
      Enumerable: true,
      Configurable: false,
      isDescriptor: true,
      isDataDescriptor: true
    });

    function $ModuleIterator(module){
      var index = 0;
      $Object.call(this);

      this.set(symbols.iterator, this);
      this.set('next', new $InternalFunction(function next(){
        if (index < module.keys.length) {
          var key = module.keys[index++];
          return new $Array([key, module.get(key)]);
        }
        return new AbruptCompletion('throw', realm.intrinsics.StopIteration);
      }));
    }

    inherit($ModuleIterator, $Object);



    function $Module(object, key){
      if (object instanceof $Module) {
        return object;
      }

      this.init(object, key);
      iteration.each(this.keys, this.add, this);
      tag(this);
    }


    define($Module.prototype, {
      type: '$Module',
      BuiltinBrand: 'BuiltinModule'
    });

    define($Module.prototype, [
      function init(object, keys){
        this.props = new Hash;
        this.object = object;
        this.keys = keys;
      },
      function add(key){
        this.props[key] = new Reference(this.object, key);
      },
      function get(key){
        if (key === symbols.iterator) {
          return this.iterator();
        }

        var ref = this.props[key];
        if (ref) {
          return $$GetValue(ref);
        }
      },
      (function(){ return function define(){} })(),
      function set(key){},
      function update(){},
      function has(key){
        return key in this.props;
      },
      function each(callback){
        iteration.each(this.keys, function(key){
          callback.call(this, this.describe(key));
        }, this);
      },
      function describe(key){
        if (this.has(key)) {
          return [key, this.get(key), E__];
        }
      },
      function query(key){
        if (this.has(key)) {
          return E__;
        }
      },
      function enumerator(){
        return new $Enumerator(this.keys);
      },
      function iterator(){
        // TODO make this less wasteful
        var self = this;
        return new $InternalFunction(function(){
          return new $ModuleIterator(self);
        });
      },
      function Iterate(){
        return this.iterator().Call(undefined, []);
      },
      function GetInheritance(){
        return null;
      },
      function SetInheritance(v){
        return false;
      },
      function IsExtensible(){
        return false;
      },
      function PreventExtensions(){
        return true;
      },
      function HasProperty(key){
        return this.has(key);
      },
      function HasOwnProperty(key){
        return this.has(key);
      },
      function Get(key){
        return this.get(key);
      },
      function GetP(key, receiver){
        return this.get(key);
      },
      function Put(key, value){
        return false;
      },
      function SetP(key, value, receiver){
        return false;
      },
      function GetOwnProperty(key){
        if (this.has(key)) {
          return new ModuleValue(this.get(key));
        }
        return false;
      },
      function DefineOwnProperty(key, desc, strict){
        return strict ? $$ThrowException('strict_lhs_assignment') : false;
      },
      function Delete(key){
        return false;
      },
      function Keys(){
        return this.keys;
      },
      function OwnPropertyKeys(){
        return this.keys.concat(symbols.iterator);
      },
      function Enumerate(){
        return this.keys;
      }
    ]);

    return $Module;
  })();

  var $NativeModule = (function(){
    function $NativeModule(bindings){
      $Module.call(this, bindings);
      delete this.bindings;
    }

    inherit($NativeModule, $Module, [
      function init(bindings){
        this.bindings = bindings;
        this.props = new Hash;
        this.keys = map(bindings, function(value, key){
          return key;
        });
      },
      function add(key){
        if (typeof this.bindings[key] === 'function') {
          this.props[key] = new $InternalFunction({
            name: key,
            call: this.bindings[key],
            length: this.bindings[key].length
          });
        } else {
          this.props[key] = this.bindings[key];
        }
      },
      function get(key){
        if (key === symbols.iterator) {
          return this.iterator();
        }

        return this.props[key];
      }
    ]);

    return $NativeModule;
  })();



  var $Error = (function(){
    function $Error(name, type, message){
      $Object.call(this, intrinsics['%'+name+'Prototype%']);
      this.define('message', message, ECW);
      if (type !== undefined) {
        this.define('type', type, _CW);
      }
    }

    inherit($Error, $Object, {
      BuiltinBrand: 'BuiltinError'
    }, [
      function setOrigin(filename, origin){
        filename && this.set('filename', filename);
        origin && this.set('origin', origin);
      },
      function setCode(loc, code){
        var line = code.split('\n')[loc.start.line - 1];
        var pad = new Array(loc.start.column).join('-') + '^';
        this.set('line', loc.start.line);
        this.set('column', loc.start.column);
        this.set('code', line + '\n' + pad);
      }
    ]);

    return $Error;
  })();



  var $NativeFunction = (function(){
    function $NativeFunction(options){
      if (typeof options === 'function') {
        options = {
          call: options,
          name: fname(options),
          length: options.length,
          proto: intrinsics['%FunctionPrototype%']
        };
      }
      if (options.proto === undefined) {
        options.proto = intrinsics['%FunctionPrototype%'];
      }
      $Object.call(this, options.proto);

      this.define('arguments', null, ___);
      this.define('caller', null, ___);
      this.define('length', options.length, ___);
      this.define('name', options.name, ___);

      if (options.unwrapped) {
        this.Call = options.call;
        if (options.construct) {
          this.Construct = options.construct;
        }
      } else {
        this.call = options.call;
        if (options.construct) {
          this.construct = options.construct;
        }
      }

      this.Realm = realm;
      hide(this, 'Realm');
    }

    inherit($NativeFunction, $Function, {
      Builtin: true,
      type: '$NativeFunction'
    }, [
      function Call(receiver, args){
        var result = this.call.apply(receiver, [].concat(args));
        return result && result.type === Return ? result.value : result;
      },
      function Construct(args){
        if (this.construct) {
          var instance = this.has('prototype') ? new $Object(this.get('prototype')) : new $Object;
          instance.ConstructorName = this.get('name');
          var result = this.construct.apply(instance, args);
        } else {
          var result = this.call.apply(undefined, args);
        }
        return result && result.type === Return ? result.value : result;
      }
    ]);

    return $NativeFunction;
  })();

  var deopt = ['define', 'describe', 'get', 'set', 'query', 'update', 'has', 'remove', 'each'];


  var $InternalFunction = (function(){
    function $InternalFunction(options){
      if (intrinsics) {
        this.Prototype = intrinsics['%FunctionPrototype%'];
      } else {
        this.Prototype = null;
      }
      this.Realm = realm;
      this.Call = typeof options === 'function' ? options : options.call;
      this.storage = new Hash;
      this.name = options.name || fname(this.Call);
      this.length = options.length || this.Call.length;
    }

    var reflected = assign(new Hash, {
      caller:      ['caller', null, ___],
      'arguments': ['arguments', null, ___],
      length:      ['length', 0, ___],
      name:        ['name', '', ___]
    });

    function deoptimize(target){
      each(deopt, function(key){
        target[key] = $Function.prototype[key];
      });

      target.properties = new PropertyList;
      target.define('arguments', null, ___);
      target.define('caller', null, ___);
      target.define('length', target.length, ___);
      target.define('name', target.name, ___);
    }

    inherit($InternalFunction, $Function, [
      function has(key){
        return key in reflected;
      },
      function get(key){
        if (key === 'name') {
          return this.name;
        } else if (key === 'length') {
          return this.length;
        } else if (key in reflected) {
          return reflected[key][1];
        }
      },
      function describe(key){
        if (key === 'name' || key === 'length') {
          reflected[key][1] = this[key];
        }
        return reflected[key];
      },
      function query(key){
        return key in reflected ? reflected[key][2] : undefined;
      },
      function each(callback){
        for (var key in reflected) {
          if (key === 'name' || key === 'length') {
            reflected[key][1] = this[key];
          }
          callback(reflected[key]);
        }
      },
      function remove(key, attr){
        deoptimize(this);
        return this.remove(key);
      },
      function update(key, attr){
        deoptimize(this);
        return this.update(key, attr);
      },
      function set(key, value){
        deoptimize(this);
        return this.set(key, value);
      },
      (function(){
        return function define(key, value, attr){
          deoptimize(this);
          return this.define(key, value, attr);
        };
      })()
    ]);

    return $InternalFunction;
  })();



  var ExecutionContext = (function(){
    var $$GetSymbol           = operations.$$GetSymbol,
        $$Element             = operations.$$Element,
        $$SuperReference      = operations.$$SuperReference,
        $$GetThisEnvironment  = operations.$$GetThisEnvironment,
        $$ThisResolution      = operations.$$ThisResolution,
        $$SpreadDestructuring = operations.$$SpreadDestructuring,
        $$GetTemplateCallSite = operations.$$GetTemplateCallSite;

    var strictUnfound = new Hash,
        unfound       = new Hash,
        globalDesc    = new DataDescriptor(undefined, ECW);


    function ExecutionContext(caller, local, realm, code, func, args, isConstruct){
      this.caller = caller;
      this.Realm = realm;
      this.Code = code;
      this.LexicalEnvironment = local;
      this.VariableEnvironment = local;
      this.strict = code.flags.strict;
      this.args = args || [];
      this.isConstruct = !!isConstruct;
      this.callee = func && !func.Builtin ? func : caller ? caller.callee : null;
      this.stack = [];
      this.ip = 0;
      this.sp = 0;
      this.error = undefined;
      this.completion = undefined;
      this.stacktrace = undefined;
      this.ops = code.ops;
      this.cmds = code.cmds || (code.cmds = thunk.instructions(code.ops));
    }

    define(ExecutionContext, [
      function push(newContext){
        context = newContext;
        context.Realm.active || engine.changeRealm(context.Realm);
      },
      function pop(){
        if (context) {
          var oldContext = context;
          context = context.caller;
          return oldContext;
        }
      },
      function reset(){
        var stack = [];
        while (context) {
          stack.push(ExecutionContext.pop());
        }
        return stack;
      }
    ]);

    define(ExecutionContext.prototype, {
      isGlobal: false,
      strict  : false,
      isEval  : false,
      constructFunction: operations.$$EvaluateConstruct,
      callFunction     : operations.$$EvaluateCall,
      spreadArguments  : operations.$$SpreadArguments,
      spreadArray      : operations.$$SpreadInitialization,
      defineMethod     : $$PropertyDefinitionEvaluation
    });

    define(ExecutionContext.prototype, [
      function run(){
        var f = this.cmds[this.ip];

        if (!this.Realm.quiet && !this.Code.natives || this.Realm.debugBuiltins) {
          this.history || (this.history = []);

          while (f) {
            this.history[this.history.length] = this.ops[this.ip];
            this.Realm.emit('op', this.ops[this.ip], this.stack[this.sp - 1]);
            f = f(this);
          }
        } else {
          while (f) f = f(this);
        }

        return this.completion;
      },
      function send(value){
        this.stack[this.sp++] = value;
        return this.run();
      },
      function pop(){
        if (this === context) {
          context = this.caller;
          return this;
        }
      },
      function hasArgument(name){
        if (this.callee) {
          var params = this.callee.FormalParameters;
          if (params) {
            var index = params.getIndex(name);
            return index !== -1 && index < this.args.length;
          }
        }
        return false;
      },
      function argumentCount(){
        return this.args.length;
      },
      function resolveReceiver(ref){
        if (ref && ref.Reference) {
          return $$IsPropertyReference(ref) ? $$GetThisValue(ref) : ref.base.WithBaseObject();
        }
      },
      function callerName(){
        var caller = this.caller && this.caller.callee;

        if (caller) {
          if (caller.BuiltinName) {
            return caller.BuiltinName;
          } else if (caller.get) {
            return caller.get('name');
          }
        }

        return '';
      },
      function createBinding(name, immutable){
        if (immutable) {
          return this.LexicalEnvironment.CreateImmutableBinding(name);
        }
        return this.LexicalEnvironment.CreateMutableBinding(name, false);
      },
      function initializeBinding(name, value, strict){
        return this.LexicalEnvironment.InitializeBinding(name, value, strict);
      },
      function hasBinding(name){
        return this.LexicalEnvironment.HasBinding(name);
      },
      function popScope(){
        var scope = this.LexicalEnvironment;
        this.LexicalEnvironment = this.LexicalEnvironment.outer;
        return scope;
      },
      function pushScope(){
        this.LexicalEnvironment = new DeclarativeEnv(this.LexicalEnvironment);
      },
      function cloneScope(){
        var scope = this.LexicalEnvironment,
            clone = new DeclarativeEnv(scope.outer);
        for (var k in scope.bindings) {
          clone.bindings[k] = scope.bindings[k];
        }
        for (var k in scope.deletables) {
          clone.deletables[k] = scope.deletables[k];
        }
        for (var k in scope.consts) {
          clone.consts[k] = scope.consts[k];
        }
        this.LexicalEnvironment = clone;
        return scope;
      },
      function replaceScope(scope){
        var oldScope = this.LexicalEnvironment;
        this.LexicalEnvironment = scope;
        return oldScope;
      },
      function pushWith(obj){
        this.LexicalEnvironment = new DeclarativeEnv(this.LexicalEnvironment);
        this.LexicalEnvironment.withBase = obj;
        return obj;
      },
      function createClass(def, superclass){
        this.LexicalEnvironment = new DeclarativeEnv(this.LexicalEnvironment);
        var ctor = $$ClassDefinitionEvaluation(def.name, superclass, def.ctor, def.methods, def.symbols);
        this.LexicalEnvironment = this.LexicalEnvironment.outer;
        return ctor;
      },
      function createFunction(isExpression, name, code){
        var $F = code.flags.generator ? $GeneratorFunction : $Function,
            env = this.LexicalEnvironment;

        if (isExpression && name) {
          env = new DeclarativeEnv(env);
          env.CreateImmutableBinding(name);
        }

        var func = new $F(code.lexicalType, name, code.params, code, env, code.flags.strict);

        if (code.lexicalType !== 'arrow') {
          $$MakeConstructor(func);
          isExpression && name && env.InitializeBinding(name, func);
        }

        return func;
      },
      function createArguments(args, env, params, func){
        if (env === undefined) {
          return new $StrictArguments(args);
        } else {
          return new $MappedArguments(args, env, params, func);
        }
      },
      function hasOwnGlobal(name){
        return this.Realm.global.HasOwnProperty(name);
      },
      function getOwnGlobal(name){
        return this.Realm.global.GetOwnProperty(name);
      },
      function putOwnGlobal(name, value, configurable){
        globalDesc.Configurable = !!configurable;
        globalDesc.Value = value;
        var result = this.Realm.global.DefineOwnProperty(name, globalDesc, true);
        globalDesc.Value = undefined;
        return result;
      },
      function createArray(len){
        return new $Array(len);
      },
      function createObject(proto){
        return new $Object(proto);
      },
      function createRegExp(regex){
        return new $RegExp(regex);
      },
      function getPropertyReference(name, obj){
        return $$Element(this, name, obj);
      },
      function getReference(name){
        var origin = this.LexicalEnvironment || this.VariableEnvironment,
            cache = origin.cache;

        if (cache) {
          if (name in cache) {
            return cache[name];
          }
        } else {
          cache = origin.cache = new Hash;
        }


        var lex = origin,
            strict = this.callee ? this.callee.Strict : this.Code.flags.strict;

        do {
          if (lex.HasBinding(name)) {
            return cache[name] = new Reference(lex, name, strict);
          }
        } while (lex = lex.outer)

        cache = strict ? strictUnfound : unfound;
        if (name in cache) {
          return cache[name];
        }
        return cache[name] = new Reference(undefined, name, strict);
      },
      function getSuperReference(name){
        return $$SuperReference(this, name);
      },
      function getThisEnvironment(){
        return $$GetThisEnvironment(this);
      },
      function getThis(){
        return $$ThisResolution(this);
      },
      function destructureSpread(target, index){
        return $$SpreadDestructuring(this, target, index);
      },
      function getTemplateCallSite(template){
        return $$GetTemplateCallSite(this, template);
      },
      function getSymbol(name){
        return $$GetSymbol(this, name) || $$ThrowException('undefined_symbol', name);
      },
      function createSymbol(name, isPublic){
        return new $Symbol(name, isPublic);
      },
      function initializeSymbolBinding(name, symbol){
        return this.LexicalEnvironment.InitializeSymbolBinding(name, symbol);
      }
    ]);

    return ExecutionContext;
  })();




  function notify(changeRecord){
    if (!('ChangeObservers' in this)) {
      return $$ThrowException('called_on_incompatible_object', ['Notifier.prototype.notify']);
    }

    changeRecord = $$ToObject(changeRecord);
    var type = changeRecord.Get('type');
    if (typeof type !== 'string') {
      return  $$ThrowException('changerecord_type', [typeof type]);
    }

    var changeObservers = this.ChangeObservers;
    if (changeObservers.size) {
      var target = this.Target,
          newRecord = new $Object,
          keys = changeRecord.Enumerate(true, true);

      newRecord.define('object', target, 1);
      for (var i=0; i < keys.length; i++) {
        newRecord.define(keys[i], changeRecord.Get(keys[i]), 1);
      }

      newRecord.PreventExtensions();
      $$EnqueueChangeRecord(newRecord, changeObservers);
    }
  }


  var internalModules = exports.internalModules = (function(modules){
    return define({}, [
      function set(name, bindings){
        modules[name] = new $NativeModule(bindings);
        modules[name].mrl = name;
      },
      function has(name){
        return name in modules;
      },
      function get(name){
        return modules[name];
      },
      function remove(name){
        if (this.has(name)) {
          delete modules[name];
          return true;
        }
        return false;
      }
    ]);
  })(new Hash);


  var Intrinsics = (function(){
    var $errors = ['EvalError', 'RangeError', 'ReferenceError',
                   'SyntaxError', 'TypeError', 'URIError'];

    var $builtins = {
      Array   : $Array,
      Function: $Function,
      RegExp  : $RegExp,
      Symbol  : $Symbol
    };

    exports.builtins = {
      $Array            : $Array,
      $BoundFunction    : $BoundFunction,
      $Error            : $Error,
      $Function         : $Function,
      $Generator        : $Generator,
      $GeneratorFunction: $GeneratorFunction,
      $InternalFunction : $InternalFunction,
      $Module           : $Module,
      $NativeFunction   : $NativeFunction,
      $Object           : $Object,
      $Proxy            : $Proxy,
      $RegExp           : $RegExp,
      $Symbol           : $Symbol,
      $TypedArray       : $TypedArray,
      MapData           : MapData,
      WeakMapData       : WeakMapData,
      DeclarativeEnv    : DeclarativeEnv,
      ObjectEnv         : ObjectEnv,
      FunctionEnv       : FunctionEnv,
      GlobalEnv         : GlobalEnv,
      ExecutionContext  : ExecutionContext
    };

    function FunctionPrototypeCall(){}

    function $$CreateThrowTypeError(realm){
      var thrower = create($NativeFunction.prototype);
      $Object.call(thrower, realm.intrinsics['%FunctionPrototype%']);
      thrower.call = function(){
        return $$ThrowException('strict_poison_pill');
      };
      thrower.define('length', 0, ___);
      thrower.define('name', 'ThrowTypeError', ___);
      thrower.Realm = realm;
      thrower.Extensible = false;
      thrower.Strict = true;
      thrower.isStrictThrower = true;
      hide(thrower, 'Realm');
      return new Accessor(thrower);
    }

    var primitives = {
      RegExp: RegExp.prototype
    };

    function Intrinsics(realm){
      this.Realm = realm;
      realm.intrinsics = this.bindings = new Hash;
      engine.changeRealm(realm);
      intrinsics.Genesis = new $Object(null);
      intrinsics.Genesis.HiddenPrototype = true;
      intrinsics['%ObjectPrototype%'] = new $Object(intrinsics.Genesis);
      intrinsics.global = global = engine.activeGlobal = realm.global = new $Object(intrinsics['%ObjectPrototype%']);
      intrinsics.global.BuiltinBrand = 'GlobalObject';
      realm.globalEnv = new GlobalEnv(intrinsics.global);
      realm.globalEnv.Realm = realm;

      for (var k in $builtins) {
        var prototype = intrinsics['%'+k+'Prototype%'] = create($builtins[k].prototype);
        $Object.call(prototype, intrinsics['%ObjectPrototype%']);
        if (k in primitives) {
          prototype.PrimitiveValue = primitives[k];
        }
      }

      intrinsics.StopIteration = new $Object(intrinsics['%ObjectPrototype%']);
      intrinsics.StopIteration.BuiltinBrand = 'StopIteration';

      intrinsics['%FunctionPrototype%'].FormalParameters = [];
      intrinsics['%FunctionPrototype%'].Call = FunctionPrototypeCall;
      intrinsics['%FunctionPrototype%'].BuiltinBrand = 'BuiltinFunction';
      intrinsics['%FunctionPrototype%'].Scope = realm.globalEnv;
      intrinsics['%FunctionPrototype%'].Realm = realm;
      intrinsics.ThrowTypeError = $$CreateThrowTypeError(realm);

      intrinsics['%ArrayPrototype%'].array = [];
      intrinsics['%ArrayPrototype%'].length = ['length', 0, __W];

      intrinsics.ObserverCallbacks = new MapData;
      intrinsics['%NotifierPrototype%'] = new $Object(intrinsics['%ObjectPrototype%']);
      intrinsics['%NotifierPrototype%'].define('notify', new $NativeFunction(notify), _CW);
    }

    inherit(Intrinsics, DeclarativeEnv, {
      type: 'Intrinsics'
    }, [
      function binding(options){
        if (typeof options === 'function') {
          options = {
            call: options,
            name: options.name,
            length: options.length
          }
        }

        if (!options.name) {
          if (!options.call.name) {
            options.name = arguments[1];
          } else {
            options.name = options.call.name;
          }
        }

        if (typeof options.length !== 'number') {
          options.length = options.call.length;
        }

        if (realm !== this.Realm) {
          var activeRealm = realm;
          engine.changeRealm(this.Realm);
        }

        this.bindings[options.name] = new $NativeFunction(options);

        if (activeRealm) {
          engine.changeRealm(activeRealm);
        }
      }
    ]);

    return Intrinsics;
  })();


  var Script = (function(){
    function ParseOptions(o){
      for (var k in o) {
        if (k in this) {
          this[k] = o[k];
        }
      }
    }

    ParseOptions.prototype = {
      loc     : true,
      range   : true,
      raw     : false,
      comment : false,
      tokens  : false,
      tolerant: false
    };

    function parse(src, filename, kind, options){
      if (!options) {
        if (isObject(kind)) {
          options = kind;
          kind = '';
        } else if (isObject(filename)) {
          options = filename;
          filename = kind = '';
        } else {
          options = {};
        }
      }
      try {
        return esprima.parse(src, options ? new ParseOptions(options) : ParseOptions.prototype);
      } catch (e) {
        if (!realm || !intrinsics) return e;
        var err = new $Error('SyntaxError', undefined, e.message),
            loc = { line: e.lineNumber, column: e.column };

        err.setCode({ start: loc, end: loc }, src);
        err.setOrigin(filename, kind);
        return new AbruptCompletion('throw', err);
      }
    }

    exports.parse = parse;

    internalModules.set('@@parser', {
      $$Parse: function(_, args){
        var src      = args[0],
            loc      = args[1],
            range    = args[2],
            raw      = args[3],
            tokens   = args[4],
            comment  = args[5],
            tolerant = args[6],
            source   = args[7];

        var ast = parse(src, source, 'script', {
          loc     : !!loc,
          range   : !!range,
          raw     : !!raw,
          tokens  : !!tokens,
          comment : !!comment,
          tolerant: !!tolerant
        });

        if (ast.Abrupt) {
          return ast;
        }

        return fromInternal(ast);
      }
    });

    var load = (function(){
      if (typeof process !== 'undefined') {
        var fs = require('fs');
        return function load(source){
          if (!~source.indexOf('\n') && fs.existsSync(source)) {
            return { scope: 'global', source: fs.readFileSync(source, 'utf8'), filename: source };
          } else {
            return { scope: 'global', source: source, filename: '' };
          }
        };
      }
      return function load(source){
        return { scope: 'global', source: source, filename: '' };
      };
    })();

    function Script(options){
      if (options instanceof Script) {
        return options;
      }

      this.type = 'script';

      if (typeof options === 'function') {
        this.type = 'recompiled function';
        if (!fname(options)) {
          options = {
            scope: 'function',
            filename: '',
            source: '('+options+')()'
          }
        } else {
          options = {
            scope: 'function',
            filename: fname(options),
            source: options+''
          };
        }
      } else if (typeof options === 'string') {
        options = load(options);
      } else if (options == null) {

      } else if (typeof options === 'object') {

      }

      if (options.natives) {
        this.natives = true;
        this.type = 'native';
      }
      if (options.eval || options.scope === 'eval') {
        this.eval = true;
        this.type = 'eval';
      }
      this.scope = options.scope;

      if (!isObject(options.ast) && typeof options.source === 'string') {
        this.source = options.source;
        this.ast = parse(options.source, options.filename, this.type);
        if (this.ast.Abrupt) {
          this.error = this.ast;
          this.ast = null;
        }
      }

      this.filename = options.filename || '';
      if (this.ast) {
        this.bytecode = assemble(this);
        tag(this.bytecode);
      }
      return this;
    }

    define(Script, [parse]);

    return Script;
  })();


  var timers = create(null);

  var Realm = (function(){
    function wrapFunction(f){
      if (f._wrapper) {
        return f._wrapper;
      }

      f._wrapper = function(){
        return f.Call(this, arguments);
      };

      f._wrapper._wraps = f;

      return f._wrapper;
    }

    function deliverChangeRecordsAndReportErrors(){
      var observerResults = $$DeliverAllChangeRecords();
      if (observerResults && observerResults instanceof Array) {
        each(observerResults, function(error){
          realm.emit('throw', error);
        });
      }
    }

    internalModules.set('@@globals', {
      $$ParseInt: parseInt,
      $$ParseFloat: parseFloat,
      $$DecodeURI: decodeURI,
      $$DecodeURIComponent: decodeURIComponent,
      $$EncodeURI: encodeURI,
      $$EncodeURIComponent: encodeURIComponent,
      $$Escape: escape,
      $$Unescape: unescape
    });

    internalModules.set('@@collections', {
      $$MapClear: function(_, args){
        return args[0].MapData.clear();
      },
      $$MapDelete: function(_, args){
        return args[0].MapData.remove(args[1]);
      },
      $$MapGet: function(_, args){
        return args[0].MapData.get(args[1]);
      },
      $$MapHas: function(_, args){
        return args[0].MapData.has(args[1]);
      },
      $$MapInitialization: CollectionInitializer(MapData, 'Map'),
      $$MapNext: function(_, args){
        var result = args[0].MapData.after(args[1]);
        return result instanceof Array ? new $Array(result) : result;
      },
      $$MapSet: function(_, args){
        return args[0].MapData.set(args[1], args[2]);
      },
      $$MapSigil: function(){
        return collections.MapData.sigil;
      },
      $$MapSize: function(_, args){
        var data = args[0].MapData;
        return data ? data.size : 0;
      },
      $$WeakMapGet: function(_, args){
        return args[0].WeakMapData.get(args[1]);
      },
      $$WeakMapDelete: function(_, args){
        return args[0].WeakMapData.remove(args[1]);
      },
      $$WeakMapHas: function(_, args){
        return args[0].WeakMapData.has(args[1]);
      },
      $$WeakMapSet: function(_, args){
        return args[0].WeakMapData.set(args[1], args[2]);
      },
      $$WeakMapInitialization: CollectionInitializer(WeakMapData, 'WeakMap')
    });


    internalModules.set('@@typed-arrays', {
      $$DataViewGet: function(obj, args){
        var offset = args[1] >>> 0;

        if (offset >= obj.ByteLength) {
          return $$ThrowException('buffer_out_of_bounds')
        }

        return obj.View['get'+args[0]](offset, !!args[2]);
      },
      $$DataViewSet: function(obj, args){
        var offset = args[1] >>> 0;

        if (offset >= obj.ByteLength) {
          return $$ThrowException('buffer_out_of_bounds')
        }

        return obj.View['set'+args[0]](offset, args[2], !!args[3]);
      },
      $$NativeBufferCreate: function(_, args){
        return new ArrayBuffer(args[0]);
      },
      $$NativeBufferSlice: function(_, args){
        var buffer = args[0],
            begin  = args[1],
            end    = args[2];

        return buffer.slice(begin, end);
      },
      $$NativeDataViewCreate: function(_, args){
        var buffer = args[0];

        return new DataView(buffer.NativeBuffer);
      },
      $$TypedArrayCreate: function(_, args){
        return new $TypedArray(args[0], args[1], args[2], args[3]);
      }
    });

    void function(){
      var objectTypes = {
        Array   : $Array,
        Boolean : createBoolean,
        Error   : $Error,
        Function: $Function,
        Module  : $Module,
        Number  : createNumber,
        Object  : $Object,
        Proxy   : $Proxy,
        RegExp  : $RegExp,
        Symbol  : $Symbol,
        String  : createString
      };

      var timerId = Math.random() * 1000000 << 10;

      var now = Date.now || function(){ return +new Date };

      function evaluate(src, env, realm){
        var script = new Script({
          scope: 'global',
          natives: false,
          source: src
        });

        if (script.error) {
          return script.error;
        }

        var ctx = new ExecutionContext(context, env, realm, script.bytecode);
        ExecutionContext.push(ctx);
        var result = ctx.run();
        ctx === context && ExecutionContext.pop();

        return result;
      }

      internalModules.set('@@internals', {
        $$AddObserver: function(_, args){
          var data     = args[0],
              callback = args[1];

          data.set(callback, callback);
        },
        $$ArgumentCount: function(){
          return context.argumentCount();
        },
        $$Assert: function(_, args){
          if (args[0] === true) {
            return true;
          }

          return $$ThrowException('assertion_failed', ['$$Assert']);
        },
        $$AssertIsInternalArray: function(_, args){
          if (args[0] instanceof Array) {
            return true;
          }

          return $$ThrowException('assertion_failed', ['$$AssertIsInternalArray']);
        },
        $$AssertIsECMAScriptValue: function(_, args){
          if (typeof args[0] !== 'object' || args[0] === null && args[0].DefineOwnProperty) {
            return true;
          }

          return $$ThrowException('assertion_failed', ['$$AssertIsECMAScriptValue:']);
        },
        $$AssertWontThrow: function(_, args){
          if (!args[0] || !args[0].Abrupt) {
            return true;
          }

          return $$ThrowException('assertion_failed', ['$$AssertWontThrow']);
        },
        $$BoundFunctionCreate: function(_, args){
          var func     = args[0],
              thisArg  = args[1],
              argArray = args[2];

          return new $BoundFunction(func, thisArg, argArray);
        },
        $$Call: function(_, args){
          var func = args[0].Call ? args[0].call : args[0];

          switch (args.length) {
            case 1: return func();
            case 2: return func.call(args[1]);
            case 3: return func.call(args[1], args[2]);
            case 4: return func.call(args[1], args[2], args[3]);
            case 5: return func.call(args[1], args[2], args[3], args[4]);
            case 6: return func.call(args[1], args[2], args[3], args[4], args[5]);
            default: return func.apply(args[1], args.slice(2));
          }
        },
        $$CallerArgumentCount: function(){
          if (context.caller) {
            return context.argumentCount();
          }

          return null;
        },
        $$CallerHasArgument: function(_, args){
          if (context.caller) {
            return context.caller.hasArgument(args[0]);
          }

          return false;
        },
        $$CallerName: function(){
          return context.callerName();
        },
        $$CallerIsConstruct: function(){
          if (context.caller) {
            return context.caller.isConstruct;
          }

          return false;
        },
        $$ClearImmediate: function(_, args){
          var id = args[0];

          var func = timers[id];

          if (func) {
            func.Realm.queue[func.queueIndex] = null;
            timers[id] = null;
            func.queueIndex = undefined;
            func.timerId = undefined;
          }
        },
        $$ClearTimer: function(_, args){
          var id = args[0];

          if (timers[id]) {
            timers[id] = null;
          }
        },
        $$CreateArray: function(_, args){
          var targetRealm = args[0],
              array       = args[1];

          var $array = new $Array(array);

          if (targetRealm !== realm) {
            $array.Realm = targetRealm;
            $array.Prototype = targetRealm.intrinsics['%ArrayPrototype%'];
          }

          return $array;
        },
        $$CreateEval: function(_, args){
          function builtinEval(_, args, direct){
            var code = args[0];

            if (typeof code !== 'string') {
              return code;
            }

            var script = new Script({
              scope: 'eval',
              natives: false,
              strict: context.callee ? context.callee.Strict : context.strict,
              source: code
            });

            if (script.error) {
              return script.error;
            }

            var ctx = new ExecutionContext(context, direct ? context.LexicalEnvironment : realm.globalEnv, realm, script.bytecode);
            ExecutionContext.push(ctx);
            var result = ctx.run();
            ctx === context && ExecutionContext.pop();

            return result;
          }

          builtinEval.isBuiltinEval = true;

          return new $InternalFunction({
            name: 'eval',
            length: 1,
            call: builtinEval
          });
        },
        $$CreateInternalObject: function(_, args){
          var prototype = args[0];

          return create(prototype || null);
        },
        $$CreateNil: function(_, args){
          return new $Nil;
        },
        $$CreateObject: function(_, args){
          return new objectTypes[args[0]](args[1], args[2]);
        },
        $$CreateUndetectable: function(_, args){
          var value = args[0];

          return new Undetectable(value);
        },
        $$CurrentRealm: function(){
          return realm;
        },
        $$DeliverChangeRecords: function(_, args){
          var callback = args[0];

          return operations.$$DeliverChangeRecords(callback);
        },
        $$Enumerate: function(_, args){
          return new $Array(properties(args[0]));
        },
        $$EnumerateAll: function(_, args){
          var obj   = args[0],
              seen  = new Hash,
              props = [];

          while (obj instanceof $Object) {
            each(properties(obj), function(prop){
              if (!(prop in seen)) {
                seen[prop] = props.push(prop);
              }
            });
            obj = getPrototypeOf(obj);
          }

          return new $Array(props);
        },
        $$EvaluateInScope: function(_, args){
          var code = args[0],
              obj  = args[1];

          var targetRealm = obj.Realm || realm;

          return evaluate(code, new ObjectEnv(obj, targetRealm.global), targetRealm);
        },
        $$EvaluateInGlobal: function(_, args){
          var code   = args[0],
              global = args[1];

          return evaluate(code, global.env, global.Realm);
        },
        $$EvaluateModule: function(_, args){
          var loader = args[0],
              source = args[1],
              mrl    = args[2];

          var result, thrown;

          realm.evaluateModule(loader, source, mrl,
            function(module){ result = module },
            function(error){ result = error; thrown = true; }
          );

          return thrown ? new AbruptCompletion('throw', result) : result;
        },
        $$EvaluateModuleAsync: function(_, args){
          var loader   = args[0],
              source   = args[1],
              mrl      = args[2],
              callback = args[3],
              errback  = args[4];

          realm.evaluateModule(loader, source, mrl, wrapFunction(callback), wrapFunction(errback));
        },
        $$Exception: function(_, args){
          var type    = args[0],
              details = args[1];

          return $$MakeException(type, details ? details.array : []);
        },
        $$Fetch: function(_, args){
          var mrl      = args[0],
              callback = args[1];

          var result = require('./builtins')[mrl];

          if (!result) {
            result = new $Error('Error', undefined, 'Unable to locate module "'+mrl+'"');
          }

          callback.Call(undefined, [result]);
        },
        $$Get: function(_, args){
          var obj = args[0],
              key = args[1],
              val = obj[key];

          if (typeof val === 'function') {
            return val._wraps || (val._wraps = new $NativeFunction({
              length: val.length,
              name  : key,
              call  : val
            }));
          }

          return val;
        },
        $$GetIntrinsic: function(_, args){
          return realm.intrinsics[args[0]];
        },
        $$GetNotifier: function(_, args){
          var obj = args[0];

          var notifier = obj.Notifier;

          if (!notifier) {
            notifier = obj.Notifier = new $Object(intrinsics['%NotifierPrototype%']);
            notifier.Target = obj;
            notifier.ChangeObservers = new MapData;
          }

          return notifier;
        },
        $$HasArgument: function(_, args){
          return context.hasArgument(args[0]);
        },
        $$Has: function(_, args){
          return args[1] in args[0];
        },
        $$Invoke: function(_, args){
          var obj = args[0],
              key = args[1];

          if (obj[key]) {
            switch (args.length) {
              case 2: return obj[key]();
              case 3: return obj[key](args[2]);
              case 4: return obj[key](args[2], args[3]);
              case 5: return obj[key](args[2], args[3], args[4]);
              case 6: return obj[key](args[2], args[3], args[4], args[5]);
              default: return obj[key].apply(obj, args.slice(2));
            }
          }

          return $$ThrowException('unknown_internal_function', [key]);
        },
        $$IsConstruct: function(){
          return context.isConstruct;
        },
        $$IsUndetectable: function(_, args){
          var value = args[0];

          return isUndetectable(value);
        },
        $$Now: now,
        $$NumberToString: function(_, args){
          return args[0].toString(args[1] || 10);
        },
        $$ParseDate: Date.parse
          ? function(_, args){ return Date.parse(args[0]) }
          : function(_, args){ return NaN },
        $$ReadFile: function(_, args){
          var path     = args[0],
              callback = args[1];

          require('fs').readFile(path, 'utf8', function(err, file){
            callback.Call(undefined, [file]);
          });
        },
        $$RegExpExec: function(_, args){
          var result = args[0].PrimitiveValue.exec(args[1]);
          if (result) {
            var array = new $Array(result);
            array.set('index', result.index);
            array.set('input', args[1]);
            return array;
          }
          return null;
        },
        $$RemoveObserver: function(_, args){
          var data     = args[0],
              callback = args[1];

          data.remove(callback);
        },
        $$Resolve: (function(){
          if (require('path')) {
            var resolve = require('path').resolve;

            return function(_, args){
              var baseURL = args[0],
                  relURL  = args[1];

              return resolve(baseURL, relURL);
            };
          }

          return function(_, args){
            var baseURL = args[0],
                relURL  = args[1];

            var base = baseURL.split('/'),
                to   = relURL.split('/');

            base.length--;

            for (var i=0; i < to.length; i++) {
              if (to[i] === '..') {
                base.length--;
              } else if (to[i] !== '.') {
                base[base.length] = to[i];
              }
            }

            return base.join('/');
          };
        })(),
        $$Set: function(_, args){
          var obj = args[0],
              key = args[1],
              val = args[2];

          if (val && val.Call) {
            val = wrapFunction(val);
          }

          return args[0][args[1]] = val;
        },
        $$SetTimer: function(_, args){
          var func   = args[0],
              time   = args[1],
              repeat = args[2];

          var id    = timerId++,
              start = now();

          timers[id] = setTimeout(function trigger(){
            if (timers[id]) {
              func.Call(realm.global, []);

              var curr   = now(),
                  excess = curr - start - time;

              start = curr;
              timers[id] = repeat ? setTimeout(trigger, time - excess) : null;

              deliverChangeRecordsAndReportErrors();
            }

            if (!repeat || !timers[id]) {
              func = null;
            }
          }, time);

          return id;
        },
        $$SetImmediate: function(_, args){
          var func = args[0];

          if (func.timerId == null) {
            var queue = func.Realm.queue;
            func.queueIndex = queue.length;
            func.timerId = timerId++;
            queue[queue.length] = func;
            timers[func.timerId] = func;
          }

          return func.timerId;
        },
        $$SetIntrinsic: function(_, args){
          realm.intrinsics[args[0]] = args[1];
        },
        $$Signal: function(_, args){
          realm.emit.apply(realm, args);
        },
        $$StringToNumber: function(_, args){
          return +args[0];
        },
        $$ToModule: function(_, args){
          var obj = args[0];

          return new $Module(obj, obj.Enumerate(false, false));
        },
        $$WrapDescriptor: function(_, args){
          var descriptor = args[0];

          if (descriptor) {
            return new $Descriptor(descriptor);
          }
        }
      });
    }();

    internalModules.set('@@math', {
      $$Acos: function(_, args){
        return Math.acos(args[0]);
      },
      $$Asin: function(_, args){
        return Math.asin(args[0]);
      },
      $$Atan: function(_, args){
        return Math.atan(args[0]);
      },
      $$Atan2: function(_, args){
        return Math.atan2(args[0]);
      },
      $$Cos: function(_, args){
        return Math.acos(args[0]);
      },
      $$Exp: function(_, args){
        return Math.exp(args[0]);
      },
      $$Log: function(_, args){
        return Math.log(args[0]);
      },
      $$Pow: function(_, args){
        return Math.pow(args[0], args[1]);
      },
      $$Random: function(){
        return Math.random();
      },
      $$Sin: function(_, args){
        return Math.sin(args[0]);
      },
      $$Sqrt: function(_, args){
        return Math.sqrt(args[0]);
      },
      $$Tan: function(_, args){
        return Math.ta(args[0]);
      }
    });

    internalModules.set('@@regexp', {
      $$RegExpCreate: function(obj, args){
        var pattern = args[0],
            flags   = args[1];

        if (typeof pattern === 'object') {
          pattern = pattern.PrimitiveValue;
        }

        try {
          var result = new RegExp(pattern, flags);
        } catch (e) {
          return $$ThrowException('invalid_regexp', [pattern+'']);
        }

        return new $RegExp(result);
      },
      $$RegExpExec: function(_, args){
        var regexp = args[0],
            string = args[1];

        var result = regexp.PrimitiveValue.exec(string);

        if (result) {
          var array = new $Array(result);
          array.set('index', result.index);
          array.set('input', string);
          return array;
        }

        return result;
      },
      $$RegExpTest: function(_, args){
        var regexp = args[0],
            string = args[1];

        return regexp.PrimitiveValue.test(string);
      },
      $$RegExpToString: function(_, args){
        var regexp = args[0];

        return regexp.PrimitiveValue.toString();
      }
    });


    internalModules.set('@@string', {
      $$StringFromCharCode: function(_, args){
        var charcode = args[0];

        return String.fromCharCode(charcode);
      },
      $$StringReplace: function(_, args){
        var string  = args[0],
            search  = args[1],
            replace = args[2];

        if (search && search.StringValue) {
          search = search.StringValue;
        }

        return string.replace(search, replace);
      },
      $$StringSplit: function(_, args){
        var string = args[0],
            sep    = args[1],
            limit  = args[2];

        if (sep && sep.StringValue) {
          sep = sep.StringValue;
        }

        return new $Array(string.split(sep, limit));
      },
      $$StringSearch: function(_, args){
        var string = args[0],
            regexp = args[1];

        return string.search(regexp);
      },
      $$StringSlice: function(_, args){
        var string = args[0],
            start  = args[1],
            end    = args[2];

        return end === undefined ? string.slice(start) : string.slice(start, end);
      },
      $$StringToCharCode: function(_, args){
        var string = args[0];

        return string.charCodeAt(0);
      }
    });

    internalModules.set('@@json', {
      $$JSONParse: (function(){
        var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

        return function(_, args){
          var source  = args[0],
              reviver = args[1];

          function walk(holder, key){
            var value = holder.get(key);

            if (value && typeof value === 'object') {
              value.each(function(prop){
                if (prop[2] & 1) {
                  v = walk(prop[1], prop[0]);
                  if (v !== undefined) {
                    prop[1] = v;
                  } else {
                    value.remove(prop[0]);
                  }
                }
              });
            }

            return reviver.Call(holder, [key, value]);
          }

          cx.lastIndex = 0;

          if (cx.test(source)) {
            source = source.replace(cx, function(a){
              return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            });
          }

          var test = source.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                           .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                           .replace(/(?:^|:|,)(?:\s*\[)+/g, '');

          if (/^[\],:{}\s]*$/.test(test)) {
            var json    = realm.evaluate('('+source+')'),
                wrapper = new $Object;

            wrapper.set('', json);
            return $$IsCallable(reviver) ? walk(wrapper, '') : json;
          }

          return $$ThrowException('invalid_json', source);
        };
      })(),
      $$JSONQuote: (function(){
        var escapable = new RegExp('[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4'+
                                   '\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]', 'g'),
            meta = { '\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"' : '\\"', '\\': '\\\\' };

        function escaper(a) {
          var c = meta[a];
          return typeof c === 'string' ? c : '\\u'+('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }

        return function(_, args){
          var string = args[0]

          escapable.lastIndex = 0;

          return '"'+string.replace(escapable, escaper)+'"';
        };
      })()
    });

    void function(){
      var month = 2592000000;

      function nearest(current, compare){
        current = new Date(current);

        for (var step = month; step > 0; step = Math.floor(step / 3)) {
          if (compare !== current.getTimezoneOffset()) {
            while (compare !== current.getTimezoneOffset()) {
              current = new Date(current.getTime() + step);
            }
            current = new Date(current.getTime() - step);
          }
        }

        while (compare !== current.getTimezoneOffset()) {
          current = new Date(current.getTime() + 1);
        }

        return current;
      }

      var jun = new Date(2000, 5, 20, 0, 0, 0, 0).getTimezoneOffset(),
          dec = new Date(2000, 11, 20, 0, 0, 0, 0).getTimezoneOffset();

      if (jun > dec) {
        var DST_START = nearest(dec, jun),
            DST_END   = nearest(jun, dec);
      } else {
        var DST_START = nearest(jun, dec),
            DST_END   = nearest(dec, jun);
      }

      internalModules.set('@@date', {
        LOCAL_TZ        : new Date().getTimezoneOffset() / -60,
        DST_START_MONTH : DST_START.getMonth(),
        DST_START_SUNDAY: DST_START.getDate() > 15,
        DST_START_OFFSET: DST_START.getHours() * 3600000 + DST_START.getMinutes() * 60000,
        DST_END_MONTH   : DST_END.getMonth(),
        DST_END_SUNDAY  : DST_END.getDate() > 15,
        DST_END_OFFSET  : DST_END.getHours() * 3600000 + DST_END.getMinutes() * 60000
      });
    }();

    internalModules.set('@@constants', {
      MAX_INTEGER      : 9007199254740992,
      MAX_VALUE        : 1.7976931348623157e+308,
      MIN_VALUE        : 5e-324,
      NaN              : +'NaN',
      POSITIVE_INFINITY: 1 / 0,
      NEGATIVE_INFINITY: 1 / -0,
      undefined        : void 0
    });


    internalModules.set('@@symbols', symbols);
    internalModules.set('@@internal-symbols', internalSymbols);


    var mutationScopeInit = new Script('void 0;');

    function initialize(realm, Ω, ƒ){
      if (realm.initialized) return Ω();
      realm.state = 'initializing';
      realm.initialized = true;
      realm.mutationScope = new ExecutionContext(null, realm.globalEnv, realm, mutationScopeInit.bytecode);

      var builtins = require('./builtins');
      realm.builtins = create(null);

      var bootstrapLoader = {
        global: realm.global,
        baseURL: '',
        load: {
          Call: function(_, args){
            var mrl      = args[0],
                callback = args[1],
                errback  = args[2];

            if (mrl in realm.builtins) {
              callback.Call(undefined, [realm.builtins[mrl]]);
            } else if (mrl in builtins) {
              resolveModule(bootstrapLoader, builtins[mrl], mrl, function(module){
                realm.builtins[mrl] = module;
                module.loader = bootstrapLoader;
                module.resolved = mrl;
                module.mrl = mrl;
                callback.Call(undefined, [module]);
              }, wrapFunction(errback));
            } else {
              callback.Call(undefined, [new $Error('Error', undefined, 'Unable to locate module "'+mrl+'"')]);
            }
          }
        },
        Get: function(key){
          return bootstrapLoader[key];
        }
      };

      resolveModule(bootstrapLoader, builtins['@system'], '@system', Ω, ƒ);
    }

    function prepareToRun(bytecode, scope){
      if (!scope) {
        var realm = createSandbox(realm.global);
        scope = realm.globalEnv;
      } else {
        var realm = scope.Realm;
      }
      ExecutionContext.push(new ExecutionContext(null, scope, realm, bytecode));
      var status = $$TopLevelDeclarationInstantiation(bytecode);
      if (status && status.Abrupt) {
        realm.emit(status.type, status);
        return status;
      }
    }

    function run(realm, bytecode){
      realm.executing = bytecode;
      realm.state = 'executing';
      realm.emit('executing', bytecode);

      var result = context.run();

      if (result === Pause) {
        var resume = function(){
          resume = function(){};
          delete realm.resume;
          realm.emit('resume');
          return run(realm, bytecode);
        };

        context.sp--;
        realm.resume = function(){ return resume() };
        realm.state = 'paused';
        realm.emit('pause', realm.resume);
      } else {
        deliverChangeRecordsAndReportErrors();
        realm.executing = null;
        realm.state = 'idle';
        return result;
      }
    }

    function mutationContext(realm, toggle){
      if (toggle === undefined) {
        toggle = !realm.mutating;
      } else {
        toggle = !!toggle;
      }

      if (toggle !== realm.mutating) {
        realm.mutating = toggle;
        if (toggle) {
          ExecutionContext.push(realm.mutationScope);
        } else {
          deliverChangeRecordsAndReportErrors();
          ExecutionContext.pop();
        }
      }
      return toggle;
    }

    function resolveImports(loader, code, Ω, ƒ){
      var modules = new Hash;
      if (code.imports && code.imports.length) {
        var load = loader.Get('load'),
            count = code.imports.length,
            errors = [];

        var callback = {
          Call: function(receiver, args){
            var result = args[0];

            if (result instanceof $Module) {
              modules[result.mrl] = result;
            } else {}

            if (!--count) {
              if (errors.length) {
                ƒ(errors);
              } else {
                Ω(modules);
              }
            }
          }
        };

        var errback = {
          Call: function(receiver, args){
            errors.push(args[0]);
            if (!--count) {
              ƒ(errors);
            }
          }
        };

        each(code.imports, function(imported){
          if (imported.code) {
            var sandbox = createSandbox(global, loader);

            runScript(sandbox, { bytecode: imported.code }, function(){
              var module = new $Module(sandbox.globalEnv, imported.code.exportedNames);
              module.mrl = imported.code.name;
              callback.Call(null, [module]);
            }, function(err){
              errback.Call(null, [err]);
            });
          } else if (imported.origin instanceof Array) {
            var env = realm.globalEnv,
                mod;

            each(imported.orgin, function(path){
              mod = env.GetBindingValue(path);
              if (!(mod instanceof $Module)) {
                // TODO throw
              }

              env = mod.object.env || mod.object.Realm.globalEnv;
              if (!env) {
                // TODO throw
              }
            });


            callback.Call(null, [mod]);
          } else if (internalModules.has(imported.origin)) {
            callback.Call(null, [internalModules.get(imported.origin)]);
          } else {
            load.Call(loader, [imported.origin, callback, errback]);
          }
        });
      } else {
        Ω(modules);
      }
    }

    function createSandbox(object, loader){
      var outerRealm = object.Realm || object.Prototype.Realm,
          bindings   = new $Object,
          scope      = new GlobalEnv(bindings),
          realm      = scope.Realm = bindings.Realm = create(outerRealm);

      bindings.BuiltinBrand = 'GlobalObject';
      scope.outer = outerRealm.globalEnv;
      realm.global = bindings;
      realm.globalEnv = scope;
      if (loader) {
        realm.loader = loader;
      }
      return realm;
    }


    function runScript(realm, script, Ω, ƒ){
      var scope = realm.globalEnv,
          ctx   = new ExecutionContext(context, scope, realm, script.bytecode);

      ExecutionContext.push(ctx);
      var status = $$TopLevelDeclarationInstantiation(script.bytecode);
      context === ctx && ExecutionContext.pop();

      if (status && status.Abrupt) {
        return ƒ(status);
      }

      resolveImports(realm.loader, script.bytecode, function(modules){
        each(script.bytecode.imports, function(imported){
          var module = modules[imported.origin];

          if (imported.name) {
            scope.SetMutableBinding(imported.name, module);
          } else if (imported.specifiers) {
            each(imported.specifiers, function(path, name){
              if (name === '*') {
                return module.each(function(prop){
                  scope.SetModuleBinding(prop[0], module);
                });
              }

              var obj = module;
              for (var i=0; i < path.length - 1; i++) {
                obj = obj.Get(part);
              }

              if (name[0] !== '@') {
                return scope.SetModuleBinding(path[i], obj);
              }

              obj = obj.Get(path[i]);

              if (name[1] === '@' && !(obj instanceof $WellKnownSymbol)) {
                ƒ($$MakeException('unknown_wellknown_symbol', [name]));
              } else if (!(obj instanceof $Symbol)) {
                ƒ($$MakeException('import_not_symbol', [name]));
              } else {
                scope.InitializeSymbolBinding(name.slice(1), obj);
              }
            });
          }
        });

        ExecutionContext.push(ctx);
        var result = ctx.run();
        context === ctx && ExecutionContext.pop();

        if (result && result.Abrupt) {
          ƒ(result);
        } else {
          Ω(result);
        }
        runQueue(realm);
      }, function(errors){
        each(errors, ƒ);
        runQueue(realm);
      });
    }

    function resolveModule(loader, source, name, Ω, ƒ){
      var script = new Script({
        name: name,
        natives: true,
        source: source,
        scope: 'module'
      });


      if (script.error) {
        return ƒ(script.error);
      }

      realm.scripts.push(script);

      var sandbox = createSandbox(loader.Get('global'), loader);

      runScript(sandbox, script, function(){
        Ω(new $Module(sandbox.globalEnv, script.bytecode.exportedNames));
      }, ƒ);
    }

    function runQueue(realm){
      if (realm.queue.length) {
        for (var i=0; i < realm.queue.length; i++) {
          var func = realm.queue[i];
          if (func) {
            timers[func.timerId] = null;
            func.timerId = undefined;
            func.queueIndex = undefined;
            func.Call(realm.global, []);
          }
        }
        realm.queue.length = 0;
      }
    }


    function Realm(oncomplete){
      Emitter.call(this);

      this.active        = false;
      this.quiet         = false;
      this.initialized   = false;
      this.mutationScope = null;
      this.scripts       = [];
      this.queue         = [];
      this.templates     = {};
      this.state         = 'bootstrapping';

      new Intrinsics(this);

      hide(intrinsics['%FunctionPrototype%'], 'Scope');
      hide(this, 'intrinsics');
      hide(this, 'natives');
      hide(this, 'templates');
      hide(this, 'scripts');
      hide(this, 'globalEnv');
      hide(this, 'initialized');
      hide(this, 'quiet');
      hide(this, 'mutationScope');

      var self = this;
      engine.addRealm(this);

      function init(){
        initialize(self, function(){
          self.scripts = [];
          self.state = 'idle';
          self.emit('ready');
          if (typeof oncomplete === 'function') {
            oncomplete(self);
          }
        }, function(error){
          self.state = 'error';
          self.emit('throw', error);
          if (typeof oncomplete === 'function') {
            oncomplete(error);
          }
        });
      }

      this.state = 'initializing';
      if (oncomplete === true) {
        setTimeout(init, 10);
      } else {
        init();
      }
    }

    inherit(Realm, Emitter, [
      function enterMutationContext(){
        mutationContext(this, true);
      },
      function exitMutationContext(){
        mutationContext(this, false);
      },
      function evaluateModule(loader, source, name, callback, errback){
        if (typeof callback !== 'function') {
          if (typeof name === 'function') {
            callback = name;
            name = '';
          } else {
            callback = noop;
          }
        }

        if (typeof errback !== 'function') {
          errback = noop;
        }

        resolveModule(loader, source, name, callback, errback);
      },
      function evaluateAsync(subject, callback, errback){
        var script = new Script(subject),
            self = this;

        callback || (callback = noop);
        errback  || (errback = callback);

        if (script.error) {
          nextTick(function(){
            self.emit(script.error.type, script.error);
            errback(script.error);
          });
        } else {
          this.scripts.push(script);
          runScript(this, script, function(result){
            self.emit('complete', result);
            callback(result);
          }, function(error){
            self.emit('throw', error);
            errback(error);
          });
        }

        return this;
      },
      function evaluate(subject){
        engine.changeRealm(this);
        var script = new Script(subject);

        if (script.error) {
          this.emit('throw', script.error);
          return script.error;
        }

        this.scripts.push(script);

        var result = prepareToRun(script.bytecode, this.globalEnv) || run(this, script.bytecode);
        this.emit(result && result.Abrupt ? 'throw' : 'complete', result);

        runQueue(this);

        return result;
      },
      function useConsole(console){
        if (console.error) {
          this.on('throw', function(completion){
            console.error(completion.value);
          });
        }

        if (console.clear) {
          this.on('clear', function(){
            console.clear();
          });
        }

        this.on('inspect', function(values, expand){
          values = values.array;
          if (expand) {
            console.dir(values[0]);
          } else {
            console.log.apply(console, values);
          }
        });

        return this;
      }
    ]);

    return Realm;
  })();


  var realm = null,
      global = null,
      context = null,
      intrinsics = null;

  engine.on('realm-change', function(){
    realm = engine.activeRealm;
    global = engine.activeGlobal;
    intrinsics = engine.activeIntrinsics;
  });

  engine.on('context-change', function(){
    context = engine.activeContext;
  });


  exports.Realm = Realm;
  exports.Script = Script;
  exports.$NativeFunction = $NativeFunction;

  return exports;
})((0,eval)('this'), typeof module !== 'undefined' ? module.exports : {});


exports.debug = (function(exports){
  "use strict";
  var objects   = require('./lib/objects'),
      iteration = require('./lib/iteration'),
      utility   = require('./lib/utility'),
      constants = require('./constants'),
      runtime   = require('./runtime'),
      engine    = require('./engine').engine;

  var isObject   = objects.isObject,
      inherit    = objects.inherit,
      create     = objects.create,
      define     = objects.define,
      assign     = objects.assign,
      properties = objects.properties,
      hasOwn     = objects.hasOwn,
      getBrandOf = objects.getBrandOf,
      Hash       = objects.Hash,
      each       = iteration.each,
      quotes     = utility.quotes,
      uid        = utility.uid;

  var ENUMERABLE   = 0x01,
      CONFIGURABLE = 0x02,
      WRITABLE     = 0x04,
      ACCESSOR     = 0x08;

  function always(value){
    return function(){ return value };
  }

  function alwaysCall(func, args){
    args || (args = []);
    return function(){ return func.apply(null, args) }
  }

  function isNegativeZero(n){
    return n === 0 && 1 / n === -Infinity;
  }

  var now = Date.now || function now(){ return +new Date };

  function realm(){
    if (!engine.activeRealm && engine.realms.length) {
      engine.changeRealm(engine.realms[0]);
    }

    return engine.activeRealm;
  }


  function Mirror(){}

  define(Mirror.prototype, {
    destroy: function(){
      this.subject = null;
      this.destroy = null;
    },
    type: null,
    getPrototype: function(){
      return _Null;
    },
    get: function(){
      return _Undefined;
    },
    getValue: function(){
      return _Undefined;
    },
    kind: 'Unknown',
    label: always(''),
    hasOwn: always(null),
    has: always(null),
    list: alwaysCall(Array),
    inheritedAttrs: alwaysCall(create, [null]),
    ownAttrs: alwaysCall(create, [null]),
    getterAttrs: alwaysCall(create, [null]),
    isExtensible: always(null),
    isEnumerable: always(null),
    isConfigurable: always(null),
    getOwnDescriptor: always(null),
    getDescriptor: always(null),
    describe: always(null),
    isAccessor: always(null),
    isWritable: always(null),
    query: always(null)
  });

  function MirrorValue(subject, label){
    this.subject = subject;
    this.type = typeof subject;
    this.kind = getBrandOf(subject)+'Value';
    if (this.type === 'number' && isNegativeZero(subject)) {
      label = '-0';
    }
    this.label = always(label);
  }

  inherit(MirrorValue, Mirror);

  function MirrorStringValue(subject){
    this.subject = subject;
  }

  inherit(MirrorStringValue, MirrorValue, {
    label: always('string'),
    kind: 'StringValue',
    type: 'string'
  });

  function MirrorNumberValue(subject){
    this.subject = subject;
  }

  inherit(MirrorNumberValue, MirrorValue, {
    label: always('number'),
    kind: 'NumberValue',
    type: 'number'
  });


  var proto = uid();


  var MirrorPrototypeAccessor = (function(){
    function MirrorPrototypeAccessor(holder, accessor, key){
      this.holder = holder;
      this.subject = accessor;
      this.key = key;
    }


    inherit(MirrorPrototypeAccessor, Mirror, {
      accessor: true,
      kind: 'Accessor'
    }, [
      function label(){
        var label = [];
        if (this.subject.Get) label.push('Getter');
        if (this.subject.Set) label.push('Setter');
        return label.join('/');
      },
      function getName(){
        return (this.subject.Get || this.subject.Set).get('name');
      }
    ]);

    return MirrorPrototypeAccessor;
  })();




  var MirrorObject = (function(){
    function MirrorObject(subject){
      subject.__introspected = this;
      this.subject = subject;
      this.accessors = new Hash;
    }

    inherit(MirrorObject, Mirror, {
      kind: 'Object',
      type: 'object',
      parentLabel: '[[proto]]',
      attrs: null,
      props: null
    }, [
      function destroy(){
        this.__introspected = null;
        this.destroy = null;
      },
      function get(key){
        if (this.isAccessor(key)) {
          var prop = this.describe(key),
              accessor = prop[1] || prop[3];

          if (!this.accessors[key]) {
            if (this.subject.isProto) {
              this.accessors[key] = new MirrorPrototypeAccessor(this.subject, accessor, key);
            } else {
              this.accessors[key] = new MirrorAccessor(this.subject, accessor, key);
            }
          }
          return this.accessors[key];
        } else {
          var prop = this.subject.describe(key);
          if (prop) {
            return introspect(prop[1]);
          } else {
            return this.getPrototype().get(key);
          }
        }
      },
      function describe(key){
        return this.subject.describe(key) || this.getPrototype().describe(key);
      },
      function isClass(){
        return !!this.subject.Class;
      },
      function getBrand(){
        return this.subject.BuiltinBrand;
      },
      function getValue(key){
        return this.get(key).subject;
      },
      function getPrototype(){
        //return introspect(this.subject.GetInheritance());
        var obj = this.subject;
        do {
          obj = obj.GetInheritance();
        } while (obj && obj.HiddenPrototype)
        return introspect(obj);
      },
      function setPrototype(value){
        realm().enterMutationContext();
        var proto = this.subject.Prototype;

        if (proto && proto.HiddenPrototype) {
          var result = proto.SetInheritance(value);
        } else {
          var result = this.subject.SetInheritance(value);
        }

        realm().exitMutationContext();
        return introspect(result);
      },
      function set(key, value){
        realm().enterMutationContext();
        var result = introspect(this.subject.set(key, value));
        realm().exitMutationContext();
        return result;
      },
      function update(key, attr){
        realm().enterMutationContext();
        var result = introspect(this.subject.update(key, attr));
        realm().exitMutationContext();
        return result;
      },
      function defineProperty(key, desc){
        desc = Object(desc);
        var Desc = {};
        if ('value' in desc) {
          Desc.Value = desc.value;
        }
        if ('get' in desc) {
          Desc.Get = desc.get;
        }
        if ('set' in desc) {
          Desc.Set = desc.set;
        }
        if ('enumerable' in desc) {
          Desc.Enumerable = desc.enumerable;
        }
        if ('configurable' in desc) {
          Desc.Configurable = desc.configurable;
        }
        if ('writable' in desc) {
          Desc.Writable = desc.writable;
        }
        realm().enterMutationContext();
        var ret = this.subject.DefineOwnProperty(key, Desc, false);
        realm().exitMutationContext();
        return ret;
      },
      function hasOwn(key){
        if (this.subject) {
          return this.subject.has(key);
        } else {
          return false;
        }
      },
      function has(key){
        return this.hasOwn(key) || this.getPrototype().has(key);
      },
      function isExtensible(key){
        return this.subject.IsExtensible();
      },
      function getDescriptor(key){
        return this.getOwnDescriptor(key) || this.getPrototype().getDescriptor(key);
      },
      function getOwnDescriptor(key){
        var prop = this.subject.describe(key);
        if (prop) {
          if (prop[2] & ACCESSOR) {
            return {
              name: prop[0],
              get: prop[1].Get,
              set: prop[1].Set,
              enumerable: (prop[2] & ENUMERABLE) > 0,
              configurable: (prop[2] & CONFIGURABLE) > 0
            }
          } else {
            return {
              name: prop[0],
              value: prop[1],
              writable: (prop[2] & WRITABLE) > 0,
              enumerable: (prop[2] & ENUMERABLE) > 0,
              configurable: (prop[2] & CONFIGURABLE) > 0
            }
          }
        }
      },
      function getInternal(name){
        return this.subject[name];
      },
      function isEnumerable(key){
        return (this.query(key) & ENUMERABLE) > 0;
      },
      function isConfigurable(key){
        return (this.query(key) & CONFIGURABLE) > 0;
      },
      function isAccessor(key){
        return (this.query(key) & ACCESSOR) > 0;
      },
      function isWritable(key){
        var prop = this.subject.describe(key);
        if (prop) {
          return !!(prop[2] & ACCESSOR ? prop[1].Set : prop[2] & WRITABLE);
        } else {
          return this.subject.IsExtensible();
        }
      },
      function query(key){
        var attrs = this.subject.query(key);
        return attrs === null ? this.getPrototype().query(key) : attrs;
      },
      function toStringTag(){
        if (this.subject.toStringTag) {
          return this.subject.toStringTag();
        }
        return '';
      },
      function label(){
        var tag = this.toStringTag();
        if (tag) {
          return tag;
        }

        var brand = this.subject.BuiltinBrand;
        if (brand && brand !== 'BuiltinObject') {
          return brandMap[brand];
        }

        if (this.subject.ConstructorName) {
          return this.subject.ConstructorName;
        } else if (this.has('constructor')) {
          var ctorName = this.get('constructor').get('name');
          if (ctorName.subject && typeof ctorName.subject === 'string') {
            return ctorName.subject;
          }
        }

        return 'Object';
      },
      function inheritedAttrs(){
        return this.ownAttrs(this.getPrototype().inheritedAttrs());
      },
      function ownAttrs(props){
        props || (props = new Hash);
        this.subject.each(function(prop){
          var key = prop[0] === '__proto__' ? proto : prop[0];
          props[key] = prop;
        });
        return props;
      },
      function getterAttrs(own){
        var inherited = this.getPrototype().getterAttrs(),
            props = this.ownAttrs();

        for (var k in props) {
          if (own || (props[k][2] & ACCESSOR)) {
            inherited[k] = props[k];
          }
        }
        return inherited;
      },
      function list(hidden, own){
        var keys = [],
            props = own
              ? this.ownAttrs()
              : own === false
                ? this.inheritedAttrs()
                : this.getterAttrs(true);

        for (var k in props) {
          var prop = props[k];
          if (hidden || !prop[0].Private && (prop[2] & ENUMERABLE)) {
            keys.push(prop[0]);
          }
        }

        return keys.sort();
      }
    ]);

    return MirrorObject;
  })();



  var MirrorArray = (function(){

    function MirrorArray(subject){
      MirrorObject.call(this, subject);
    }

    inherit(MirrorArray, MirrorObject, {
      kind: 'Array'
    }, [
      function list(hidden, own){
        var keys = [],
            indexes = [],
            len = this.getValue('length'),
            props = own
              ? this.ownAttrs()
              : own === false
                ? this.inheritedAttrs()
                : this.getterAttrs(true);


        for (var k in props) {
          var prop = props[k];
          if (hidden || !prop[0].Private && (prop[2] & ENUMERABLE)) {
            if (prop[0] >= 0 && prop[0] < len) {
              indexes.push(prop[0]);
            } else {
              keys.push(prop[0]);
            }
          }
        }

        return indexes.concat(keys.sort());
      }
    ]);

    return MirrorArray;
  })();


  var MirrorArguments = (function(){
    function MirrorArguments(subject){
      MirrorObject.call(this, subject);
    }

    inherit(MirrorArguments, MirrorArray, {
      kind: 'Arguments'
    });

    return MirrorArguments;
  })();


  var MirrorArrayBufferView = (function(){
    function MirrorArrayBufferView(subject){
      MirrorObject.call(this, subject);
    }

    inherit(MirrorArrayBufferView, MirrorArray, {
      kind: 'ArrayBuffer'
    }, [
      function label(){
        return brandMap[this.subject.BuiltinBrand];
      }
    ]);
    return MirrorArrayBufferView;
  })();

  var MirrorDate = (function(){

    function MirrorDate(subject){
      MirrorObject.call(this, subject);
    }

    inherit(MirrorDate, MirrorObject, {
      kind: 'Date'
    }, [
      function primitiveValue(){
        return this.subject.DateValue;
      },
      function label(){
        var toLocaleString = this.subject.Get('toLocaleString');
        if (toLocaleString) {
          return toLocaleString.Call(this.subject, []);
        }
        return 'Invalid Date';
      }
    ]);

    return MirrorDate;
  })();


  var MirrorError = (function(){
    function MirrorError(subject){
      MirrorObject.call(this, subject);
    }

    inherit(MirrorError, MirrorObject, {
      kind: 'Error'
    }, [
      function label(){
        return this.getValue('name');
      }
    ]);

    return MirrorError;
  })();


  var MirrorThrown = (function(){
    function MirrorThrown(subject){
      if (isObject(subject)) {
        MirrorError.call(this, subject);
      } else {
        return introspect(subject);
      }
    }

    inherit(MirrorThrown, MirrorError, {
      kind: 'Thrown'
    }, [
      function getError(){
        if (this.subject.BuiltinBrand === 'StopIteration') {
          return 'StopIteration';
        }
        return this.getValue('name') + ': ' + this.getValue('message');
      },
      function origin(){
        var file = this.getValue('filename') || '',
            type = this.getValue('origin') || '';

        return file && type ? type + ' ' + file : type + file;
      },
      function trace(){
        return this.subject.trace;
      },
      function context(){
        return this.subject.context;
      }
    ]);

    return MirrorThrown;
  })();


  var MirrorFunction = (function(){
    function MirrorFunction(subject){
      MirrorObject.call(this, subject);
    }

    inherit(MirrorFunction, MirrorObject, {
      type: 'function',
      kind: 'Function'
    }, [
      function getName(){
        return this.subject.get('name');
      },
      function getDetails(){
        var params = this.subject.FormalParameters;
        if (params && params.reduced) {
          return params.reduced;
        }
        return { params: [], defaults: [], name: this.getName(), rest: null };
      },
      function apply(receiver, args){
        if (receiver.subject) {
          receiver = receiver.subject;
        }
        realm().enterMutationContext();
        var ret = this.subject.Call(receiver, args);
        realm().exitMutationContext();
        return introspect(ret);
      },
      function construct(args){
        if (this.subject.Construct) {
          realm().enterMutationContext();
          var ret = this.subject.Construct(args);
          realm().exitMutationContext();
          return introspect(ret);
        } else {
          return false;
        }
      },
      function getScope(){
        return introspect(this.subject.Scope);
      },
      function isStrict(){
        return !!this.subject.Strict;
      },
      function isClass(){
        return !!this.subject.isClass;
      },
      function isConstructor(){
        return !!this.subject.isConstructor || this.subject.constructCount > 0;
      },
      function isGenerator(){
        return !!this.subject.isGenerator;
      },
      function ownAttrs(props){
        var strict = this.isStrict();
        props || (props = new Hash);
        this.subject.each(function(prop){
          if (!prop[0].Private) {
            var key = prop[0] === '__proto__' ? proto : prop[0];
            props[key] = prop;
          }
        });
        return props;
      }
    ]);

    return MirrorFunction;
  })();



  var MirrorGlobal = (function(){
    function MirrorGlobal(subject){
      MirrorObject.call(this, subject);
    }

    inherit(MirrorGlobal, MirrorObject, {
      kind: 'Global'
    }, [
      function getEnvironment(){
        return introspect(this.subject.env);
      }
    ]);

    return MirrorGlobal;
  })();


  var MirrorJSON = (function(){
    function MirrorJSON(subject){
      MirrorObject.call(this, subject);
    }

    inherit(MirrorJSON, MirrorObject, {
      kind: 'JSON'
    });

    return MirrorJSON;
  })();


  var MirrorMath = (function(){
    function MirrorMath(subject){
      MirrorObject.call(this, subject);
    }

    inherit(MirrorMath, MirrorObject, {
      kind: 'Math'
    });

    return MirrorMath;
  })();


  var MirrorModule = (function(){
    function MirrorModule(subject){
      MirrorObject.call(this, subject);
    }

    inherit(MirrorModule, MirrorObject, {
      kind: 'Module'
    }, [
      function get(key){
        if (this.isAccessor(key)) {
          if (!this.accessors[key]) {
            var prop = this.describe(key),
                accessor = prop[1] || prop[3];

            realm().enterMutationContext();
            this.accessors[key] = introspect(accessor.Get.Call(this.subject, []));
            realm().exitMutationContext();
          }

          return this.accessors[key];
        } else {
          return introspect(this.subject.get(key));
        }
      }
    ]);

    return MirrorModule;
  })();

  var MirrorRegExp = (function(){
    function MirrorRegExp(subject){
      MirrorObject.call(this, subject);
    }

    inherit(MirrorRegExp, MirrorObject, {
      kind: 'RegExp'
    }, [
      function label(){
        return this.subject.PrimitiveValue+'';
      }
    ]);

    return MirrorRegExp;
  })();



  var MirrorPrimitiveWrapper = (function(){
    function MirrorPrimitiveWrapper(subject){
      MirrorObject.call(this, subject);
    }

    inherit(MirrorPrimitiveWrapper, MirrorObject, {
      kind: 'PrimitiveWrapper'
    }, [
      function primitiveValue(){
        return this.subject.getPrimitiveValue();
      },
      function primitiveLabel(){
        return ''+this.primitiveValue();
      },
      function label(){
        return MirrorObject.prototype.label.call(this)+'('+this.primitiveLabel()+')';
      }
    ]);

    return MirrorPrimitiveWrapper;
  })();

  var MirrorBoolean = (function(){
    function MirrorBoolean(subject){
      MirrorObject.call(this, subject);
    }

    inherit(MirrorBoolean, MirrorPrimitiveWrapper, {
      kind: 'Boolean'
    }, [
      function primitiveValue(){
        return this.subject.BooleanValue;
      }
    ]);

    return MirrorBoolean;
  })();

  var MirrorNumber = (function(){
    function MirrorNumber(subject){
      MirrorObject.call(this, subject);
    }

    inherit(MirrorNumber, MirrorPrimitiveWrapper, {
      kind: 'Number'
    }, [
      function primitiveValue(){
        return this.subject.NumberValue;
      }
    ]);

    return MirrorNumber;
  })();


  var MirrorString = (function(){
    function MirrorString(subject){
      MirrorObject.call(this, subject);
    }

    inherit(MirrorString, MirrorPrimitiveWrapper,{
      kind: 'String'
    }, [
      MirrorArray.prototype.list,
      function primitiveValue(){
        return this.subject.StringValue;
      },
      function primitiveLabel(){
        return quotes(this.subject.StringValue);
      }
    ]);

    return MirrorString;
  })();


  var MirrorSymbol = (function(){
    function MirrorSymbol(subject){
      MirrorObject.call(this, subject);
    }

    inherit(MirrorSymbol, MirrorObject, {
      kind: 'Symbol'
    }, [
      function label(){
        return '@' + (this.subject.Name || 'Symbol');
      },
      function isPrivate(){
        return this.subject.Private;
      }
    ]);

    return MirrorSymbol;
  })();



  var MirrorCollection = (function(){
    function CollectionIterator(data){
      this.guard = this.current = data.guard;
      this.index = 0;
    }

    define(CollectionIterator.prototype, [
      function next(){
        if (!this.current || this.current.next === this.guard) {
          this.guard = this.current = null;
          throw StopIteration;
        }
        this.index++;
        return this.current = this.current.next;
      }
    ]);

    function MirrorCollection(subject){
      MirrorObject.call(this, subject);
    }

    inherit(MirrorCollection, MirrorObject, [
      function count(){
        return this.data.size;
      },
      function __iterator__(){
        return new CollectionIterator(this.data);
      }
    ]);

    return MirrorCollection;
  })();

  var MirrorNil = (function(){
    function MirrorNil(subject){
      MirrorObject.call(this, subject);
    }

    inherit(MirrorNil, MirrorObject, {
      kind: 'Nil'
    }, [
      function label(){
        return 'nil';
      },
      function list(){
        return [];
      }
    ]);

    return MirrorNil;
  })();


  var MirrorSet = (function(){
    function MirrorSet(subject){
      MirrorCollection.call(this, subject);
      var map = this.subject.SetData;
      if (map) {
        this.data = map.MapData;
      }
    }

    inherit(MirrorSet, MirrorCollection, {
      kind: 'Set'
    }, [
    ]);

    return MirrorSet;
  })();

  var MirrorMap = (function(){
    function MirrorMap(subject){
      MirrorCollection.call(this, subject);
      this.data = this.subject.MapData;
    }

    inherit(MirrorMap, MirrorCollection, {
      kind: 'Map'
    }, [
    ]);

    return MirrorMap;
  })();


  var MirrorWeakMap = (function(){
    function MirrorWeakMap(subject){
      MirrorObject.call(this, subject);
    }

    inherit(MirrorWeakMap, MirrorObject, {
      kind: 'WeakMap'
    });

    return MirrorWeakMap;
  })();


  var MirrorAccessor = (function(){
    function MirrorAccessor(holder, accessor, key){
      this.holder = holder;
      this.accessor = accessor;
      this.key = key;
      this.refresh();
    }


    inherit(MirrorAccessor, Mirror, {
      accessor: true
    }, [
      function refresh(){
        var timestamp = now();
        if (this.cooldown && timestamp - this.cooldown < 10000) return;
        this.cooldown = timestamp;
        if (this.cooldown)
        if (this.accessor.Get) {
          if (this.accessor.Get.isStrictThrower) {
            var subject = this.accessor.Get;
            this.refresh = function(){ return this }
          } else {
            realm().enterMutationContext();
            var subject = this.accessor.Get.Call(this.holder, []);
            realm().exitMutationContext();
          }
        } else {
          var subject = undefined;
        }
        if (subject !== this.subject || !this.introspected) {
          this.subject = subject;
          this.introspected = introspect(subject);
          this.kind = this.introspected.kind;
          this.type = this.introspected.type;
        }
        return this;
      },
      function destroy(){
        if (this.introspected.destroy) {
          this.introspected.destroy();
        }
        this.subject = null;
        this.destroy = null;
        this.holder = null;
        this.key = null;
      }
    ]);

    function forward(func, key){
      if (hasOwn(MirrorAccessor.prototype, key)) return;
      var src = func+'',
          paren = src.indexOf('('),
          name = src.slice(src.indexOf(' ') + 1, paren),
          args = src.slice(paren, src.indexOf(')') + 1),
          ref = 'this.introspected.'+name,
          forwarder = new Function('return function '+name+args+'{ this.refresh(); if ('+ref+') return '+ref+args+' }')();

      define(MirrorAccessor.prototype, forwarder);
    }

    each([MirrorObject, MirrorFunction, MirrorThrown, MirrorPrimitiveWrapper], function(Mirror){
      each(properties(Mirror.prototype), function(key){
        if (typeof Mirror.prototype[key] === 'function') {
          forward(Mirror.prototype[key], key);
        }
      });
    });

    return MirrorAccessor;
  })();

  var MirrorProxy = (function(){
    function MirrorProxy(subject){
      if (subject.__introspected) {
        return subject.__introspected;
      }
      subject.__introspected = this;
      this.subject = subject;
      if ('Call' in subject) {
        this.type = 'function';
      }
      this.target = introspect(subject.ProxyTarget);
      this.cache = new Hash;
      this.kind = this.target.kind;
      if (this.kind === 'Scope' || this.kind === 'Global') {
        this.kind = 'Object';
      }
    }

    function descToAttrs(desc){
      if (desc) {
        if ('Value' in desc) {
          return desc.Enumerable | (desc.Configurable << 1) | (desc.Writable << 2);
        }
        return desc.Enumerable | (desc.Configurable << 1) | ACCESSOR;
      }
    }

    function attrsToDesc(attrs){
      var desc = {};
      if (attrs > 0) {
        if (attrs & ENUMERABLE) desc.Enumerable = true;
        if (attrs & CONFIGURABLE) desc.Configurable = true;
        if (attrs & WRITABLE) desc.Writable = true;
      }
      return desc;
    }

    inherit(MirrorProxy, Mirror, {
      type: 'object'
    }, [
      MirrorObject.prototype.getInternal,
      MirrorObject.prototype.isExtensible,
      MirrorObject.prototype.getPrototype,
      MirrorObject.prototype.setPrototype,
      MirrorObject.prototype.inheritedAttrs,
      MirrorObject.prototype.getterAttrs,
      MirrorObject.prototype.isEnumerable,
      MirrorObject.prototype.isConfigurable,
      MirrorObject.prototype.isAccessor,
      MirrorObject.prototype.isWritable,
      MirrorObject.prototype.getDescriptor,
      MirrorObject.prototype.defineProperty,
      MirrorFunction.prototype.apply,
      MirrorFunction.prototype.construct,
      function getName(){
        return this.subject.Get('name');
      },
      function getDetails(){
        return this.target.getDetails();
      },
      function getScope(){
        return this.target.getScope();
      },
      function isConstructor(){
        return this.target.isConstructor() || this.subject.constructCount > 0;
      },
      function isClass(){
        return this.target.isClass();
      },
      function isStrict(){
        return this.target.isStrict();
      },
      function list(hidden, own){
        return this.target.list.call(this, hidden, own);
      },
      function label(){
        return this.target.label();
      },
      function set(key, value){
        realm().enterMutationContext();
        var result = introspect(this.subject.Set(key, value));
        realm().exitMutationContext();
        return result;
      },
      function update(key, attr){
        realm().enterMutationContext();
        var result = introspect(this.subject.DefineOwnProperty(key, attrsToDesc(attr)));
        realm().exitMutationContext();
        return result;
      },
      function query(key){
        var prop = this.describe(key);
        if (prop) {
          return prop[2];
        }
      },
      function get(key){
        return introspect(this.getValue(key));
      },
      function getValue(key){
        var prop = key in this.cache ? this.cache[key] : this.describe(key);
        if (prop) {
          return prop[1];
        }
      },
      function hasOwn(key){
        return this.subject.HasOwnProperty(key);
      },
      function has(key){
        return this.subject.HasProperty(key);
      },
      function scheduleReset(){
        if (!this.resetScheduled) {
          this.resetScheduled = true;
          var self = this;
          setTimeout(function(){
            self.enumerated = false;
            self.resetScheduled = false;
            self.cache = new Hash;
          }, 15);
        }
      },
      function describe(key){
        if (key in this.cache) {
          return this.cache[key];
        }
        if (key !== '__proto__') {
          var desc = this.subject.GetOwnProperty(key);
          this.scheduleReset();
          if (desc) {
            if ('Get' in desc || 'Set' in desc) {
              var val = { Get: desc.Get, Set: desc.Set };
            } else {
              var val = desc.Value;
            }
            this.cache[key] = [key, val, descToAttrs(desc)];
          } else {
            this.cache[key] = undefined;
          }
          return this.cache[key];
        }
      },
      function ownAttrs(props){
        if (this.enumerated) {
          return this.cache;
        }
        this.enumerated = true;

        var keys = this.subject.Enumerate(false, false);

        for (var i=0; i < keys.length; i++) {
          this.describe(keys[i]);
        }

        return this.cache;
      }
    ]);

    return MirrorProxy;
  })();



  var MirrorScope = (function(){
    function MirrorScope(subject){
      if (subject.type === 'GlobalEnv') {
        return new MirrorGlobalScope(subject);
      }
      subject.__introspected = this;
      this.subject = subject;
    }

    inherit(MirrorScope, Mirror, {
      kind: 'Scope',
      type: 'scope',
      parentLabel: '[[outer]]',
      isExtensible: always(true),
      isEnumerable: always(true),
      isAccessor: always(false)
    }, [
      function isAccessor(key){
        return this.getPrototype().isAccessor(key) || false;
      },
      function getOuter(){
        return introspect(this.subject.outer);
      },
      function getPrototype(){
        return introspect(this.subject.outer);
      },
      function getValue(key){
        return this.subject.GetBindingValue(key);
      },
      function get(key){
        return introspect(this.subject.GetBindingValue(key));
      },
      function getOwn(key){
        if (this.hasOwn(key)) {
          return introspect(this.subject.GetBindingValue(key));
        }
      },
      function label(){
        return this.subject.type;
      },
      function hasOwn(key){
        return this.subject.HasBinding(key);
      },
      function has(key){
        return this.subject.HasBinding(key) || this.getPrototype().has(key);
      },
      function inheritedAttrs(){
        return this.ownAttrs(this.getPrototype().inheritedAttrs());
      },
      function ownAttrs(props){
        props || (props = new Hash);

        each(this.subject.EnumerateBindings(), function(key){
          key = key === '__proto__' ? proto : key;
          props[key] = [key, null, 7]
        });
        return props;
      },
      function isClass(){
        return !!this.subject.Class;
      },
      function list(hidden, own){
        own = true;
        var props = own ? this.ownAttrs() : this.inheritedAttrs(),
            keys = [];

        for (var k in props) {
          keys.push(props[k][0]);
        }

        return keys.sort();
      },
      function isConfigurable(key){
        return !(this.subject.deletables && key in this.subject.deletables);
      },
      function isWritable(key){
        return !(this.subject.consts && key in this.subject.consts);
      },
      function getOwnDescriptor(key){
        if (this.hasOwn(key)) {
          return { configurable: this.isConfigurable(key),
                   enumerable: true,
                   writable: this.isWritable(key),
                   value: this.get(key)   };
        }
      },
      function getDescriptor(key){
        return this.getOwnDescriptor(key) || this.getPrototype().getDescriptor(key);
      },
      function describe(key){
        return [this.subject.GetBindingValue(key), value, this.query(key)];
      },
      function query(key){
        return 1 | (this.isConfigurable(key) << 1) | (this.isWritable(key) << 2);
      }
    ]);

    return MirrorScope;
  })();

  var MirrorGlobalScope = (function(){
    function MirrorGlobalScope(subject){
      subject.__introspected = this;
      this.subject = subject;
      this.global = introspect(subject.bindings);
    }

    inherit(MirrorGlobalScope, MirrorScope, {
    }, [
      function getPrototype(){
        return this.global.getPrototype();
      },
      function isExtensible(){
        return this.global.isExtensible();
      },
      function isEnumerable(key){
        return this.global.isEnumerable(key);
      },
      function isConfigurable(key){
        return this.global.isConfigurable(key);
      },
      function isWritable(key){
        return this.global.isWritable(key);
      },
      function isAccessor(key){
        return this.global.isAccessor(key);
      },
      function query(key){
        return this.global.query(key);
      },
      function describe(key){
        return this.global.describe(key) || MirrorScope.prototype.describe.call(this, key);
      },
      function getOwnDescriptor(key){
        return this.global.getOwnDescriptor(key) || MirrorScope.prototype.getOwnDescriptor.call(this, key);
      },
      function list(hidden, own){
        return this.global.list(hidden, true).concat(this.subject.importedNames);
      }
    ]);

    return MirrorGlobalScope;
  })();


  var brandMap = {
    BuiltinArguments   : 'Arguments',
    BuiltinArray       : 'Array',
    BuiltinArrayBuffer : 'ArrayBuffer',
    BooleanWrapper     : 'Boolean',
    BuiltinDataView    : 'DataView',
    BuiltinDate        : 'Date',
    BuiltinError       : 'Error',
    BuiltinFunction    : 'Function',
    GlobalObject       : 'global',
    BuiltinJSON        : 'JSON',
    BuiltinMap         : 'Map',
    BuiltinMath        : 'Math',
    BuiltinModule      : 'Module',
    BuiltinNil         : 'Nil',
    NumberWrapper      : 'Number',
    BuiltinRegExp      : 'RegExp',
    BuiltinSet         : 'Set',
    StringWrapper      : 'String',
    BuiltinSymbol      : 'Symbol',
    BuiltinWeakMap     : 'WeakMap',
    BuiltinInt8Array   : 'Int8Array',
    BuiltinUint8Array  : 'Uint8Array',
    BuiltinInt16Array  : 'Int16Array',
    BuiltinUint16Array : 'Uint16Array',
    BuiltinInt32Array  : 'Int32Array',
    BuiltinUint32Array : 'Uint32Array',
    BuiltinFloat32Array: 'Float32Array',
    BuiltinFloat64Array: 'Float64Array'
  };

  var brands = {
    BuiltinArguments   : MirrorArguments,
    BuiltinArray       : MirrorArray,
    BooleanWrapper     : MirrorBoolean,
    BuiltinDate        : MirrorDate,
    BuiltinError       : MirrorError,
    BuiltinFunction    : MirrorFunction,
    GlobalObject       : MirrorGlobal,
    BuiltinJSON        : MirrorJSON,
    BuiltinMap         : MirrorMap,
    BuiltinMath        : MirrorMath,
    BuiltinModule      : MirrorModule,
    BuiltinNil         : MirrorNil,
    NumberWrapper      : MirrorNumber,
    BuiltinRegExp      : MirrorRegExp,
    BuiltinSet         : MirrorSet,
    StringWrapper      : MirrorString,
    BuiltinSymbol      : MirrorSymbol,
    BuiltinWeakMap     : MirrorWeakMap,
    BuiltinInt8Array   : MirrorArrayBufferView,
    BuiltinUint8Array  : MirrorArrayBufferView,
    BuiltinInt16Array  : MirrorArrayBufferView,
    BuiltinUint16Array : MirrorArrayBufferView,
    BuiltinInt32Array  : MirrorArrayBufferView,
    BuiltinUint32Array : MirrorArrayBufferView,
    BuiltinFloat32Array: MirrorArrayBufferView,
    BuiltinFloat64Array: MirrorArrayBufferView
  };

  var _Null        = new MirrorValue(null, 'null'),
      _Undefined   = new MirrorValue(undefined, 'undefined'),
      _True        = new MirrorValue(true, 'true'),
      _False       = new MirrorValue(false, 'false'),
      _NaN         = new MirrorValue(NaN, 'NaN'),
      _Infinity    = new MirrorValue(Infinity, 'Infinity'),
      _NegInfinity = new MirrorValue(-Infinity, '-Infinity'),
      _Zero        = new MirrorValue(0, '0'),
      _NegZero     = new MirrorValue(-0, '-0'),
      _One         = new MirrorValue(1, '1'),
      _NegOne      = new MirrorValue(-1, '-1'),
      _Empty       = new MirrorValue('', "''");

  var numbers = new Hash,
      strings = new Hash;


  function introspect(subject){
    switch (typeof subject) {
      case 'undefined': return _Undefined;
      case 'boolean': return subject ? _True : _False;
      case 'string':
        if (subject === '') {
          return _Empty
        } else if (subject.length < 20) {
          if (subject in strings) {
            return strings[subject];
          } else {
            return strings[subject] = new MirrorStringValue(subject);
          }
        } else {
          return new MirrorStringValue(subject);
        }
      case 'number':
        if (subject !== subject) {
          return _NaN;
        }
        switch (subject) {
          case Infinity: return _Infinity;
          case -Infinity: return _NegInfinity;
          case 0: return 1 / subject === -Infinity ? _NegZero : _Zero;
          case 1: return _One;
          case -1: return _NegOne;
        }
        if (subject in numbers) {
          return numbers[subject];
        } else {
          return numbers[subject] = new MirrorNumberValue(subject);
        }
      case 'object':
        if (subject == null) {
          return _Null;
        } else if (subject instanceof Mirror) {
          return subject;
        } else if (subject.__introspected) {
          return subject.__introspected;
        } else if (subject.Environment) {
          return new MirrorScope(subject);
        } else if (subject.Completion) {
          return new MirrorThrown(subject.value);
        } else if (subject.BuiltinBrand) {
          if (subject.Proxy) {
            return new MirrorProxy(subject);
          } else if (subject.BuiltinBrand in brands) {
            return new brands[subject.BuiltinBrand](subject);
          } else if (subject.Call) {
            return new MirrorFunction(subject);
          } else {
            return new MirrorObject(subject);
          }
        } else {
          return _Undefined
        }
    }
  }


  var Renderer = (function(){

    function alwaysLabel(mirror){
      return mirror.label();
    }


    function Renderer(handlers){
      if (handlers) {
        for (var k in this) {
          if (k in handlers) {
            this[k] = handlers[k];
          }
        }
      }
    }

    define(Renderer.prototype, [
      function render(subject){
        var mirror = introspect(subject);
        return this[mirror.kind](mirror);
      }
    ]);

    assign(Renderer.prototype, {
      Unknown: alwaysLabel,
      BooleanValue: alwaysLabel,
      StringValue: function(mirror){
        return quotes(mirror.subject);
      },
      NumberValue: function(mirror){
        var label = mirror.label();
        return label === 'number' ? mirror.subject : label;
      },
      UndefinedValue: alwaysLabel,
      NullValue: alwaysLabel,
      Thrown: function(mirror){
        return mirror.getError();
      },
      Accessor: alwaysLabel,
      Arguments: alwaysLabel,
      Array: alwaysLabel,
      ArrayBuffer: alwaysLabel,
      Boolean: alwaysLabel,
      Date: alwaysLabel,
      Error: function(mirror){
        return mirror.getValue('name') + ': ' + mirror.getValue('message');
      },
      Function: alwaysLabel,
      Global: alwaysLabel,
      JSON: alwaysLabel,
      Map: alwaysLabel,
      Math: alwaysLabel,
      Module: alwaysLabel,
      Nil: alwaysLabel,
      Object: alwaysLabel,
      Number: alwaysLabel,
      RegExp: alwaysLabel,
      Scope: alwaysLabel,
      Set: alwaysLabel,
      Symbol: alwaysLabel,
      String: alwaysLabel,
      WeakMap: alwaysLabel
    });

    return Renderer;
  })();


  var renderer = new Renderer;

  define(exports, [
    function basicRender(o){
      return renderer.render(o);
    },
    function createRenderer(handlers){
      return new Renderer(handlers);
    },
    function isMirror(o){
      return o instanceof Mirror;
    },
    introspect,
    Renderer
  ]);


  define(exports, 'mirrors', {
    Mirror                 :Mirror,
    MirrorValue            :  MirrorValue,
    MirrorNull             :    _Null,
    MirrorUndefined        :    _Undefined,
    MirrorTrue             :    _True,
    MirrorFalse            :    _False,
    MirrorStringValue      :    MirrorStringValue,
    MirrorEmpty            :      _Empty,
    MirrorNumberValue      :    MirrorNumberValue,
    MirrorInfinity         :      _Infinity,
    MirrorNaN              :      _NaN,
    MirrorNegInfinity      :      _NegInfinity,
    MirrorZero             :      _Zero,
    MirrorNegZero          :      _NegZero,
    MirrorOne              :      _One,
    MirrorNegOne           :      _NegOne,
    MirrorPrototypeAccessor:  MirrorPrototypeAccessor,
    MirrorObject           :  MirrorObject,
    MirrorArray            :    MirrorArray,
    MirrorArguments        :      MirrorArguments,
    MirrorArrayBufferView  :      MirrorArrayBufferView,
    MirrorPrimitiveWrapper :    MirrorPrimitiveWrapper,
    MirrorBoolean          :      MirrorBoolean,
    MirrorNumber           :      MirrorNumber,
    MirrorString           :      MirrorString,
    MirrorDate             :    MirrorDate,
    MirrorError            :    MirrorError,
    MirrorThrown           :      MirrorThrown,
    MirrorFunction         :    MirrorFunction,
    MirrorGlobal           :    MirrorGlobal,
    MirrorJSON             :    MirrorJSON,
    MirrorMath             :    MirrorMath,
    MirrorModule           :    MirrorModule,
    MirrorNil              :    MirrorNil,
    MirrorRegExp           :    MirrorRegExp,
    MirrorSymbol           :    MirrorSymbol,
    MirrorCollection       :    MirrorCollection,
    MirrorSet              :      MirrorSet,
    MirrorMap              :      MirrorMap,
    MirrorWeakMap          :    MirrorWeakMap,
    MirrorAccessor         :  MirrorAccessor,
    MirrorProxy            :  MirrorProxy,
    MirrorScope            :  MirrorScope,
    MirrorGlobalScope      :    MirrorGlobalScope
  });

  return exports;
})(typeof module !== 'undefined' ? module.exports : {});


exports.index = (function(module){
  "use strict";
  var objects   = require('./lib/objects'),
      iteration = require('./lib/iteration'),
      runtime   = require('./runtime'),
      assembler = require('./assembler'),
      debug     = require('./debug'),
      constants = require('./constants'),
      errors    = require('./errors'),
      engine    = module.exports = require('./engine').engine;

  var assign           = objects.assign,
      assignAll        = objects.assignAll,
      define           = objects.define,
      inherit          = objects.inherit,
      Realm            = runtime.Realm,
      Script           = runtime.Script,
      Renderer         = debug.Renderer,
      AbruptCompletion = errors.AbruptCompletion,
      $$ThrowException = errors.$$ThrowException,
      builtins         = runtime.builtins,
      $NativeFunction  = builtins.$NativeFunction;


  var exoticTemplates = {
    Array: function(){
      return function $ExoticArray(len){
        builtins.$Array.call(this, +len || 0);
        this.init.apply(this, arguments);
      };
    },
    Function: function(){
      return function $ExoticFunction(call, construct){
        builtins.$Object.call(this);
        this.call = call;
        if (construct) {
          this.construct = construct;
        }
        this.init.apply(this, arguments);
      }
    },
    Object: function(){
      return function $ExoticObject(){
        builtins.$Object.call(this);
        this.init.apply(this, arguments);
      }
    }
  };

  assign(engine, [
    runtime.parse,
    function createRealm(listener){
      return new Realm(listener);
    },
    function createRealmAsync(){
      return new Realm(true);
    },
    function createScript(options){
      return new Script(options);
    },
    function createCode(options){
      return new Script(options).bytecode;
    },
    function createRenderer(handlers){
      return new Renderer(handlers);
    },
    function createFunction(options){
      return new $NativeFunction(options);
    },
    function createAbruptCompletion(value){
      return new AbruptCompletion(value);
    },
    function createExotic(inherits, handlers){
      if (typeof inherits === 'string') {
        if (!(inherits in exoticTemplates)) {
          inherits = 'Object';
        }
        var $Exotic = exoticTemplates[inherits]();
      } else if (!handlers) {
        handlers = inherits;
      }

      if (!$Exotic) {
        $Exotic = exoticTemplates.Object();
        inherits = 'Object';
      }

      var Super = builtins['$'+inherits];


      inherit($Exotic, Super, {
        Native: true
      }, [
        function init(){},
        function remove(key){
          this.update(key, undefined);
        },
        function describe(key){
          return [key, this.get(key), this.query(key)];
        },
        (function(){
          return function define(key, value, attrs){
            this.set(key, value);
            this.update(key, attrs);
          };
        })(),
        function has(key){
          return this.query(key) !== undefined;
        },
        function each(callback){
          return $$ThrowException('missing_fundamental_handler', 'each');
        },
        function get(key){
          return $$ThrowException('missing_fundamental_handler', 'get');
        },
        function set(key, value){
          return $$ThrowException('missing_fundamental_handler', 'set');
        },
        function query(key){
          return $$ThrowException('missing_fundamental_handler', 'query');
        },
        function update(key, attr){
          return $$ThrowException('missing_fundamental_handler', 'update');
        }
      ]);

      if (Super.prototype.Call) {
        define($Exotic.prototype, [
          function call(){},
          function construct(){},
          $NativeFunction.prototype.Call,
          $NativeFunction.prototype.Construct,
          $NativeFunction.prototype.HasInstance
        ]);
      }

      if (handlers) {
        define($Exotic.prototype, handlers);
      }

      return $Exotic;
    }
  ]);


  function createInterceptor(name, construct){
    if (!construct && typeof name === 'function') {
      construct = name;
      name = fname(construct);
    }

    var Ctor = new $NativeFunction({
      name: name || '',
      length: construct.length,
      call: function(){
        var obj = new $IndexedInterceptor(construct.apply(null, arguments));
        obj.Prototype = Ctor.get('prototype');
        return obj;
      },
      construct: function(){
        var obj = new $IndexedInterceptor(construct.apply(null, arguments));
        obj.Prototype = Ctor.get('prototype');
        return obj;
      }
    });

    var proto = new builtins.$Object;
    proto.ConstructorName = name;
    proto.define('constructor', Ctor, 6);
    Ctor.define('prototype', proto, 4);

    return Ctor;
  }

  var $IndexedInterceptor = (function(){
    function $IndexedInterceptor(target){
      builtins.$Object.call(this);
      this.target = target;
      this.length = target.length;
      this.properties.set('length', target.length, 0);
    }

    inherit($IndexedInterceptor, builtins.$Object, {
      indexAttribute: 5
    }, [
      function remove(key){
        var index = +key;
        if (index >= 0 && index < this.target.length) {
          return delete this.target[index];
        }

        if (this.properties.has(key)) {
          return this.properties.remove(key);
        }
      },
      function describe(key){
        var index = +key;
        if (index >= 0 && index < this.target.length) {
          return [index+'', this.target[index], this.indexAttribute];
        }

        if (this.properties.has(key)) {
          return this.properties.describe(key);
        }
      },
      (function(){
        return function define(key, value, attrs){
          var index = +key;
          if (index >= 0 && index < this.target.length) {
            return this.target[index] = value;
          }

          if (this.properties.has(key)) {
            return this.properties.set(key, value, attrs);
          }
        };
      })(),
      function has(key){
        var index = +key;
        if (index >= 0 && index < this.target.length) {
          return true;
        }

        return this.properties.has(key);
      },
      function each(callback){
        var len = this.target.length;

        for (var i=0; i < len; i++) {
          callback([i+'', this.target[i], this.indexAttribute]);
        }

        this.properties.each(callback);
      },
      function get(key){
        var index = +key;
        if (index >= 0 && index < this.target.length) {
         return this.target[index];
        }

        if (this.properties.has(key)) {
          return this.properties.get(key);
        }
      },
      function set(key, value){
        var index = +key;
        if (index >= 0 && index < this.target.length) {
         return this.target[index] = value;
        }

        if (this.properties.has(key)) {
          return this.properties.set(key, value);
        }
      },
      function query(key){
        var index = +key;
        if (index >= 0 && index < this.target.length) {
          return this.indexAttribute;
        }

        if (this.properties.has(key)) {
          return this.properties.query(key);
        }
      },
      function update(key, attr){
        var index = +key;
        if (index >= 0 && index < this.target.length) {
          return false;
        }

        if (this.properties.has(key)) {
          return this.properties.update(key, attr);
        }
      }
    ]);

    return $IndexedInterceptor;
  })();

  function brainTransplant(func, call, construct){
    if (!(func instanceof $NativeFunction)) {
      func.Call = $NativeFunction.prototype.Call;
      func.Construct = $NativeFunction.prototype.Construct;
      if (call instanceof $NativeFunction) {
        construct = call.construct;
        call = call.call;
      }
      func.call = call;
      func.construct = construct;
    }
    return func;
  }


  define(engine, {
    Assembler : assembler.Assembler,
    Code      : assembler.Code,
    Realm     : Realm,
    Renderer  : Renderer,
    Script    : Script,
    constants : constants,
    iterate   : iteration.iterate,
    introspect: debug.introspect,
    createInterceptor: createInterceptor,
    brainTransplant: brainTransplant,
    isUndetectable: require('./object-model/$Nil').isUndetectable,
    utility: assignAll({}, [
      require('./lib/functions'),
      require('./lib/iteration'),
      require('./lib/objects'),
      require('./lib/traversal'),
      require('./lib/utility'),
      require('./lib/DoublyLinkedList'),
      require('./lib/Emitter'),
      require('./lib/Feeder'),
      require('./lib/HashMap'),
      require('./lib/ObjectMap'),
      require('./lib/HashSet'),
      require('./lib/LinkedList'),
      require('./lib/PropertyList'),
      require('./lib/Queue'),
      require('./lib/Stack')
    ]),
    debug: debug
  });

  return engine;
})(typeof module !== 'undefined' ? module : {});



exports.builtins["@@descriptors"] = "import {\n  $$CreateInternalObject,\n  $$Get,\n  $$Set\n} from '@@internals';\n\nimport {\n  extendInternal\n} from '@@utilities';\n\nimport {\n  MISSING\n} from '@@internal-symbols';\n\n\nprivate @descriptor;\n\n\nconst Desc = extendInternal($$CreateInternalObject(), {\n  _type: 'Descriptor',\n  Configurable: MISSING,\n  Enumerable: MISSING,\n  Writable: MISSING,\n  Value: MISSING,\n  Get: MISSING,\n  Set: MISSING\n});\n\n\nexport class Descriptor {\n  constructor(desc = $$CreateInternalObject(Desc)){\n    this.@descriptor = desc;\n  }\n\n  get(){\n    return this.@descriptor;\n  }\n\n  set(Descriptor){\n    this.@descriptor = Descriptor;\n  }\n\n  get configurable(){\n    return $$Get(this.@descriptor, 'Configurable');\n  }\n\n  get enumerable(){\n    return $$Get(this.@descriptor, 'Enumerable');\n  }\n\n  get writable(){\n    return $$Get(this.@descriptor, 'Writable');\n  }\n\n  get value(){\n    return $$Get(this.@descriptor, 'Value');\n  }\n\n  get get(){\n    return $$Get(this.@descriptor, 'Get');\n  }\n\n  get set(){\n    return $$Get(this.@descriptor, 'Set');\n  }\n\n  set configurable(value){\n    $$Set(this.@descriptor, 'Configurable', value);\n  }\n\n  set enumerable(value){\n    $$Set(this.@descriptor, 'Enumerable', value);\n  }\n\n  set writable(value){\n    $$Set(this.@descriptor, 'Writable', value);\n  }\n\n  set value(value){\n    $$Set(this.@descriptor, 'Value', value);\n  }\n\n  set get(value){\n    $$Set(this.@descriptor, 'Get', value);\n  }\n\n  set set(value){\n    $$Set(this.@descriptor, 'Set', value);\n  }\n}\n\n\n\n\nexport class DataDescriptor extends Descriptor {\n  constructor(configurable = MISSING, enumerable = MISSING, writable = MISSING, value = MISSING){\n    super();\n    this.configurable = configurable;\n    this.enumerable = enumerable;\n    this.writable = writable;\n    this.value = value;\n  }\n}\n\n\n\nexport class AccessorDescriptor extends Descriptor {\n  constructor(configurable = MISSING, enumerable = MISSING, get = MISSING, set = MISSING){\n    super();\n    this.configurable = configurable;\n    this.enumerable = enumerable;\n    this.get = get;\n    this.set = set;\n  }\n}\n\nexport const defaults = new Descriptor;\ndefaults.configurable = false;\ndefaults.enumerable = false;\ndefaults.writable = false;\ndefaults.value = undefined;\ndefaults.set = undefined;\ndefaults.get = undefined;\n";

exports.builtins["@@objects"] = "// ##############################################\n// ##### 11 Internal Methods and Properties #####\n// ##############################################\n\nimport {\n  $$ArgumentCount,\n  $$CreateArray,\n  $$CreateObject,\n  $$CreateInternalObject,\n  $$CurrentRealm,\n  $$Get,\n  $$GetPropertyAttribute,\n  $$GetPropertyValue,\n  $$GetIntrinsic,\n  $$HasArgument,\n  $$Set,\n  $$SetPropertyAttribute,\n  $$SetPropertyValue\n} from '@@internals';\n\nimport {\n  createAccessorDescriptor,\n  createDataDescriptor,\n  Type\n} from '@@types';\n\nimport {\n  undefined\n} from '@constants';\n\nconst E = 0x1,\n      C = 0x2,\n      W = 0x4,\n      A = 0x8,\n      ___ = 0,\n      E__ = E,\n      _C_ = C,\n      EC_ = E | C,\n      __W = W,\n      E_W = E | W,\n      _CW = C | W,\n      ECW = E | C | W,\n      __A = A,\n      E_A = E | A,\n      _CA = C | A,\n      ECA = E | C | A;\n\n\n// ##########################################################################\n// ### 11.1 Ordinary Object Internal Methods and Internal Data Properties ###\n// ##########################################################################\n\nconst OrdinaryObject = $$CreateInternalObject(null);\n$$Set(OrdinaryObject, '_type', 'Object');\n$$Set(OrdinaryObject, 'Extensible', true);\n$$Set(OrdinaryObject, 'Prototype', undefined);\n\n\n// #############################\n// # 11.1.1 [[GetInheritance]] #\n// #############################\n\n$$Set(OrdinaryObject, 'GetInheritance', function(){\n  return $$Get(this, 'Prototype');\n});\n\n\n// #############################\n// # 11.1.2 [[SetInheritance]] #\n// #############################\n\n$$Set(OrdinaryObject, 'SetInheritance', function(V){\n  $$Assert(Type(V) === 'Object' || Type(V) === 'Null');\n\n  if (!$$Get(this, 'Extensible')) {\n    return false;\n  }\n\n  $$Set(this, 'Prototype', V);\n  return true;\n});\n\n\n// ###########################\n// # 11.1.3 [[IsExtensible]] #\n// ###########################\n\n$$Set(OrdinaryObject, 'IsExtensible', function(){\n  return $$Get(this, 'Extensible');\n});\n\n\n// ################################\n// # 11.1.4 [[PreventExtensions]] #\n// ################################\n\n$$Set(OrdinaryObject, 'PreventExtensions', function(){\n  $$Set(this, 'Extensible', false);\n});\n\n\n// #############################\n// # 11.1.5 [[HasOwnProperty]] #\n// #############################\n\n$$Set(OrdinaryObject, 'HasOwnProperty', function(P){\n  $$Assert(IsPropertyKey(P));\n  return $$HasProperty(this, P);\n});\n\n\n// #############################\n// # 11.1.6 [[GetOwnProperty]] #\n// #############################\n\n$$Set(OrdinaryObject, 'GetOwnProperty', function(P){\n  $$Assert(IsPropertyKey(P));\n  return OrdinaryGetOwnProperty(this, P);\n});\n\n\n// 11.1.6.1 OrdinaryGetOwnProperty\n\nexport function OrdinaryGetOwnProperty(O, P){\n  $$Assert(IsPropertyKey(P));\n\n  if (!$$HasProperty(O, P)) {\n    return undefined;\n  }\n\n  const attr = $$GetPropertyAttribute(O, P),\n        val  = $$GetPropertyValue(O, P);\n\n  if (attr & A) {\n    return createAccessorDescriptor($$Get(val, 'Get'), $$Get(val, 'Set'), attr & E, attr & C);\n  }\n\n  return createDataDescriptor(val, attr & W, attr & E, attr & C);\n}\n\n\n// ################################\n// # 11.1.7 [[DefineOwnProperty]] #\n// ################################\n\n$$Set(OrdinaryObject, 'DefineOwnProperty', function(P, Desc){;\n  return OrdinaryDefineOwnProperty(this, P, Desc);\n});\n\n\n// 11.1.7.1 OrdinaryDefineOwnProperty\n\nexport function OrdinaryDefineOwnProperty(O, P, Desc){\n  const current    = OrdinaryGetOwnProperty(O, P),\n        extensible = $$Get(O, 'Extensible');\n\n  return ValidateAndApplyPropertyDescriptor(O, P, extensible, Desc, current);\n}\n\n\n// 11.1.7.2 IsCompatiblePropertyDescriptor\n\nexport function IsCompatiblePropertyDescriptor(Extensible, Desc, Current) {\n  return ValidateAndApplyPropertyDescriptor(undefined, undefined, Extensible, Desc, Current);\n}\n\n\n// 11.1.7.3 ValidateAndApplyPropertyDescriptor\n\nfunction attributesFromDescriptor(Desc){\n  if ($$Has(Desc, 'attrs')) {\n    return $$Get(Desc, 'attrs');\n  }\n\n  if ($$Has(Desc, 'Get') || $$Has(Desc, 'Set')) {\n    $$Assert(!$$Has(Desc, 'Value') && !$$Has(Desc, 'Writable'));\n    return $$Get(Desc, 'Enumerable') | ($$Get(Desc, 'Configurable') << 1) | 8;\n  }\n  return $$Get(Desc, 'Enumerable') | ($$Get(Desc, 'Configurable') << 1) | ($$Get(Desc, 'Writable') << 2);\n}\n\nconst Accessor = $$CreateInternalObject();\n$$Set(Accessor, '_type', 'Accessor');\n$$Set(Accessor, 'Get', undefined);\n$$Set(Accessor, 'Set', undefined);\n\nfunction createAccessor(Desc){\n  const accessor = $$CreateInternalObject(Accessor);\n  $$Set(accessor, 'Get', $$Get(Desc, 'Get'));\n  $$Set(accessor, 'Set', $$Get(Desc, 'Set'));\n  return accessor;\n}\n\nfunction same(a, b, field){\n  return SameValue($$Get(a, field), $$Get(b, field));\n}\n\nexport function ValidateAndApplyPropertyDescriptor(O, P, extensible, Desc, current){\n  $$Assert(O === undefined || IsPropertyKey(P));\n\n\n  // New property\n  if (current === undefined) {\n    if (!extensible) {\n      return false;\n    }\n\n    $$Assert(extensible === true);\n\n    if (O !== undefined) {\n      if (IsGenericDescriptor(Desc) || IsDataDescriptor(Desc)) {\n        $$CreateProperty(O, P, $$Get(Desc, 'Value'), attributesFromDescriptor(Desc));\n      } else {\n        $$CreateProperty(O, P, createAccessor(Desc), attributesFromDescriptor(Desc));\n      }\n\n      if ($$Has(O, 'Notifier')) {\n        const changeObservers = $$Get($$Get(O, 'Notifier'), 'ChangeObservers');\n        if ($$Get(changeObservers, 'size')) {\n          EnqueueChangeRecord(CreateChangeRecord('new', O, P), changeObservers);\n        }\n      }\n    }\n\n    return true;\n  }\n\n\n  // Empty Descriptor\n  if (!($$Has(Desc, 'Get') || $$Has(Desc, 'Set') || $$Has(Desc, 'Value'))) {\n    if (!($$Has(Desc, 'Writable') || $$Has(Desc, 'Configurable') || $$Has(Desc, 'Enumerable'))) {\n      return true;\n    }\n  }\n\n  //Equal Descriptor\n  if (same(Desc, current, 'Value') && same(Desc, current, 'Get') && same(Desc, current, 'Set')) {\n    if (same(Desc, current, 'Writable') && same(Desc, current, 'Enumerable') && same(Desc, current, 'Configurable')) {\n      return true;\n    }\n  }\n\n  let changeType = 'reconfigured';\n\n  if ($$Get(current, 'Configurable') === false) {\n    if ($$Get(Desc, 'Configurable')) {\n      return false;\n    }\n    if ($$Has(Desc, 'Enumerable') && !same(Desc, current, 'Enumerable')) {\n      return false;\n    }\n  }\n/*\n  if (!IsGenericDescriptor(Desc)) {\n    if (IsDataDescriptor(current) !== IsDataDescriptor(Desc)) {\n      if ($$Get(current, 'Configurable') === false) {\n        return false;\n      }\n\n      if (IsDataDescriptor(current)) {\n        if (O !== undefined) {\n\n        }\n      }\n    }\n\n    if (currentIsData && descIsData) {\n\n    if (currentIsData) {\n      if (!$$Get(current, 'Writable') && $$Has(Desc, 'Value') && !same(Desc, current, 'Value')) {\n        return false;\n      }\n    } else if ($$Has(Desc, 'Set') && !same(Desc, current, 'Set')) {\n      return false;\n    } else if ($$Has(Desc, 'Get') && !same(Desc, current, 'Get')) {\n      return false;\n    }\n  }\n\n  if (O === undefined) {\n    return true;\n  }\n\n  'Configurable' in Desc || (Desc.Configurable = current.Configurable);\n  'Enumerable' in Desc || (Desc.Enumerable = current.Enumerable);\n\n  if (IsAccessorDescriptor(Desc)) {\n    O.update(P, Desc.Enumerable | (Desc.Configurable << 1) | 8);\n    if (IsDataDescriptor(current)) {\n      O.set(P, new Accessor(Desc.Get, Desc.Set));\n    } else {\n      var accessor = current.getAccessor();\n      'Set' in Desc && (accessor.Set = Desc.Set);\n      'Get' in Desc && (accessor.Get = Desc.Get);\n      ('Set' in Desc || 'Get' in Desc) && O.set(P, accessor);\n    }\n  } else {\n    if (IsAccessorDescriptor(current)) {\n      current.Writable = true;\n    }\n    'Writable' in Desc || (Desc.Writable = current.Writable);\n    O.update(P, Desc.Enumerable | (Desc.Configurable << 1) | (Desc.Writable << 2));\n    if ('Value' in Desc) {\n      O.set(P, Desc.Value);\n      changeType = 'updated';\n    }\n  }\n\n  if (O.Notifier) {\n    var changeObservers = O.Notifier.ChangeObservers;\n    if (changeObservers.size) {\n      var record = $$CreateChangeRecord(changeType, O, P, current);\n      $$EnqueueChangeRecord(record, changeObservers);\n    }\n  }\n\n  return true;*/\n}\n\n\n\n// ###########################################\n// # 11.1.18 ObjectCreate Abstract Operation #\n// ###########################################\n\nexport function ObjectCreate(proto){\n  if (!$$ArgumentCount()) {\n    proto = $$GetIntrinsic('%ObjectPrototype%');\n  }\n  return $$CreateObject('Object', proto);\n}\n\n\n// ###########################################\n// # 11.2.2.3 ArrayCreate Abstract Operation #\n// ###########################################\n\nexport function ArrayCreate(length){\n  return $$CreateArray($$CurrentRealm(), length);\n}\n";

exports.builtins["@@operations"] = "// #####################################\n// ####### 9 Abstract Operations #######\n// #####################################\n\n\nimport {\n  abs,\n  call,\n  floor,\n  getIntrinsic,\n  hasBrand,\n  isNaN,\n  isZeroOrInfinite,\n  sign\n} from '@@utilities';\n\nimport {\n  ArrayCreate,\n  ObjectCreate,\n  Type\n} from '@@types';\n\nimport {\n  $$Assert,\n  $$AssertIsInternalArray,\n  $$AssertIsECMAScriptValue,\n  $$AssertWontThrow,\n  $$Invoke,\n  $$CallerName,\n  $$CreateObject,\n  $$CreateInternalObject,\n  $$CurrentRealm,\n  $$Exception,\n  $$Get,\n  $$GetIntrinsic,\n  $$Has,\n  $$HasArgument,\n  $$StringToNumber,\n  $$Set\n} from '@@internals';\n\nimport {\n  NaN\n} from '@@constants';\n\nimport {\n  @@ToPrimitive: ToPrimitive\n} from '@@symbols';\n\n\n\n// ###########################################\n// ##### 9.1 Type Conversion and Testing #####\n// ###########################################\n\n\n// #########################\n// ### 9.1.1 ToPrimitive ###\n// #########################\n\nexport function ToPrimitive(argument, PreferredType){\n  if (Type(argument) !== 'Object') {\n    return argument;\n  }\n\n  let hint = 'number';\n  if (!$$HasArgument('PreferredType')) {\n    hint = 'default';\n  } else if (PreferredType === 'String') {\n    hint = 'string';\n  }\n\n  const exoticToPrim = Get(argument, @@ToPrimitive);\n  if (exoticToPrim !== undefined) {\n    if (!IsCallable(exoticToPrim)) {\n      throw $$Exception('cannot_convert_to_primitive', []);\n    }\n\n    const result = call(exoticToPrim, argument);\n    if (Type(result) !== 'Object') {\n      return result;\n    } else {\n      throw $$Exception('cannot_convert_to_primitive', []);\n    }\n  }\n\n  if (hint === 'default') {\n    hint = 'number';\n  }\n\n  return OrdinaryToPrimitive(argument, hint);\n}\n\nexport function OrdinaryToPrimitive(O, hint){\n  $$Assert(Type(O) === 'Object');\n  $$Assert(Type(hint) === 'String' && hint === 'string' || hint === 'number');\n\n  let tryFirst, trySecond;\n  if (hint === 'string') {\n    tryFirst = 'toString';\n    trySecond = 'valueOf';\n  } else {\n    tryFirst = 'valueOf';\n    trySecond = 'toString';\n  }\n\n  const first = Get(O, tryFirst);\n  if (IsCallable(first)) {\n    const result = call(first, O);\n    if (Type(result) !== 'Object') {\n      return result;\n    }\n  }\n\n  const second = Get(O, trySecond);\n  if (IsCallable(second)) {\n    const result = call(second, O);\n    if (Type(result) !== 'Object') {\n      return result;\n    }\n  }\n\n  throw $$Exception('cannot_convert_to_primitive', []);\n}\n\n\n// #######################\n// ### 9.1.2 ToBoolean ###\n// #######################\n\nexport function ToBoolean(argument){\n  switch (Type(argument)) {\n    case 'Boolean':\n      return argument;\n    case 'Undefined':\n    case 'Null':\n      return false;\n    case 'Number':\n      return argument !== 0 && argument === argument;\n    case 'String':\n      return argument !== '';\n    case 'Object':\n      return true;\n  }\n}\n\n\n// ######################\n// ### 9.1.3 ToNumber ###\n// ######################\n\nexport function ToNumber(argument){\n  switch (Type(argument)) {\n    case 'Number':\n      return argument;\n    case 'Undefined':\n      return NaN;\n    case 'Null':\n      return 0;\n    case 'Boolean':\n      return argument === true ? 1 : 0;\n    case 'String':\n      return $$StringToNumber(argument);\n    case 'Object':\n      return ToNumber(ToPrimitive(argument), 'Number');\n  }\n}\n\n\n// #######################\n// ### 9.1.4 ToInteger ###\n// #######################\n\nexport function ToInteger(argument){\n  const number = ToNumber(argument);\n\n  if (isNaN(number)) {\n    return 0;\n  }\n\n  if (isZeroOrInfinite(number)) {\n    return number;\n  }\n\n  return sign(number) * floor(abs(number));\n}\n\n\n// #####################\n// ### 9.1.5 ToInt32 ###\n// #####################\n\nexport function ToInt32(argument){\n  const number = ToNumber(argument);\n\n  if (isNaN(number) || isZeroOrInfinite(number)) {\n    return 0;\n  }\n\n  const int = sign(number) * floor(abs(number)) & 0xffffffff;\n\n  return int >= 0x80000000 ? int - 0x80000000 : int;\n}\n\n\n// ######################\n// ### 9.1.6 ToUint32 ###\n// ######################\n\nexport function ToUint32(argument){\n  const number = ToNumber(argument);\n\n  if (isNaN(number) || isZeroOrInfinite(number)) {\n    return 0;\n  }\n\n  return sign(number) * floor(abs(number)) & 0xffffffff;\n}\n\n\n// ######################\n// ### 9.1.7 ToUint16 ###\n// ######################\n\nexport function ToUint16(argument){\n  const number = ToNumber(argument);\n\n  if (isNaN(number) || isZeroOrInfinite(number)) {\n    return 0;\n  }\n\n  return sign(number) * floor(abs(number)) & 0xffff;\n}\n\n\n// ######################\n// ### 9.1.8 ToString ###\n// ######################\n\nexport function ToString(argument){\n  switch (Type(argument)) {\n    case 'String':\n      return argument;\n    case 'Undefined':\n      return 'undefined';\n    case 'Number':\n      return $$Invoke(argument, 'toString');\n    case 'Null':\n      return 'null';\n    case 'Boolean':\n      return argument === true ? 'true' : 'false';\n    case 'Object':\n      return ToString(ToPrimitive(argument, 'String'));\n  }\n}\n\n\n// ######################\n// ### 9.1.9 ToObject ###\n// ######################\n\nexport function ToObject(argument){\n  switch (Type(argument)) {\n    case 'Object':\n      return argument;\n    case 'Undefined':\n      throw $$Exception('undefined_to_object', []);\n    case 'Null':\n      throw $$Exception('null_to_object', []);\n    case 'Boolean':\n      return new (getIntrinsic('%Boolean%'))(argument);\n    case 'Number':\n      return new (getIntrinsic('%Number%'))(argument);\n    case 'String':\n      return new (getIntrinsic('%String%'))(argument);\n  }\n}\n\n\n// ############################\n// ### 9.1.10 ToPropertyKey ###\n// ############################\n\nexport function ToPropertyKey(argument){\n  const type = Type(argument);\n\n  if (type === 'String' || type === 'Object' && hasBrand(argument, 'BuiltinSymbol')) {\n    return argument;\n  }\n\n  return ToString(argument);\n}\n\n\n\n// #################################################\n// ##### 9.2 Testing and Comparison Operations #####\n// #################################################\n\n\n// ##################################\n// ### 9.2.1 CheckObjectCoercible ###\n// ##################################\n\nexport function CheckObjectCoercible(argument){\n  if (argument === null) {\n    throw $$Exception('null_to_object', []);\n  } else if (argument === undefined) {\n    throw $$Exception('undefined_to_object', []);\n  }\n\n  return argument;\n}\n\n// ########################\n// ### 9.2.2 IsCallable ###\n// ########################\n\nexport function IsCallable(argument){\n  return Type(argument) === 'Object' && $$Has(argument, 'Call');\n}\n\n\n// #######################\n// ### 9.2.3 SameValue ###\n// #######################\n\nexport function SameValue(x, y){\n  return x === y ? x !== 0 || 1 / x === 1 / y : isNaN(x) && isNaN(y);\n}\n\n\n// ###########################\n// ### 9.2.4 IsConstructor ###\n// ###########################\n\nexport function IsConstructor(argument){\n  return Type(argument) === 'Object' && $$Has(argument, 'Construct');\n}\n\n// ###########################\n// ### 9.2.5 IsPropertyKey ###\n// ###########################\n\nexport function IsPropertyKey(argument){\n  const type = Type(argument);\n  return type === 'String' || type === 'Object' && hasBrand(argument, 'BuiltinSymbol');\n}\n\n\n\n\n// #####################################\n// ##### 9.3 Operations on Objects #####\n// #####################################\n\n\n// #################\n// ### 9.3.1 Get ###\n// #################\n\nexport function Get(O, P){\n  $$Assert(Type(O) === 'Object');\n  $$Assert(IsPropertyKey(P) === true);\n\n  return $$Invoke(O, 'GetP', O, P);\n}\n\n\n// #################\n// ### 9.3.2 Put ###\n// #################\n\nexport function Put(O, P, V, Throw){\n  $$Assert(Type(O) === 'Object');\n  $$Assert(IsPropertyKey(P) === true);\n  $$Assert(Type(Throw) === 'Boolean');\n\n  const success = $$Invoke(O, 'SetP', O, P, V);\n  if (Throw && !success) {\n    throw $$Exception('strict_cannot_assign', [P]);\n  }\n\n  return success;\n}\n\n\n// ###################################\n// ### 9.3.3 CreateOwnDataProperty ###\n// ###################################\n\nconst normal = $$CreateInternalObject();\n$$Set(normal, 'Writable', true);\n$$Set(normal, 'Enumerable', true);\n$$Set(normal, 'Configurable', true);\n\nexport function CreateOwnDataProperty(O, P, V){\n  $$Assert(Type(O) === 'Object');\n  $$Assert(IsPropertyKey(P) === true);\n  //$$Assert(!hasOwn(O, P));\n\n  const extensible = $$Invoke(O, 'IsExtensible');\n  if (!extensible) {\n    return extensible;\n  }\n\n  $$Set(normal, 'Value', V);\n  const result = $$Invoke(O, 'DefineOwnProperty', P, normal);\n  $$Set(normal, 'Value', undefined);\n\n  return result;\n}\n\n\n// ###################################\n// ### 9.3.4 DefinePropertyOrThrow ###\n// ###################################\n\nexport function DefinePropertyOrThrow(O, P, desc){\n  $$Assert(Type(O) === 'Object');\n  $$Assert(IsPropertyKey(P) === true);\n\n  const success = $$Invoke(O, 'DefineOwnProperty', P, desc);\n  if (!success) {\n    throw $$Exception('redefine_disallowed', [$$CallerName(), P]);\n  }\n\n  return success;\n}\n\n\n// ###################################\n// ### 9.3.5 DeletePropertyOrThrow ###\n// ###################################\n\nexport function DeletePropertyOrThrow(O, P){\n  $$Assert(Type(O) === 'Object');\n  $$Assert(IsPropertyKey(P) === true);\n\n  const success = $$Invoke(O, 'Delete', P); // TODO: rename to DeleteProperty\n  if (!success) {\n    throw $$Exception('delete_disallowed', [$$CallerName(), P]);\n  }\n  return success;\n}\n\n\n// non-spec function\nexport function PutPropertyOrThrow(O, P, value){\n  $$Assert(Type(O) === 'Object');\n  $$Assert(IsPropertyKey(P) === true);\n\n  const success = $$Invoke(O, 'Put', P, value);\n  if (!success) {\n    throw $$Exception('redefine_disallowed', [$$CallerName(), P]);\n  }\n  return success;\n}\n\n\n// #########################\n// ### 9.3.6 HasProperty ###\n// #########################\n\nexport function HasProperty(O, P){\n  $$Assert(Type(O) === 'Object');\n  $$Assert(IsPropertyKey(P) === true);\n\n  return $$Invoke(O, 'HasProperty', P);\n}\n\n\n// #######################\n// ### 9.3.7 GetMethod ###\n// #######################\n\nexport function GetMethod(O, P){\n  $$Assert(Type(O) === 'Object');\n  $$Assert(IsPropertyKey(P) === true);\n\n  const func = $$Invoke(O, 'GetP', O, P);\n  if (func === undefined) {\n    return func;\n  }\n\n  if (!IsCallable(func)) {\n    throw $$Exception('property_not_function', [P]);\n  }\n\n  return func;\n}\n\n\n// ####################\n// ### 9.3.8 Invoke ###\n// ####################\n\nconst emptyArgs = [];\n\nexport function Invoke(O, P, args){\n  $$Assert(IsPropertyKey(P) === true);\n\n  args || (args = emptyArgs);\n\n  const obj  = ToObject(O),\n        func = GetMethod(obj, P);\n\n  if (func === undefined) {\n    throw $$Exception('property_not_function', [P]);\n  }\n\n  return $$Invoke(func, 'Call', O, $$Get(args, 'array'));\n}\n\n\n// ################################\n// ### 9.3.9 TestIfSecureObject ###\n// ################################\n\nfunction TestIfSecureObject(O, immutable){}\n\n\n// ###############################\n// ### 9.3.10 MakeObjectSecure ###\n// ###############################\n\nfunction MakeObjectSecure(O, immutable){}\n\n\n// ##################################\n// ### 9.3.11 CreateArrayFromList ###\n// ##################################\n\nfunction CreateArrayFromList(elements){\n  $$AssertIsInternalArray(elements);\n\n  const array = ArrayCreate(0),\n        len   = $$Get(elements, 'length');\n\n  for (let n=0; n < len; n++) {\n    const element = $$Get(elements, n);\n    $$AssertIsECMAScriptValue(elements);\n    $$AssertWontThrow(CreateOwnDataProperty(array, ToString(n), element));\n  }\n\n  return array;\n}\n\n\n// ##################################\n// ### 9.3.12 OrdinaryHasInstance ###\n// ##################################\n\nexport function OrdinaryHasInstance(C, O){\n  if (!IsCallable(C)) {\n    return false;\n  }\n\n  if ($$Has(C, 'BoundTargetFunction')) {\n    return O instanceof $$Get(C, 'BoundTargetFunction');\n  }\n\n  if (Type(O) !== 'Object') {\n    return false;\n  }\n\n  const P = Get(C, 'prototype');\n  if (Type(P) !== 'Object') {\n    throw $$Exception('instanceof_nonobject_proto');\n  }\n\n  do {\n    O = $$Invoke(O, 'GetInheritance');\n    if (O === P) {\n      return true;\n    }\n  } while (O)\n\n  return false;\n}\n\n\n// ############################################\n// ### 9.3.13 OrdinaryCreateFromConstructor ###\n// ############################################\n\n\nexport function OrdinaryCreateFromConstructor(constructor, intrinsicDefaultProto){\n  if (Type(constructor) !== 'Object') {\n    throw $$Exception('construct_non_constructor', [Type(constructor)]);\n  }\n\n  let proto = Get(constructor, 'prototype');\n\n  if (!proto) {\n    const realm = $$Has(constructor, 'Realm') ? $$Get(constructor, 'Realm') : $$CurrentRealm();\n    proto = $$GetIntrinsic(realm, intrinsicDefaultProto);\n  }\n\n  return ObjectCreate(proto);\n}\n\n";

exports.builtins["@@operators"] = "import {\n  POSITIVE_INFINITY,\n  NEGATIVE_INFINITY\n} from '@@constants';\n\nimport {\n  GetMethod,\n  IsCallable,\n  OrdinaryHasInstance,\n  ToNumber,\n  ToPrimitive\n} from '@@operations';\n\nimport {\n  Type\n} from '@@types';\n\nimport {\n  call,\n  isNaN\n} from '@@utilities';\n\nimport {\n  $$Compare,\n  $$Exception\n} from '@@internals';\n\nimport {\n  @@hasInstance: hasInstance\n} from '@@symbols';\n\n\n\n\n// ###############################\n// ## 12.8 Relational Operators ##\n// ###############################\n\n// #######################################################\n// # 12.8.1 The Abstract Relational Comparison Algorithm #\n// #######################################################\n\nfunction AbstractRelationalComparison(x, y, LeftFirst = true){\n  let px, py;\n\n  if (LeftFirst) {\n    px = ToPrimitive(x, 'Number');\n    py = ToPrimitive(y, 'Number');\n  } else {\n    py = ToPrimitive(y, 'Number');\n    px = ToPrimitive(x, 'Number');\n  }\n\n  if (Type(px) === 'String' && Type(py) === 'String') {\n    // TODO: full string relational comparison\n    return $$Compare(px, py);\n  }\n\n  const nx = ToNumber(px),\n        ny = ToNumber(py);\n\n  if (isNaN(nx) || isNaN(ny)) {\n    return undefined;\n  } else if (nx === ny) {\n    return false;\n  } else if (nx === POSITIVE_INFINITY) {\n    return false;\n  } else if (ny === POSITIVE_INFINITY) {\n    return true;\n  } else if (ny === NEGATIVE_INFINITY) {\n    return false;\n  } else if (nx === NEGATIVE_INFINITY) {\n    return true;\n  }\n\n  return $$Compare(nx, ny);\n}\n\n\nfunction INSTANCE_OF(lref, rref){\n  return instanceofOperator(GetValue(lref), GetValue(rref));\n}\n\nfunction instanceofOperator(O, C){\n  const instOfHandler = GetMethod(C, @@hasInstance);\n\n  if (instOfHandler !== undefined) {\n    return call(instOfHandler, C, [O]);\n  }\n\n  if (!IsCallable(C)) {\n    throw $$Exception('instanceof_function_expected', [Type(C)]);\n  }\n\n  return OrdinaryHasInstance(C, O);\n}\n";

exports.builtins["@@types"] = "// #######################\n// ####### 8 Types #######\n// #######################\n\n\nimport {\n  $$ArgumentCount,\n  $$BoundFunctionCreate,\n  $$CreateObject,\n  $$CreateInternalObject,\n  $$CurrentRealm,\n  $$Get,\n  $$GetIntrinsic,\n  $$HasArgument,\n  $$Set\n} from '@@internals';\n\nimport {\n  MISSING\n} from '@@internal-symbols';\n\n\nconst ENUMERABLE   = 0x1,\n      CONFIGURABLE = 0x2,\n      WRITABLE     = 0x4,\n      ACCESSOR     = 0x8;\n\n// #########################################\n// ##### 8.1 ECMAScript Language Types #####\n// #########################################\n\n\n// ################################\n// ### 8.1.1 The Undefined Type ###\n// ################################\n\nexport const undefined = void 0;\n\n\n// ###########################\n// ### 8.1.2 The Null Type ###\n// ###########################\n\n// null\n\n\n// ##############################\n// ### 8.1.3 The Boolean Type ###\n// ##############################\n\n// true\n// false\n\n\n// #############################\n// ### 8.1.4 The String Type ###\n// #############################\n\n// #############################\n// ### 8.1.5 The Number Type ###\n// #############################\n\nexport const NaN = +'NaN';\nexport const Infinity = 1 / 0;\n\n\n\n// #############################\n// ### 8.1.6 The Object Type ###\n// #############################\n\n// ###############################\n// # 8.1.6.1 Property Attributes #\n// ###############################\n\n\n\nexport function isPrimitive(value){\n  switch (typeof value) {\n    case 'undefined':\n    case 'string':\n    case 'number':\n    case 'boolean':\n      return true;\n    default:\n      return value === null;\n  }\n}\n\nexport function Type(value){\n  switch (typeof value) {\n    case 'object':\n      return value === null ? 'Null' : 'Object';\n    case 'undefined':\n      return 'Undefined';\n    case 'function':\n      return 'Object';\n    case 'string':\n      return 'String';\n    case 'number':\n      return 'Number';\n    case 'boolean':\n      return 'Boolean';\n  }\n}\n\n\n\n// #############################################\n// # 8.1.6.3 Well-Known Symbols and Intrinsics #\n// #############################################\n/*\n@@create\n@@hasInstance\n@@iterator\n@@ToPrimitive\n@@toStringTag\n\n\n'%Object%'\n'%ObjectPrototype%'\n'%ObjProto_toString%'\n'%Function%'\n'%FunctionPrototype%'\n'%Array%'\n'%ArrayPrototype%'\n'%ArrayIteratorPrototype%'\n'%Map%'\n'%MapPrototype%'\n'%MapIteratorPrototype%'\n'%WeakMap%'\n'%WeakMapPrototype%'\n'%Set%'\n'%SetPrototype%'\n'%SetIteratorPrototype%'\n'%StopIteration%'\n*/\n// ####################################################\n// ### 8.2.2 The List and Record Specification Type ###\n// ####################################################\n\n\n// ######################################################\n// ### 8.2.3 The Completion Record Specification Type ###\n// ######################################################\n\n\nconst CompletionRecord = $$CreateInternalObject();\n$$Set(CompletionRecord, '_type', 'CompletionRecord');\n$$Set(CompletionRecord, 'type', 'normal');\n$$Set(CompletionRecord, 'value', undefined);\n$$Set(CompletionRecord, 'target', MISSING);\n\nexport function createCompletionRecord(type, value, target = MISSING){\n  const completion = $$CreateInternalObject(CompletionRecord);\n  $$Set(completion, 'type', type);\n  $$Set(completion, 'value', value);\n  $$Set(completion, 'target', target);\n  return completion;\n}\n\n\n// ############################\n// # 8.2.3.1 NormalCompletion #\n// ############################\n\nconst emptyCompletion = createCompletionRecord('normal');\n\nexport function NormalCompletion(argument){\n  const completion = $$CreateInternalObject(emptyCompletion);\n  $$Set(completion, 'value', argument);\n  return completion;\n}\n\n\n// ##############################\n// # 8.2.3.3 Throw an Exception #\n// ##############################\n\nconst thrownCompletion = createCompletionRecord('throw');\n\nexport function ThrowAnException(argument){\n  const completion = $$CreateInternalObject(thrownCompletion);\n  $$Set(completion, 'value', argument);\n  throw completion;\n}\n\n\n// ##########################\n// # 8.2.3.4 ReturnIfAbrupt #\n// ##########################\n\nexport function ReturnIfAbrupt(argument){\n  if (argument && $$Get(argument, '_type') === 'CompletionRecord') {\n    if ($$Get(argument, 'type') !== 'normal') {\n      throw argument;\n    }\n    return $$Get(argument, 'value');\n  }\n  return argument;\n}\n\n\n// ##############################################\n// ### 8.2.4 The Reference Specification Type ###\n// ##############################################\n\nconst Reference = $$CreateInternalObject();\n$$Set(Reference, '_type', 'Reference');\n$$Set(Reference, 'base', undefined);\n$$Set(Reference, 'name', '');\n$$Set(Reference, 'strict', false);\n$$Set(Reference, 'thisValue', undefined);\n\n\n// ########################################################\n// ### 8.2.5 The Property Descriptor Specification Type ###\n// ########################################################\n\n\nconst Descriptor = $$CreateInternalObject();\n$$Set(Descriptor, '_type', 'Descriptor');\n$$Set(Descriptor, 'Configurable', MISSING);\n$$Set(Descriptor, 'Enumerable', MISSING);\n$$Set(Descriptor, 'Writable', MISSING);\n$$Set(Descriptor, 'Value', MISSING);\n$$Set(Descriptor, 'Set', MISSING);\n$$Set(Descriptor, 'Get', MISSING);\n\nconst descriptorDefaults = $$CreateInternalObject(Descriptor);\n$$Set(descriptorDefaults, 'Configurable', false);\n$$Set(descriptorDefaults, 'Enumerable', false);\n$$Set(descriptorDefaults, 'Writable', false);\n$$Set(descriptorDefaults, 'Value', undefined);\n$$Set(descriptorDefaults, 'Set', undefined);\n$$Set(descriptorDefaults, 'Get', undefined);\n\n// Data Descriptors\nconst DataDescriptor = $$CreateInternalObject(Descriptor);\n$$Set(DataDescriptor, '_attrs', 0);\n\nexport function createDataDescriptor(value, writable, enumerable, configurable){\n  const desc = $$CreateInternalObject(DataDescriptor);\n  let attrs = 0;\n\n  if (configurable !== MISSING) {\n    if (configurable = !!(configurable)) {\n      attrs |= CONFIGURABLE;\n    }\n    $$Set(desc, 'Configurable', configurable);\n  }\n\n  if (enumerable !== MISSING) {\n    if (enumerable = !!(enumerable)) {\n      attrs |= ENUMERABLE;\n    }\n    $$Set(desc, 'Enumerable', !!(enumerable));\n  }\n\n  if (writable !== MISSING) {\n    if (writable = !!(writable)) {\n      writable |= WRITABLE;\n    }\n    $$Set(desc, 'Writable', !!(writable));\n  }\n\n  if (value !== MISSING) {\n    $$Set(desc, 'Value', value);\n  }\n\n  $$Set(desc, 'attrs', attrs);\n  return desc;\n}\n\n// Accessor Descriptors\nconst AccessorDescriptor = $$CreateInternalObject(Descriptor);\n$$Set(DataDescriptor, '_attrs', ACCESSOR);\n\nexport function createAccessorDescriptor(get, set, enumerable, configurable){\n  const desc = $$CreateInternalObject(AccessorDescriptor);\n  let attrs = ACCESSOR;\n\n  if (configurable !== MISSING) {\n    if (configurable = ToBoolean(configurable)) {\n      attrs |= CONFIGURABLE;\n    }\n    $$Set(desc, 'Configurable', configurable);\n  }\n\n  if (enumerable !== MISSING) {\n    if (enumerable = ToBoolean(enumerable)) {\n      attrs |= ENUMERABLE;\n    }\n    $$Set(desc, 'Enumerable', enumerable);\n  }\n\n  if (get !== MISSING) {\n    $$Set(desc, 'Set', get);\n  }\n\n  if (set !== MISSING) {\n    $$Set(desc, 'Get', set);\n  }\n\n  $$Set(desc, 'attrs', attrs);\n  return desc;\n}\n\nconst normal = createDataDescriptor(undefined, true, true, true);\n\nfunction defineNormal(obj, key, value){\n  $$Set(normal, 'Value', value);\n  const result = OrdinaryDefineOwnProperty(obj, key, normal);\n  $$Set(normal, 'Value', undefined);\n  return result;\n}\n\n// ################################\n// # 8.2.5.1 IsAccessorDescriptor #\n// ################################\n\nexport function IsAccessorDescriptor(Desc){\n  return Desc !== undefined && $$Get(Desc, 'Get') !== MISSING || $$Get(Desc, 'Set') !== MISSING;\n}\n\n// ################################\n// # 8.2.5.2 IsAccessorDescriptor #\n// ################################\n\nexport function IsDataDescriptor(Desc){\n  return Desc !== undefined && $$Get(Desc, 'Value') !== MISSING || $$Get(Desc, 'Writable') !== MISSING;\n}\n\n// ###############################\n// # 8.2.5.3 IsGenericDescriptor #\n// ###############################\n\nexport function IsGenericDescriptor(Desc){\n  return Desc !== undefined && !IsAccessorDescriptor(Desc) && !IsDataDescriptor(Desc);\n}\n\n// ##################################\n// # 8.2.5.4 FromPropertyDescriptor #\n// ##################################\n\nfunction isEmptyOrdinaryObject(obj){\n  return true;\n}\n\nexport function FromPropertyDescriptor(Desc){\n  if (Desc === undefined) {\n    return undefined;\n  } else if ($$Has(Desc, 'Origin')) {\n    return $$Get(Desc, 'Origin');\n  }\n\n  const obj = ObjectCreate();\n  $$Assert(isOrdinaryEmptyObject(obj));\n\n  if ($$Has(Desc, 'Value')) {\n    defineNormal(obj, 'value', $$Get(Desc, 'Value'));\n  }\n  if ($$Has(Desc, 'Writable')) {\n    defineNormal(obj, 'writable', $$Get(Desc, 'Writable'));\n  }\n  if ($$Has(Desc, 'Get')) {\n    defineNormal(obj, 'get', $$Get(Desc, 'Get'));\n  }\n  if ($$Has(Desc, 'Set')) {\n    defineNormal(obj, 'set', $$Get(Desc, 'Set'));\n  }\n  if ($$Has(Desc, 'Enumerable')) {\n    defineNormal(obj, 'enumerable', $$Get(Desc, 'Enumerable'));\n  }\n  if ($$Has(Desc, 'Configurable')) {\n    defineNormal(obj, 'configurable', $$Get(Desc, 'Configurable'));\n  }\n\n  return obj;\n}\n\n\n\n// ################################\n// # 8.2.5.5 ToPropertyDescriptor #\n// ################################\n\nexport function ToPropertyDescriptor(Obj){\n  if (Type(Obj) !== 'Object') {\n    throw $$Exception(); // TODO desc must be object\n  }\n\n  const enumerable   = HasProperty(Obj, 'enumerable')   ? Get(Obj, 'enumerable')   : MISSING,\n        configurable = HasProperty(Obj, 'configurable') ? Get(Obj, 'configurable') : MISSING,\n        value        = HasProperty(Obj, 'value')        ? Get(Obj, 'value')        : MISSING,\n        writable     = HasProperty(Obj, 'writable')     ? Get(Obj, 'writable')     : MISSING,\n        getter       = HasProperty(Obj, 'get')          ? Get(Obj, 'get')          : MISSING,\n        setter       = HasProperty(Obj, 'set')          ? Get(Obj, 'set')          : MISSING;\n\n  let desc;\n\n  if (getter !== MISSING || setter !== MISSING) {\n    if (value !== MISSING || writable !== MISSING) {\n      throw $$Exception(); // TODO accessor + data\n    }\n    if (getter !== MISSING && getter !== undefined && !IsCallable(getter)) {\n      throw $$Exception(); // TODO non-callable getter\n    }\n    if (setter !== MISSING && setter !== undefined && !IsCallable(setter)) {\n      throw $$Exception(); // TODO non-callable setter\n    }\n    desc = createAccessorDescriptor(get, set, enumerable, configurable);\n  } else {\n    desc = createDataDescriptor(value, writable, enumerable, configurable);\n  }\n\n  $$Set(desc, 'Origin', obj);\n  return desc;\n}\n\n\n// ######################################\n// # 8.2.5.6 CompletePropertyDescriptor #\n// ######################################\n\nfunction copy(Desc, LikeDesc, field){\n  if (!$$Has(Desc, field)) {\n    $$Set(Desc, field, $$Get(LikeDesc, field));\n  }\n}\n\nexport function CompletePropertyDescriptor(Desc, LikeDesc = descriptorDefaults){\n  $$Assert($$Get(LikeDesc, '_type') === 'Descriptor');\n  $$Assert($$Get(Desc, '_type') === 'Descriptor');\n\n  if (IsDataDescriptor(Desc) || IsGenericDescriptor(Desc)) {\n    copy(Desc, LikeDesc, 'Value');\n    copy(Desc, LikeDesc, 'Writable');\n  } else {\n    copy(Desc, LikeDesc, 'Get');\n    copy(Desc, LikeDesc, 'Set');\n  }\n\n  copy(Desc, LikeDesc, 'Enumerable');\n  copy(Desc, LikeDesc, 'Configurable');\n  return Desc;\n}\n\n\n// ##########################################\n// # 8.3.18 ObjectCreate Abstract Operation #\n// ##########################################\n\nexport function ObjectCreate(proto){\n  if (!$$ArgumentCount()) {\n    proto = $$GetIntrinsic('%ObjectPrototype%');\n  }\n  return $$CreateObject('Object', proto);\n}\n\n\n// ##########################################\n// # 8.4.2.3 ArrayCreate Abstract Operation #\n// ##########################################\n\nexport function ArrayCreate(length){\n  return $$CreateArray($$CurrentRealm(), length);\n}\n\n\n// ##################################################\n// # 8.4.1.3 BoundFunctionCreate Abstract Operation #\n// ##################################################\n\nexport function BoundFunctionCreate(targetFunction, boundThis, boundArgs){\n  return $$BoundFunctionCreate(targetFunction, boundThis, boundArgs);\n}\n";

exports.builtins["@@utilities"] = "import {\n  $$Invoke,\n  $$CreateInternalObject,\n  $$CreateObject,\n  $$CurrentRealm,\n  $$Exception,\n  $$Get,\n  $$GetIntrinsic,\n  $$Has,\n  $$NumberToString,\n  $$Set,\n  $$SetIntrinsic,\n  $$WrapDescriptor\n} from '@@internals';\n\nimport {\n  MAX_INTEGER,\n  MAX_VALUE,\n  MIN_VALUE,\n  NaN,\n  POSITIVE_INFINITY,\n  NEGATIVE_INFINITY,\n  undefined\n} from '@@constants';\n\nimport {\n  toStringTag\n} from '@@symbols';\n\nimport {\n  Type\n} from '@@types';\n\n\nconst FROZEN = 0,\n      HIDDEN = 6;\n\n\nconst padding = ['', '0', '00', '000', '0000', '00000', '000000'];\n\nexport function zeroPad(number, places = 2){\n  const num  = $$NumberToString(number),\n        len  = num.length,\n        diff = places - len;\n\n  if (diff > 0) {\n    return padding[diff] + num;\n  }\n  return num;\n}\n\ninternalFunction(zeroPad);\n\n\nfunction getKey(key){\n  if (typeof key === 'string') {\n    return key;\n  } else if (hasBrand(key, 'BuiltinSymbol')) {\n    return `@${$$Get(key, 'Name')}`;\n  }\n\n  return '';\n}\n\ninternalFunction(getKey);\n\nfunction getName(func){\n  return getKey(get(func, 'name'));\n}\n\ninternalFunction(getName);\n\n\nexport function abs(x){\n  return x < 0 ? -x : x;\n}\n\ninternalFunction(abs);\n\n\nexport function floor(x){\n  return x >> 0;\n}\n\ninternalFunction(floor);\n\n\nexport function sign(x){\n  return x < 0 ? -1 : 1;\n}\n\ninternalFunction(sign);\n\n\nexport function isZeroOrInfinite(x){\n  return x === 0 || x === POSITIVE_INFINITY || x === NEGATIVE_INFINITY;\n}\n\ninternalFunction(isZeroOrInfinite);\n\n\nexport function isNaN(x){\n  return x !== x;\n}\n\ninternalFunction(isNaN);\n\n\nexport function max(x, y){\n  return x > y ? x : y\n}\n\ninternalFunction(getGlobal);\n\nexport function min(x, y){\n  return x < y ? x : y;\n}\n\ninternalFunction(getGlobal);\n\n\nexport function isFinite(value){\n  return typeof value === 'number'\n      && !isNaN(value)\n      && value < POSITIVE_INFINITY\n      && value > NEGATIVE_INFINITY;\n}\n\ninternalFunction(isFinite);\n\n\nexport function isInteger(value) {\n  return typeof value === 'number'\n      && !isNaN(value)\n      && value > -MAX_INTEGER\n      && value < MAX_INTEGER\n      && value | 0 === value;\n}\n\ninternalFunction(isInteger);\n\n\nexport function hasBrand(obj, brand){\n  if (obj == null) {\n    return false;\n  }\n  return $$Get(obj, 'BuiltinBrand') === brand;\n}\n\ninternalFunction(hasBrand);\n\n\nconst emptyList = $$Get([], 'array');\n\nexport function call(func, receiver, args){\n  return $$Invoke(func, 'Call', receiver, args ? $$Get(args, 'array') : emptyList);\n}\n\ninternalFunction(call);\n\n\nexport function construct(func, args){\n  return $$Invoke(func, 'Construct', args ? $$Get(args, 'array') : emptyList);\n}\n\ninternalFunction(construct);\n\n\nexport function enumerate(obj, inherited, onlyEnumerable){\n  return $$CreateObject('Array', $$Invoke(obj, 'Enumerate', inherited, onlyEnumerable));\n}\n\ninternalFunction(enumerate);\n\n\nexport function ownKeys(obj){\n  return $$CreateObject('Array', $$Invoke(obj, 'OwnPropertyKeys'));\n}\n\ninternalFunction(enumerate);\n\n\nexport function deleteProperty(obj, key){\n  return $$Invoke(obj, 'remove', key);\n}\n\ninternalFunction(deleteProperty);\n\n\nexport function update(obj, key, attr){\n  return $$Invoke(obj, 'update', key, attr);\n}\n\ninternalFunction(update);\n\n\nexport function define(obj, key, value, attr){\n  return $$Invoke(obj, 'define', key, value, attr);\n}\n\ninternalFunction(define);\n\n\nexport function query(obj, key){\n  return $$Invoke(obj, 'query', key);\n}\n\ninternalFunction(query);\n\n\nexport function get(obj, key){\n  return $$Invoke(obj, 'get', key);\n}\n\ninternalFunction(get);\n\n\nexport function set(obj, key, value){\n  return $$Invoke(obj, 'set', key, value);\n}\n\ninternalFunction(set);\n\n\nexport function getOwnProperty(obj, key){\n  return $$WrapDescriptor($$Invoke(obj, 'GetOwnProperty', key));\n}\n\ninternalFunction(getOwnProperty);\n\nexport function createDescriptor(){\n  return $$WrapDescriptor($$CreateInternalObject());\n}\n\ninternalFunction(createDescriptor);\n\n\nexport function defineOwnProperty(obj, key, desc){\n  if (!$$Has(desc, 'descriptor')) {\n    const wrapped = createDescriptor();\n\n    if ('configurable' in desc) {\n      wrapped.configurable = desc.configurable;\n    }\n\n    if ('enumerable' in desc) {\n      wrapped.enumerable = desc.enumerable;\n    }\n\n    if ('writable' in desc) {\n      wrapped.writable = desc.writable;\n    }\n\n    if ('value' in desc) {\n      wrapped.value = desc.value;\n    }\n\n    if ('get' in desc) {\n      wrapped.get = desc.get;\n    }\n\n    if ('set' in desc) {\n      wrapped.set = desc.set;\n    }\n\n    desc = wrapped;\n  }\n\n  return $$Invoke(obj, 'DefineOwnProperty', key, $$Get(desc, 'descriptor'));\n}\n\ninternalFunction(defineOwnProperty);\n\n\nexport function builtinFunction(func){\n  $$Set(func, 'BuiltinFunction', true);\n  $$Set(func, 'BuiltinName', getKey(func.name));\n  deleteProperty(func, 'prototype');\n  update(func, 'name', 0);\n  define(func, 'caller', null, 0);\n  define(func, 'arguments', null, 0);\n}\n\ninternalFunction(builtinFunction);\n\n\nexport function internalFunction(func){\n  $$Set(func, 'InternalFunction', true);\n  $$Set(func, 'Strict', false);\n  deleteProperty(func, 'prototype');\n  deleteProperty(func, 'caller');\n  deleteProperty(func, 'arguments');\n}\n\ninternalFunction(internalFunction);\n\n\nexport function extend(obj, properties){\n  const keys = enumerate(properties, false, false);\n  let index = keys.length;\n\n  while (index--) {\n    const key   = keys[index],\n          desc  = $$Invoke(properties, 'GetOwnProperty', key);\n\n    $$Set(desc, 'Enumerable', false);\n\n    if ($$Has(desc, 'Value')) {\n      const value = $$Get(desc, 'Value');\n\n      if (typeof value === 'number') {\n        $$Set(desc, 'Configurable', false);\n        $$Set(desc, 'Writable', false);\n      } else if (typeof value === 'function') {\n        builtinFunction(value);\n      }\n    }\n\n    $$Invoke(obj, 'DefineOwnProperty', key, desc);\n  }\n}\n\ninternalFunction(extend);\n\n\nexport function extendInternal(internal, properties){\n  const keys = enumerate(properties, false, false);\n\n  let index = keys.length;\n\n  while (index--) {\n    const key = keys[index];\n    $$Set(internal, key, properties[key]);\n  }\n\n  return internal;\n}\n\ninternalFunction(extendInternal);\n\n\nexport function createInternal(proto, properties){\n  const internal = $$CreateInternalObject(proto);\n  return properties ? extendInternal(internal, properties) : internal;\n}\n\ninternalFunction(createInternal);\n\n\nexport function hideEverything(o, name){\n  if (Type(o) !== 'Object') {\n    return o;\n  }\n\n  const keys = enumerate(o, false, true);\n  let index = keys.length;\n\n  while (index--) {\n    const key   = get(keys, index),\n          attrs = query(o, key),\n          val   = get(o, key);\n\n    update(o, key, typeof val === 'number' ? FROZEN : attrs & ~1);\n\n    if (name && typeof val === 'function') {\n      $$Set(val, 'BuiltinName', `${name}.${getName(val)}`);\n    }\n  }\n\n  if (typeof o === 'function') {\n    hideEverything(get(o, 'prototype'), `${getName(o)}.prototype`);\n    $$Set(o, 'BuiltinName', getName(o));\n  }\n\n  return o;\n}\n\ninternalFunction(hideEverything);\n\n\nexport function builtinClass(Ctor, brand){\n  const prototype = $$GetIntrinsic(`%${Ctor.name}Prototype%`),\n        isSymbol  = Ctor.name === 'Symbol';\n\n  if (prototype) {\n    if (!isSymbol) {\n      extend(prototype, Ctor.prototype);\n      Ctor.prototype = prototype;\n    }\n  } else {\n    $$SetIntrinsic(`%${Ctor.name}%`, Ctor);\n    $$SetIntrinsic(`%${Ctor.name}Prototype%`, Ctor.prototype);\n  }\n\n  $$Set(Ctor, 'BuiltinConstructor', true);\n  $$Set(Ctor, 'BuiltinFunction', true);\n  update(Ctor, 'prototype', FROZEN);\n  define(Ctor, 'length', 1, FROZEN);\n  define(Ctor, 'caller', null, FROZEN);\n  define(Ctor, 'arguments', null, FROZEN);\n\n  if (!isSymbol) {\n    setBrand(Ctor.prototype, brand || `Builtin${Ctor.name}`);\n    setTag(Ctor.prototype, Ctor.name);\n    hideEverything(Ctor, getName(Ctor));\n  }\n}\n\ninternalFunction(builtinClass);\n\n\nexport function isInitializing(obj, internal){\n  return obj != null && $$Has(obj, internal) && $$Get(obj, internal) === undefined;\n}\n\ninternalFunction(isInitializing);\n\n\n\nexport function listFrom(array){\n  return $$Get(array, 'array') || $$Get([...array], 'array');\n}\n\ninternalFunction(listFrom);\n\n\nexport function listOf(...items){\n  return $$Get(items, 'array');\n}\n\ninternalFunction(listOf);\n\n\nconst cache = [];\n\nexport function numbers(start, end){\n  if (!isFinite(end)) {\n    end = start;\n    start = 0;\n  }\n\n  let index = end - start;\n\n  if (end > cache.length) {\n    while (index--) {\n      const curr = start + index;\n      cache[curr] = ToString(curr);\n    }\n  }\n\n  const result = [];\n  index = 0;\n\n  while (start < end) {\n    result[index++] = cache[start++];\n  }\n\n  return result;\n}\n\ninternalFunction(numbers);\n\n\nexport function getIntrinsic(name){\n  return $$GetIntrinsic($$CurrentRealm(), name);\n}\n\ninternalFunction(getIntrinsic);\n\n\nexport function setBrand(obj, brand){\n  $$Set(obj, 'BuiltinBrand', brand);\n}\n\ninternalFunction(setBrand);\n\n\nexport function setTag(obj, tag){\n  define(obj, toStringTag, tag);\n}\n\ninternalFunction(setTag);\n\n\nexport function ensureObject(o){\n  if (Type(o) !== 'Object') {\n    throw $$Exception('called_on_non_object', [$$CallerName()]);\n  }\n}\n\ninternalFunction(ensureObject);\n\n\nexport function ensureDescriptor(o){\n  if (o === null || typeof o !== 'object') {\n    throw $$Exception('property_desc_object', [Type(o), $$CallerName()])\n  }\n}\n\ninternalFunction(ensureDescriptor);\n\n\nexport function ensureArgs(o){\n  const brand = Type(o) === 'Object' ? $$Get(o, 'BuiltinBrand') : null;\n\n  if (brand === 'BuiltinArguments') {\n    return [...o];\n  } else if (brand === 'BuiltinArray') {\n    return o;\n  }\n\n  throw $$Exception('apply_wrong_args', [$$CallerName()]);\n}\n\ninternalFunction(ensureArgs);\n\n\nexport function ensureFunction(o){\n  if (typeof o !== 'function') {\n    throw $$Exception('called_on_non_function', [$$CallerName()]);\n  }\n}\n\ninternalFunction(ensureFunction);\n\n\nexport function ensureCallback(o){\n  if (typeof o !== 'function') {\n    throw $$Exception('callback_must_be_callable', [$$CallerName()]);\n  }\n}\n\ninternalFunction(ensureCallback);\n\n\nexport function ensureProto(proto){\n  if (proto !== null && Type(proto) !== 'Object') {\n    throw $$Exception('proto_object_or_null', [$$CallerName()])\n  }\n}\n\ninternalFunction(ensureProto);\n\n\nexport function getGlobal(){\n  return $$Get($$CurrentRealm(), 'global');\n}\n\ninternalFunction(getGlobal);\n";

exports.builtins["@array"] = "import {\n  @@create     : create,\n  @@toStringTag: toStringTag,\n  @@iterator   : iterator\n} from '@@symbols';\n\nimport {\n  undefined\n} from '@@constants';\n\nimport {\n  $$ArgumentCount,\n  $$Exception\n} from '@@internals';\n\nimport {\n  builtinClass,\n  builtinFunction,\n  call,\n  define,\n  ensureCallback,\n  ensureObject,\n  extend,\n  hasBrand,\n  internalFunction\n} from '@@utilities';\n\nimport {\n  DeletePropertyOrThrow,\n  PutPropertyOrThrow,\n  IsConstructor,\n  ToInteger,\n  ToObject,\n  ToString,\n  ToInt32,\n  ToUint32\n} from '@@operations';\n\nimport {\n  Type\n} from '@@types';\n\nimport {\n  Iterator,\n  StopIteration\n} from '@iter';\n\nimport {\n  Set,\n  add,\n  has\n} from '@set';\n\nimport {\n  min,\n  max,\n  floor\n} from '@math';\n\nimport {\n  hasOwn\n} from '@reflect';\n\n\n\nconst arrays = new Set;\n\nconst K = 0x01,\n      V = 0x02,\n      S = 0x04;\n\nconst kinds = {\n  'key': 1,\n  'value': 2,\n  'key+value': 3,\n  'sparse:key': 5,\n  'sparse:value': 6,\n  'sparse:key+value': 7\n};\n\n\n\nclass ArrayIterator extends Iterator {\n  private @array, // IteratedObject\n          @index, // ArrayIteratorNextIndex\n          @kind;  // ArrayIterationKind\n\n  constructor(array, kind){\n    this.@array = ToObject(array);\n    this.@index = 0;\n    this.@kind = kinds[kind];\n  }\n\n  next(){\n    ensureObject(this);\n\n    if (!hasOwn(this, @array) || !hasOwn(this, @index) || !hasOwn(this, @kind)) {\n      throw $$Exception('incompatible_array_iterator', ['ArrayIterator.prototype.next']);\n    }\n\n    const array = this.@array,\n          index = this.@index,\n          kind  = this.@kind,\n          len   = ToUint32(array.length);\n\n    if (kind & S) {\n      let found = false;\n      while (!found && index < len) {\n        found = index in array;\n        if (!found) {\n          index++;\n        }\n      }\n    }\n\n    if (index >= len) {\n      this.@index = Infinity;\n      throw StopIteration;\n    }\n\n    this.@index = index + 1;\n    const key = ToString(index);\n    return kind & V ? kind & K ? [key, array[key]] : array[key] : key;\n  }\n}\n\n\nbuiltinClass(ArrayIterator);\n\n\n\nfunction defaultComparefn(x, y){\n  return 1 - (ToString(x) < ToString(y));\n}\n\ninternalFunction(defaultComparefn);\n\n\nfunction truncate(value, shift){\n  return value >> shift << shift;\n}\n\ninternalFunction(truncate);\n\n\n\nexport class Array {\n  constructor(...values){\n    if (values.length === 1 && typeof values[0] === 'number') {\n      const result = [];\n      result.length = values[0];\n      return result;\n    }\n    return values;\n  }\n\n  concat(...items){\n    const array = [],\n          count = items.length;\n\n    let obj   = ToObject(this),\n        n     = 0,\n        index = 0;\n\n    do {\n      if (isArray(obj)) {\n        let len = ToUint32(obj.length),\n            i   = 0;\n\n        do {\n          if (i in obj) {\n            array[n++] = obj[i];\n          }\n        } while (++i < len)\n      } else {\n        array[n++] = obj;\n      }\n      obj = items[index];\n    } while (index++ < count)\n\n    return array;\n  }\n\n  entries(){\n    return new ArrayIterator(this, 'key+value');\n  }\n\n  every(callbackfn, context = undefined){\n    const array = ToObject(this),\n          len   = ToUint32(array.length);\n\n    ensureCallback(callbackfn);\n\n    if (len) {\n      let index = 0;\n      do {\n        if (index in array && !call(callbackfn, context, [array[index], index, array])) {\n          return false;\n        }\n      } while (++index < len)\n    }\n\n    return true;\n  }\n\n  filter(callbackfn, context = undefined){\n    const array  = ToObject(this),\n          len    = ToUint32(array.length),\n          result = [];\n\n    ensureCallback(callbackfn);\n\n    if (len) {\n      let index = 0;\n      do {\n        if (index in array) {\n          let element = array[index];\n          if (call(callbackfn, context, [element, index, array])) {\n            result[result.length] = element;\n          }\n        }\n      } while (++index < len)\n    }\n\n    return result;\n  }\n\n  forEach(callbackfn, context = undefined){\n    const array = ToObject(this),\n          len   = ToUint32(array.length);\n\n    ensureCallback(callbackfn);\n\n    for (let i = 0; i < len; i++) {\n      if (i in array) {\n        call(callbackfn, context, [array[i], i, this]);\n      }\n    }\n  }\n\n  indexOf(search, fromIndex = 0){\n    const array = ToObject(this),\n          len   = ToUint32(array.length);\n\n    if (len === 0) {\n      return -1;\n    }\n\n    let index = ToInteger(fromIndex);\n    if (index >= len) {\n      return -1;\n    } else if (index < 0) {\n      index += len;\n      if (index < 0) {\n        return -1;\n      }\n    }\n\n    do {\n      if (index in array && array[index] === search) {\n        return index;\n      }\n    } while (++index < len)\n\n    return -1;\n  }\n\n  join(separator){\n    const array = ToObject(this);\n\n    if (has(arrays, array)) {\n      return '';\n    }\n    add(arrays, array);\n\n    const sep = $$ArgumentCount() ? ToString(separator) : ',',\n          len = ToUint32(array.length);\n\n    if (len === 0) {\n      return '';\n    }\n\n    let result = '0' in array ? ToString(array[0]) : '',\n        index  = 0;\n\n    while (++index < len) {\n      result += index in array ? sep + ToString(array[index]) : sep;\n    }\n\n    arrays.delete(array);\n    return result;\n  }\n\n  keys(){\n    return new ArrayIterator(this, 'key');\n  }\n\n  lastIndexOf(search, fromIndex = this.length){\n    const array = ToObject(this),\n          len   = ToUint32(array.length);\n\n    if (len === 0) {\n      return -1;\n    }\n\n    let index = ToInteger(fromIndex);\n    if (index >= len) {\n      index = len - 1;\n    } else if (index < 0) {\n      index += len;\n      if (index < 0) {\n        return -1;\n      }\n    }\n\n    do {\n      if (index in array && array[index] === search) {\n        return index;\n      }\n    } while (index--)\n\n    return -1;\n  }\n\n  map(callbackfn, context = undefined){\n    const array  = ToObject(this),\n          len    = ToUint32(array.length),\n          result = [];\n\n    ensureCallback(callbackfn);\n\n    for (var i = 0; i < len; i++) {\n      if (i in array) {\n        result[i] = call(callbackfn, context, [array[i], i, this]);\n      }\n    }\n\n    return result;\n  }\n\n  pop(){\n    const array = ToObject(this),\n          len   = ToUint32(array.length) - 1;\n\n    if (len >= 0) {\n      const result = array[len];\n      array.length = len;\n      return result;\n    }\n  }\n\n  push(...values){\n    const array = ToObject(this),\n          len   = ToUint32(array.length),\n          count = values.length;\n\n    let index = len;\n\n    array.length += count;\n\n    for (var i = 0; i < count; i++) {\n      array[index++] = values[i];\n    }\n\n    return index;\n  }\n\n  reduce(callbackfn, initialValue){\n    const array = ToObject(this),\n          len   = ToUint32(array.length);\n\n    ensureCallback(callbackfn);\n\n    let accumulator, index;\n    if ($$ArgumentCount() > 1) {\n      accumulator = initialValue;\n      index = 0;\n    } else {\n      accumulator = array[0];\n      index = 1;\n    }\n\n    do {\n      if (index in array) {\n        accumulator = call(callbackfn, this, [accumulator, array[index], array]);\n      }\n    } while (++index < len)\n\n    return accumulator;\n  }\n\n  reduceRight(callbackfn, initialValue){\n    const array = ToObject(this),\n          len   = ToUint32(array.length);\n\n    ensureCallback(callbackfn);\n\n    let accumulator, index;\n    if ($$ArgumentCount() > 1) {\n      accumulator = initialValue;\n      index = len - 1;\n    } else {\n      accumulator = array[len - 1];\n      index = len - 2;\n    }\n\n    do {\n      if (index in array) {\n        accumulator = call(callbackfn, this, [accumulator, array[index], array]);\n      }\n    } while (--index >= 0)\n\n    return accumulator;\n  }\n\n  reverse(){\n    const array  = ToObject(this),\n          len    = ToUint32(array.length),\n          middle = floor(len / 2);\n\n    let lower = -1;\n    while (++lower !== middle) {\n      const upper       = len - lower - 1,\n            lowerP      = ToString(lower),\n            upperP      = ToString(upper),\n            lowerValue  = array[lowerP],\n            upperValue  = array[upperP];\n\n      if (upperP in array) {\n        PutPropertyOrThrow(array, lowerP, upperValue);\n        if (lowerP in array) {\n          PutPropertyOrThrow(array, upperP, lowerValue);\n        } else {\n          DeletePropertyOrThrow(array, upperP);\n        }\n      } else if (lowerP in array) {\n        PutPropertyOrThrow(array, upperP, lowerValue);\n      } else {\n        DeletePropertyOrThrow(array, lowerP);\n      }\n    }\n\n    return array;\n  }\n\n  slice(start = 0, end = this.length){\n    const array  = ToObject(this),\n          len    = ToUint32(array.length),\n          result = [];\n\n    start = ToInteger(start);\n    if (start < 0) {\n      start = max(len + start, 0);\n    }\n\n    end = ToInteger(end);\n    if (end < 0) {\n      end = max(len + end, 0);\n    } else {\n      end = min(end, len);\n    }\n\n    if (start < end) {\n      let newIndex = 0,\n          oldIndex = start;\n\n      do {\n        result[newIndex++] = array[oldIndex++];\n      } while (oldIndex < end)\n    }\n\n    return result;\n  }\n\n  shift(){\n    const array  = ToObject(this),\n          len    = ToUint32(array.length),\n          result = array[0];\n\n    if (!len) {\n      return result;\n    }\n\n    let oldIndex = 1,\n        newIndex = 0;\n\n    do {\n      if (oldIndex in array) {\n        PutPropertyOrThrow(array, newIndex, array[oldIndex]);\n      } else {\n        DeletePropertyOrThrow(array, newIndex);\n      }\n      newIndex++;\n    } while (++oldIndex < len)\n\n    PutPropertyOrThrow(array, 'length', len - 1);\n    return result;\n  }\n\n  some(callbackfn, context = undefined){\n    const array = ToObject(this),\n          len   = ToUint32(array.length);\n\n    ensureCallback(callbackfn);\n\n    if (len) {\n      let index = 0;\n      do {\n        if (index in array && call(callbackfn, context, [array[index], index, array])) {\n          return true;\n        }\n      } while (++index < len)\n    }\n\n    return false;\n  }\n\n  sort(comparefn = defaultComparefn){\n    const array = ToObject(this),\n          len   = array.length;\n\n    ensureCallback(comparefn);\n\n    if (len >= 2) {\n      let trunc = 1;\n\n      for (var start = truncate(len - 2, trunc); start >= 0; start -= 2) {\n        if (comparefn(array[start], array[start + 1]) > 0) {\n          [array[start], array[start + 1]] = [array[start + 1], array[start]];\n        }\n      }\n\n      if (len > 2) {\n        let a    = array,\n            b    = new Array(len),\n            size = 2;\n\n        do {\n          let start  = truncate(len - 1, ++trunc),\n              countA = start + size,\n              countB = len;\n\n          countA = min(countA, len);\n\n          while (start >= 0) {\n            let toIndex   = start,\n                fromA     = toIndex,\n                fromB     = countA,\n                continues = true;\n\n            do {\n              if (fromA < countA) {\n                if (fromB < countB) {\n                  if (comparefn(a[fromA], a[fromB]) > 0) {\n                    b[toIndex++] = a[fromB++];\n                  } else {\n                    b[toIndex++] = a[fromA++];\n                  }\n                } else {\n                  while (fromA < countA) {\n                    b[toIndex++] = a[fromA++];\n                  }\n                  continues = false;\n                }\n              } else {\n                while (fromB < countB) {\n                  b[toIndex++] = a[fromB++];\n                }\n                continues = false;\n              }\n            } while (continues)\n\n            countB = start;\n            start -= 2 * size;\n            countA = start + size;\n          }\n\n          [a, b] = [b, a];\n          size *= 2;\n        } while (len > size)\n\n        if (!(trunc & 1)) {\n          for (var i = len - 1; i >= 0; i--) {\n            array[i] = a[i];\n          }\n        }\n      }\n    }\n\n    return array;\n  }\n\n  splice(start, deleteCount, ...items){\n    const array     = ToObject(this),\n          len       = ToUint32(array.length),\n          itemCount = items.length,\n          result    = [];\n\n    start = ToInteger(start);\n    if (start < 0) {\n      start = max(len + start, 0);\n    } else {\n      start = min(start, len);\n    }\n\n    deleteCount = min(max(ToInteger(deleteCount), 0), len - start);\n\n    if (deleteCount > 0) {\n      let index = 0;\n\n      do {\n        let from = index + start;\n\n        if (from in array) {\n          PutPropertyOrThrow(result, index, array[from]);\n        }\n        index++;\n      } while (index < deleteCount)\n\n      PutPropertyOrThrow(result, 'length', deleteCount);\n    }\n\n    const count = len - deleteCount;\n\n    if (itemCount < deleteCount) {\n      let index = start;\n\n      while (index < count) {\n        let from = index + deleteCount,\n            to   = index + itemCount;\n\n        if (from in array) {\n          PutPropertyOrThrow(array, to, array[from]);\n        } else {\n          DeletePropertyOrThrow(array, to);\n        }\n        index++;\n      }\n    } else if (itemCount > deleteCount) {\n      let index = count;\n\n      while (index > start) {\n        let from = index + deleteCount - 1,\n            to   = index + itemCount - 1;\n\n        if (from in array) {\n          PutPropertyOrThrow(array, to, array[from]);\n        } else {\n          DeletePropertyOrThrow(array, to);\n        }\n\n        index--;\n      }\n    }\n\n    if (itemCount) {\n      let itemIndex = 0,\n          index     = start;\n\n      do {\n        PutPropertyOrThrow(array, index++, items[itemIndex++]);\n      } while (itemIndex < itemCount)\n    }\n\n    PutPropertyOrThrow(array, 'length', len - deleteCount + itemCount);\n\n    return result;\n  }\n\n  toLocaleString(){\n    const array = ToObject(this),\n          len   = ToUint32(array.length);\n\n    if (len === 0 || has(arrays, array)) {\n      return '';\n    }\n    add(arrays, array);\n\n    let next   = array[0],\n        result = next == null ? '' : next.toLocaleString(),\n        index  = 0;\n\n    while (++index < len) {\n      result += ',';\n      next = array[index];\n      if (next != null) {\n        result += next.toLocaleString();\n      }\n    }\n\n    arrays.delete(array);\n    return result;\n  }\n\n  toString(){\n    const array = ToObject(this);\n    let func = array.join;\n\n    if (typeof func !== 'function') {\n      func = $$GetIntrinsic('%ObjProto_toString%');\n    }\n\n    return call(func, array);\n  }\n\n  unshift(...values){\n    const array  = ToObject(this),\n          len    = ToUint32(array.length),\n          newLen = len + values.length;\n\n    if (len === newLen) {\n      return newLen;\n    }\n\n    PutPropertyOrThrow(array, 'length', newLen);\n\n    let oldIndex = len,\n        newIndex = newLen;\n\n    while (oldIndex-- > 0) {\n      newIndex--;\n      if (oldIndex in array) {\n        PutPropertyOrThrow(array, newIndex, array[oldIndex]);\n      } else {\n        DeletePropertyOrThrow(array, newIndex);\n      }\n    }\n\n    while (newIndex-- > 0) {\n      PutPropertyOrThrow(array, newIndex, values[newIndex]);\n    }\n\n    return newLen;\n  }\n\n  values(){\n    return new ArrayIterator(this, 'value');\n  }\n}\n\nbuiltinClass(Array);\nconst ArrayPrototype = Array.prototype;\ndefine(ArrayPrototype, @@iterator, ArrayPrototype.values);\n\n['push', 'reduce', 'reduceRight'].forEach(name => define(ArrayPrototype[name], 'length', 1, 0));\n\nexport function isArray(array){\n  return Type(array) === 'Object' ? hasBrand(array, 'BuiltinArray') : false;\n}\n\nexport function from(arrayLike){\n  const obj    = ToObject(arrayLike),\n        len    = ToUint32(obj.length),\n        Ctor   = IsConstructor(this) ? this : Array,\n        result = new Ctor(len);\n\n  for (var i = 0; i < len; i++) {\n    if (i in obj) {\n      result[i] = obj[i];\n    }\n  }\n\n  result.length = len;\n  return result;\n}\n\nexport function of(...items){\n  if (!IsConstructor(this)) {\n    return items;\n  }\n\n  const len    = items.length,\n        result = new this(len);\n\n  for (var i = 0; i < len; i++) {\n    result[i] = items[i];\n  }\n\n  result.length = len;\n  return result;\n}\n\nextend(Array, { isArray, from, of });\n";

exports.builtins["@binary-data"] = "import {\n  $$Invoke,\n  $$Exception,\n  $$Get,\n  $$Set\n} from '@@internals';\n\nimport {\n  builtinClass,\n  define,\n  extend,\n  hasBrand,\n  set\n} from '@@utilities';\n\nimport {\n  Type\n} from '@@types';\n\n\nclass Data {\n  constructor(){\n    throw $$Exception('abstract', 'Data');\n  }\n\n  update(value){\n    if (Type(this) !== 'Object' || !hasBrand(this, 'BuiltinData')) {\n      throw $$Exception('not_generic', ['Data.prototype.update']);\n    }\n\n    const R = $$Invoke($$Get(this, 'DataType'), 'Convert', [val]);\n    $$Invoke(this, 'SetValue', [Dereference(R)]);\n  }\n}\n\nextend(Data, {\n  array(number){\n    if (Type(this) !== 'Object' || !hasBrand(this, 'BuiltinDataType')) {\n      throw $$Exception('not_generic', ['DataType.prototype.array']);\n    }\n\n    return new ArrayType(this, number);\n  }\n});\n\nbuiltinClass(Data);\n\n\nexport class DataType extends Function {\n  constructor(){\n\n  }\n}\n\nset(DataType, 'prototype', Data);\nbuiltinClass(DataType);\n\n\n\nexport class ArrayType extends DataType {\n\n}\n\nbuiltinClass(ArrayType);\n\n\n\nexport class StructType extends DataType {\n\n}\n\nbuiltinClass(StructType);\n\n";

exports.builtins["@boolean"] = "// ################################\n// ##### 15.6 Boolean Objects #####\n// ################################\n\nimport {\n  $$ArgumentCount,\n  $$Exception,\n  $$Get,\n  $$Set\n} from '@@internals';\n\nimport {\n  OrdinaryCreateFromConstructor,\n  ToBoolean\n} from '@@operations';\n\nimport {\n  Type\n} from '@@types';\n\nimport {\n  builtinClass,\n  define,\n  extend,\n  hasBrand,\n  isInitializing\n} from '@@utilities';\n\nimport {\n  @@create: create\n} from '@@symbols';\n\n\n\n// #########################################################\n// ### 15.6.4 Properties of the Boolean Prototype Object ###\n// #########################################################\n\nexport class Boolean {\n  // ##########################################\n  // # 15.6.4.1 Boolean.prototype.constructor #\n  // ##########################################\n  constructor(value){\n    value = ToBoolean(value);\n\n    // 15.6.1.1 Boolean (value)\n    if (!isInitializing(this, 'BooleanValue')) {\n      return value;\n    }\n\n    // 15.6.2.1 new Boolean (value)\n    $$Set(this, 'BooleanValue', value);\n  }\n\n  // #######################################\n  // # 15.6.4.2 Boolean.prototype.toString #\n  // #######################################\n  toString(){\n    if (Type(this) === 'Boolean') {\n      return this ? 'true' : 'false';\n    } else if (hasBrand(this, 'BooleanWrapper')) {\n      return $$Get(this, 'BooleanValue') ? 'true' : 'false';\n    }\n\n    throw $$Exception('not_generic', ['Boolean.prototype.toString']);\n  }\n\n  // ######################################\n  // # 15.6.4.3 Boolean.prototype.valueOf #\n  // ######################################\n  valueOf(){\n    if (Type(this) === 'Boolean') {\n      return this;\n    } else if (hasBrand(this, 'BooleanWrapper')) {\n      return $$Get(this, 'BooleanValue');\n    }\n\n    throw $$Exception('not_generic', ['Boolean.prototype.valueOf']);\n  }\n}\n\n\nbuiltinClass(Boolean, 'BooleanWrapper');\n$$Set(Boolean.prototype, 'BooleanValue', false);\n\n\nextend(Boolean, {\n  // #############################\n  // # 15.6.3.2 Boolean.@@create #\n  // #############################\n  @@create(){\n    const obj = OrdinaryCreateFromConstructor(this, '%BooleanPrototype%');\n    $$Set(obj, 'BuiltinBrand', 'BooleanWrapper');\n    $$Set(obj, 'BooleanValue', undefined);\n    return obj;\n  }\n});\n";

exports.builtins["@console"] = "import {\n  now\n} from '@date';\n\nimport {\n  Map\n} from '@map';\n\nimport {\n  Error\n} from '@error';\n\nimport {\n  ToString\n} from '@@operations';\n\n\nimport {\n  createUndetectable,\n  signal\n} from '@continuum';\n\nconst QUIET = createUndetectable('quiet');\n\n\nexport class Console {\n  private @output, @timers, @write, @writeln;\n\n  constructor(output){\n    this.@output = output;\n    this.@timers = new Map;\n  }\n\n  @write(value, color = '#fff'){\n    this.@output.signal('write', ToString(value), ToString(color));\n  }\n\n  @writeln(value, color = '#fff'){\n    this.@output.signal('write', value + '\\n', ToString(color));\n  }\n\n  assert(expression, ...values){\n    if (!expression) {\n      values = values.join('');\n      this.@writeln(values);\n      throw new Error('Assertion failed: '+values);\n    }\n    return QUIET;\n  }\n\n  clear(){\n    this.@output.signal('clear');\n    return QUIET;\n  }\n\n  count(title){\n    // TODO\n  }\n\n  debug(...values){\n    this.@writeln(values.join(''));\n    return QUIET;\n  }\n\n  dir(object){\n    this.@output.signal('inspect', [object], true);\n    return QUIET;\n  }\n\n  dirxml(){\n    // TODO\n  }\n\n  error(...values){\n    this.@writeln('× '+values.join(''), '#f04');\n    return QUIET;\n  }\n\n  group(...values){\n    this.@writeln('» '+values.join(''));\n    this.@output.signal('group');\n  }\n\n  groupCollapsed(...values){\n    this.@writeln('» '+values.join(''));\n    this.@output.signal('group-collapsed');\n  }\n\n  groupEnd(){\n    this.@output.signal('group-end');\n  }\n\n  info(...values){\n    this.@writeln('† '+values.join(''), '#09f');\n    return QUIET;\n  }\n\n  log(...values){\n    this.@output.signal('inspect', values);\n    return QUIET;\n  }\n\n  profile(){\n    // TODO\n  }\n\n  profileEnd(){\n    // TODO\n  }\n\n  table(data, columns){\n    // TODO\n  }\n\n  time(name){\n    this.@timers[name] = now();\n    return QUIET;\n  }\n\n  timeEnd(name){\n    if (this.@timers.has(name)) {\n      const duration = now() - this.@timers.get(name);\n      this.@writeln(name + ': ' + duration + 'ms');\n    }\n    return QUIET;\n  }\n\n  timeStamp(name){\n    this.@writeln(name + ': ' + now());\n    return QUIET;\n  }\n\n  trace(error){\n    // TODO\n  }\n\n  warn(...values){\n    this.@writeln('! '+values.join(''), '#ff6');\n    return QUIET;\n  }\n}\n\n\nexport const console = new Console({ signal: signal });\n";

exports.builtins["@continuum"] = "import {\n  builtinFunction\n} from '@@utilities';\n\nimport {\n  $$CreateUndetectable,\n  $$CreateNil,\n  $$Get,\n  $$IsUndetectable,\n  $$Signal\n} from '@@internals';\n\n\nexport const nil = $$CreateNil();\n\nexport function createUndetectable(value){\n  return $$CreateUndetectable(value);\n}\n\nbuiltinFunction(createUndetectable);\n\n\nexport function unwrapUndetectable(value){\n  if ($$IsUndetectable(value)) {\n    return $$Get(value, 'value');\n  }\n}\n\nbuiltinFunction(unwrapUndetectable);\n\n\nexport function isUndetectable(value){\n  return $$IsUndetectable(value);\n}\n\nbuiltinFunction(isUndetectable);\n\n\nexport function signal(type, ...values){\n  $$Signal(type, ...values);\n}\n";

exports.builtins["@date"] = "// #############################\n// ##### 15.9 Date Objects #####\n// #############################\n\n\nimport {\n  $$ArgumentCount,\n  $$CallerHasArgument,\n  $$CallerName,\n  $$Get,\n  $$Exception,\n  $$Has,\n  $$HasArgument,\n  $$IsConstruct,\n  $$Now,\n  $$ParseDate,\n  $$RegExpExec,\n  $$Set\n} from '@@internals';\n\nimport {\n  OrdinaryCreateFromConstructor,\n  OrdinaryToPrimitive,\n  IsCallable,\n  ToInteger,\n  ToNumber,\n  ToObject,\n  ToPrimitive,\n  ToString\n} from '@@operations';\n\nimport {\n  Type\n} from '@@types';\n\nimport {\n  abs,\n  builtinClass,\n  call,\n  define,\n  extend,\n  hideEverything,\n  isFinite,\n  isInitializing,\n  isNaN,\n  floor,\n  zeroPad\n} from '@@utilities';\n\nimport {\n  DST_START_MONTH,\n  DST_START_SUNDAY,\n  DST_START_OFFSET,\n  DST_END_MONTH,\n  DST_END_SUNDAY,\n  DST_END_OFFSET,\n  LOCAL_TZ\n} from '@@date';\n\nimport {\n  NaN\n} from '@@constants';\n\nimport {\n  @@create     : create,\n  @@ToPrimitive: ToPrimitive\n} from '@@symbols';\n\n\n\nconst msPerSecond = 1000,\n      msPerMinute = 60 * msPerSecond,\n      msPerHour   = 60 * msPerMinute,\n      msPerDay    = 24 * msPerHour;\n\n\n// ###############################################\n// ### 15.9.1.2 Day Number and Time within Day ###\n// ###############################################\n\nfunction Day(t){\n  return floor(t / msPerDay);\n}\n\nfunction TimeWithinDay(t){\n  return t % msPerDay;\n}\n\n\n// ############################\n// ### 15.9.1.3 Year Number ###\n// ############################\n\nfunction DaysInYear(y){\n  if (y % 4) {\n    return 365;\n  } else if (y % 100) {\n    return 366;\n  } else if (y % 400) {\n    return 365;\n  }\n  return 366;\n}\n\nfunction DayFromYear(y){\n  return 365 * (y - 1970) + floor((y - 1969) / 4) - floor((y - 1901) / 100) + floor((y - 1601) / 400);\n}\n\nfunction TimeFromYear(y){\n  return msPerDay * DayFromYear(y);\n}\n\nfunction YearFromTime(t) {\n  let year = floor(t / (msPerDay * 365.2425)) + 1970;\n  const t2 = TimeFromYear(year);\n\n  if (t2 > t) {\n    return year - 1;\n  } else if (t2 + msPerDay * DaysInYear(year) <= t) {\n    return year + 1;\n  }\n\n  return year;\n}\n\nfunction InLeapYear(t){\n  return DaysInYear(YearFromTime(t)) - 365;\n}\n\n\n// #############################\n// ### 15.9.1.4 Month Number ###\n// #############################\n\nconst OFFSETS      = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365],\n      LEAP_OFFSETS = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366],\n      MONTH_DAYS   = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];\n\n\nfunction getDays(t){\n  return InLeapYear(t) ? LEAP_OFFSETS : OFFSETS\n}\n\nfunction daysInMonth(m, leap) {\n  m %= 12;\n  if (m === 1) {\n    return leap ? 28: 29;\n  }\n  return MONTH_DAYS[m];\n}\n\n\nfunction MonthFromTime(t){\n  const days = getDays(t),\n        day  = DayWithinYear(t);\n\n  if (day < days[6]) {\n    if (day < days[3]) {\n      if (day < days[1]) {\n        return 0;\n      } else if (day < days[2]) {\n        return 1;\n      } else {\n        return 2;\n      }\n    } else if (day < days[4]) {\n      return 3;\n    } else if (day < days[5]) {\n      return 4;\n    } else {\n      return 5;\n    }\n  } else if (day < days[9]) {\n    if (day < days[7]) {\n      return 6;\n    } else if (day < days[8]) {\n      return 7;\n    } else {\n      return 8;\n    }\n  } else if (day < days[10]) {\n    return 9;\n  } else if (day < days[11]) {\n    return 10;\n  } else {\n    return 11;\n  }\n}\n\nfunction DayWithinYear(t){\n  return Day(t) - DayFromYear(YearFromTime(t));\n}\n\n\n// ############################\n// ### 15.9.1.5 Date Number ###\n// ############################\n\nfunction DateFromTime(t){\n  return DayWithinYear(t) - getDays(t)[MonthFromTime(t)] + 1;\n}\n\n\n// #########################\n// ### 15.9.1.6 Week Day ###\n// #########################\n\nfunction WeekDay(t){\n  return (Day(t) + 4) % 7;\n}\n\n\nconst [\n  // ###########################################\n  // ### 15.9.1.7 Local Time Zone Adjustment ###\n  // ###########################################\n  LocalTZA,\n\n  // ################################################\n  // ### 15.9.1.8 Daylight Saving Time Adjustment ###\n  // ################################################\n  DaylightSavingTA\n\n] = (function(){\n  function nextMonth(adjustment){\n    return function(t, leap){\n      t += daysInMonth(adjustment, leap) * msPerDay;\n      return t - WeekDay(t) * msPerDay;\n    };\n  }\n\n  function currentMonth(adjustment){\n    return t => t + WeekDay(t) * msPerDay - msPerDay * 7;\n  }\n\n  const adjustFirst = (DST_START_SUNDAY ? nextMonth : currentMonth)(DST_START_MONTH),\n        adjustLast  = (DST_END_SUNDAY ? nextMonth : currentMonth)(DST_END_MONTH);\n\n\n  function DaylightSavingTA(t){\n    const year = TimeFromYear(YearFromTime(t)),\n          leap = InLeapYear(t);\n\n    if (DST_START_OFFSET + adjustFirst(year, leap) <= t && t < DST_END_OFFSET + adjustLast(year, leap)) {\n      return msPerHour;\n    }\n\n    return 0;\n  }\n\n  return [\n    LOCAL_TZ * msPerHour - DaylightSavingTA($$Now()),\n    DaylightSavingTA\n  ];\n})();\n\n\n// ###########################\n// ### 15.9.1.9 Local Time ###\n// ###########################\n\nfunction LocalTime(t){\n  return t + LocalTZA + DaylightSavingTA(t);\n}\n\nfunction ToUTC(t){\n  t -= LocalTZA;\n  return t - DaylightSavingTA(t);\n}\n\n\n// ##########################################################\n// ### 15.9.1.10 Hours, Minutes, Second, and Milliseconds ###\n// ##########################################################\n\n\nfunction HourFromTime(t){\n  return floor(t / msPerHour) % 24;\n}\n\nfunction MinFromTime(t){\n  return floor(t / msPerMinute) % 60;\n}\n\nfunction SecFromTime(t){\n  return floor(t / msPerSecond) % 60;\n}\n\nfunction msFromTime(t){\n  return t % 1000;\n}\n\n\n// ##########################\n// ### 15.9.1.11 MakeTime ###\n// ##########################\n\nfunction MakeTime(hour, min, sec, ms){\n  if (!(isFinite(hour) && isFinite(min) && isFinite(sec) && isFinite(ms))) {\n    return NaN;\n  }\n\n  hour = ToInteger(hour);\n  min = ToInteger(min);\n  sec = ToInteger(sec);\n  ms = ToInteger(ms);\n\n  return hour * msPerHour + min * msPerMinute + sec * msPerSecond + ms;\n}\n\n\n// #########################\n// ### 15.9.1.12 MakeDay ###\n// #########################\n\n// function MakeDay(year, month, date){\n//   if (!(isFinite(year) && isFinite(month) && isFinite(date))) {\n//     return NaN;\n//   }\n\n//   year = ToInteger(year);\n//   month = ToInteger(month);\n//   date = ToInteger(date);\n\n//   let t = year < 1970 ? 1 : 0;\n\n//   if (year < 1970){\n//     for (var i = 1969; i >= year; i--) {\n//       t -= DaysInYear(i) * msPerDay;\n//     }\n//   } else {\n//     for (var i = 1970; i < year; i++) {\n//       t += DaysInYear(i) * msPerDay;\n//     }\n//   }\n\n//   const days = getDays(t);\n//   for (var i = 0; i < month; i++) {\n//     t += days[i] * msPerDay;\n//   }\n\n//   if (YearFromTime(t) !== year + floor(month / 12) || MonthFromTime(t) !== month % 12 || DateFromTime(t) !== 1) {\n//     return NaN;\n//   }\n//   return Day(t) + date - 1;\n// }\n\nfunction MakeDay(year, month, date){\n  if (!(isFinite(year) && isFinite(month) && isFinite(date))) {\n    return NaN;\n  }\n\n  year = ToInteger(year);\n  month = ToInteger(month);\n  date = ToInteger(date);\n\n  return DayFromYear(year) + daysInMonth(month, InLeapYear(year)) + date - 1;\n}\n\n\n// ##########################\n// ### 15.9.1.13 MakeDate ###\n// ##########################\n\nfunction MakeDate(day, time){\n  if(!(isFinite(day) && isFinite(time))) {\n    return NaN;\n  }\n\n  return day * msPerDay + time;\n}\n\n\n// ##########################\n// ### 15.9.1.14 TimeClip ###\n// ##########################\n\nfunction TimeClip(time){\n  if(!isFinite(time) || abs(time) > 864e13){\n    return NaN;\n  }\n\n  //return ToInteger(time) + 0;\n  return time + 0;\n}\n\n\nfunction ensureDate(t){\n  if (t === undefined) {\n    throw $$Exception('not_generic', [`Date.prototype.${$$CallerName()}`]);\n  }\n}\n\n// ####################\n// ### Date Getters ###\n// ####################\n\nfunction getTimezone(t, divisor){\n  if (t === undefined) {\n    throw $$Exception('not_generic', [`Date.prototype.${$$CallerName()}`]);\n  }\n  return isNaN(t) ? t : (t - LocalTime(t)) / divisor;\n}\n\nfunction getTime(t, utc, callback){\n  if (t === undefined) {\n    throw $$Exception('not_generic', [`Date.prototype.${$$CallerName()}`]);\n  }\n  return isNaN(t) ? t : callback(utc ? t : LocalTime(t));\n}\n\nfunction coerceNaNToZero(t){\n  return isNaN(t) ? 0 : t;\n}\n\n// ####################\n// ### Date Setters ###\n// ####################\n\nfunction makeDate(utc, date){\n  const t  = LocalTime(utc),\n        dt = ToNumber(date);\n\n  return MakeDate(MakeDay(YearFromTime(t), MonthFromTime(t), dt), TimeWithinDay(t));\n}\n\nfunction makeFullYear(utc, year, month, date){\n  const lt = LocalTime(utc),\n        t  = isNaN(lt) ? 0 : lt,\n        y  = ToNumber(year),\n        m  = $$CallerHasArgument('month') ? ToNumber(month) : MonthFromTime(t),\n        dt = $$CallerHasArgument('date')  ? ToNumber(date)  : DateFromTime(t);\n\n  return MakeDate(MakeDay(y, m, dt), TimeWithinDay(t));\n}\n\nfunction makeHours(utc, hour, min, sec, ms){\n  const t     = LocalTime(utc),\n        h     = ToNumber(hour),\n        m     = $$CallerHasArgument('min') ? ToNumber(min) : MinFromTime(t),\n        s     = $$CallerHasArgument('sec') ? ToNumber(sec) : SecFromTime(t),\n        milli = $$CallerHasArgument('ms')  ? ToNumber(ms)  : msFromTime(t);\n\n  return MakeDate(Day(t), MakeTime(h, m, s, milli));\n}\n\nfunction makeMilliseconds(utc, ms){\n  const t     = LocalTime(utc),\n        milli = ToNumber(ms),\n        time  = MakeTime(HourFromTime(t), MinFromTime(t), SecFromTime(t), milli);\n\n  return MakeDate(Day(t), time);\n}\n\nfunction makeMinutes(utc, min, sec, ms){\n  const t     = LocalTime(utc),\n        m     = ToNumber(min),\n        s     = $$CallerHasArgument('sec') ? ToNumber(sec) : SecFromTime(t),\n        milli = $$CallerHasArgument('ms')  ? ToNumber(ms)  : msFromTime(t);\n\n  return MakeDate(Day(t), MakeTime(HourFromTime(t), m, s, milli));\n}\n\nfunction makeMonth(utc, month, date){\n  const t  = LocalTime(utc),\n        m  = ToNumber(month),\n        dt = $$CallerHasArgument('date') ? ToNumber(date) : DateFromTime(t);\n\n  return MakeDate(MakeDay(YearFromTime(t), m, dt), TimeWithinDay(t));\n}\n\nfunction makeSeconds(utc, sec, ms){\n  const t     = LocalTime(utc),\n        sec   = ToNumber(sec),\n        milli = $$CallerHasArgument('ms') ? ToNumber(ms) : msFromTime(t);\n\n  return MakeDate(Day(t), MakeTime(HourFromTime(t), MinFromTime(t), sec, milli));\n}\n\n\n// ##################################\n// ### Date to String Conversions ###\n// ##################################\n\nconst DAYS   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],\n      MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];\n\nfunction toString(t){\n  return `${toDateString(t)} ${toTimeString(t)}`;\n}\n\nfunction toDateString(t){\n  const weekday = DAYS[getTime(t, false, WeekDay)],\n        month   = MONTHS[getTime(t, false, MonthFromTime)],\n        date    = zeroPad(getTime(t, false, DateFromTime)),\n        year    = zeroPad(getTime(t, false, YearFromTime), 4);\n\n  return `${weekday} ${month} ${date} ${year}`;\n}\n\nfunction toTimeString(t){\n  const timezone = getTimezone(t, msPerHour),\n        hour     = zeroPad(getTime(t, false, HourFromTime)),\n        min      = zeroPad(getTime(t, false, MinFromTime)),\n        sec      = zeroPad(getTime(t, false, SecFromTime)),\n        tz       = (timezone < 0 ? '+' : '-') + zeroPad(abs(timezone) * 100, 4);\n\n  return `${hour}:${min}:${sec} GMT${tz}`;\n}\n\nfunction toLocaleString(t){\n  return `${toLocaleDateString(t)} ${toLocaleTimeString(t)}`;\n}\n\nfunction toLocaleDateString(t){\n  const month = zeroPad(getTime(t, false, MonthFromTime) + 1),\n        date  = zeroPad(getTime(t, false, DateFromTime)),\n        year  = zeroPad(getTime(t, false, YearFromTime), 4);\n\n  return `${month}/${date}/${year}`;\n}\n\nfunction toLocaleTimeString(t){\n  const h        = getTime(t, false, HourFromTime),\n        hour     = h % 12,\n        min      = zeroPad(getTime(t, false, MinFromTime)),\n        sec      = zeroPad(getTime(t, false, SecFromTime)),\n        meridiem = h === hour ? 'AM' : 'PM';\n\n  return `${hour || 12}:${min}:${sec} ${meridiem}`;\n}\n\n\n// ###########################\n// ### 15.9.4.2 Date.parse ###\n// ###########################\n\nconst dateParser = /^(\\d{4}|[+\\-]\\d{6})(?:-(\\d\\d)(?:-(\\d\\d))?)?(?:T(\\d\\d):(\\d\\d)(?::(\\d\\d)(?:\\.(\\d{3}))?)?(?:(Z)|([+\\-])(\\d\\d)(?::(\\d\\d))?)?)?$/;\n\nexport function parse(date){\n  const match = $$RegExpExec(dateParser, ToString(date));\n\n  if (match === null) {\n    return $$ParseDate(date);\n  }\n\n  let [, year, month, day, hours, minutes, seconds, ms, tzSep, tzSign, tzHours, tzMinutes] = match;\n\n  if (tzSep !== 'Z' && tzSign !== undefined) {\n    minutes = ToNumber(minutes) + (ToNumber(tzHours) * 60 + ToNumber(tzMinutes)) * -(tzSign === '+');\n  }\n\n  return UTC(ToNumber(year) || 0, (ToNumber(month) || 1) - 1, day, hours, minutes, seconds, ms);\n}\n\n\n// #########################\n// ### 15.9.4.3 Date.UTC ###\n// #########################\n\nexport function UTC(year, month, date = 1, hours = 0, minutes = 0, seconds = 0, ms = 0){\n  const y     = ToNumber(year),\n        m     = ToNumber(month),\n        dt    = ToNumber(date),\n        h     = ToNumber(hours),\n        min   = ToNumber(minutes),\n        s     = ToNumber(seconds),\n        milli = ToNumber(ms);\n\n  const yInt = ToInteger(y),\n        yr   = !isNaN(y) && 0 <= yInt && yInt <= 99 ? y + 1900 : y;\n\n  return TimeClip(MakeDate(MakeDay(yr, m, dt), MakeTime(h, min, s, milli)));\n}\n\n\n// #########################\n// ### 15.9.4.4 Date.now ###\n// #########################\n\nexport function now(){\n  return $$Now();\n}\n\n\n// ######################################################\n// ### 15.9.5 Properties of the Date Prototype Object ###\n// ######################################################\n\nexport class Date {\n  // ###########################################\n  // ### 15.9.5.1 Date.prototype.constructor ###\n  // ###########################################\n  constructor(year, month, date = 1, hours = 0, minutes = 0, seconds = 0, ms = 0){\n    if (!isInitializing(this, 'DateValue')) {\n      // 15.9.2 The Date Constructor Called as a Function\n      return toString($$Now());\n    }\n\n    // 15.9.3 The Date Constructor\n    const argc = $$ArgumentCount();\n    let value;\n\n    if (argc > 1) {\n      // 15.9.3.1 new Date (year, month [, date [, hours [, minutes [, seconds [, ms ] ] ] ] ] )\n      const y     = ToNumber(year),\n            m     = ToNumber(month),\n            dt    = ToNumber(date),\n            h     = ToNumber(hours),\n            min   = ToNumber(minutes),\n            s     = ToNumber(seconds),\n            milli = ToNumber(ms);\n\n      const yInt = ToInteger(y),\n            yr   = !isNaN(y) && 0 <= yInt && yInt <= 99 ? y + 1900 : y;\n\n\n      value = TimeClip(ToUTC(MakeDate(MakeDay(yr, m, dt), MakeTime(h, min, s, milli))));\n    } else if (argc === 1) {\n      // 15.9.3.2 new Date (value)\n      year = ToPrimitive(year);\n      value = TimeClip(typeof year === 'string' ? parse(year) : year)\n    } else {\n      // 15.9.3.3 new Date ( )\n      value = $$Now();\n    }\n\n    $$Set(this, 'DateValue', value);\n  }\n\n  // ########################################\n  // ### 15.9.5.2 Date.prototype.toString ###\n  // ########################################\n  toString(){\n    const t = $$Get(this, 'DateValue');\n\n    ensureDate(t);\n\n    return isNaN(t) ? 'Invalid Date' : toString(t);\n  }\n\n  // ############################################\n  // ### 15.9.5.3 Date.prototype.toDateString ###\n  // ############################################\n  toDateString(){\n    const t = $$Get(this, 'DateValue');\n\n    ensureDate(t);\n\n    return isNaN(t) ? 'Invalid Date' : toDateString(t);\n  }\n\n  // ############################################\n  // ### 15.9.5.4 Date.prototype.toTimeString ###\n  // ############################################\n  toTimeString(){\n    const t = $$Get(this, 'DateValue');\n\n    ensureDate(t);\n\n    return isNaN(t) ? 'Invalid Date' : toTimeString(t);\n  }\n\n  // ##############################################\n  // ### 15.9.5.5 Date.prototype.toLocaleString ###\n  // ##############################################\n  toLocaleString(){\n    const t = $$Get(this, 'DateValue');\n\n    ensureDate(t);\n\n    return isNaN(t) ? 'Invalid Date' : toLocaleString(t);\n  }\n\n  // ##################################################\n  // ### 15.9.5.6 Date.prototype.toLocaleDateString ###\n  // ##################################################\n  toLocaleDateString(){\n    const t = $$Get(this, 'DateValue');\n\n    ensureDate(t);\n\n    return isNaN(t) ? 'Invalid Date' : toLocaleDateString(t);\n  }\n\n  // ##################################################\n  // ### 15.9.5.7 Date.prototype.toLocaleTimeString ###\n  // ##################################################\n  toLocaleTimeString(){\n    const t = $$Get(this, 'DateValue');\n\n    ensureDate(t);\n\n    return isNaN(t) ? 'Invalid Date' : toLocaleTimeString(t);\n  }\n\n  // #######################################\n  // ### 15.9.5.8 Date.prototype.valueOf ###\n  // #######################################\n  valueOf(){\n    return $$Get(this, 'DateValue');\n  }\n\n  // #######################################\n  // ### 15.9.5.9 Date.prototype.getTime ###\n  // #######################################\n  getTime(){\n    return $$Get(this, 'DateValue');\n  }\n\n  // ############################################\n  // ### 15.9.5.10 Date.prototype.getFullYear ###\n  // ############################################\n  getFullYear(){\n    return getTime($$Get(this, 'DateValue'), false, YearFromTime);\n  }\n\n  // ###############################################\n  // ### 15.9.5.11 Date.prototype.getUTCFullYear ###\n  // ###############################################\n  getUTCFullYear(){\n    return getTime($$Get(this, 'DateValue'), true, YearFromTime);\n  }\n\n  // #########################################\n  // ### 15.9.5.12 Date.prototype.getMonth ###\n  // #########################################\n  getMonth(){\n    return getTime($$Get(this, 'DateValue'), false, MonthFromTime);\n  }\n\n  // ############################################\n  // ### 15.9.5.13 Date.prototype.getUTCMonth ###\n  // ############################################\n  getUTCMonth(){\n    return getTime($$Get(this, 'DateValue'), true, MonthFromTime);\n  }\n\n  // ########################################\n  // ### 15.9.5.14 Date.prototype.getDate ###\n  // ########################################\n  getDate(){\n    return getTime($$Get(this, 'DateValue'), false, DateFromTime);\n  }\n\n  // ###########################################\n  // ### 15.9.5.15 Date.prototype.getUTCDate ###\n  // ###########################################\n  getUTCDate(){\n    return getTime($$Get(this, 'DateValue'), true, DateFromTime);\n  }\n\n  // #######################################\n  // ### 15.9.5.16 Date.prototype.getDay ###\n  // #######################################\n  getDay(){\n    return getTime($$Get(this, 'DateValue'), false, WeekDay);\n  }\n\n  // ##########################################\n  // ### 15.9.5.17 Date.prototype.getUTCDay ###\n  // ##########################################\n  getUTCDay(){\n    return getTime($$Get(this, 'DateValue'), true, WeekDay);\n  }\n\n  // #########################################\n  // ### 15.9.5.18 Date.prototype.getHours ###\n  // #########################################\n  getHours(){\n    return getTime($$Get(this, 'DateValue'), false, HourFromTime);\n  }\n\n  // ############################################\n  // ### 15.9.5.19 Date.prototype.getUTCHours ###\n  // ############################################\n  getUTCHours(){\n    return getTime($$Get(this, 'DateValue'), true, HourFromTime);\n  }\n\n  // ###########################################\n  // ### 15.9.5.20 Date.prototype.getMinutes ###\n  // ###########################################\n  getMinutes(){\n    return getTime($$Get(this, 'DateValue'), false, MinFromTime);\n  }\n\n  // ##############################################\n  // ### 15.9.5.21 Date.prototype.getUTCMinutes ###\n  // ##############################################\n  getUTCMinutes(){\n    return getTime($$Get(this, 'DateValue'), true, MinFromTime);\n  }\n\n  // ###########################################\n  // ### 15.9.5.22 Date.prototype.getSeconds ###\n  // ###########################################\n  getSeconds(){\n    return getTime($$Get(this, 'DateValue'), false, SecFromTime);\n  }\n\n  // ##############################################\n  // ### 15.9.5.23 Date.prototype.getUTCSeconds ###\n  // ##############################################\n  getUTCSeconds(){\n    return getTime($$Get(this, 'DateValue'), true, SecFromTime);\n  }\n\n  // ################################################\n  // ### 15.9.5.24 Date.prototype.getMilliseconds ###\n  // ################################################\n  getMilliseconds(){\n    return getTime($$Get(this, 'DateValue'), false, msFromTime);\n  }\n\n  // ###################################################\n  // ### 15.9.5.25 Date.prototype.getUTCMilliseconds ###\n  // ###################################################\n  getUTCMilliseconds(){\n    return getTime($$Get(this, 'DateValue'), true, msFromTime);\n  }\n\n  // ##################################################\n  // ### 15.9.5.26 Date.prototype.getTimezoneOffset ###\n  // ##################################################\n  getTimezoneOffset(){\n    return getTimezone($$Get(this, 'DateValue'), msPerMinute);\n  }\n\n  // ########################################\n  // ### 15.9.5.27 Date.prototype.setTime ###\n  // ########################################\n  setTime(time){\n    return $$Set(this, 'DateValue', TimeClip(ToNumber(time)));\n  }\n\n  // ################################################\n  // ### 15.9.5.28 Date.prototype.setMilliseconds ###\n  // ################################################\n  setMilliseconds(ms){\n    return $$Set(this, 'DateValue', TimeClip(ToUTC(makeMilliseconds($$Get(this, 'DateValue'), ms))));\n  }\n\n  // ###################################################\n  // ### 15.9.5.29 Date.prototype.setUTCMilliseconds ###\n  // ###################################################\n  setUTCMilliseconds(ms){\n    return $$Set(this, 'DateValue', TimeClip(makeMilliseconds($$Get(this, 'DateValue'), ms)));\n  }\n\n  // ###########################################\n  // ### 15.9.5.30 Date.prototype.setSeconds ###\n  // ###########################################\n  setSeconds(sec, ms){\n    return $$Set(this, 'DateValue', TimeClip(ToUTC(makeSeconds($$Get(this, 'DateValue'), sec, ms))));\n  }\n\n  // ##############################################\n  // ### 15.9.5.31 Date.prototype.setUTCSeconds ###\n  // ##############################################\n  setUTCSeconds(sec, ms){\n    return $$Set(this, 'DateValue', TimeClip(makeSeconds($$Get(this, 'DateValue'), sec, ms)));\n  }\n\n  // ###########################################\n  // ### 15.9.5.32 Date.prototype.setMinutes ###\n  // ###########################################\n  setMinutes(min, sec, ms){\n    return $$Set(this, 'DateValue', TimeClip(ToUTC(makeMinutes($$Get(this, 'DateValue'), min, sec, ms))));\n  }\n\n  // ##############################################\n  // ### 15.9.5.33 Date.prototype.setUTCMinutes ###\n  // ##############################################\n  setUTCMinutes(min, sec, ms){\n    return $$Set(this, 'DateValue', TimeClip(makeMinutes($$Get(this, 'DateValue'), min, sec, ms)));\n  }\n\n  // #########################################\n  // ### 15.9.5.34 Date.prototype.setHours ###\n  // #########################################\n  setHours(hour, min, sec, ms){\n    return $$Set(this, 'DateValue', TimeClip(ToUTC(makeHours($$Get(this, 'DateValue'), hour, min, sec, ms))));\n  }\n\n  // ############################################\n  // ### 15.9.5.35 Date.prototype.setUTCHours ###\n  // ############################################\n  setUTCHours(hour, min, sec, ms){\n    return $$Set(this, 'DateValue', TimeClip(makeHours($$Get(this, 'DateValue'), hour, min, sec, ms)));\n  }\n\n  // ########################################\n  // ### 15.9.5.36 Date.prototype.setDate ###\n  // ########################################\n  setDate(date){\n    return $$Set(this, 'DateValue', TimeClip(ToUTC(makeDate($$Get(this, 'DateValue'), date))));\n  }\n\n  // ###########################################\n  // ### 15.9.5.37 Date.prototype.setUTCDate ###\n  // ###########################################\n  setUTCDate(date){\n    return $$Set(this, 'DateValue', TimeClip(makeDate($$Get(this, 'DateValue'), date)));\n  }\n\n  // #########################################\n  // ### 15.9.5.38 Date.prototype.setMonth ###\n  // #########################################\n  setMonth(month, date){\n    return $$Set(this, 'DateValue', TimeClip(ToUTC(makeMonth($$Get(this, 'DateValue'), month, date))));\n  }\n\n  // ############################################\n  // ### 15.9.5.39 Date.prototype.setUTCMonth ###\n  // ############################################\n  setUTCMonth(month, date){\n    return $$Set(this, 'DateValue', TimeClip(makeMonth($$Get(this, 'DateValue'), month, date)));\n  }\n\n  // ############################################\n  // ### 15.9.5.40 Date.prototype.setFullYear ###\n  // ############################################\n  setFullYear(year, month, date){\n    return $$Set(this, 'DateValue', TimeClip(ToUTC(makeFullYear($$Get(this, 'DateValue'), year, month, date))));\n  }\n\n  // ###############################################\n  // ### 15.9.5.41 Date.prototype.setUTCFullYear ###\n  // ###############################################\n  setUTCFullYear(year, month, date){\n    return $$Set(this, 'DateValue', TimeClip(makeFullYear($$Get(this, 'DateValue'), year, month, date)));\n  }\n\n  // ############################################\n  // ### 15.9.5.42 Date.prototype.toUTCString ###\n  // ############################################\n  toUTCString(){\n    const t = $$Get(this, 'DateValue');\n\n    ensureDate(t);\n\n    if (isNaN(t)) {\n      return 'Invalid Date';\n    }\n\n    const weekday = DAYS[getTime(t, true, WeekDay)],\n          date    = zeroPad(getTime(t, true, DateFromTime)),\n          month   = MONTHS[getTime(t, true, MonthFromTime)],\n          year    = zeroPad(getTime(t, true, YearFromTime), 4),\n          hour    = zeroPad(getTime(t, true, HourFromTime)),\n          min     = zeroPad(getTime(t, true, MinFromTime)),\n          sec     = zeroPad(getTime(t, true, SecFromTime));\n\n    return `${weekday}, ${date} ${month} ${year} ${hour}:${min}:${sec} GMT`;\n  }\n\n  // ############################################\n  // ### 15.9.5.43 Date.prototype.toISOString ###\n  // ############################################\n  toISOString(){\n    const t = $$Get(this, 'DateValue');\n\n    ensureDate(t);\n\n    if (isNaN(t)) {\n      return 'Invalid Date';\n    }\n\n    const year  = zeroPad(getTime(t, true, YearFromTime), 4),\n          month = zeroPad(getTime(t, true, MonthFromTime) + 1),\n          date  = zeroPad(getTime(t, true, DateFromTime)),\n          hour  = zeroPad(getTime(t, true, HourFromTime)),\n          min   = zeroPad(getTime(t, true, MinFromTime)),\n          sec   = zeroPad(getTime(t, true, SecFromTime)),\n          ms    = zeroPad(getTime(t, true, msFromTime), 3);\n\n    return `${year}-${month}-${date}T${hour}:${min}:${sec}.${ms}Z`;\n  }\n\n  // #######################################\n  // ### 15.9.5.44 Date.prototype.toJSON ###\n  // #######################################\n  toJSON(){\n    const obj = ToObject(this);\n\n    if (!isFinite(ToPrimitive(obj, 'Number'))) {\n      return null;\n    }\n\n    const toISO = obj.toISOString;\n\n    if (!IsCallable(toISO)) {\n      throw $$Exception('called_non_callable', ['Date.prototype.toISOString']);\n    }\n\n    return call(toISO, obj);\n  }\n\n  // ##############################################\n  // ### 15.9.5.45 Date.prototype.@@ToPrimitive ###\n  // ##############################################\n  @@ToPrimitive(hint){\n    if (Type(this) !== 'Object') {\n      throw $$Exception('cannot_convert_to_primitive2', ['Date.prototype.@@ToPrimitive']);\n    }\n\n    const tryFirst = hint === 'string' || hint === 'default' ? 'string' : 'number';\n\n    return OrdinaryToPrimitive(this, tryFirst);\n  }\n}\n\nbuiltinClass(Date);\n$$Set(Date.prototype, 'DateValue', NaN);\nextend(Date, { parse, UTC, now });\n\nextend(Date, {\n  // 15.9.4.6 Date.@@create\n  @@create(){\n    const obj = OrdinaryCreateFromConstructor(this, '%DatePrototype%');\n    $$Set(obj, 'BuiltinBrand', 'BuiltinDate');\n    $$Set(obj, 'DateValue', undefined);\n    return obj;\n  }\n});\n";

exports.builtins["@debugger"] = "import {\n  dict\n} from '@dict';\n\nimport {\n  WeakMap\n} from '@weakmap';\n\n\nfunction ensureHandler(value){\n  if (value !== undefined && typeof value !== 'function') {\n    throw new TypeError(`${$$CallerName()} must be a function or undefined`);\n  }\n}\n\nexport class Debugger {\n  private @enabled,\n          @globals,\n          @uncaughtExceptionHook,\n          @onNewScript,\n          @onDebuggerStatement,\n          @onEnterFrame,\n          @onEnterFrame,\n          @onThrow,\n          @onException,\n          @onExceptionUnwind,\n          @onError,\n          @onNewGlobalObject,\n\n  constructor(...globals){\n    this.uncaughtExceptionHook = null;\n    this.@globals = new WeakMap;\n\n    for (let global of globals) {\n      this.addDebuggee(global);\n    }\n\n    this.enabled = true;\n  }\n\n  addDebuggee(global){\n    if (!hasBrand(global, 'GlobalObject')) {\n      throw new TypeError('Only global objects may be debugged');\n    }\n\n    const globals = this.@globals;\n\n    if (globals.has(global)) {\n      return globals.get(global);\n    }\n\n    if ($$CurrentRealm() === $$Get(global, 'Realm')) {\n      // TODO this check isn't adequate since Realms are inherited for the purpose of modules\n      throw new Error('Debuggee must belong to a different realm than debugger');\n    }\n\n    return globals.set(global, new DebuggerObject(global));\n  }\n\n  removeDebuggee(global){\n    if (!hasBrand(global, 'GlobalObject')) {\n      if (global instanceof DebuggerObject) {\n\n      }\n    }\n    this.@globals.delete(global);\n  }\n\n  hasDebuggee(global){\n\n  }\n\n  getDebuggees(){\n\n  }\n\n  getNewestFrame(){\n\n  }\n\n  findScriptURLs(query){\n    assertSignature(query, Undefined, String);\n  }\n\n  findScripts(query){\n    assertSignature(query, Undefined, Query);\n  }\n\n  set enabled(value){\n    if (value !== this.@enabled) {\n      this.@enabled = value;\n      $$ToggleDebugger(this, value);\n    }\n  }\n\n  get enabled(){\n    return this.@enabled;\n  }\n\n  get uncaughtExceptionHook(){\n    return $$GetUncaughtExceptionHook(this);\n  }\n\n  set uncaughtExceptionHook(value){\n    if (typeof value !== 'function' && value !== null) {\n      throw new TypeError('uncaughtExceptionHook must be either a function or null');\n    }\n    $$SetUncaughtExceptionHook(this, value);\n  }\n\n  get onNewScript(){\n    return this.@onNewScript;\n  }\n\n  set onNewScript(value){\n    assertSignature(value, Undefined, Function);\n    if (value !== this.@onNewScript) {\n      this.@onNewScript = value;\n      this.@setHandler('onNewScript', value);\n    }\n  }\n\n  get onDebuggerStatement(){\n    return this.@onDebuggerStatement;\n  }\n\n  set onDebuggerStatement(value){\n    assertSignature(value, Undefined, Function);\n    if (value !== this.@onDebuggerStatement) {\n      this.@onDebuggerStatement = value;\n      this.@setHandler('onDebuggerStatement', value);\n    }\n  }\n\n  get onEnterFrame(){\n    return this.@onEnterFrame;\n  }\n\n  set onEnterFrame(value){\n    assertSignature(value, Undefined, Function);\n    if (value !== this.@onEnterFrame) {\n      this.@onEnterFrame = value;\n      this.@setHandler('onEnterFrame', value);\n    }\n  }\n\n  get onThrow(){\n    return this.@onThrow;\n  }\n\n  set onThrow(value){\n    assertSignature(value, Undefined, Function);\n    if (value !== this.@onThrow) {\n      this.@onThrow = value;\n      this.@setHandler('onThrow', value);\n    }\n  }\n\n  get onException(){\n    return this.@onException;\n  }\n\n  set onException(value){\n    assertSignature(value, Undefined, Function);\n    if (value !== this.@onException) {\n      this.@onException = value;\n      this.@setHandler('onException', value);\n    }\n  }\n\n  get onExceptionUnwind(){\n    return this.@onExceptionUnwind;\n  }\n\n  set onExceptionUnwind(value){\n    assertSignature(value, Undefined, Function);\n    if (value !== this.@onExceptionUnwind) {\n      this.@onExceptionUnwind = value;\n      this.@setHandler('onExceptionUnwind', value);\n    }\n  }\n\n  get onError(){\n    return this.@onError;\n  }\n\n  set onError(value){\n    assertSignature(value, Undefined, Function);\n    if (value !== this.@onError) {\n      this.@onError = value;\n      this.@setHandler('onError', value);\n    }\n  }\n\n  get onNewGlobalObject(){\n    return this.@onNewGlobalObject;\n  }\n\n  set onNewGlobalObject(value){\n    assertSignature(value, Undefined, Function);\n    if (value !== this.@onNewGlobalObject) {\n      this.@onNewGlobalObject = value;\n      this.@setHandler('onNewGlobalObject', value);\n    }\n  }\n}\n\n\nconst DebuggerDebuggeeWouldRun = Debugger.DebuggeeWouldRun = class DebuggeeWouldRun {\n  constructor(cause){\n    if (cause) {\n      this.cause = cause;\n    }\n  }\n};\n\nconst DebuggerFrame = Debugger.Frame = class Frame {\n  constructor(){\n\n  }\n\n  eval(code){\n    assertSignature(code, String);\n  }\n\n  evalWithBindings(code, bindings){\n    assertSignature(code, String);\n    assertSignature(bindings, Object);\n  }\n\n  pop(completion){\n    assertSignature(completion, CompletionValue);\n  }\n\n  replaceCall(func, thisArg, ...arguments){\n    assertSignature(func, DebuggerObject);\n    assertSignature(thisArg, DebuggeeValue);\n    assertSignatures(arguments, DebuggeeValue);\n  }\n\n  get onStep(){\n    return this.@onStep;\n  }\n\n  set onStep(value){\n    assertSignature(value, Undefined, Function);\n    if (value !== this.@onStep) {\n      this.@onStep = value;\n      this.@setHandler('onStep', value);\n    }\n  }\n\n  get onPop(){\n    return this.@onPop;\n  }\n\n  set onPop(value){\n    assertSignature(value, Undefined, Function);\n    if (value !== this.@onPop) {\n      this.@onPop = value;\n      this.@setHandler('onPop', value);\n    }\n  }\n\n  get onResume(){\n    return this.@onResume;\n  }\n\n  set onResume(value){\n    assertSignature(value, Undefined, Function);\n    if (value !== this.@onResume) {\n      this.@onResume = value;\n      this.@setHandler('onResume', value);\n    }\n  }\n\n  get type(){\n    return $$Get()\n  }\n\n  get this(){\n  }\n\n  get older(){\n  }\n\n  get depth(){\n  }\n\n  get live(){\n  }\n\n  get script(){\n  }\n\n  get offset(){\n  }\n\n  get environment(){\n  }\n\n  get callee(){\n  }\n\n  get generator(){\n  }\n\n  get constructing(){\n  }\n};\n\nconst DebuggerScript = Debugger.Script = class Script {\n  decompile(pretty){\n    assertSignature(pretty, Undefined, Boolean);\n  }\n\n  getAllOffsets(){\n  }\n\n  getLineOffsets(line){\n    assertSignature(line, Number);\n  }\n\n  getOffsetLine(offset){\n    assertSignature(offset, Number);\n  }\n\n  getChildScripts(){\n  }\n\n  setBreakpoint(offset, handler){\n    assertSignature(offset, Number);\n    assertSignature(handler, BreakpointHandler);\n  }\n\n  getBreakpoints(offset){\n    assertSignature(offset, Undefined, Number);\n  }\n\n  clearBreakpoints(handler, offset){\n    assertSignature(handler, BreakpointHandler);\n    assertSignature(offset, Undefined, Number);\n  }\n\n  get url(){\n  }\n\n  get startLine(){\n  }\n\n  get lineCount(){\n  }\n\n  get staticLevel(){\n  }\n};\n\nconst DebuggerObject = Debugger.Object = class Object {\n  getProperty(name) {\n    assertSignature(name, String);\n  }\n\n  setProperty(name, value){\n    assertSignature(name, String);\n    assertSignature(value, DebuggeeValue);\n  }\n\n  getOwnPropertyDescriptor(name){\n    assertSignature(name, String);\n  }\n\n  getOwnPropertyNames(){\n  }\n\n  defineProperty(name, attributes){\n    assertSignature(name, String);\n    assertSignature(attributes, Descriptor);\n  }\n\n  defineProperties(properties){\n    assertSignature(properties, Object);\n  }\n\n  deleteProperty(name){\n    assertSignature(name, String);\n  }\n\n  seal(){\n  }\n\n  freeze(){\n  }\n\n  preventExtensions(){\n  }\n\n  isSealed(){\n  }\n\n  isFrozen(){\n  }\n\n  isExtensible(){\n  }\n\n  copy(value){\n    assertSignature(value, DebuggerObject);\n  }\n\n  create(prototype, properties){\n    assertSignature(prototype, DebuggerObject, Null);\n    assertSignature(properties, Undefined, Object);\n  }\n\n  makeDebuggeeValue(value){\n  }\n\n  decompile(pretty){\n    assertSignature(pretty, Undefined, Boolean);\n  }\n\n  call(thisArg, ...arguments){\n    assertSignature(thisArg, DebuggeeValue, AsConstructor);\n    assertSignatures(arguments, DebuggeeValue);\n  }\n\n  apply(thisArg, arguments){\n    assertSignature(thisArg, DebuggeeValue, AsConstructor);\n    assertSignature(arguments, DebuggeeValue);\n  }\n\n  evalInGlobal(code){\n    assertSignature(code, String);\n  }\n\n  evalInGlobalWithBindings(code, bindings){\n    assertSignature(code, String);\n    assertSignature(bindings, Object);\n  }\n\n  asEnvironment(){\n  }\n\n  setObjectWatchpoint(handler){\n    assertSignature(handler, WatchpointHandler, Null);\n  }\n\n  clearObjectWatchpoint(){\n  }\n\n  setPropertyWatchpoint(name, handler){\n    assertSignature(name, String);\n    assertSignature(handler, WatchpointHandler, Null);\n  }\n\n  clearPropertyWatchpoint(name){\n    assertSignature(name, String);\n  }\n\n  unwrap(){\n  }\n\n  get proto(){\n  }\n\n  get brand(){\n  }\n\n  get callable(){\n  }\n\n  get name(){\n  }\n\n  get displayName(){\n  }\n\n  get parameters(){\n  }\n\n  get script(){\n  }\n\n  get environment(){\n  }\n\n  get proxyHandler(){\n  }\n\n  get global(){\n  }\n};\n\nconst DebuggerEnvironment = Debugger.Environment = class Environment {\n  names(){\n  }\n\n  getVariable(name){\n    assertSignature(name, String);\n  }\n\n  setVariable(name, value){\n    assertSignature(name, String);\n    assertSignature(value, DebuggeeValue);\n  }\n\n  getVariableDescriptor(name){\n    assertSignature(name, String);\n  }\n\n  defineVariable(name, descriptor){\n    assertSignature(name, String);\n    assertSignature(descriptor, Descriptor);\n  }\n\n  deleteVariable(name){\n    assertSignature(name, String);\n  }\n\n  find(name){\n    assertSignature(name, String);\n  }\n\n  eval(code){\n    assertSignature(code, String);\n  }\n\n  evalWithBindings(code, bindings){\n    assertSignature(code, String);\n    assertSignature(bindings, Object);\n  }\n\n  get type(){\n  }\n\n  get parent(){\n  }\n\n  get object(){\n  }\n\n  get thisValue(){\n  }\n};\n";

exports.builtins["@dict"] = "import {\n  builtinFunction\n} from '@@utilities';\n\nimport {\n  ObjectCreate\n} from '@@types';\n\nimport {\n  ToObject\n} from '@@operations';\n\nimport {\n  hasOwn\n} from '@reflect';\n\n\nexport function keys(obj){\n  obj = ToObject(obj);\n  return (function*(){\n    for (let x in obj) {\n      if (hasOwn(obj, x)) {\n        yield x;\n      }\n    }\n  })();\n}\n\nbuiltinFunction(keys);\n\n\nexport function values(obj){\n  obj = ToObject(obj);\n  return (function*(){\n    for (let x in obj) {\n      if (hasOwn(obj, x)) {\n        yield obj[x];\n      }\n    }\n  })();\n}\n\nbuiltinFunction(values);\n\n\nexport function entries(obj){\n  obj = ToObject(obj);\n  return (function*(){\n    for (let x in obj) {\n      if (hasOwn(obj, x)) {\n        yield [x, obj[x]];\n      }\n    }\n  })();\n}\n\nbuiltinFunction(entries);\n\n\nexport function dict(init){\n  const d = ObjectCreate(null);\n  if (init) {\n    for (let key of keys(init)) {\n      d[key] = init[key];\n    }\n  }\n  return d;\n}\n\nbuiltinFunction(dict);\n";

exports.builtins["@error"] = "import {\n  @@create: create\n} from '@@symbols';\n\n\nimport {\n  $$CreateObject,\n  $$Get,\n  $$GetIntrinsic,\n  $$Set\n} from '@@internals';\n\nimport {\n  builtinClass,\n  define,\n  extend,\n  isInitializing\n} from '@@utilities';\n\nimport {\n  OrdinaryCreateFromConstructor,\n  ToString\n} from '@@operations';\n\n\nconst global = $$GetIntrinsic('global');\n\nconst HIDDEN = 6;\n\n\n\nfunction setOrigin(filename = '', origin = null){\n  this.filename = filename;\n  this.origin = origin;\n}\n\nfunction setCode(loc, code){\n  const start    = $$Get(loc, 'start'),\n        line     = $$Get(start, 'line'),\n        column   = $$Get(start, 'column'),\n        fullLine = code.split('\\n')[line - 1];\n\n  this.line = fullLine;\n  this.column = column;\n  this.code = line + '\\n' + '-'.repeat(column) + '^';\n}\n\n\n\nexport class Error {\n  constructor(message){\n    if (!isInitializing(this, 'setCode')) {\n      return new Error(message);\n    }\n\n    this.message = ToString(message);\n    $$Set(this, 'setCode', setCode);\n    $$Set(this, 'setOrigin', setOrigin);\n  }\n\n  toString(){\n    return `${this.name}: ${this.message}`;\n  }\n}\n\ndefine(Error.prototype, 'name', 'Error', HIDDEN);\ndefine(Error.prototype, 'message', '', HIDDEN);\n\nextend(Error, {\n  @@create(){\n    const obj = OrdinaryCreateFromConstructor(this, '%ErrorPrototype%');\n    $$Set(obj, 'setCode', undefined);\n    $$Set(obj, 'setOrigin', undefined);\n    $$Set(obj, 'BuiltinBrand', 'BuiltinError');\n    return obj;\n  }\n});\n\nbuiltinClass(Error);\n\n\n\nexport class EvalError extends Error {\n  constructor(message){\n    if (!isInitializing(this, 'setCode')) {\n      return new EvalError(message);\n    }\n\n    super(message);\n  }\n}\n\nbuiltinClass(EvalError);\ndefine(EvalError.prototype, 'name', 'EvalError', HIDDEN);\n\n\nexport class RangeError extends Error {\n  constructor(message){\n    if (!isInitializing(this, 'setCode')) {\n      return new RangeError(message);\n    }\n\n    super(message);\n  }\n}\n\nbuiltinClass(RangeError);\ndefine(RangeError.prototype, 'name', 'RangeError', HIDDEN);\n\n\nexport class ReferenceError extends Error {\n  constructor(message){\n    if (!isInitializing(this, 'setCode')) {\n      return new ReferenceError(message);\n    }\n\n    super(message);\n  }\n}\n\nbuiltinClass(ReferenceError);\ndefine(ReferenceError.prototype, 'name', 'ReferenceError', HIDDEN);\n\n\n\nexport class SyntaxError extends Error {\n  constructor(message){\n    if (!isInitializing(this, 'setCode')) {\n      return new SyntaxError(message);\n    }\n\n    super(message);\n  }\n}\n\nbuiltinClass(SyntaxError);\ndefine(SyntaxError.prototype, 'name', 'SyntaxError', HIDDEN);\n\n\nexport class TypeError extends Error {\n  constructor(message){\n    if (!isInitializing(this, 'setCode')) {\n      return new TypeError(message);\n    }\n\n    super(message);\n  }\n}\n\nbuiltinClass(TypeError);\ndefine(TypeError.prototype, 'name', 'TypeError', HIDDEN);\n\n\nexport class URIError extends Error {\n  constructor(message){\n    if (!isInitializing(this, 'setCode')) {\n      return new URIError(message);\n    }\n\n    super(message);\n  }\n}\n\nbuiltinClass(URIError);\ndefine(URIError.prototype, 'name', 'URIError', HIDDEN);\n";

exports.builtins["@function"] = "// #################################\n// ##### 15.3 Function Objects #####\n// #################################\n\n\nimport {\n  @@create: create,\n  @@hasInstance: hasInstance\n} from '@@symbols';\n\nimport {\n  OrdinaryCreateFromConstructor,\n  OrdinaryHasInstance,\n  ToString\n} from '@@operations';\n\nimport {\n  BoundFunctionCreate\n} from '@@types';\n\nimport {\n  builtinClass,\n  builtinFunction,\n  define,\n  ensureArgs,\n  ensureFunction,\n  getGlobal,\n  hasBrand,\n  listFrom\n} from '@@utilities';\n\nimport {\n  $$EvaluateInGlobal,\n  $$Get,\n  $$Has,\n  $$Invoke\n} from '@@internals';\n\nimport {\n  $$StringSlice\n} from '@@string';\n\n\nconst global = getGlobal();\n\n\n// ##########################################################\n// ### 15.3.4 Properties of the Function Prototype Object ###\n// ##########################################################\n\nexport class Function {\n  // ###########################################\n  // # 15.3.4.1 Function.prototype.constructor #\n  // ###########################################\n  constructor(...args){\n    const argCount = args.length;\n\n    let bodyText,\n        paramText;\n\n    if (argCount === 0) {\n      bodyText = '';\n      paramText = '';\n    } else if (argCount === 1) {\n      bodyText = ToString(args[0]);\n      paramText = '';\n    } else {\n      let index = 0;\n\n      paramText = ToString(args[0]);\n      while (++index < argCount - 1) {\n        paramText += ',' + ToString(args[index]);\n      }\n\n      bodyText = ToString(args[index]);\n    }\n\n    bodyText = '\\n' + bodyText + '\\n';\n\n    return $$EvaluateInGlobal(`(function anonymous(${paramText}) {${bodyText}})`, global);\n  }\n\n  // ########################################\n  // # 15.3.4.2 Function.prototype.toString #\n  // ########################################\n  toString(){\n    ensureFunction(this, 'Function.prototype.toString');\n\n    let obj = this;\n    while ($$Has(obj, 'ProxyTarget')) {\n      obj = $$Get(obj, 'ProxyTarget');\n    }\n\n    if ($$Get(obj, 'BuiltinFunction') || !$$Has(obj, 'Code')) {\n      let name = obj.name;\n\n      if (hasBrand(name, 'BuiltinSymbol')) {\n        name = `@${$$Get(name, 'Name')}`;\n      }\n\n      return `function ${name}() { [native code] }`;\n    }\n\n    const code  = $$Get(obj, 'Code'),\n          range = $$Get(code, 'range');\n\n    return $$StringSlice($$Get(code, 'source'), $$Get(range, '0'), $$Get(range, '1'));\n  }\n\n  // #####################################\n  // # 15.3.4.3 Function.prototype.apply #\n  // #####################################\n  apply(thisArg, argArray){\n    ensureFunction(this, 'Function.prototype.apply');\n    return $$Invoke(this, 'Call', thisArg, listFrom(ensureArgs(argArray)));\n  }\n\n  // ####################################\n  // # 15.3.4.4 Function.prototype.call #\n  // ####################################\n  call(thisArg, ...args){\n    ensureFunction(this, 'Function.prototype.call');\n    return $$Invoke(this, 'Call', thisArg, listFrom(args));\n  }\n\n  // ####################################\n  // # 15.3.4.5 Function.prototype.bind #\n  // ####################################\n  bind(thisArg, ...args){\n    ensureFunction(this, 'Function.prototype.bind');\n    return BoundFunctionCreate(this, thisArg, listFrom(args));\n  }\n\n  // ########################################\n  // # 15.3.4.6 Function.prototype.@@create #\n  // ########################################\n  @@create(){\n    return OrdinaryCreateFromConstructor(this, '%ObjectPrototype%');\n  }\n\n  // #############################################\n  // # 15.3.4.7 Function.prototype.@@hasInstance #\n  // #############################################\n  @@hasInstance(V){\n    return OrdinaryHasInstance(this, V);\n  }\n}\n\nbuiltinClass(Function);\n\ndefine(Function.prototype, 'length', 0, 0);\ndefine(Function.prototype, 'name', '', 0);\n\n\n\nexport function apply(func, thisArg, args){\n  ensureFunction(func, '@function.apply');\n  return $$Invoke(func, 'Call', thisArg, listFrom(ensureArgs(args)));\n}\n\nbuiltinFunction(apply);\n\n\nexport function call(func, thisArg, ...args){\n  ensureFunction(func, '@function.call');\n  return $$Invoke(func, 'Call', thisArg, listFrom(args));\n}\n\nbuiltinFunction(call);\n\n\nexport function bind(func, thisArg, ...args){\n  ensureFunction(func, '@function.bind');\n  return BoundFunctionCreate(func, thisArg, listFrom(args));\n}\n\nbuiltinFunction(bind);\n";

exports.builtins["@globals"] = "import {\n  $$CreateEval,\n  $$Get,\n  $$GetIntrinsic,\n  $$Set\n} from '@@internals';\n\nimport {\n  builtinFunction,\n  define,\n  setTag\n} from '@@utilities';\n\nimport {\n  ToNumber,\n  ToPrimitive,\n  ToString\n} from '@@operations';\n\nimport {\n  $$DecodeURI,\n  $$DecodeURIComponent,\n  $$EncodeURI,\n  $$EncodeURIComponent,\n  $$Escape,\n  $$ParseFloat,\n  $$ParseInt,\n  $$Unescape\n} from '@@globals';\n\nsetTag($$GetIntrinsic('global'), 'global');\nsetTag($$GetIntrinsic('StopIteration'), 'StopIteration');\n\n\nexport function decodeURI(value){\n  return $$DecodeURI(ToString(value));\n}\n\nbuiltinFunction(decodeURI);\n\n\nexport function decodeURIComponent(value){\n  return $$DecodeURIComponent(ToString(value));\n}\n\nbuiltinFunction(decodeURIComponent);\n\n\nexport function encodeURI(value){\n  return $$EncodeURI(ToString(value));\n}\n\nbuiltinFunction(encodeURI);\n\n\nexport function encodeURIComponent(value){\n  return $$EncodeURIComponent(ToString(value));\n}\n\nbuiltinFunction(encodeURIComponent);\n\n\nexport function escape(value){\n  return $$Escape(ToString(value));\n}\n\nbuiltinFunction(escape);\n\n\nexport const eval = $$CreateEval();\n$$Set(eval, 'FormalParameters', $$Get(function eval(x){}, 'FormalParameters'));\n\n\nexport function isFinite(number){\n  number = ToNumber(number);\n  return number === number && number !== Infinity && number !== -Infinity;\n}\n\nbuiltinFunction(isFinite);\n\n\nexport function isNaN(number){\n  number = ToNumber(number);\n  return number !== number;\n}\n\nbuiltinFunction(isNaN);\n\n\nexport function parseFloat(value){\n  return $$ParseFloat(ToPrimitive(value));\n}\n\nbuiltinFunction(parseFloat);\n\n\nexport function parseInt(value, radix){\n  return $$ParseInt(ToPrimitive(value), ToNumber(radix));\n}\n\nbuiltinFunction(parseInt);\n\n\nexport function unescape(value){\n  return $$Unescape(ToString(value));\n}\n\nbuiltinFunction(unescape);\n";

exports.builtins["@iter"] = "import {\n  $$CurrentRealm,\n  $$GetIntrinsic\n} from '@@internals';\n\nimport {\n  builtinClass,\n  builtinFunction\n} from '@@utilities';\n\nimport {\n  @@iterator: iterator\n} from '@@symbols';\n\nimport {\n  ToObject\n} from '@@operations';\n\n\nexport const iterator = @@iterator;\n\n\nexport function zip(a, b){\n  const keys = a.@@iterator(),\n        vals = b.@@iterator();\n\n  return (function*(){\n    while (true) {\n      yield [keys.next(), vals.next()];\n    }\n  })();\n}\n\nbuiltinFunction(zip);\n\n\nexport function unzip(iterable){\n  const obj = ToObject(iterable);\n\n  if ('values' in obj) {\n    const keys = 'keys' in obj ? obj.keys() : obj.values(),\n          vals = obj.values();\n\n    return [ (function*(){ while (1) yield keys.next() })(),\n             (function*(){ while (1) yield vals.next() })() ];\n  }\n\n  let key = 'entries' in obj ? 'entries' : @@iterator in obj ? @@iterator : null;\n  if (key) {\n    const keys = obj[key](),\n          vals = obj[key]();\n\n    return [ (function*(){ while (1) yield keys.next()[0] })(),\n             (function*(){ while (1) yield vals.next()[1] })() ];\n  }\n}\n\nbuiltinFunction(unzip);\n\n\nexport class Iterator {\n  @@iterator(){\n    return this;\n  }\n}\n\nbuiltinClass(Iterator);\n\nexport const StopIteration = $$GetIntrinsic('StopIteration');\n";

exports.builtins["@json"] = "import {\n  $$JSONParse,\n  $$JSONQuote\n} from '@@json';\n\nimport {\n  $$StringReplace,\n  $$StringSlice\n} from '@@string';\n\nimport {\n  call,\n  enumerate,\n  extend,\n  hasBrand,\n  internalFunction,\n  setTag\n} from '@@utilities';\n\nimport {\n  $$Get,\n  $$Exception,\n  $$Set\n} from '@@internals';\n\nimport {\n  ToNumber,\n  ToString\n} from '@@operations';\n\nimport {\n  Type\n} from '@@types';\nimport {\n  add,\n  has,\n  Set\n} from '@set';\n\nlet ReplacerFunction, PropertyList, stack, indent, gap;\n\nfunction J(value){\n  if (has(stack, value)) {\n    throw $$Exception('circular_structure', []);\n  }\n\n  const stepback = indent,\n        partial  = [];\n\n  let brackets;\n\n  indent += gap;\n  add(stack, value);\n\n  if (hasBrand(value, 'BuiltinArray')) {\n    brackets = ['[', ']'];\n\n    for (var i=0, len = value.length; i < len; i++) {\n      var prop = Str(i, value);\n      partial[i] = prop === undefined ? 'null' : prop;\n    }\n  } else {\n    const keys  = PropertyList || enumerate(value, false, true),\n          colon = gap ? ': ' : ':';\n\n    brackets = ['{', '}'];\n\n    for (var i=0, len=keys.length; i < len; i++) {\n      const prop = Str(keys[i], value);\n      if (prop !== undefined) {\n        partial.push($$JSONQuote(keys[i]) + colon + prop);\n      }\n    }\n  }\n\n  let final;\n  if (!partial.length) {\n    final = '';\n  } else if (!gap) {\n    final = partial.join(',');\n  } else {\n    final = '\\n' + indent + partial.join(',\\n' + indent) + '\\n' + stepback;\n  }\n\n  stack.delete(value);\n  indent = stepback;\n  return brackets[0] + final + brackets[1];\n}\n\ninternalFunction(J);\n\nfunction Str(key, holder){\n  let value = holder[key];\n\n  if (Type(value) === 'Object') {\n    const toJSON = value.toJSON;\n    if (typeof toJSON === 'function') {\n      value = call(toJSON, value, [key]);\n    }\n  }\n\n  if (ReplacerFunction) {\n    value = call(ReplacerFunction, holder, [key, value]);\n  }\n\n  if (Type(value) === 'Object') {\n    const brand = $$Get(value, 'BuiltinBrand');\n    if (brand === 'NumberWrapper') {\n      value = $$Get(value, 'NumberValue');\n    } else if (brand === 'StringWrapper') {\n      value = $$Get(value, 'StringValue');\n    } else if (brand === 'BooleanWrapper') {\n      value = $$Get(value, 'BooleanValue');\n    }\n  }\n\n\n  if (value === null) {\n    return 'null';\n  } else if (value === true) {\n    return 'true';\n  } else if (value === false) {\n    return 'false';\n  }\n\n  const type = Type(value);\n  if (type === 'String') {\n    return $$JSONQuote(value);\n  } else if (type === 'Number') {\n    return isNaN(value) || value === Infinity || value === -Infinity ? 'null' : ToString(value);\n  } else if (type === 'Object') {\n    return J(value);\n  }\n}\n\ninternalFunction(Str);\n\n\nexport function stringify(value, replacer, space){\n  ReplacerFunction = undefined;\n  PropertyList = undefined;\n  stack = new Set;\n  indent = '';\n\n  if (Type(replacer) === 'Object') {\n    if (typeof replacer === 'function') {\n      ReplacerFunction = replacer;\n    } else if (hasBrand(replacer, 'BuiltinArray')) {\n      let props = new Set;\n\n      for (let value of replacer) {\n        const type = Type(value);\n        let item;\n\n        if (type === 'String') {\n          item = value;\n        } else if (type === 'Number') {\n          item = ToString(value);\n        } else if (type === 'Object') {\n          const brand = $$Get(value, 'BuiltinBrand');\n          if (brand === 'String' || brand === 'Number') {\n            item = ToString(value);\n          }\n        }\n\n        if (item !== undefined) {\n          add(props, item);\n        }\n      }\n\n      PropertyList = [...props];\n    }\n  }\n\n  if (Type(space) === 'Object') {\n    space = ToString(space);\n  }\n\n  if (Type(space) === 'String') {\n    gap = $$StringSlice(space, 0, 10);\n  } else if (Type(space) === 'Number') {\n    space |= 0;\n    space = space > 10 ? 10 : space < 1 ? 0 : space\n    gap = ' '.repeat(space);\n  } else {\n    gap = '';\n  }\n\n  return Str('', { '': value });\n}\n\nexport function parse(source, reviver){\n  return $$JSONParse(source, reviver);\n}\n\n\n\nexport const JSON = {};\nextend(JSON, { stringify, parse });\n$$Set(JSON, 'BuiltinBrand', 'BuiltinJSON');\nsetTag(JSON, 'JSON');\n";

exports.builtins["@map"] = "import {\n  @@iterator: iterator,\n  @@create  : create\n} from '@@symbols';\n\nimport {\n  undefined\n} from '@@constants';\n\nimport {\n  $$CallerName,\n  $$Exception,\n  $$Get,\n  $$Has,\n  $$Set\n} from '@@internals';\n\nimport {\n  builtinClass,\n  builtinFunction,\n  define,\n  ensureObject,\n  extend,\n  hasBrand,\n  internalFunction,\n  isInitializing\n} from '@@utilities';\n\nimport {\n  ObjectCreate,\n  Type\n} from '@@types';\n\nimport {\n  OrdinaryCreateFromConstructor,\n  ToObject,\n  ToString\n} from '@@operations';\n\nimport {\n  $$MapClear,\n  $$MapDelete,\n  $$MapGet,\n  $$MapHas,\n  // 15.14.1.1 MapInitialisation (TODO: self-host in ES6)\n  $$MapInitialization,\n  $$MapNext,\n  $$MapSet,\n  $$MapSigil,\n  $$MapSize\n} from '@@collections';\n\nimport {\n  Iterator\n} from '@iter';\n\nimport {\n  hasOwn\n} from '@reflect';\n\n\nconst sigil = $$MapSigil();\n\nfunction ensureMap(o){\n  if (Type(o) !== 'Object' || !$$Has(o, 'MapData')) {\n    throw $$Exception('called_on_incompatible_object', [$$CallerName()]);\n  }\n}\n\ninternalFunction(ensureMap);\n\n\n\nclass MapIterator extends Iterator {\n  private @map,  // Map\n          @key,  // MapNextKey\n          @kind; // MapIterationKind\n\n  constructor(map, kind){\n    this.@map = ToObject(map);\n    this.@key = sigil;\n    this.@kind = kind;\n  }\n\n  next(){\n    ensureObject(this);\n\n    if (!(hasOwn(this, @map) && hasOwn(this, @key) && hasOwn(this, @kind))) {\n      throw $$Exception('called_on_incompatible_object', ['MapIterator.prototype.next']);\n    }\n\n    const kind = this.@kind,\n          item = $$MapNext(this.@map, this.@key);\n\n    if (!item) {\n      throw StopIteration;\n    }\n\n    this.@key = item[0];\n\n    if (kind === 'key+value') {\n      return item;\n    } else if (kind === 'key') {\n      return item[0];\n    }\n\n    return item[1];\n  }\n}\n\nbuiltinClass(MapIterator);\n\n\n// ######################################################\n// ### 15.14.5 Properties of the Map Prototype Object ###\n// ######################################################\n\nexport class Map {\n  // #######################################\n  // # 15.14.5.1 Map.prototype.constructor #\n  // #######################################\n  constructor(iterable){\n    if (!isInitializing(this, 'MapData')) {\n      // 15.14.2 The Map Constructor Called as a Function\n      return new Map(iterable);\n    }\n\n    // 15.14.3 The Map Constructor\n    $$MapInitialization(this, iterable);\n  }\n\n  // #################################\n  // # 15.14.5.2 Map.prototype.clear #\n  // #################################\n  clear(){\n    ensureMap(this);\n    $$MapClear(this, key);\n    return this;\n  }\n\n  // ##################################\n  // # 15.14.5.3 Map.prototype.delete #\n  // ##################################\n  delete(key){\n    ensureMap(this);\n    return $$MapDelete(this, key);\n  }\n\n  // ###################################\n  // # 15.14.5.4 Map.prototype.forEach #\n  // ###################################\n  forEach(callbackfn, thisArg = undefined){\n    ensureMap(this);\n    ensureCallback(callbackfn);\n\n    let item = $$MapNext(this, sigil);\n\n    while (item) {\n      call(callbackfn, this, item[1], item[0], this);\n      item = $$MapNext(this, item);\n    }\n  }\n\n  get size(){\n    if (this && $$Has(this, 'MapData')) {\n      return $$MapSize(this);\n    }\n\n    return 0;\n  }\n\n  get(key){\n    ensureMap(this);\n    return $$MapGet(this, key);\n  }\n\n  has(key){\n    ensureMap(this);\n    return $$MapHas(this, key);\n  }\n\n  entries(){\n    ensureMap(this);\n    return new MapIterator(this, 'key+value');\n  }\n\n  keys(){\n    ensureMap(this);\n    return new MapIterator(this, 'key');\n  }\n\n  set(key, value){\n    ensureMap(this);\n    $$MapSet(this, key, value);\n    return this;\n  }\n\n  values(){\n    ensureMap(this);\n    return new MapIterator(this, 'value');\n  }\n}\n\nextend(Map, {\n  @@create(){\n    const obj = OrdinaryCreateFromConstructor(this, '%MapPrototype%');\n    $$Set(obj, 'MapData', undefined);\n    $$Set(obj, 'BuiltinBrand', 'BuiltinMap');\n    return obj;\n  }\n});\n\ndefine(Map.prototype, @@iterator, Map.prototype.entries);\nbuiltinClass(Map);\n";

exports.builtins["@math"] = "// ################################\n// ##### 15.8 The Math Object #####\n// ################################\n\n\nimport {\n  ToInt32,\n  ToNumber,\n  ToUint32\n} from '@@operations';\n\nimport {\n  builtinFunction,\n  define,\n  hideEverything,\n  internalFunction,\n  set,\n  setTag,\n  update\n} from '@@utilities';\n\nimport {\n  $$Set\n} from '@@internals';\n\nimport {\n  $$Acos,\n  $$Asin,\n  $$Atan,\n  $$Atan2,\n  $$Cos,\n  $$Exp,\n  $$Log,\n  $$Pow,\n  $$Random,\n  $$Sin,\n  $$Sqrt,\n  $$Tan\n} from '@@math';\n\nimport {\n  NaN,\n  NEGATIVE_INFINITY,\n  POSITIVE_INFINITY\n} from '@@constants';\n\n\n\nfunction isFiniteNonZero(value) {\n  return value === value\n      && value !== 0\n      && value !== NEGATIVE_INFINITY\n      && value !== POSITIVE_INFINITY;\n}\n\ninternalFunction(isFiniteNonZero);\n\n\nfunction factorial(x){\n  let i = 2,\n      n = 1;\n\n  while (i <= x) {\n    n *= i++;\n  }\n\n  return n;\n}\n\ninternalFunction(factorial);\n\n\nexport const Math = {\n  // ##################################################\n  // ### 15.8.1 Value Properties of the Math Object ###\n  // ##################################################\n\n  // ###################\n  // # 15.8.1.1 Math.E #\n  // ###################\n  E: 2.7182818284590452354,\n\n  // ######################\n  // # 15.8.1.2 Math.LN10 #\n  // ######################\n  LN10: 2.302585092994046,\n\n  // #####################\n  // # 15.8.1.3 Math.LN2 #\n  // #####################\n  LN2: 0.6931471805599453,\n\n  // #######################\n  // # 15.8.1.4 Math.LOG2E #\n  // #######################\n  LOG2E: 1.4426950408889634,\n\n  // ########################\n  // # 15.8.1.5 Math.LOG10E #\n  // ########################\n  LOG10E: 0.4342944819032518,\n\n  // ####################\n  // # 15.8.1.6 Math.PI #\n  // ####################\n  PI: 3.1415926535897932,\n\n  // #########################\n  // # 15.8.1.7 Math.SQRT1_2 #\n  // #########################\n  SQRT1_2: 0.7071067811865476,\n\n  // #######################\n  // # 15.8.1.8 Math.SQRT2 #\n  // #######################\n  SQRT2: 1.4142135623730951,\n\n\n  // #####################################################\n  // ### 15.8.2 Function Properties of the Math Object ###\n  // #####################################################\n\n\n  // #####################\n  // # 15.8.2.1 Math.abs #\n  // #####################\n  abs(x){\n    x = ToNumber(x);\n\n    return x === 0 ? 0 : x < 0 ? -x : x;\n  },\n\n  // ######################\n  // # 15.8.2.2 Math.acos #\n  // ######################\n  acos(x){\n    x = ToNumber(x);\n\n    return isFiniteNonZero(x) ? $$Acos(x) : x;\n  },\n\n  // ######################\n  // # 15.8.2.3 Math.asin #\n  // ######################\n  asin(x){\n    x = ToNumber(x);\n\n    return isFiniteNonZero(x) ? $$Asin(x) : x;\n  },\n\n  // ######################\n  // # 15.8.2.4 Math.atan #\n  // ######################\n  atan(x){\n    x = ToNumber(x);\n\n    return isFiniteNonZero(x) ? $$Atan(x) : x;\n  },\n\n  // #######################\n  // # 15.8.2.5 Math.atan2 #\n  // #######################\n  atan2(x){\n    x = ToNumber(x);\n\n    return isFiniteNonZero(x) ? $$Atan2(x) : x;\n  },\n\n  // ######################\n  // # 15.8.2.6 Math.ceil #\n  // ######################\n  ceil(x){\n    x = ToNumber(x);\n\n    return isFiniteNonZero(x) ? ToInt32(x + 1) : x;\n  },\n\n  // #####################\n  // # 15.8.2.7 Math.cos #\n  // #####################\n  cos(x){\n    x = ToNumber(x);\n\n    return isFiniteNonZero(x) ? $$Cos(x) : x;\n  },\n\n  // #####################\n  // # 15.8.2.8 Math.exp #\n  // #####################\n  exp(x){\n    x = ToNumber(x);\n\n    return isFiniteNonZero(x) ? $$Exp(x) : x;\n  },\n\n  // #######################\n  // # 15.8.2.9 Math.floor #\n  // #######################\n  floor(x){\n    x = ToNumber(x);\n\n    return isFiniteNonZero(x) ? ToInt32(x) : x;\n  },\n\n  // ######################\n  // # 15.8.2.10 Math.log #\n  // ######################\n  log(x){\n    x = ToNumber(x);\n\n    return isFiniteNonZero(x) ? $$Log(x) : x;\n  },\n\n  // ######################\n  // # 15.8.2.11 Math.max #\n  // ######################\n  max(...values){\n    const count = values.length;\n\n    if (count === 0) {\n      return -Infinity;\n    } else if (count === 1) {\n      return ToNumber(values[0]);\n    } else if (count === 2) {\n      const x = ToNumber(values[0]),\n            y = ToNumber(values[1]);\n\n      if (isNaN(x) || isNaN(y)) {\n        return NaN;\n      }\n\n      return x > y ? x : y;\n    } else {\n      let index   = count,\n          maximum = -Infinity;\n\n      while (index--) {\n        const current = ToNumber(values[index]);\n\n        if (current !== current) {\n          return NaN;\n        } else if (current > maximum) {\n          maximum = current;\n        }\n      }\n\n      return maximum;\n    }\n  },\n\n  // ######################\n  // # 15.8.2.12 Math.min #\n  // ######################\n  min(...values){\n    const count = values.length;\n\n    if (count === 0) {\n      return Infinity;\n    } else if (count === 1) {\n      return ToNumber(values[0]);\n    } else if (count === 2) {\n      const x = ToNumber(values[0]),\n            y = ToNumber(values[1]);\n\n      if (x !== x || y !== y) {\n        return NaN;\n      }\n      return x < y ? x : y;\n    } else {\n      let index   = count,\n          minimum = Infinity;\n\n      while (index--) {\n        const current = ToNumber(values[index]);\n\n        if (current !== current) {\n          return NaN;\n        } else if (current < minimum) {\n          minimum = current;\n        }\n      }\n\n      return minimum;\n    }\n  },\n\n  // ######################\n  // # 15.8.2.13 Math.pow #\n  // ######################\n  pow(x, y){\n    return $$Pow(ToNumber(x), ToNumber(y));\n  },\n\n  // #########################\n  // # 15.8.2.14 Math.random #\n  // #########################\n  random(){\n    return $$Random();\n  },\n\n  // ########################\n  // # 15.8.2.15 Math.round #\n  // ########################\n  round(x){\n    x = ToNumber(x);\n\n    return isFiniteNonZero(x) ? x + .5 | 0 : x;\n  },\n\n  // ######################\n  // # 15.8.2.16 Math.sin #\n  // ######################\n  sin(x){\n    x = ToNumber(x);\n\n    return isFiniteNonZero(x) ? $$Sin(x) : x;\n  },\n\n  // #######################\n  // # 15.8.2.17 Math.sqrt #\n  // #######################\n  sqrt(x){\n    return $$Sqrt(ToNumber(x));\n  },\n\n  // ######################\n  // # 15.8.2.18 Math.tan #\n  // ######################\n  tan(x){\n    x = ToNumber(x);\n\n    return isFiniteNonZero(x) ? $$Tan(x) : x;\n  },\n\n  // ########################\n  // # 15.8.2.19 Math.log10 #\n  // ########################\n  log10(x){\n    x = ToNumber(x);\n\n    return isFiniteNonZero(x) ? $$Log(x) * LOG10E : x;\n  },\n\n  // #######################\n  // # 15.8.2.20 Math.log2 #\n  // #######################\n  log2(x){\n    x = ToNumber(x);\n\n    return isFiniteNonZero(x) ? $$Log(x) * LOG2E : x;\n  },\n\n  // ########################\n  // # 15.8.2.21 Math.log1p #\n  // ########################\n  log1p(x){\n    x = ToNumber(x);\n    if (!isFiniteNonZero(x)) {\n      return x;\n    }\n\n    if (x <= -1) {\n      return -Infinity;\n    } else if (x < 0 || x > 1) {\n      return $$Log(1 + x);\n    }\n\n    let o = 0,\n        n = 50;\n\n    for (var i = 1; i < n; i++) {\n      if ((i % 2) === 0) {\n        o -= $$Pow(x, i) / i;\n      } else {\n        o += $$Pow(x, i) / i;\n      }\n    }\n\n    return o;\n  },\n\n  // ########################\n  // # 15.8.2.22 Math.expm1 #\n  // ########################\n  expm1(x) {\n    x = ToNumber(x);\n    if (!isFiniteNonZero(x)) {\n      return x;\n    }\n\n    let o = 0,\n        n = 50;\n\n    for (var i = 1; i < n; i++) {\n      o += $$Pow(x, i) / factorial(i);\n    }\n\n    return o;\n  },\n\n  // #######################\n  // # 15.8.2.23 Math.cosh #\n  // #######################\n  cosh(x) {\n    x = ToNumber(x);\n    if (!isFiniteNonZero(x)) {\n      return x;\n    }\n\n    x = abs(x);\n\n    return x > 21 ? $$Exp(x) / 2 : ($$Exp(x) + $$Exp(-x)) / 2;\n  },\n\n  // #######################\n  // # 15.8.2.24 Math.sinh #\n  // #######################\n  sinh(x){\n    x = ToNumber(x);\n\n    return isFiniteNonZero(x) ? ($$Exp(x) - $$Exp(-x)) / 2 : x;\n  },\n\n  // #######################\n  // # 15.8.2.25 Math.tanh #\n  // #######################\n  tanh(x) {\n    x = ToNumber(x);\n\n    return isFiniteNonZero(x) ? ($$Exp(x) - $$Exp(-x)) / ($$Exp(x) + $$Exp(-x)) : x;\n  },\n\n  // ########################\n  // # 15.8.2.26 Math.acosh #\n  // ########################\n  acosh(x){\n    x = ToNumber(x);\n\n    return isFiniteNonZero(x) ? $$Log(x + $$Sqrt(x * x - 1)) : x;\n  },\n\n  // ########################\n  // # 15.8.2.27 Math.asinh #\n  // ########################\n  asinh(x){\n    x = ToNumber(x);\n\n    return isFiniteNonZero(x) ? $$Log(x + $$Sqrt(x * x + 1)) : x;\n  },\n\n  // ########################\n  // # 15.8.2.28 Math.atanh #\n  // ########################\n  atanh(x) {\n    x = ToNumber(x);\n\n    return isFiniteNonZero(x) ? .5 * $$Log((1 + x) / (1 - x)) : x;\n  },\n\n  // ########################\n  // # 15.8.2.29 Math.hypot #\n  // ########################\n  hypot(value1, value2, value3 = 0) {\n    const x = ToNumber(value1),\n          y = ToNumber(value2),\n          z = ToNumber(value3);\n\n    if (x === POSITIVE_INFINITY || y === POSITIVE_INFINITY || z === POSITIVE_INFINITY) {\n      return POSITIVE_INFINITY;\n    } else if (x === NEGATIVE_INFINITY || y === NEGATIVE_INFINITY || z === NEGATIVE_INFINITY) {\n      return POSITIVE_INFINITY;\n    } else if (isNaN(x) || isNaN(y) || isNaN(z)) {\n      return NaN;\n    } else if (x === 0 && y === 0 && z === 0) {\n      return 0;\n    }\n\n    return $$Sqrt(x * x + y * y + z * z);\n  },\n\n  // ########################\n  // # 15.8.2.30 Math.trunc #\n  // ########################\n  trunc(x){\n    x = ToNumber(x);\n\n    return isFiniteNonZero(x) ? ~~x : x;\n  },\n\n  // #######################\n  // # 15.8.2.31 Math.sign #\n  // #######################\n  sign(x){\n    x = ToNumber(x);\n\n    return x === 0 || x !== x ? x : x < 0 ? -1 : 1;\n  },\n\n  // #######################\n  // # 15.8.2.31 Math.cbrt #\n  // #######################\n  cbrt(x){\n    x = ToNumber(x);\n\n    return sign(x) * $$Pow(abs(x), 1 / 3);\n  },\n\n  imul(x, y) {\n    const xlo = loword(x),\n          ylo = loword(y);\n\n    return xlo * ylo + ToInt32((hiword(x) * ylo + hiword(y) * xlo) << 16);\n  }\n};\n\nconst loword = x => x & 0xffff,\n      hiword = x => x >>> 16 & 0xffff;\n\n\n$$Set(Math, 'BuiltinBrand', 'BuiltinMath');\nsetTag(Math, 'Math');\nset(Math.max, 'length', 2);\nset(Math.min, 'length', 2);\nhideEverything(Math);\n\n\nexport const E       = Math.E,\n             LN10    = Math.LN10,\n             LN2     = Math.LN2,\n             LOG2E   = Math.LOG2E,\n             LOG10E  = Math.LOG10E,\n             PI      = Math.PI,\n             SQRT1_2 = Math.SQRT1_2,\n             SQRT2   = Math.SQRT2,\n             abs     = Math.abs,\n             acos    = Math.acos,\n             acosh   = Math.acosh,\n             asin    = Math.asin,\n             asinh   = Math.asinh,\n             atan    = Math.atan,\n             atan2   = Math.atan2,\n             atanh   = Math.atanh,\n             ceil    = Math.ceil,\n             cbrt    = Math.cbrt,\n             cos     = Math.cos,\n             cosh    = Math.cosh,\n             exp     = Math.exp,\n             expm1   = Math.expm1,\n             floor   = Math.floor,\n             hypot   = Math.hypot,\n             imul    = Math.imul,\n             log     = Math.log,\n             log10   = Math.log10,\n             log1p   = Math.log1p,\n             log2    = Math.log2,\n             max     = Math.max,\n             min     = Math.min,\n             pow     = Math.pow,\n             random  = Math.random,\n             round   = Math.round,\n             sign    = Math.sign,\n             sin     = Math.sin,\n             sinh    = Math.sinh,\n             sqrt    = Math.sqrt,\n             tan     = Math.tan,\n             tanh    = Math.tanh,\n             trunc   = Math.trunc;\n";

exports.builtins["@number"] = "// ###############################\n// ##### 15.7 Number Objects #####\n// ###############################\n\n\nimport {\n  $$ArgumentCount,\n  $$CallerName,\n  $$Exception,\n  $$Get,\n  $$Invoke,\n  $$NumberToString,\n  $$Set\n} from '@@internals';\n\nimport {\n  OrdinaryCreateFromConstructor,\n  ToInteger,\n  ToNumber,\n  ToUint32\n} from '@@operations';\n\nimport {\n  Type\n} from '@@types';\n\nimport {\n  builtinClass,\n  define,\n  extend,\n  floor,\n  hasBrand,\n  internalFunction,\n  isInitializing\n} from '@@utilities';\n\nimport {\n  @@create: create\n} from '@@symbols';\n\nimport {\n  undefined\n} from '@@constants';\n\nimport {\n  parseFloat,\n  parseInt\n} from '@globals';\n\n\nfunction ensureNumber(o){\n  if (Type(o) === 'Number') {\n    return o;\n  } else if (hasBrand(o, 'NumberWrapper')) {\n    return $$Get(o, 'NumberValue');\n  }\n\n  throw $$Exception('not_generic', [`Number.prototype.${$$CallerName()}`]);\n}\n\ninternalFunction(ensureNumber);\n\n\n// ########################################################\n// ### 15.7.4 Properties of the Number Prototype Object ###\n// ########################################################\n\nexport class Number {\n  // #########################################\n  // # 15.7.4.1 Number.prototype.constructor #\n  // #########################################\n  constructor(value){\n    value = $$ArgumentCount() ? ToNumber(value) : 0;\n\n    // 15.7.1.1 Number ( [ value ] )\n    if (!isInitializing(this, 'NumberValue')) {\n      return value;\n    }\n\n    // 15.7.2.1 new Number ( [ value ] )\n    $$Set(this, 'NumberValue', value);\n  }\n\n  // ######################################\n  // # 15.7.4.2 Number.prototype.toString #\n  // ######################################\n  toString(radix = 10){\n    radix = ToInteger(radix);\n    if (radix < 2 || radix > 36) {\n      throw $$Exception('invalid_radix', []);\n    }\n\n    return $$NumberToString(ensureNumber(this), radix);\n  }\n\n  // ############################################\n  // # 15.7.4.3 Number.prototype.toLocaleString #\n  // ############################################\n  toLocaleString(){\n    return $$Invoke(ensureNumber(this), 'toLocaleString');\n  }\n\n  // #####################################\n  // # 15.7.4.4 Number.prototype.valueOf #\n  // #####################################\n  valueOf(){\n    return ensureNumber(this);\n  }\n\n  // #####################################\n  // # 15.7.4.5 Number.prototype.toFixed #\n  // #####################################\n  toFixed(fractionDigits){\n    const f = ToInteger(fractionDigits);\n\n    if (f < 0 || f > 20) {\n      throw $$Exception('invalid_fraction');\n    }\n\n    return $$Invoke(ensureNumber(this), 'toFixed', f);\n  }\n\n  // ###########################################\n  // # 15.7.4.6 Number.prototype.toExponential #\n  // ###########################################\n  toExponential(fractionDigits){\n    const x = ensureNumber(this),\n          f = ToInteger(fractionDigits);\n\n    if (fractionDigits !== undefined && f < 0 || f > 20) {\n      throw $$Exception('invalid_fraction');\n    }\n\n    return $$Invoke(x, 'toExponential', f);\n  }\n\n  // #########################################\n  // # 15.7.4.6 Number.prototype.toPrecision #\n  // #########################################\n  toPrecision(precision){\n    const x = ensureNumber(this),\n          p = ToInteger(precision);\n\n    if (isNaN(x)) {\n      return 'NaN';\n    } else if (x === NEGATIVE_INFINITY) {\n      return '-Infinity';\n    } else if (x === POSITIVE_INFINITY) {\n      return 'Infinity';\n    }\n\n    if (p < 1 || p > 21) {\n      throw $$Exception('invalid_precision');\n    }\n\n    return $$Invoke(x, 'toPrecision', p);\n  }\n\n  // #################################\n  // # 15.7.4.8 Number.prototype.clz #\n  // #################################\n  clz(){\n    const x = ensureNumber(this);\n    let n = ToUint32(x);\n\n    if (n === 0) {\n      return 32;\n    }\n\n    n = n < 0 ? floor(n + 1) : floor(n);\n    n -= floor(n / 0x100000000) * 0x100000000;\n    return 32 - $$NumberToString(n, 2).length;\n  }\n}\n\nbuiltinClass(Number, 'NumberWrapper');\n$$Set(Number.prototype, 'NumberValue', 0);\n\n\n\n// ###################################################\n// ### 15.7.3 Properties of the Number Constructor ###\n// ###################################################\n\nextend(Number, {\n  // #############################\n  // # 15.7.3.2 Number.MAX_VALUE #\n  // #############################\n  MAX_VALUE: 1.7976931348623157e+308,\n\n  // #############################\n  // # 15.7.3.3 Number.MIN_VALUE #\n  // #############################\n  MIN_VALUE: 5e-324,\n\n  // #######################\n  // # 15.7.3.4 Number.NaN #\n  // #######################\n  NaN: +'NaN',\n\n  // #####################################\n  // # 15.7.3.5 Number.NEGATIVE_INFINITY #\n  // #####################################\n  NEGATIVE_INFINITY: 1 / -0,\n\n  // #####################################\n  // # 15.7.3.6 Number.POSITIVE_INFINITY #\n  // #####################################\n  POSITIVE_INFINITY: 1 / 0,\n\n  // ###########################\n  // # 15.7.3.7 Number.EPSILON #\n  // ###########################\n  EPSILON: 2.220446049250313e-16,\n\n  // ###############################\n  // # 15.7.3.8 Number.MAX_INTEGER #\n  // ###############################\n  MAX_INTEGER: 9007199254740992,\n\n  // ############################\n  // # 15.7.3.9 Number.parseInt #\n  // ############################\n  parseInt,\n\n  // ###############################\n  // # 15.7.3.10 Number.parseFloat #\n  // ###############################\n  parseFloat,\n\n  // ##########################\n  // # 15.7.3.11 Number.isNaN #\n  // ##########################\n  isNaN(number){\n    return number !== number;\n  },\n\n  // #############################\n  // # 15.7.3.12 Number.isFinite #\n  // #############################\n  isFinite(number){\n    return Type(number) === 'Number'\n        && number === number\n        && number !== POSITIVE_INFINITY\n        && number !== NEGATIVE_INFINITY;\n  },\n\n  // ##############################\n  // # 15.7.3.13 Number.isInteger #\n  // ##############################\n  isInteger(number) {\n    return Type(number) === 'Number' && ToInteger(number) === number;\n  },\n\n  // ##########################\n  // # 15.7.3.14 Number.toInt #\n  // ##########################\n  toInt(number){\n    return ToInteger(number);\n  },\n\n  // #############################\n  // # 15.7.3.15 Number.@@create #\n  // #############################\n  @@create(){\n    const obj = OrdinaryCreateFromConstructor(this, '%NumberPrototype%');\n    $$Set(obj, 'BuiltinBrand', 'NumberWrapper');\n    $$Set(obj, 'NumberValue', undefined);\n    return obj;\n  }\n});\n\n\nexport const MAX_VALUE         = Number.MAX_VALUE,\n             MIN_VALUE         = Number.MIN_VALUE,\n             NaN               = Number.NaN,\n             NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY,\n             POSITIVE_INFINITY = Number.POSITIVE_INFINITY,\n             EPSILON           = Number.EPSILON,\n             MAX_INTEGER       = Number.MAX_INTEGER,\n             parseInt          = Number.parseInt,\n             parseFloat        = Number.parseFloat,\n             isNaN             = Number.isNaN,\n             isFinite          = Number.isFinite,\n             isInteger         = Number.isInteger,\n             toInt             = Number.toInt;\n";

exports.builtins["@object"] = "import {\n  @@toStringTag: toStringTag\n} from '@@symbols';\n\nimport {\n  ToBoolean,\n  ToObject,\n  ToPropertyKey\n} from '@@operations';\n\nimport {\n  builtinClass,\n  builtinFunction,\n  ensureDescriptor,\n  ensureFunction,\n  ensureObject,\n  ensureProto,\n  enumerate,\n  extend,\n  getOwnProperty,\n  defineOwnProperty,\n  internalFunction,\n  query\n} from '@@utilities';\n\nimport {\n  ObjectCreate,\n  Type\n} from '@@types';\n\nimport {\n  $$AddObserver,\n  $$DeliverChangeRecords,\n  $$Exception,\n  $$GetIntrinsic,\n  $$GetNotifier,\n  $$Has,\n  $$Invoke,\n  $$RemoveObserver,\n  $$SetIntrinsic,\n  $$WrapDescriptor\n} from '@@internals';\n\nimport {\n  hasOwn\n} from '@reflect';\n\n\nexport class Object extends null {\n  constructor(value){\n    return value == null ? {} : ToObject(value);\n  }\n\n  hasOwnProperty(key){\n    return hasOwn(ToObject(this), key);\n  }\n\n  isPrototypeOf(object){\n    while (Type(object) === 'Object') {\n      object = $$Invoke(object, 'GetInheritance');\n      if (object === this) {\n        return true;\n      }\n    }\n    return false;\n  }\n\n  propertyIsEnumerable(key){\n    return ToBoolean(query(ToObject(this), key) & 1);\n  }\n\n  toLocaleString(){\n    return this.toString();\n  }\n\n  toString(){\n    if (this === undefined) {\n      return '[object Undefined]';\n    } else if (this === null) {\n      return '[object Null]';\n    }\n    return `[object ${this.@@toStringTag}]`;\n  }\n\n  valueOf(){\n    return ToObject(this);\n  }\n}\n\nbuiltinClass(Object);\n\n$$SetIntrinsic('%ObjProto_toString%', Object.prototype.toString);\n\n\nexport function assign(target, source){\n  ensureObject(target, 'Object.assign');\n  source = ToObject(source);\n\n  for (let [i, key] of enumerate(source, false, true)) {\n    const prop = source[key];\n    if (typeof prop === 'function' && $$Has(prop, 'HomeObject')) {\n      // TODO\n    }\n    target[key] = prop;\n  }\n\n  return target;\n}\n\nexport function create(proto, properties){\n  ensureProto(proto, 'Object.create');\n  const object = ObjectCreate(proto);\n\n  if (properties !== undefined) {\n    ensureDescriptor(properties);\n\n    for (var key in properties) {\n      const desc = properties[key];\n      ensureDescriptor(desc);\n      defineOwnProperty(object, key, desc);\n    }\n  }\n\n  return object;\n}\n\nexport function defineProperty(object, key, property){\n  ensureObject(object, 'Object.defineProperty');\n  ensureDescriptor(property);\n  defineOwnProperty(object, ToPropertyKey(key), property);\n  return object;\n}\n\nexport function defineProperties(object, properties){\n  ensureObject(object, 'Object.defineProperties');\n  ensureDescriptor(properties);\n\n  for (var key in properties) {\n    const desc = properties[key];\n    ensureDescriptor(desc);\n    defineOwnProperty(object, key, desc);\n  }\n\n  return object;\n}\n\nexport function freeze(object){\n  ensureObject(object, 'Object.freeze');\n  const props = enumerate(object, false, false);\n\n  for (var i=0; i < props.length; i++) {\n    const desc = getOwnProperty(object, props[i]);\n    if (desc.configurable) {\n      desc.configurable = false;\n      if ('writable' in desc) {\n        desc.writable = false;\n      }\n      defineOwnProperty(object, props[i], desc);\n    }\n  }\n\n  $$Invoke(object, 'PreventExtensions');\n  return object;\n}\n\n\nexport function getOwnPropertyDescriptor(object, key){\n  ensureObject(object, 'Object.getOwnPropertyDescriptor');\n  return getOwnProperty(object, ToPropertyKey(key));\n}\n\nexport function getOwnPropertyNames(object){\n  ensureObject(object, 'Object.getOwnPropertyNames');\n  return enumerate(object, false, false);\n}\n\nexport function getPropertyDescriptor(object, key){\n  ensureObject(object, 'Object.getPropertyDescriptor');\n  return $$WrapDescriptor($$Invoke(object, 'GetProperty', ToPropertyKey(key)));\n}\n\nexport function getPropertyNames(object){\n  ensureObject(object, 'Object.getPropertyNames');\n  return enumerate(object, true, false);\n}\n\nexport function getPrototypeOf(object){\n  ensureObject(object, 'Object.getPrototypeOf');\n  return $$Invoke(object, 'GetInheritance');\n}\n\nexport function is(x, y){\n  return x === y ? x !== 0 || 1 / x === 1 / y : x !== x && y !== y;\n}\n\nexport function isnt(x, y){\n  return x === y ? x === 0 && 1 / x !== 1 / y : x === x || y === y;\n}\n\nexport function isExtensible(object){\n  ensureObject(object, 'Object.isExtensible');\n  return $$Invoke(object, 'IsExtensible');\n}\n\nexport function isFrozen(object){\n  ensureObject(object, 'Object.isFrozen');\n  if ($$Invoke(object, 'IsExtensible')) {\n    return false;\n  }\n\n  const props = enumerate(object, false, false);\n\n  for (var i=0; i < props.length; i++) {\n    const desc = getOwnProperty(object, props[i]);\n    if (desc && desc.configurable || 'writable' in desc && desc.writable) {\n      return false;\n    }\n  }\n\n  return true;\n}\n\nexport function isSealed(object){\n  ensureObject(object, 'Object.isSealed');\n  if ($$Invoke(object, 'IsExtensible')) {\n    return false;\n  }\n\n  const props = enumerate(object, false, false);\n\n  for (var i=0; i < props.length; i++) {\n    const desc = getOwnProperty(object, props[i]);\n    if (desc && desc.configurable) {\n      return false;\n    }\n  }\n\n  return true;\n}\n\nexport function keys(object){\n  ensureObject(object, 'Object.keys');\n  return enumerate(object, false, true);\n}\n\nexport function preventExtensions(object){\n  ensureObject(object, 'Object.preventExtensions');\n  $$Invoke(object, 'PreventExtensions');\n  return object;\n}\n\nexport function seal(object){\n  ensureObject(object, 'Object.seal');\n\n  const desc = { configurable: false },\n        props = enumerate(object, false, false);\n\n  for (var i=0; i < props.length; i++) {\n    defineOwnProperty(object, props[i], desc);\n  }\n\n  $$Invoke(object, 'PreventExtensions');\n  return object;\n}\n\n\nfunction getObservers(object){\n  return $$GetInternal($$GetNotifier(object), 'ChangeObservers');\n}\n\n\ninternalFunction(getObservers);\n\nexport function observe(object, callback){\n  ensureObject(object, 'Object.observe');\n  ensureFunction(callback, 'Object.observe');\n  if (isFrozen(callback)) {\n\n  }\n\n  $$AddObserver(getObservers(object), callback);\n  $$AddObserver($$GetIntrinsic('ObserverCallbacks'), callback);\n  return object;\n}\n\nexport function unobserve(object, callback){\n  ensureObject(object, 'Object.unobserve');\n  ensureFunction(callback, 'Object.unobserve');\n  $$RemoveObserver(getObservers(object), callback);\n  return object;\n}\n\nexport function deliverChangeRecords(callback){\n  ensureFunction(callback, 'Object.deliverChangeRecords');\n  $$DeliverChangeRecords(callback);\n}\n\nexport function getNotifier(object){\n  ensureObject(object, 'Object.getNotifier');\n  return isFrozen(object) ? null : $$GetNotifier(object);\n}\n\n\nextend(Object, { assign, create, defineProperty, defineProperties, deliverChangeRecords,\n  freeze, getNotifier, getOwnPropertyDescriptor, getOwnPropertyNames, getPropertyDescriptor,\n  getPropertyNames, getPrototypeOf, is, isnt, isExtensible, isFrozen, isSealed, keys, observe,\n  preventExtensions, seal, unobserve\n});\n\n\n\nexport function isPrototypeOf(object, prototype){\n  while (prototype) {\n    prototype = $$Invoke(prototype, 'GetInheritance');\n    if (prototype === object) {\n      return true;\n    }\n  }\n  return false;\n}\n\nbuiltinFunction(isPrototypeOf);\n\n\nexport function hasOwnProperty(object, key){\n  return hasOwn(ToObject(object), key);\n}\n\nbuiltinFunction(hasOwnProperty);\n\n\nexport function propertyIsEnumerable(object, key){\n  return ToBoolean(query(ToObject(object), key) & 1);\n}\n\nbuiltinFunction(propertyIsEnumerable);\n";

exports.builtins["@parser"] = "import {\n  $$Parse\n} from '@@parser';\n\nexport function parse(src, { loc, range, raw, tokens, comment, source, tolerant } = { source: null }){\n  return $$Parse(src, loc, range, raw, tokens, comment, tolerant, source);\n}\n\nexport class Position {\n  constructor(line = 1, column = 0){\n    this.line = line;\n    this.column = column;\n  }\n}\n\nexport class SourceLocation {\n  constructor(start, end){\n    this.start = new Position(start);\n    this.end = new Position(end);\n  }\n}\n\nexport class ASTNode {\n  private @type;\n  constructor(type) {\n    this.type = type;\n  }\n  get type() {\n    return this.@type;\n  }\n  set type(val) {\n    this.@type = val;\n  }\n}\n\nexport class ASTNodeList {\n  private @nodes;\n  constructor(...nodes) {\n    return index(this, nodes, @nodes);\n  }\n}\n\nexport class Expression extends ASTNode {}\nexport class Pattern extends ASTNode {}\nexport class Statement extends ASTNode {}\nexport class Declaration extends Statement {}\n\nexport class ArrayExpression extends Expression {\n  private @elements;\n  constructor(elements) {\n    this.elements = elements;\n  }\n  get elements() {\n    return this.@elements;\n  }\n  set elements(nodelist) {\n    this.@elements = nodelist;\n  }\n}\n\nexport class ArrayPattern extends Pattern {\n  private @elements;\n  constructor(elements) {\n    this.elements = elements;\n  }\n  get elements() {\n    return this.@elements;\n  }\n  set elements(nodelist) {\n    this.@elements = nodelist;\n  }\n}\n\nexport class ArrowFunctionExpression extends Expression {\n  private @params, @body, @defaults, @rest, @generator;\n  constructor(params, body, defaults, rest, generator) {\n    this.params = params;\n    this.body = body;\n    this.defaults = defaults;\n    this.rest = rest;\n    this.generator = generator;\n  }\n  get params() {\n    return this.@params;\n  }\n  set params(nodelist) {\n    this.@params = nodelist;\n  }\n  get body() {\n    return this.@body;\n  }\n  set body(node) {\n    this.@body = node;\n  }\n  get defaults() {\n    return this.@defaults;\n  }\n  set defaults(nodelist) {\n    this.@defaults = nodelist;\n  }\n  get rest() {\n    return this.@rest;\n  }\n  set rest(node) {\n    this.@rest = node;\n  }\n  get generator() {\n    return this.@generator;\n  }\n  set generator(val) {\n    this.@generator = val;\n  }\n}\n\nexport class AssignmentExpression extends Expression {\n  private @left, @right, @operator;\n  constructor(left, right, operator) {\n    this.left = left;\n    this.right = right;\n    this.operator = operator;\n  }\n  get left() {\n    return this.@left;\n  }\n  set left(node) {\n    this.@left = node;\n  }\n  get right() {\n    return this.@right;\n  }\n  set right(node) {\n    this.@right = node;\n  }\n  get operator() {\n    return this.@operator;\n  }\n  set operator(val) {\n    this.@operator = val;\n  }\n}\n\nexport class AtSymbol extends Expression {\n  private @name, @internal;\n  constructor(name, internal) {\n    this.name = name;\n    this.internal = internal;\n  }\n  get name() {\n    return this.@name;\n  }\n  set name(val) {\n    this.@name = val;\n  }\n  get internal() {\n    return this.@internal;\n  }\n  set internal(val) {\n    this.@internal = val;\n  }\n}\n\nexport class BlockStatement extends Statement {\n  private @body;\n  constructor(body) {\n    this.body = body;\n  }\n  get body() {\n    return this.@body;\n  }\n  set body(nodelist) {\n    this.@body = nodelist;\n  }\n}\n\nexport class BinaryExpression extends Expression {\n  private @left, @right, @operator;\n  constructor(left, right, operator) {\n    this.left = left;\n    this.right = right;\n    this.operator = operator;\n  }\n  get left() {\n    return this.@left;\n  }\n  set left(node) {\n    this.@left = node;\n  }\n  get right() {\n    return this.@right;\n  }\n  set right(node) {\n    this.@right = node;\n  }\n  get operator() {\n    return this.@operator;\n  }\n  set operator(val) {\n    this.@operator = val;\n  }\n}\n\nexport class BreakStatement extends Statement {\n  private @label;\n  constructor(label) {\n    this.label = label;\n  }\n  get label() {\n    return this.@label;\n  }\n  set label(val) {\n    this.@label = val;\n  }\n}\n\nexport class CallExpression extends Expression {\n  private @callee, @args;\n  constructor(callee, args) {\n    this.callee = callee;\n    this.args = args;\n  }\n  get callee() {\n    return this.@callee;\n  }\n  set callee(node) {\n    this.@callee = node;\n  }\n  get args() {\n    return this.@args;\n  }\n  set args(nodelist) {\n    this.@args = nodelist;\n  }\n}\n\nexport class CatchClause extends ASTNode {\n  private @param, @body;\n  constructor(param, body) {\n    this.param = param;\n    this.body = body;\n  }\n  get param() {\n    return this.@param;\n  }\n  set param(node) {\n    this.@param = node;\n  }\n  get body() {\n    return this.@body;\n  }\n  set body(node) {\n    this.@body = node;\n  }\n}\n\nexport class ConditionalExpression extends Expression {\n  private @test, @consequent, @alternate;\n  constructor(test, consequent, alternate) {\n    this.test = test;\n    this.consequent = consequent;\n    this.alternate = alternate;\n  }\n  get test() {\n    return this.@test;\n  }\n  set test(node) {\n    this.@test = node;\n  }\n  get consequent() {\n    return this.@consequent;\n  }\n  set consequent(node) {\n    this.@consequent = node;\n  }\n  get alternate() {\n    return this.@alternate;\n  }\n  set alternate(node) {\n    this.@alternate = node;\n  }\n}\n\nexport class ClassBody extends ASTNode {\n  private @body;\n  constructor(body) {\n    this.body = body;\n  }\n  get body() {\n    return this.@body;\n  }\n  set body(nodelist) {\n    this.@body = nodelist;\n  }\n}\n\nexport class ClassDeclaration extends Declaration {\n  private @id, @body, @superClass;\n  constructor(id, body, superClass) {\n    this.id = id;\n    this.body = body;\n    this.superClass = superClass;\n  }\n  get id() {\n    return this.@id;\n  }\n  set id(node) {\n    this.@id = node;\n  }\n  get body() {\n    return this.@body;\n  }\n  set body(node) {\n    this.@body = node;\n  }\n  get superClass() {\n    return this.@superClass;\n  }\n  set superClass(node) {\n    this.@superClass = node;\n  }\n}\n\nexport class ClassExpression extends Expression {\n  private @id, @body, @superClass;\n  constructor(id, body, superClass) {\n    this.id = id;\n    this.body = body;\n    this.superClass = superClass;\n  }\n  get id() {\n    return this.@id;\n  }\n  set id(node) {\n    this.@id = node;\n  }\n  get body() {\n    return this.@body;\n  }\n  set body(node) {\n    this.@body = node;\n  }\n  get superClass() {\n    return this.@superClass;\n  }\n  set superClass(node) {\n    this.@superClass = node;\n  }\n}\n\nexport class ContinueStatement extends Statement {\n  private @label;\n  constructor(label) {\n    this.label = label;\n  }\n  get label() {\n    return this.@label;\n  }\n  set label(val) {\n    this.@label = val;\n  }\n}\n\nexport class ComprehensionBlock extends ASTNode {\n  private @left, @right, @body;\n  constructor(left, right, body) {\n    this.left = left;\n    this.right = right;\n    this.body = body;\n  }\n  get left() {\n    return this.@left;\n  }\n  set left(node) {\n    this.@left = node;\n  }\n  get right() {\n    return this.@right;\n  }\n  set right(node) {\n    this.@right = node;\n  }\n  get body() {\n    return this.@body;\n  }\n  set body(node) {\n    this.@body = node;\n  }\n}\n\nexport class ComprehensionExpression extends Expression {\n  private @filter, @blocks, @body;\n  constructor(filter, blocks, body) {\n    this.filter = filter;\n    this.blocks = blocks;\n    this.body = body;\n  }\n  get filter() {\n    return this.@filter;\n  }\n  set filter(node) {\n    this.@filter = node;\n  }\n  get blocks() {\n    return this.@blocks;\n  }\n  set blocks(nodelist) {\n    this.@blocks = nodelist;\n  }\n  get body() {\n    return this.@body;\n  }\n  set body(node) {\n    this.@body = node;\n  }\n}\n\nexport class DoWhileStatement extends Statement {\n  private @body, @test;\n  constructor(body, test) {\n    this.body = body;\n    this.test = test;\n  }\n  get body() {\n    return this.@body;\n  }\n  set body(node) {\n    this.@body = node;\n  }\n  get test() {\n    return this.@test;\n  }\n  set test(node) {\n    this.@test = node;\n  }\n}\n\nexport class DebuggerStatement extends Statement {\n}\n\nexport class EmptyStatement extends Statement {\n}\n\nexport class ExportDeclaration extends Statement {\n  private @specifiers, @declaration;\n  constructor(specifiers, declaration) {\n    this.specifiers = specifiers;\n    this.declaration = declaration;\n  }\n  get specifiers() {\n    return this.@specifiers;\n  }\n  set specifiers(nodelist) {\n    this.@specifiers = nodelist;\n  }\n  get declaration() {\n    return this.@declaration;\n  }\n  set declaration(node) {\n    this.@declaration = node;\n  }\n}\n\nexport class ExportSpecifier extends ASTNode {\n  private @id, @from;\n  constructor(id, from) {\n    this.id = id;\n    this.from = from;\n  }\n  get id() {\n    return this.@id;\n  }\n  set id(node) {\n    this.@id = node;\n  }\n  get from() {\n    return this.@from;\n  }\n  set from(node) {\n    this.@from = node;\n  }\n}\n\nexport class ExportSpecifierSet extends ASTNode {\n  private @specifiers;\n  constructor(specifiers) {\n    this.specifiers = specifiers;\n  }\n  get specifiers() {\n    return this.@specifiers;\n  }\n  set specifiers(node) {\n    this.@specifiers = node;\n  }\n}\n\nexport class ExpressionStatement extends Statement {\n  private @expression;\n  constructor(expression) {\n    this.expression = expression;\n  }\n  get expression() {\n    return this.@expression;\n  }\n  set expression(node) {\n    this.@expression = node;\n  }\n}\n\nexport class ForStatement extends Statement {\n  private @init, @test, @update, @body;\n  constructor(init, test, update, body) {\n    this.init = init;\n    this.test = test;\n    this.update = update;\n    this.body = body;\n  }\n  get init() {\n    return this.@init;\n  }\n  set init(node) {\n    this.@init = node;\n  }\n  get test() {\n    return this.@test;\n  }\n  set test(node) {\n    this.@test = node;\n  }\n  get update() {\n    return this.@update;\n  }\n  set update(node) {\n    this.@update = node;\n  }\n  get body() {\n    return this.@body;\n  }\n  set body(node) {\n    this.@body = node;\n  }\n}\n\nexport class ForInStatement extends Statement {\n  private @left, @right, @body;\n  constructor(left, right, body) {\n    this.left = left;\n    this.right = right;\n    this.body = body;\n  }\n  get left() {\n    return this.@left;\n  }\n  set left(node) {\n    this.@left = node;\n  }\n  get right() {\n    return this.@right;\n  }\n  set right(node) {\n    this.@right = node;\n  }\n  get body() {\n    return this.@body;\n  }\n  set body(node) {\n    this.@body = node;\n  }\n}\n\nexport class ForOfStatement extends Statement {\n  private @left, @right, @body;\n  constructor(left, right, body) {\n    this.left = left;\n    this.right = right;\n    this.body = body;\n  }\n  get left() {\n    return this.@left;\n  }\n  set left(node) {\n    this.@left = node;\n  }\n  get right() {\n    return this.@right;\n  }\n  set right(node) {\n    this.@right = node;\n  }\n  get body() {\n    return this.@body;\n  }\n  set body(node) {\n    this.@body = node;\n  }\n}\n\nexport class FunctionDeclaration extends Declaration {\n  private @id, @params, @body, @defaults, @rest, @generator;\n  constructor(id, params, body, defaults, rest, generator) {\n    this.id = id;\n    this.params = params;\n    this.body = body;\n    this.defaults = defaults;\n    this.rest = rest;\n    this.generator = generator;\n  }\n  get id() {\n    return this.@id;\n  }\n  set id(node) {\n    this.@id = node;\n  }\n  get params() {\n    return this.@params;\n  }\n  set params(nodelist) {\n    this.@params = nodelist;\n  }\n  get body() {\n    return this.@body;\n  }\n  set body(node) {\n    this.@body = node;\n  }\n  get defaults() {\n    return this.@defaults;\n  }\n  set defaults(nodelist) {\n    this.@defaults = nodelist;\n  }\n  get rest() {\n    return this.@rest;\n  }\n  set rest(node) {\n    this.@rest = node;\n  }\n  get generator() {\n    return this.@generator;\n  }\n  set generator(val) {\n    this.@generator = val;\n  }\n}\n\nexport class FunctionExpression extends Expression {\n  private @id, @params, @body, @defaults, @rest, @generator;\n  constructor(id, params, body, defaults, rest, generator) {\n    this.id = id;\n    this.params = params;\n    this.body = body;\n    this.defaults = defaults;\n    this.rest = rest;\n    this.generator = generator;\n  }\n  get id() {\n    return this.@id;\n  }\n  set id(node) {\n    this.@id = node;\n  }\n  get params() {\n    return this.@params;\n  }\n  set params(nodelist) {\n    this.@params = nodelist;\n  }\n  get body() {\n    return this.@body;\n  }\n  set body(node) {\n    this.@body = node;\n  }\n  get defaults() {\n    return this.@defaults;\n  }\n  set defaults(nodelist) {\n    this.@defaults = nodelist;\n  }\n  get rest() {\n    return this.@rest;\n  }\n  set rest(node) {\n    this.@rest = node;\n  }\n  get generator() {\n    return this.@generator;\n  }\n  set generator(val) {\n    this.@generator = val;\n  }\n}\n\nexport class Glob extends ASTNode {\n}\n\nexport class Identifier extends Expression {\n  private @name;\n  constructor(name) {\n    this.name = name;\n  }\n  get name() {\n    return this.@name;\n  }\n  set name(val) {\n    this.@name = val;\n  }\n}\n\nexport class IfStatement extends Statement {\n  private @test, @consequent, @alternate;\n  constructor(test, consequent, alternate) {\n    this.test = test;\n    this.consequent = consequent;\n    this.alternate = alternate;\n  }\n  get test() {\n    return this.@test;\n  }\n  set test(node) {\n    this.@test = node;\n  }\n  get consequent() {\n    return this.@consequent;\n  }\n  set consequent(node) {\n    this.@consequent = node;\n  }\n  get alternate() {\n    return this.@alternate;\n  }\n  set alternate(node) {\n    this.@alternate = node;\n  }\n}\n\nexport class ImportDeclaration extends Statement {\n  private @specifiers, @from;\n  constructor(specifiers, from) {\n    this.specifiers = specifiers;\n    this.from = from;\n  }\n  get specifiers() {\n    return this.@specifiers;\n  }\n  set specifiers(nodelist) {\n    this.@specifiers = nodelist;\n  }\n  get from() {\n    return this.@from;\n  }\n  set from(node) {\n    this.@from = node;\n  }\n}\n\nexport class ImportSpecifier extends ASTNode {\n  private @id, @from;\n  constructor(id, from) {\n    this.id = id;\n    this.from = from;\n  }\n  get id() {\n    return this.@id;\n  }\n  set id(node) {\n    this.@id = node;\n  }\n  get from() {\n    return this.@from;\n  }\n  set from(node) {\n    this.@from = node;\n  }\n}\n\nexport class Literal extends Expression {\n  private @value;\n  constructor(value) {\n    this.value = value;\n  }\n  get value() {\n    return this.@value;\n  }\n  set value(val) {\n    this.@value = val;\n  }\n}\n\nexport class LabeledStatement extends Statement {\n  private @label, @body;\n  constructor(label, body) {\n    this.label = label;\n    this.body = body;\n  }\n  get label() {\n    return this.@label;\n  }\n  set label(val) {\n    this.@label = val;\n  }\n  get body() {\n    return this.@body;\n  }\n  set body(node) {\n    this.@body = node;\n  }\n}\n\nexport class LogicalExpression extends Expression {\n  private @left, @right, @operator;\n  constructor(left, right, operator) {\n    this.left = left;\n    this.right = right;\n    this.operator = operator;\n  }\n  get left() {\n    return this.@left;\n  }\n  set left(node) {\n    this.@left = node;\n  }\n  get right() {\n    return this.@right;\n  }\n  set right(node) {\n    this.@right = node;\n  }\n  get operator() {\n    return this.@operator;\n  }\n  set operator(val) {\n    this.@operator = val;\n  }\n}\n\nexport class MemberExpression extends Expression {\n  private @object, @property, @computed;\n  constructor(object, property, computed) {\n    this.object = object;\n    this.property = property;\n    this.computed = computed;\n  }\n  get object() {\n    return this.@object;\n  }\n  set object(node) {\n    this.@object = node;\n  }\n  get property() {\n    return this.@property;\n  }\n  set property(node) {\n    this.@property = node;\n  }\n  get computed() {\n    return this.@computed;\n  }\n  set computed(val) {\n    this.@computed = val;\n  }\n}\n\nexport class MethodDefinition extends ASTNode {\n  private @key, @value, @kind;\n  constructor(key, value, kind) {\n    this.key = key;\n    this.value = value;\n    this.kind = kind;\n  }\n  get key() {\n    return this.@key;\n  }\n  set key(node) {\n    this.@key = node;\n  }\n  get value() {\n    return this.@value;\n  }\n  set value(node) {\n    this.@value = node;\n  }\n  get kind() {\n    return this.@kind;\n  }\n  set kind(val) {\n    this.@kind = val;\n  }\n}\n\nexport class ModuleDeclaration extends Declaration {\n  private @id, @body, @from;\n  constructor(id, body, from) {\n    this.id = id;\n    this.body = body;\n    this.from = from;\n  }\n  get id() {\n    return this.@id;\n  }\n  set id(node) {\n    this.@id = node;\n  }\n  get body() {\n    return this.@body;\n  }\n  set body(node) {\n    this.@body = node;\n  }\n  get from() {\n    return this.@from;\n  }\n  set from(node) {\n    this.@from = node;\n  }\n}\n\nexport class NewExpression extends Expression {\n  private @callee, @args;\n  constructor(callee, args) {\n    this.callee = callee;\n    this.args = args;\n  }\n  get callee() {\n    return this.@callee;\n  }\n  set callee(node) {\n    this.@callee = node;\n  }\n  get args() {\n    return this.@args;\n  }\n  set args(nodelist) {\n    this.@args = nodelist;\n  }\n}\n\nexport class ObjectExpression extends Expression {\n  private @properties;\n  constructor(properties) {\n    this.properties = properties;\n  }\n  get properties() {\n    return this.@properties;\n  }\n  set properties(nodelist) {\n    this.@properties = nodelist;\n  }\n}\n\nexport class ObjectPattern extends Pattern {\n  private @properties;\n  constructor(properties) {\n    this.properties = properties;\n  }\n  get properties() {\n    return this.@properties;\n  }\n  set properties(nodelist) {\n    this.@properties = nodelist;\n  }\n}\n\nexport class Path extends ASTNode {\n  private @body;\n  constructor(body) {\n    this.body = body;\n  }\n  get body() {\n    return this.@body;\n  }\n  set body(nodelist) {\n    this.@body = nodelist;\n  }\n}\n\nexport class Program extends ASTNode {\n  private @body;\n  constructor(body) {\n    this.body = body;\n  }\n  get body() {\n    return this.@body;\n  }\n  set body(nodelist) {\n    this.@body = nodelist;\n  }\n}\n\nexport class Property extends ASTNode {\n  private @key, @value, @kind, @method, @shorthand;\n  constructor(key, value, kind, method, shorthand) {\n    this.key = key;\n    this.value = value;\n    this.kind = kind;\n    this.method = method;\n    this.shorthand = shorthand;\n  }\n  get key() {\n    return this.@key;\n  }\n  set key(node) {\n    this.@key = node;\n  }\n  get value() {\n    return this.@value;\n  }\n  set value(node) {\n    this.@value = node;\n  }\n  get kind() {\n    return this.@kind;\n  }\n  set kind(val) {\n    this.@kind = val;\n  }\n  get method() {\n    return this.@method;\n  }\n  set method(val) {\n    this.@method = val;\n  }\n  get shorthand() {\n    return this.@shorthand;\n  }\n  set shorthand(val) {\n    this.@shorthand = val;\n  }\n}\n\nexport class ReturnStatement extends Statement {\n  private @arg;\n  constructor(arg) {\n    this.arg = arg;\n  }\n  get arg() {\n    return this.@arg;\n  }\n  set arg(node) {\n    this.@arg = node;\n  }\n}\n\nexport class SequenceExpression extends Expression {\n  private @expressions;\n  constructor(expressions) {\n    this.expressions = expressions;\n  }\n  get expressions() {\n    return this.@expressions;\n  }\n  set expressions(nodelist) {\n    this.@expressions = nodelist;\n  }\n}\n\nexport class SpreadElement extends ASTNode {\n  private @arg;\n  constructor(arg) {\n    this.arg = arg;\n  }\n  get arg() {\n    return this.@arg;\n  }\n  set arg(node) {\n    this.@arg = node;\n  }\n}\n\nexport class SwitchStatement extends Statement {\n  private @descriminant, @cases;\n  constructor(descriminant, cases) {\n    this.descriminant = descriminant;\n    this.cases = cases;\n  }\n  get descriminant() {\n    return this.@descriminant;\n  }\n  set descriminant(node) {\n    this.@descriminant = node;\n  }\n  get cases() {\n    return this.@cases;\n  }\n  set cases(nodelist) {\n    this.@cases = nodelist;\n  }\n}\n\nexport class SwitchCase extends ASTNode {\n  private @test, @consequent;\n  constructor(test, consequent) {\n    this.test = test;\n    this.consequent = consequent;\n  }\n  get test() {\n    return this.@test;\n  }\n  set test(node) {\n    this.@test = node;\n  }\n  get consequent() {\n    return this.@consequent;\n  }\n  set consequent(nodelist) {\n    this.@consequent = nodelist;\n  }\n}\n\nexport class SymbolDeclaration extends Declaration {\n  private @declarations, @kind;\n  constructor(declarations, kind) {\n    this.declarations = declarations;\n    this.kind = kind;\n  }\n  get declarations() {\n    return this.@declarations;\n  }\n  set declarations(nodelist) {\n    this.@declarations = nodelist;\n  }\n  get kind() {\n    return this.@kind;\n  }\n  set kind(val) {\n    this.@kind = val;\n  }\n}\n\nexport class SymbolDeclarator extends ASTNode {\n  private @id, @init;\n  constructor(id, init) {\n    this.id = id;\n    this.init = init;\n  }\n  get id() {\n    return this.@id;\n  }\n  set id(node) {\n    this.@id = node;\n  }\n  get init() {\n    return this.@init;\n  }\n  set init(node) {\n    this.@init = node;\n  }\n}\n\nexport class TaggedTemplateExpression extends Expression {\n  private @tag, @template;\n  constructor(tag, template) {\n    this.tag = tag;\n    this.template = template;\n  }\n  get tag() {\n    return this.@tag;\n  }\n  set tag(node) {\n    this.@tag = node;\n  }\n  get template() {\n    return this.@template;\n  }\n  set template(node) {\n    this.@template = node;\n  }\n}\n\nexport class TemplateElement extends ASTNode {\n  private @value, @tail;\n  constructor(value, tail) {\n    this.value = value;\n    this.tail = tail;\n  }\n  get value() {\n    return this.@value;\n  }\n  set value(val) {\n    this.@value = val;\n  }\n  get tail() {\n    return this.@tail;\n  }\n  set tail(val) {\n    this.@tail = val;\n  }\n}\n\nexport class TemplateLiteral extends Expression {\n  private @elements, @expressions;\n  constructor(elements, expressions) {\n    this.elements = elements;\n    this.expressions = expressions;\n  }\n  get elements() {\n    return this.@elements;\n  }\n  set elements(nodelist) {\n    this.@elements = nodelist;\n  }\n  get expressions() {\n    return this.@expressions;\n  }\n  set expressions(nodelist) {\n    this.@expressions = nodelist;\n  }\n}\n\nexport class ThisExpression extends Expression {\n}\n\nexport class ThrowStatement extends Statement {\n  private @arg;\n  constructor(arg) {\n    this.arg = arg;\n  }\n  get arg() {\n    return this.@arg;\n  }\n  set arg(node) {\n    this.@arg = node;\n  }\n}\n\nexport class TryStatement extends Statement {\n  private @block, @handlers, @finalizer;\n  constructor(block, handlers, finalizer) {\n    this.block = block;\n    this.handlers = handlers;\n    this.finalizer = finalizer;\n  }\n  get block() {\n    return this.@block;\n  }\n  set block(node) {\n    this.@block = node;\n  }\n  get handlers() {\n    return this.@handlers;\n  }\n  set handlers(nodelist) {\n    this.@handlers = nodelist;\n  }\n  get finalizer() {\n    return this.@finalizer;\n  }\n  set finalizer(node) {\n    this.@finalizer = node;\n  }\n}\n\nexport class UnaryExpression extends Expression {\n  private @arg, @operator;\n  constructor(arg, operator) {\n    this.arg = arg;\n    this.operator = operator;\n  }\n  get arg() {\n    return this.@arg;\n  }\n  set arg(node) {\n    this.@arg = node;\n  }\n  get operator() {\n    return this.@operator;\n  }\n  set operator(val) {\n    this.@operator = val;\n  }\n}\n\nexport class UpdateExpression extends Expression {\n  private @arg, @operator, @prefix;\n  constructor(arg, operator, prefix) {\n    this.arg = arg;\n    this.operator = operator;\n    this.prefix = prefix;\n  }\n  get arg() {\n    return this.@arg;\n  }\n  set arg(node) {\n    this.@arg = node;\n  }\n  get operator() {\n    return this.@operator;\n  }\n  set operator(val) {\n    this.@operator = val;\n  }\n  get prefix() {\n    return this.@prefix;\n  }\n  set prefix(val) {\n    this.@prefix = val;\n  }\n}\n\nexport class VariableDeclaration extends Declaration {\n  private @declarations, @kind;\n  constructor(declarations, kind) {\n    this.declarations = declarations;\n    this.kind = kind;\n  }\n  get declarations() {\n    return this.@declarations;\n  }\n  set declarations(nodelist) {\n    this.@declarations = nodelist;\n  }\n  get kind() {\n    return this.@kind;\n  }\n  set kind(val) {\n    this.@kind = val;\n  }\n}\n\nexport class VariableDeclarator extends ASTNode {\n  private @id, @init;\n  constructor(id, init) {\n    this.id = id;\n    this.init = init;\n  }\n  get id() {\n    return this.@id;\n  }\n  set id(node) {\n    this.@id = node;\n  }\n  get init() {\n    return this.@init;\n  }\n  set init(node) {\n    this.@init = node;\n  }\n}\n\nexport class WhileStatement extends Statement {\n  private @test, @body;\n  constructor(test, body) {\n    this.test = test;\n    this.body = body;\n  }\n  get test() {\n    return this.@test;\n  }\n  set test(node) {\n    this.@test = node;\n  }\n  get body() {\n    return this.@body;\n  }\n  set body(node) {\n    this.@body = node;\n  }\n}\n\nexport class WithStatement extends Statement {\n  private @object, @body;\n  constructor(object, body) {\n    this.object = object;\n    this.body = body;\n  }\n  get object() {\n    return this.@object;\n  }\n  set object(node) {\n    this.@object = node;\n  }\n  get body() {\n    return this.@body;\n  }\n  set body(node) {\n    this.@body = node;\n  }\n}\n\nexport class YieldExpression extends Expression {\n  private @arg;\n  constructor(arg) {\n    this.arg = arg;\n  }\n  get arg() {\n    return this.@arg;\n  }\n  set arg(node) {\n    this.@arg = node;\n  }\n}\n";

exports.builtins["@reflect"] = "import {\n  ToObject,\n  ToPropertyKey,\n  ToString,\n  ToUint32\n} from '@@operations';\n\nimport {\n  ObjectCreate,\n  Type\n} from '@@types';\n\nimport {\n  builtinClass,\n  builtinFunction,\n  call,\n  createDescriptor,\n  defineOwnProperty,\n  deleteProperty,\n  ensureArgs,\n  ensureDescriptor,\n  ensureFunction,\n  ensureObject,\n  ensureProto,\n  _enumerate: enumerate,\n  getOwnProperty\n} from '@@utilities';\n\nimport {\n  $$CreateObject,\n  $$Get,\n  $$Invoke\n} from '@@internals';\n\n\n\nexport class Proxy {\n  constructor(target, handler){\n    ensureObject(target, 'Proxy');\n    ensureObject(handler, 'Proxy');\n    return $$CreateObject('Proxy', target, handler);\n  }\n}\n\nbuiltinClass(Proxy);\n\ndeleteProperty(Proxy, 'prototype');\n\nconst normal = createDescriptor();\nnormal.writable = true;\nnormal.enumerable = true;\nnormal.configurable = true;\n\n\nexport class Handler {\n  getOwnPropertyDescriptor(target, propertyKey){\n    //throw $$Exception('missing_fundamental_trap', ['getOwnPropertyDescriptor']);\n    return getOwnPropertyDescriptor(target, propertyKey);\n  }\n\n  getOwnPropertyNames(target){\n    //throw $$Exception('missing_fundamental_trap', ['getOwnPropertyNames']);\n    return getOwnPropertyNames(target);\n  }\n\n  getPrototypeOf(target){\n    //throw $$Exception('missing_fundamental_trap', ['getPrototypeOf']);\n    return getPrototypeOf(target);\n  }\n\n  setPrototypeOf(target, proto){\n    //throw $$Exception('missing_fundamental_trap', ['setPrototypeOf']);\n    return setPrototypeOf(target, proto);\n  }\n\n  defineProperty(target, propertyKey, desc){\n    //throw $$Exception('missing_fundamental_trap', ['defineProperty']);\n    return defineProperty(target, propertyKey, desc);\n  }\n\n  deleteProperty(target, propertyKey){\n    //throw $$Exception('missing_fundamental_trap', ['deleteProperty']);\n    return deleteProperty(target, propertyKey);\n  }\n\n  preventExtensions(target){\n    //throw $$Exception('missing_fundamental_trap', ['preventExtensions']);\n    return preventExtensions(target);\n  }\n\n  isExtensible(target){\n    //throw $$Exception('missing_fundamental_trap', ['isExtensible']);\n    return isExtensible(target);\n  }\n\n  apply(target, thisArg, args){\n    //throw $$Exception('missing_fundamental_trap', ['apply']);\n    return apply(target, thisArg, args);\n  }\n\n  seal(target) {\n    if (!this.preventExtensions(target)) return false;\n\n    const props = this.getOwnPropertyNames(target),\n          len   = ToUint32(props.length);\n\n    for (var i = 0; i < len; i++) {\n      success = success && this.defineProperty(target, props[i], { configurable: false });\n    }\n    return success;\n  }\n\n  freeze(target){\n    if (!this.preventExtensions(target)) return false;\n\n    const props = this.getOwnPropertyNames(target),\n          len   = ToUint32(props.length);\n\n    for (var i = 0; i < len; i++) {\n      const propertyKey = props[i];\n      let desc = this.getOwnPropertyDescriptor(target, propertyKey);\n\n      if (desc) {\n        desc = 'writable' in desc || 'value' in desc\n              ? { configurable: false, writable: false }\n              : { configurable: false };\n        success = success && this.defineProperty(target, propertyKey, desc);\n      }\n    }\n\n    return success;\n  }\n\n  isSealed(target){\n    const props = this.getOwnPropertyNames(target),\n          len   = ToUint32(props.length);\n\n    for (var i = 0; i < len; i++) {\n      const desc = this.getOwnPropertyDescriptor(target, props[i]);\n\n      if (desc && desc.configurable) {\n        return false;\n      }\n    }\n\n    return !this.isExtensible(target);\n  }\n\n  isFrozen(target){\n    const props = this.getOwnPropertyNames(target),\n          len   = ToUint32(props.length);\n\n    for (var i = 0; i < len; i++) {\n      const desc = this.getOwnPropertyDescriptor(target, props[i]);\n\n      if (desc.configurable || ('writable' in desc || 'value' in desc) && desc.writable) {\n        return false;\n      }\n    }\n\n    return !this.isExtensible(target);\n  }\n\n  has(target, propertyKey){\n    const desc = this.getOwnPropertyDescriptor(target, propertyKey);\n    if (desc) {\n      return true;\n    }\n\n    const proto = $$Invoke(target, 'GetInheritance');\n    return proto === null ? false : this.has(proto, propertyKey);\n  }\n\n  hasOwn(target, propertyKey){\n    return this.getOwnPropertyDescriptor(target, propertyKey) !== undefined;\n  }\n\n  get(target, propertyKey, receiver = target){\n    const desc = this.getOwnPropertyDescriptor(target, propertyKey);\n\n    if (desc === undefined) {\n      const proto = $$Invoke(target, 'GetInheritance');\n      return proto === null ? undefined : this.get(proto, propertyKey, receiver);\n    }\n\n    if ('writable' in desc || 'value' in desc) {\n      return desc.value;\n    }\n\n    const getter = desc.get;\n    return getter === undefined ? undefined : call(getter, receiver);\n  }\n\n  set(target, propertyKey, value, receiver) {\n    const ownDesc = this.getOwnPropertyDescriptor(target, propertyKey);\n\n    if (ownDesc !== undefined) {\n      if ('get' in ownDesc || 'set' in ownDesc) {\n        const setter = ownDesc.set;\n        if (setter === undefined) {\n          return false;\n        }\n        call(setter, receiver, [value]);\n        return true;\n      } else if (ownDesc.writable === false) {\n        return false;\n      } else if (receiver === target) {\n        defineOwnProperty(receiver, propertyKey, { value: value });\n        return true;\n      } else if (!$$Invoke(receiver, 'IsExtensible')) {\n        return false;\n      }\n      normal.value = value;\n      defineOwnProperty(receiver, propertyKey, normal);\n      normal.value = undefined;\n      return true;\n    }\n\n    const proto = $$Invoke(target, 'GetInheritance');\n    if (proto === null) {\n      if (!$$Invoke(receiver, 'IsExtensible')) {\n        return false;\n      }\n      normal.value = value;\n      defineOwnProperty(receiver, propertyKey, normal);\n      normal.value = undefined;\n      return true;\n    }\n\n    return this.set(proto, propertyKey, value, receiver);\n  }\n\n  enumerate(target){\n    const result = this.getOwnPropertyNames(target),\n          len    = ToUint32(result.length),\n          result = [];\n\n    for (var i = 0; i < len; i++) {\n      const propertyKey = ToString(result[i]),\n            desc = this.getOwnPropertyDescriptor(propertyKey);\n\n      if (desc != null && desc.enumerable) {\n        result.push(propertyKey);\n      }\n    }\n\n    const proto = $$Invoke(target, 'GetInheritance');\n\n    return proto === null ? result : result.concat(enumerate(proto));\n  }\n\n  keys(target){\n    const result = this.getOwnPropertyNames(target),\n          len    = ToUint32(result.length);\n          result = [];\n\n    for (var i = 0; i < len; i++) {\n      const propertyKey = ToString(result[i]),\n            desc = this.getOwnPropertyDescriptor(propertyKey);\n\n      if (desc != null && desc.enumerable) {\n        result.push(propertyKey);\n      }\n    }\n\n    return result;\n  }\n\n  construct(target, args) {\n    const proto    = this.get(target, 'prototype', target),\n          instance = Type(proto) === 'Object' ? ObjectCreate(proto) : {},\n          result   = this.apply(target, instance, args);\n\n    return Type(result) === 'Object' ? result : instance;\n  }\n}\n\nbuiltinClass(Handler);\n\n\n\nexport function apply(target, thisArg, args){\n  ensureFunction(target, '@reflect.apply');\n  return $$Invoke(target, 'Call', thisArg, $$Get(ensureArgs(args), 'array'));\n}\n\nbuiltinFunction(apply);\n\n\nexport function construct(target, args){\n  ensureFunction(target, '@reflect.construct');\n  return $$Invoke(target, 'Construct', $$Get(ensureArgs(args), 'array'));\n}\n\nbuiltinFunction(construct);\n\n\nexport function defineProperty(target, propertyKey, attributes){\n  ensureObject(target, '@reflect.defineProperty');\n  ensureDescriptor(attributes);\n  return defineOwnProperty(target, ToPropertyKey(propertyKey), attributes);\n}\n\nbuiltinFunction(defineProperty);\n\n\nexport function deleteProperty(target, propertyKey){\n  ensureObject(target, '@reflect.deleteProperty');\n  return $$Invoke(target, 'Delete', ToPropertyKey(propertyKey), false);\n}\n\nbuiltinFunction(deleteProperty);\n\n\nexport function enumerate(target){\n  return _enumerate(ToObject(target), true, true);\n}\n\nbuiltinFunction(enumerate);\n\n\nexport function freeze(target){\n  if (Type(target) !== 'Object' || !$$Invoke(target, 'PreventExtensions')) {\n    return false;\n  }\n\n  const props = _enumerate(target, false, false),\n        len   = props.length;\n\n  letsuccess = true;\n\n  for (var i = 0; i < len; i++) {\n    const desc = getOwnProperty(target, props[i]),\n          attrs = 'writable' in desc || 'value' in desc\n            ? { configurable: false, writable: false }\n            : desc !== undefined\n              ? { configurable: false }\n              : null;\n\n    if (attrs !== null) {\n      success = success && defineOwnProperty(target, props[i], attrs);\n    }\n  }\n\n  return success;\n}\n\nbuiltinFunction(freeze);\n\n\nexport function get(target, propertyKey, receiver = target){\n  return $$Invoke(ToObject(target), 'GetP', ToPropertyKey(propertyKey), ToObject(receiver));\n}\n\nbuiltinFunction(get);\n\n\nexport function getOwnPropertyDescriptor(target, propertyKey){\n  ensureObject(target, '@reflect.getOwnPropertyDescriptor');\n  return getOwnProperty(target, ToPropertyKey(propertyKey));\n}\n\nbuiltinFunction(getOwnPropertyDescriptor);\n\n\nexport function getOwnPropertyNames(target){\n  ensureObject(target, '@reflect.getOwnPropertyNames');\n  return _enumerate(target, false, false);\n}\n\nbuiltinFunction(getOwnPropertyNames);\n\n\nexport function ownPropertyKeys(target){\n  ensureObject(target, '@reflect.ownPropertyKeys');\n  return ownKeys(target);\n}\n\nbuiltinFunction(getOwnPropertyNames);\n\n\nexport function getPrototypeOf(target){\n  ensureObject(target, '@reflect.getPrototypeOf');\n  return $$Invoke(target, 'GetInheritence');\n}\n\nbuiltinFunction(getPrototypeOf);\n\n\nexport function setPrototypeOf(target, proto){\n  ensureObject(target, '@reflect.setPrototypeOf');\n  ensureProto(proto, '@reflect.setPrototypeOf');\n  return $$Invoke(target, 'SetInheritance', proto);\n}\n\nbuiltinFunction(getPrototypeOf);\n\n\nexport function has(target, propertyKey){\n  return $$Invoke(ToObject(target), 'HasProperty', ToPropertyKey(propertyKey));\n}\n\nbuiltinFunction(has);\n\n\nexport function hasOwn(target, propertyKey){\n  return $$Invoke(ToObject(target), 'HasOwnProperty', ToPropertyKey(propertyKey));\n}\n\nbuiltinFunction(hasOwn);\n\n\nexport function isFrozen(target){\n  ensureObject(target, '@reflect.isFrozen');\n\n  if ($$Invoke(target, 'IsExtensible')) {\n    return false;\n  }\n\n  const props = _enumerate(target, false, false);\n\n  for (var i=0; i < props.length; i++) {\n    const desc = getOwnProperty(target, props[i]);\n    if (desc && desc.configurable || 'writable' in desc && desc.writable) {\n      return false;\n    }\n  }\n\n  return true;\n}\n\nbuiltinFunction(isFrozen);\n\n\nexport function isSealed(target){\n  ensureObject(target, '@reflect.isSealed');\n\n  if ($$Invoke(target, 'IsExtensible')) {\n    return false;\n  }\n\n  const props = _enumerate(target, false, false);\n\n  for (var i=0; i < props.length; i++) {\n    const desc = getOwnProperty(target, props[i]);\n    if (desc && desc.configurable) {\n      return false;\n    }\n  }\n\n  return true;\n}\n\nbuiltinFunction(isSealed);\n\n\nexport function isExtensible(target){\n  ensureObject(target, '@reflect.isExtensible');\n  return $$Invoke(target, 'IsExtensible');\n}\n\nbuiltinFunction(isExtensible);\n\n\nexport function keys(target){\n  ensureObject(target, '@reflect.keys');\n  return _enumerate(target, false, true);\n}\n\nbuiltinFunction(keys);\n\n\nexport function preventExtensions(target){\n  return Type(target) === 'Object' ? $$Invoke(target, 'PreventExtensions') : false;\n}\n\nbuiltinFunction(preventExtensions);\n\n\nexport function seal(target){\n  if (Type(target) !== 'Object') {\n    return false;\n  }\n\n  let success = $$Invoke(target, 'PreventExtensions');\n  if (!success) {\n    return success;\n  }\n\n  const props = _enumerate(target, false, false),\n        len   = props.length,\n        desc  = { configurable: false };\n\n  for (var i = 0; i < len; i++) {\n    success = success && defineOwnProperty(target, props[i], desc);\n  }\n\n  return success;\n}\n\nbuiltinFunction(seal);\n\n\nexport function set(target, propertyKey, value, receiver = target){\n  return $$Invoke(ToObject(target), 'SetP', ToPropertyKey(propertyKey), value, ToObject(receiver));\n}\n\nbuiltinFunction(set);\n";

exports.builtins["@regexp"] = "import {\n  Type\n} from '@@types';\n\nimport {\n  ToString\n} from '@@operations';\n\nimport {\n  builtinClass,\n  builtinFunction,\n  hasBrand\n} from '@@utilities';\n\nimport {\n  $$Exception,\n  $$IsConstruct\n} from '@@internals';\n\nimport {\n  $$RegExpCreate,\n  $$RegExpExec,\n  $$RegExpTest,\n  $$RegExpToString\n} from '@@regexp';\n\n\nexport class RegExp {\n  constructor(pattern, flags){\n    if ($$IsConstruct()) {\n      if (pattern === undefined) {\n        pattern = '';\n      } else if (hasBrand(pattern, 'BuiltinRegExp')) {\n        if (flags !== undefined) {\n          throw $$Exception('regexp_flags', []);\n        }\n      } else {\n        pattern = ToString(pattern);\n      }\n    } else if (flags === undefined && hasBrand(pattern, 'BuiltinRegExp')) {\n      return pattern;\n    }\n    return $$RegExpCreate(pattern, flags);\n  }\n\n  exec(string){\n    if (hasBrand(this, 'BuiltinRegExp')) {\n      return $$RegExpExec(this, ToString(string));\n    }\n\n    throw $$Exception('not_generic', ['RegExp.prototype.exec']);\n  }\n\n  test(string){\n    if (hasBrand(this, 'BuiltinRegExp')) {\n      return $$RegExpTest(this, ToString(string));\n    }\n\n    throw $$Exception('not_generic', ['RegExp.prototype.test']);\n  }\n\n  toString(){\n    if (hasBrand(this, 'BuiltinRegExp')) {\n      return $$RegExpToString(this);\n    }\n\n    throw $$Exception('not_generic', ['RegExp.prototype.toString']);\n  }\n}\n\nbuiltinClass(RegExp);\n\n\nexport function exec(regexp, string){\n  if (hasBrand(regexp, 'BuiltinRegExp')) {\n    return $$RegExpExec(regexp, ToString(string));\n  }\n  throw $$Exception('not_generic', ['@regexp.exec']);\n}\n\nbuiltinFunction(exec);\n\n\nexport function test(regexp, string){\n  if (hasBrand(regexp, 'BuiltinRegExp')) {\n    return $$RegExpTest(regexp, ToString(string));\n  }\n  throw $$Exception('not_generic', ['@regexp.test']);\n}\n\nbuiltinFunction(test);\n";

exports.builtins["@set"] = "import {\n  @@iterator: iterator,\n  @@create  : create\n} from '@@symbols';\n\nimport {\n  undefined\n} from '@@constants';\n\nimport {\n  $$Exception,\n  $$Get,\n  $$Has,\n  $$Set\n} from '@@internals';\n\nimport {\n  builtinClass,\n  builtinFunction,\n  define,\n  extend,\n  hasBrand,\n  hideEverything,\n  internalFunction,\n  isInitializing\n} from '@@utilities';\n\nimport {\n  Type\n} from '@@types';\n\nimport {\n  OrdinaryCreateFromConstructor,\n  ToObject\n} from '@@operations';\n\nimport {\n  $$MapClear,\n  $$MapDelete,\n  $$MapGet,\n  $$MapHas,\n  $$MapInitialization,\n  $$MapNext,\n  $$MapSet,\n  $$MapSigil,\n  $$MapSize\n} from '@@collections';\n\nimport {\n  Map\n} from '@map';\n\nimport {\n  Iterator\n} from '@iter';\n\nimport {\n  hasOwn\n} from '@reflect';\n\nfunction ensureSet(o, name){\n  const type = typeof o;\n  if (type === 'object' ? o === null : type !== 'function') {\n    throw $$Exception('called_on_non_object', [name]);\n  }\n\n  const data = $$Get(o, 'SetData');\n  if (!data) {\n    throw $$Exception('called_on_incompatible_object', [name]);\n  }\n\n  return data;\n}\n\ninternalFunction(ensureSet);\n\n\n\nclass SetIterator extends Iterator {\n  private @data, // Set\n          @key;  // SetNextKey\n\n  constructor(set){\n    this.@data = ensureSet(ToObject(set), 'SetIterator');\n    this.@key  = $$MapSigil();\n  }\n\n  next(){\n    if (Type(this) !== 'Object') {\n      throw $$Exception('called_on_non_object', ['SetIterator.prototype.next']);\n    }\n\n    if (!hasOwn(this, @data) || !hasOwn(this, @key)) {\n      throw $$Exception('called_on_incompatible_object', ['SetIterator.prototype.next']);\n    }\n\n    const next = $$MapNext(this.@data, this.@key);\n    if (!next) {\n      throw StopIteration;\n    }\n\n    return this.@key = next[0];\n  }\n}\n\nbuiltinClass(SetIterator);\n\n\n\n\nexport class Set {\n  constructor(iterable){\n    if (!isInitializing(this, 'SetData')) {\n      return new Set(iterable);\n    }\n\n    const data = new Map;\n    $$Set(this, 'SetData', data);\n\n    if (iterable !== undefined) {\n      iterable = ToObject(iterable);\n      for (let [key, value] of iterable) {\n        $$MapSet(data, value, true);\n      }\n    }\n  }\n\n  get size(){\n    if (this && $$Has(this, 'SetData')) {\n      return $$MapSize($$Get(this, 'SetData'));\n    }\n    return 0;\n  }\n\n  clear(){\n    $$MapClear(ensureSet(this, 'Set.prototype.clear'));\n    return this;\n  }\n\n  add(value){\n    $$MapSet(ensureSet(this, 'Set.prototype.add'), value, value);\n    return this;\n  }\n\n  has(value){\n    return $$MapHas(ensureSet(this, 'Set.prototype.has'), value);\n  }\n\n  delete(value){\n    return $$MapDelete(ensureSet(this, 'Set.prototype.delete'), value);\n  }\n\n  values(){\n    return new SetIterator(this);\n  }\n}\n\nextend(Set, {\n  @@create(){\n    const obj = OrdinaryCreateFromConstructor(this, '%SetPrototype%');\n    $$Set(obj, 'SetData', undefined);\n    $$Set(obj, 'BuiltinBrand', 'BuiltinSet');\n    return obj;\n  }\n});\n\nbuiltinClass(Set);\nconst SetPrototype = Set.prototype;\ndefine(SetPrototype, @@iterator, SetPrototype.values);\n\n\n\nfunction setAdd(set, value){\n  $$MapSet(ensureSet(set, '@set.add'), value, value);\n  return set;\n}\n\nbuiltinFunction(setAdd);\n\n\nfunction setClear(set){\n  $$MapClear(ensureSet(set, '@set.clear'));\n  return set;\n}\n\nbuiltinFunction(setClear);\n\n\nfunction setDelete(set, value){\n  return $$MapDelete(ensureSet(set, '@set.delete'), value);\n}\n\nbuiltinFunction(setDelete);\n\n\nfunction setHas(set, value){\n  return $$MapHas(ensureSet(set, '@set.has'), value);\n}\n\nbuiltinFunction(setHas);\n\n\nfunction setSize(set){\n  return $$MapSize(ensureMap(set, '@set.size'));\n}\n\nbuiltinFunction(setSize);\n\n\nfunction setIterate(set){\n  return new SetIterator(set);\n}\n\nbuiltinFunction(setIterate);\n\n\nexport const add     = setAdd,\n             clear   = setClear,\n           //delete  = setDelete, TODO: fix exporting reserved names\n             has     = setHas,\n             iterate = setIterate,\n             size    = setSize;\n";

exports.builtins["@std"] = "import {\n  $$CurrentRealm,\n  $$GetIntrinsic\n} from '@@internals';\n\n// standard constants\nconst NaN       = +'NaN',\n      Infinity  = 1 / 0,\n      undefined = void 0;\n\n// standard functions\nimport {\n  escape,\n  decodeURI,\n  decodeURIComponent,\n  encodeURI,\n  encodeURIComponent,\n  eval,\n  isFinite,\n  isNaN,\n  parseFloat,\n  parseInt,\n  unescape\n} from '@globals';\n\n\nimport {\n  clearImmediate,\n  clearInterval,\n  clearTimeout,\n  setImmediate,\n  setInterval,\n  setTimeout\n} from '@timers';\n\n// standard types\nimport { Array    } from '@array';\nimport { Boolean  } from '@boolean';\nimport { Date     } from '@date';\nimport { Function } from '@function';\nimport { Map      } from '@map';\nimport { Number   } from '@number';\nimport { Object   } from '@object';\nimport { Proxy    } from '@reflect';\nimport { RegExp   } from '@regexp';\nimport { Set      } from '@set';\nimport { String   } from '@string';\nimport { WeakMap  } from '@weakmap';\n\n\n// standard errors\nimport {\n  Error,\n  EvalError,\n  RangeError,\n  ReferenceError,\n  SyntaxError,\n  TypeError,\n  URIError\n} from '@error';\n\nimport {\n  ArrayBuffer,\n  DataView,\n  Float32Array,\n  Float64Array,\n  Int16Array,\n  Int32Array,\n  Int8Array,\n  Uint16Array,\n  Uint32Array,\n  Uint8Array\n} from '@typed-arrays';\n\n\n// standard pseudo-modules\nimport { JSON } from '@json';\nimport { Math } from '@math';\n\nimport {\n  Symbol\n} from '@symbol';\n\nimport {\n  Iterator,\n  StopIteration\n} from '@iter';\n\nimport {\n  console\n} from '@console';\n\n\nexport Array, Boolean, Date, Function, Map, Number, Object, Proxy, RegExp, Set, String, WeakMap,\n       Error, EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError,\n       ArrayBuffer, DataView, Float32Array, Float64Array, Int16Array,\n       Int32Array, Int8Array, Uint16Array, Uint32Array, Uint8Array,\n       clearImmediate, clearInterval, clearTimeout, setImmediate, setInterval, setTimeout,\n       decodeURI, decodeURIComponent, escape, encodeURI, encodeURIComponent,\n       eval, isFinite, isNaN, parseFloat, parseInt, unescape,\n       console, StopIteration, JSON, Math,\n       NaN, Infinity, undefined;\n";

exports.builtins["@string"] = "import {\n  $$ArgumentCount,\n  $$Call,\n  $$CreateInternalObject,\n  $$Get,\n  $$Exception,\n  $$Has,\n  $$Invoke,\n  $$Set\n} from '@@internals';\n\nimport {\n  $$RegExpExec\n} from '@@regexp';\n\nimport {\n  $$StringFromCharCode,\n  $$StringReplace,\n  $$StringSplit,\n  $$StringSearch,\n  $$StringSlice,\n  $$StringToCharCode\n} from '@@string';\n\nimport {\n  undefined\n} from '@@constants';\n\nimport {\n  builtinClass,\n  call,\n  createInternal,\n  define,\n  extend,\n  extendInternal,\n  hasBrand,\n  internalFunction,\n  isInitializing,\n  listFrom,\n  listOf,\n  min,\n  max,\n  numbers\n} from '@@utilities';\n\nimport {\n  OrdinaryCreateFromConstructor,\n  ToInteger,\n  ToString,\n  ToUint16,\n  ToUint32\n} from '@@operations';\n\nimport {\n  @@create: create\n} from '@@symbols';\n\nimport {\n  MAX_INTEGER\n} from '@number';\n\nimport {\n  RegExp\n} from '@regexp';\n\nimport {\n  Array\n} from '@array';\n\nimport {\n  dict\n} from '@dict';\n\nconst trimmer = /^[\\s\\uFEFF\\xA0]+|[\\s\\uFEFF\\xA0]+$/;\n\n\nfunction ensureCoercible(target, method){\n  if (target == null) {\n    throw $$Exception('object_not_coercible', [`String.prototype.${method}`, target]);\n  }\n\n  return ToString(target);\n}\n\ninternalFunction(ensureCoercible);\n\n\nfunction ToHTML(tag, content, attrName, attrVal){\n  const attr = attrName === undefined ? '' : ` ${attrName}=\"${$$StringReplace(ToString(attrVal), '\"', '&quot;')}\"`;\n\n  return `<${tag}${attr}>${content}</${tag}>`;\n}\n\ninternalFunction(ToHTML);\n\n\nfunction stringIndexOf(string, search, position){\n  const searchStr = ToString(search),\n        pos       = ToInteger(position),\n        len       = string.length,\n        searchLen = searchStr.length,\n        maxLen    = len - searchLen;\n\n  let index = min(max(pos, 0), len);\n  let offset = 0;\n\n  while (offset < searchLen && index < maxLen && searchStr[offset++] === string[index++]) {\n    if (offset === searchLen) {\n      return index;\n    }\n  }\n\n  return -1;\n}\n\ninternalFunction(stringIndexOf);\n\n\nfunction stringMatch(string, regexp){\n  if (!hasBrand(regexp, 'BuiltinRegExp')) {\n    regexp = new RegExp(regexp);\n  }\n\n  if (!regexp.global) {\n    return $$RegExpExec(regexp, string);\n  }\n\n  const array = [];\n  let previous  = 0,\n      index     = 0,\n      lastMatch = true;\n\n  regexp.lastIndex = 0;\n\n  while (lastMatch) {\n    const result = $$RegExpExec(regexp, string);\n    if (result === null) {\n      lastMatch = false;\n    } else {\n      let thisIndex = regexp.lastIndex;\n      if (thisIndex === lastIndex) {\n        previous = regexp.lastIndex = thisIndex + 1;\n      } else {\n        previous = thisIndex;\n      }\n      array[index++] = result[0];\n    }\n  }\n\n  return index === 0 ? null : array;\n}\n\ninternalFunction(stringMatch);\n\n\nexport class String {\n  constructor(value){\n    value = $$ArgumentCount() ? ToString(value) : '';\n\n    if (!isInitializing(this, 'StringValue')) {\n      return value;\n    }\n\n    $$Set(this, 'StringValue', value);\n    define(this, 'length', value.length, 0);\n  }\n\n  anchor(name){\n    return ToHTML('a', ensureCoercible(this, 'anchor'), 'name', name);\n  }\n\n  big(){\n    return ToHTML('big', ensureCoercible(this, 'big'));\n  }\n\n  blink(){\n    return ToHTML('blink', ensureCoercible(this, 'blink'));\n  }\n\n  bold(){\n    return ToHTML('b', ensureCoercible(this, 'bold'));\n  }\n\n  fixed(){\n    return ToHTML('fixed', ensureCoercible(this, 'fixed'));\n  }\n\n  fontcolor(color){\n    return ToHTML('font', ensureCoercible(this, 'fontcolor'), 'color', color);\n  }\n\n  fontsize(size){\n    return ToHTML('font', ensureCoercible(this, 'fontsize'), 'size', size);\n  }\n\n  italics(){\n    return ToHTML('i', ensureCoercible(this, 'italics'));\n  }\n\n  link(href){\n    return ToHTML('a', ensureCoercible(this, 'link'), 'href', href);\n  }\n\n  small(){\n    return ToHTML('small', ensureCoercible(this, 'small'));\n  }\n\n  strike(){\n    return ToHTML('s', ensureCoercible(this, 'strike'));\n  }\n\n  sub(){\n    return ToHTML('sub', ensureCoercible(this, 'sub'));\n  }\n\n  sup(){\n    return ToHTML('sup', ensureCoercible(this, 'sup'));\n  }\n\n  charAt(position){\n    const string = ensureCoercible(this, 'charAt');\n\n    position = ToInteger(position);\n\n    return position < 0 || position >= string.length ? '' : string[position];\n  }\n\n  charCodeAt(position){\n    const string = ensureCoercible(this, 'charCodeAt');\n\n    position = ToInteger(position);\n\n    return position < 0 || position >= string.length ? NaN : $$StringToCharCode(string[position]);\n  }\n\n  concat(...args){\n    let string = ensureCoercible(this, 'concat');\n\n    for (var i=0; i < args.length; i++) {\n      string += ToString(args[i]);\n    }\n\n    return string;\n  }\n\n  contains(searchString, position = undefined){\n    const s = ensureCoercible(this, 'contains');\n\n    return stringIndexOf(s, searchString, position) !== -1;\n  }\n\n  endsWith(searchString, endPosition = undefined){\n    const s            = ensureCoercible(this, 'endsWith'),\n          searchStr    = ToString(searchString),\n          len          = s.length,\n          pos          = endPosition === undefined ? len : ToInteger(endPosition),\n          end          = min(max(pos, 0), len),\n          searchLength = searchString.length,\n          start        = end - searchLength;\n\n    if (start < 0) {\n      return false;\n    }\n\n    const index = stringIndexOf(s, searchString, start);\n\n    return index === start;\n  }\n\n  indexOf(searchString, position = 0){\n    return stringIndexOf(ensureCoercible(this, 'indexOf'), searchString, position);\n  }\n\n  lastIndexOf(searchString, position = Infinity){\n    const string    = ensureCoercible(this, 'lastIndexOf'),\n          search    = ToString(searchString),\n          len       = string.length,\n          searchLen = searchString.length,\n          pos       = ToInteger(position) - searchLen;\n\n    let index = pos > 0 ? pos < len ? pos : len : 0;\n\n    while (index--) {\n      let offset = 0;\n      while (offset < searchLen && searchString[offset] === string[index + offset]) {\n        if (++offset === searchLen) {\n          return index;\n        }\n      }\n    }\n\n    return -1;\n  }\n\n  localeCompare(){\n    // TODO\n  }\n\n  match(regexp){\n    return stringMatch(ensureCoercible(this, 'match'), regexp);\n  }\n\n  repeat(count){\n    let string = ensureCoercible(this, 'repeat'),\n        factor = ToInteger(count),\n        result = '';\n\n    if (factor <= 1 || factor === Infinity || factor === -Infinity) {\n      throw $$Exception('invalid_repeat_count', []);\n    }\n\n    while (factor > 0) {\n      (factor & 1) && (result += string);\n      factor >>= 1;\n      string += string;\n    }\n\n    return result;\n  }\n\n  replace(search, replace){\n    const string = ensureCoercible(this, 'replace');\n\n    if (typeof replace === 'function') {\n      let match, count;\n      if (hasBrand(search, 'BuiltinRegExp')) {\n        match = stringMatch(string, search);\n        count = matches.length;\n      } else {\n        match = stringIndexOf(string, ToString(search));\n        count = 1;\n      }\n      //TODO\n    } else {\n      replace = ToString(replace);\n      if (!hasBrand(search, 'BuiltinRegExp')) {\n        search = ToString(search);\n      }\n\n      return $$StringReplace(string, search, replace);\n    }\n  }\n\n  search(regexp){\n    const string = ensureCoercible(this, 'search');\n\n    if (!hasBrand(regexp, 'BuiltinRegExp')) {\n      regexp = new RegExp(regexp);\n    }\n\n    return $$StringSearch(string, regexp);\n  }\n\n  slice(start = 0, end = this.length){\n    const string = ensureCoercible(this, 'slice');\n\n    start = ToInteger(start);\n    end = ToInteger(end);\n\n    return $$Invoke(string, 'slice', start, end);\n  }\n\n  split(separator, limit = MAX_INTEGER - 1){\n    const string = ensureCoercible(this, 'split');\n\n    limit = ToInteger(limit);\n    separator = hasBrand(separator, 'BuiltinRegExp') ? separator : ToString(separator);\n\n    return $$StringSplit(string, separator, limit);\n  }\n\n  startsWith(searchString, position = 0) {\n    const searchStr    = ToString(searchString),\n          s            = ensureCoercible(this, 'startsWith'),\n          pos          = ToInteger(position),\n          len          = s.length,\n          start        = min(max(pos, 0), len),\n          searchLength = searchString.length;\n\n    if (searchLength + start > len) {\n      return false;\n    }\n\n    const index = stringIndexOf(s, searchString, start);\n\n    return index === start;\n  }\n\n  substr(start = 0, length = Infinity){\n    const string = ensureCoercible(this, 'substr'),\n          chars  = string.length;\n\n    start = ToInteger(start);\n\n    if (start < 0) {\n      start = min(start + chars, 0);\n    }\n\n    const len = min(max(ToInteger(length), 0), chars - start);\n\n    return len === 0 ? '' : $$Invoke(string, 'slice', start, start + len);\n  }\n\n  substring(start = 0, end = this.length){\n    const string   = ensureCoercible(this, 'substring'),\n          len      = string.length,\n          startInt = min(max(ToInteger(start), 0), len),\n          endInt   = min(max(ToInteger(end), 0), len),\n          from     = min(start, end),\n          to       = max(start, end);\n\n    return $$Invoke(string, 'slice', from, to);\n  }\n\n  toLocaleLowerCase(){\n    return $$Invoke(ensureCoercible(this, 'toLocaleLowerCase'), 'toLocaleLowerCase');\n  }\n\n  toLocaleUpperCase(){\n    return $$Invoke(ensureCoercible(this, 'toLocaleUpperCase'), 'toLocaleUpperCase');\n  }\n\n  toLowerCase(){\n    return $$Invoke(ensureCoercible(this, 'toLowerCase'), 'toLowerCase');\n  }\n\n  toString(){\n    if (typeof this === 'string') {\n      return this;\n    } else if (hasBrand(this, 'StringWrapper')) {\n      return $$Get(this, 'StringValue');\n    }\n\n    throw $$Exception('not_generic', ['String.prototype.toString']);\n  }\n\n  toUpperCase(){\n    return $$Invoke(ensureCoercible(this, 'toUpperCase'), 'toUpperCase');\n  }\n\n  trim(){\n    return $$StringReplace(ensureCoercible(this, 'trim'), trimmer, '');\n  }\n\n  valueOf(){\n    if (typeof this === 'string') {\n      return this;\n    } else if (hasBrand(this, 'StringWrapper')) {\n      return $$Get(this, 'StringValue');\n    }\n\n    throw $$Exception('not_generic', ['String.prototype.valueOf']);\n  }\n}\n\nbuiltinClass(String, 'StringWrapper');\n$$Set(String.prototype, 'StringValue', '');\ndefine(String.prototype, 'length', 0, 0);\n\n\nexport function fromCharCode(...codeUnits){\n  const length = codeUnits.length;\n  let result = '';\n\n  for (var i=0; i < length; i++) {\n    result += $$StringFromCharCode(ToUint16(codeUnits[i]));\n  }\n\n  return result;\n}\n\nextend(String, {\n  fromCharCode,\n  @@create(){\n    const obj = OrdinaryCreateFromConstructor(this, '%StringPrototype%');\n    $$Set(obj, 'BuiltinBrand', 'StringWrapper');\n    $$Set(obj, 'StringValue', undefined);\n    return extendInternal(obj, internalMethods);\n  }\n});\n\n\n\n\nfunction unique(strings){\n  const len    = strings.length,\n        count  = 0,\n        seen   = dict(),\n        result = [];\n\n  for (var i=0; i < len; i++) {\n    const string = strings[i];\n    if (!(string in seen)) {\n      seen[string] = true;\n      result[count++] = string;\n    }\n  }\n\n  return result;\n}\n\ninternalFunction(unique);\n\n\nfunction getCharacter(obj, key){\n  const string = $$Get(obj, 'StringValue'),\n        index  = ToUint32(key);\n\n  if (ToString(index) === key && index < $$Get(string, 'length')) {\n    return $$Get(string, key);\n  }\n}\n\ninternalFunction(getCharacter);\n\n\nconst StringIndexDescriptor = createInternal(null, {\n  Value: undefined,\n  Writable: false,\n  Enumerable: true,\n  Configurable: false,\n  attrs: 1\n});\n\nconst GetOwnProperty = $$Get(String.prototype, 'GetOwnProperty'),\n      Enumerate      = $$Get(String.prototype, 'Enumerate');\n\nconst describe = $$Get(String.prototype, 'describe'),\n      get      = $$Get(String.prototype, 'get'),\n      has      = $$Get(String.prototype, 'has'),\n      query    = $$Get(String.prototype, 'query'),\n      each     = $$Get(String.prototype, 'each');\n\nconst internalMethods = {\n  GetOwnProperty(P){\n    const char = getCharacter(this, P);\n\n    if (char) {\n      const Desc = $$CreateInternalObject(StringIndexDescriptor);\n      $$Set(Desc, 'Value', char);\n      return Desc;\n    }\n\n    return $$Call(GetOwnProperty, this, P);\n  },\n  Get(P){\n    const char = getCharacter(this, P);\n\n    if (char) {\n      return char;\n    }\n\n    return $$Invoke(this, 'GetP', this, P);\n  },\n  Enumerate(includePrototype, onlyEnumerable){\n    const length = this.length,\n          props  = $$Call(Enumerate, this, includePrototype, onlyEnumerable);\n\n    if (!length) {\n      return props;\n    }\n\n    const array = [];\n    $$Set(array, 'array', props);\n    return listFrom(unique(numbers($$Get(props, 'length')).concat(array)));\n  },\n  each(callback){\n    const string = $$Get(this, 'StringValue'),\n          length = $$Get(string, 'length');\n\n    for (var i=0; i < length; i++) {\n      $$Call(callback, this, listOf(ToString(i), $$Get(string, i), 1));\n    }\n\n    return $$Call(each, this, callback);\n  },\n  has(key){\n    if (getCharacter(this, key)) {\n      return true;\n    }\n\n    return $$Call(has, this, key);\n  },\n  get(key){\n    const char = getCharacter(this, key);\n\n    if (char) {\n      return char;\n    }\n\n    return $$Call(get, this, key);\n  },\n  query(key){\n    const char = getCharacter(this, key);\n\n    if (char) {\n      return 1;\n    }\n\n    return $$Call(query, this, key);\n  },\n  describe(key){\n    const char = getCharacter(this, key);\n\n    if (char) {\n      return listOf(key, char, 1);\n    }\n\n    return $$Call(describe, this, key);\n  }\n};\n";

exports.builtins["@symbol"] = "import {\n  $$CreateObject,\n  $$Exception\n} from '@@internals';\n\nimport {\n  builtinClass\n} from '@@utilities';\n\nimport {\n  ToBoolean\n} from '@@operations';\n\n\nexport class Symbol {\n  constructor(name, isPublic){\n    if (name == null) {\n      throw $$Exception('unnamed_symbol', []);\n    }\n    return $$CreateObject('Symbol', name, ToBoolean(isPublic));\n  }\n}\n\n\nbuiltinClass(Symbol);\n";

exports.builtins["@system"] = "import {\n  ToObject\n} from '@@operations';\n\nimport {\n  ObjectCreate,\n  Type\n} from '@@types';\n\nimport {\n  builtinClass,\n  builtinFunction,\n  define,\n  hasBrand\n} from '@@utilities';\n\nimport {\n  $$CurrentRealm,\n  $$EvaluateModule,\n  $$EvaluateModuleAsync,\n  $$Fetch,\n  $$Get,\n  $$GetIntrinsic,\n  $$ReadFile,\n  $$Resolve,\n  $$Set,\n  $$SetIntrinsic,\n  $$ToModule\n} from '@@internals';\n\n\nclass Request {\n  private @loader, @callback, @errback, @mrl, @resolved;\n\n  constructor(loader, mrl, resolved, callback, errback){\n    this.@loader   = loader;\n    this.@mrl      = mrl;\n    this.@resolved = resolved;\n    this.@callback = callback;\n    this.@errback  = errback;\n  }\n\n  fulfill(src){\n    const loader = this.@loader;\n    let translated = (loader.@translate)(src, this.@mrl, loader.baseURL, this.@resolved);\n\n    if (loader.@strict) {\n      translated = '\"use strict\";\\n' + translated;\n    }\n\n    $$EvaluateModuleAsync(loader, translated, this.@resolved, module => {\n      $$Set(module, 'loader', loader);\n      $$Set(module, 'resolved', this.@resolved);\n      $$Set(module, 'mrl', this.@mrl);\n      loader.@modules[this.@resolved] = module;\n      (this.@callback)(module);\n    }, msg => this.reject(msg));\n  }\n\n  redirect(mrl, baseURL){\n    const loader   = this.@loader,\n          resolved = (loader.@resolve)(mrl, baseURL),\n          module   = loader.get(resolved);\n\n    this.@resolved = resolved;\n    this.@mrl = mrl;\n\n    if (module) {\n      (this.@callback)(module);\n    } else {\n      (loader.@fetch)(mrl, baseURL, this, resolved);\n    }\n  }\n\n  reject(msg){\n    (this.@errback)(msg);\n  }\n}\n\n\nprivate @strict, @resolve, @modules, @translate, @fetch;\n\n\nexport class Loader {\n  private @options, @parent;\n\n  constructor(parent, options = {}){\n    this.@strict  = true;\n    this.@modules = ObjectCreate(null);\n    this.@options = ToObject(options);\n    this.@parent  = parent && parent.@options ? parent : typeof System === 'undefined' ? {} : System;\n    this.linkedTo = this.@options.linkedTo || null;\n  }\n\n  get global(){\n    return this.@options.global || this.@parent.global || $$GetIntrinsic('global');\n  }\n\n  get baseURL(){\n    return this.@options.baseURL || this.@parent.baseURL || '';\n  }\n\n  get @translate(){\n    return this.@options.translate || this.@parent.@translate;\n  }\n\n  get @resolve(){\n    return this.@options.resolve || this.@parent.@resolve;\n  }\n\n  get @fetch(){\n    return this.@options.fetch || this.@parent.@fetch;\n  }\n\n  load(mrl, callback, errback){\n    const canonical = (this.@resolve)(mrl, this.baseURL),\n          module    = this.@modules[canonical];\n\n    if (module) {\n      callback(module);\n    } else {\n      (this.@fetch)(mrl, this.baseURL, new Request(this, mrl, canonical, callback, errback), canonical);\n    }\n  }\n\n  // TODO feedback: Loader#eval needs an optional? name/mrl parameter\n  eval(src, mrl = ''){\n    return $$EvaluateModule(this, src, mrl);\n  }\n\n  // TODO feedback: Loader#evalAsync needs an optional? name/mrl parameter\n  evalAsync(src, callback, errback, mrl = ''){\n    $$EvaluateModuleAsync(this, src, mrl, callback, errback);\n  }\n\n  get(mrl){\n    const canonical = (this.@resolve)(mrl, this.baseURL);\n\n    return this.@modules[canonical];\n  }\n\n  set(mrl, mod){\n    const canonical = (this.@resolve)(mrl, this.baseURL);\n\n    if (typeof canonical === 'string') {\n      this.@modules[canonical] = mod;\n    } else if (Type(canonical) === 'Object') {\n      for (let mrl in canonical) {\n        this.@modules[mrl] = canonical[mrl];\n      }\n    }\n  }\n\n  defineBuiltins(object = this.global){\n    const obj = object == null ? {} : ToObject(object);\n\n    for (let [key, val] of std) {\n      obj[key] = val;\n    }\n\n    return obj;\n  }\n}\n\nbuiltinClass(Loader);\n\n\n// TODO feedback: Module needs an optional? name/mrl parameter\nexport function Module(object, mrl = ''){\n  object = ToObject(object);\n\n  if (hasBrand(object, 'BuiltinModule')) {\n    return object;\n  }\n\n  const module = $$ToModule(object);\n  $$Set(module, 'loader', System);\n  $$Set(module, 'resolved', mrl);\n  $$Set(module, 'mrl', mrl);\n  return module;\n}\n\nbuiltinFunction(Module);\n\n\nexport const System = new Loader(null, {\n  global: $$GetIntrinsic('global'),\n  baseURL: '',\n  fetch(relURL, baseURL, request, resolved) {\n    const fetcher = resolved[0] === '@' ? $$Fetch : $$ReadFile;\n\n    fetcher(resolved, src => {\n      if (typeof src === 'string') {\n        request.fulfill(src);\n      } else {\n        request.reject(src);\n      }\n    });\n  },\n  resolve(relURL, baseURL){\n    return relURL[0] === '@' ? relURL : $$Resolve(baseURL, relURL);\n  },\n  translate(src, relURL, baseURL, resolved) {\n    return src;\n  }\n});\n\n\nconst builtins = new Loader(System);\nbuiltins.@strict = false;\n\n$$Set($$CurrentRealm(), 'loader', System);\n\nSystem.@modules['@system'] = builtins.@modules['@system'] = new Module({\n  Module: Module,\n  System: System,\n  Loader: Loader\n}, '@system');\n\n\nconst std = builtins.eval(`\n  module std = '@std';\n  export std;\n`).std;\n\n\nfor (let name in builtins.@modules) {\n  System.@modules[name] = builtins.@modules[name];\n}\n\n{\n  const global = $$GetIntrinsic('global'),\n        FROZEN = 0,\n        HIDDEN = 6;\n\n  for (let [key, val] of std) {\n    define(global, key, val, Type(val) === 'Object' ? HIDDEN : FROZEN);\n  }\n}\n";

exports.builtins["@timers"] = "import {\n  ToInteger,\n  ToString\n} from '@@operations';\n\nimport {\n  builtinFunction,\n  internalFunction\n} from '@@utilities';\n\nimport {\n  $$ClearImmediate,\n  $$ClearTimer,\n  $$SetImmediate,\n  $$SetTimer\n} from '@@internals';\n\nimport {\n  Function\n} from '@function';\n\n\nfunction prepareCallback(callback){\n  return typeof callback === 'function' ? callback : new Function(ToString(callback));\n}\n\ninternalFunction(prepareCallback);\n\n\nexport function clearImmediate(id){\n  $$ClearImmediate(ToInteger(id));\n}\n\nbuiltinFunction(clearImmediate);\n\n\nexport function clearInterval(id){\n  $$ClearTimer(ToInteger(id));\n}\n\nbuiltinFunction(clearInterval);\n\n\nexport function clearTimeout(id){\n  $$ClearTimer(ToInteger(id));\n}\n\nbuiltinFunction(clearTimeout);\n\n\nexport function setImmediate(callback){\n  return $$SetImmediate(prepareCallback(callback));\n}\n\nbuiltinFunction(setImmediate);\n\n\nexport function setInterval(callback, milliseconds){\n  return $$SetTimer(prepareCallback(callback), ToInteger(milliseconds), true);\n}\n\nbuiltinFunction(setInterval);\n\n\nexport function setTimeout(callback, milliseconds){\n  return $$SetTimer(prepareCallback(callback), ToInteger(milliseconds), false);\n}\n\nbuiltinFunction(setTimeout);\n";

exports.builtins["@typed-arrays"] = "import {\n  $$Exception,\n  $$Get,\n  $$Set\n} from '@@internals';\n\nimport {\n  ObjectCreate\n} from '@@types';\n\nimport {\n  builtinClass,\n  define,\n  hasBrand,\n  internalFunction\n} from '@@utilities';\n\nimport {\n  ToInteger,\n  ToObject,\n  ToInt32,\n  ToUint32\n} from '@@operations';\n\nimport {\n  $$DataViewGet,\n  $$DataViewSet,\n  $$NativeBufferCreate,\n  $$NativeBufferSlice,\n  $$NativeDataViewCreate,\n  $$TypedArrayCreate\n} from '@@typed-arrays';\n\nfunction wrappingClamp(number, min, max){\n  if (number < min) {\n    number += max;\n  }\n  return number < min ? min : number > max ? max : number;\n}\n\ninternalFunction(wrappingClamp);\n\nfunction createArrayBuffer(nativeBuffer, byteLength){\n  var buffer = ObjectCreate(ArrayBufferPrototype);\n  define(buffer, 'byteLength', byteLength, 0);\n  $$Set(buffer, 'NativeBuffer', nativeBuffer);\n  $$Set(buffer, 'ConstructorName', 'ArrayBuffer');\n  $$Set(buffer, 'BuiltinBrand', 'BuiltinArrayBuffer');\n  return buffer;\n}\n\ninternalFunction(createArrayBuffer);\n\n\nfunction createTypedArray(Type, buffer, byteOffset, length){\n  if (typeof buffer === 'number') {\n    length = ToUint32(buffer);\n    var byteLength = length * Type.BYTES_PER_ELEMENT;\n    byteOffset = 0;\n    buffer = new ArrayBuffer(byteLength);\n    return $$TypedArrayCreate(Type.name, buffer, byteLength, byteOffset);\n\n  } else {\n    buffer = ToObject(buffer);\n\n    if (hasBrand(buffer, 'BuiltinArrayBuffer')) {\n      byteOffset = ToUint32(byteOffset);\n      if (byteOffset % Type.BYTES_PER_ELEMENT) {\n        throw $$Exception('buffer_unaligned_offset', [Type.name]);\n      }\n\n      var bufferLength = buffer.byteLength,\n          byteLength = length === undefined ? bufferLength - byteOffset : ToUint32(length) * Type.BYTES_PER_ELEMENT;\n\n      if (byteOffset + byteLength > bufferLength) {\n        throw $$Exception('buffer_out_of_bounds', [Type.name]);\n      }\n\n      length = byteLength / Type.BYTES_PER_ELEMENT;\n\n      if (ToInteger(length) !== length) {\n        throw $$Exception('buffer_unaligned_length', [Type.name]);\n      }\n\n      return $$TypedArrayCreate(Type.name, buffer, byteLength, byteOffset);\n\n    } else {\n      length = ToUint32(buffer.length);\n      var byteLength = length * Type.BYTES_PER_ELEMENT;\n      byteOffset = 0;\n      buffer = new ArrayBuffer(length);\n\n      var typedArray = $$TypedArrayCreate(Type.name, buffer, byteLength, byteOffset);\n\n      for (var i=0; i < length; i++) {\n        typedArray[i] = buffer[i];\n      }\n\n      return typedArray;\n    }\n  }\n}\n\ninternalFunction(createTypedArray);\n\n\nfunction set(Type, instance, array, offset){\n  if (!hasBrand(instance, 'Builtin'+Type.name)) {\n    throw $$Exception('called_on_incompatible_object', [Type.name+'.prototype.set']);\n  }\n\n  offset = ToUint32(offset);\n  array = ToObject(array);\n  var srcLength = ToUint32(array.length),\n      targetLength = instance.length;\n\n  if (srcLength + offset > targetLength) {\n    throw $$Exception('buffer_out_of_bounds', [Type.name+'.prototype.set']);\n  }\n\n  var temp = new Type(srcLength),\n      k = 0;\n\n  while (k < srcLength) {\n    temp[k] = array[k];\n  }\n\n  k = offset;\n  while (k < targetLength) {\n    instance[k] = temp[k - offset];\n  }\n}\n\ninternalFunction(set);\n\n\nfunction subarray(Type, instance, begin, end = instance.length){\n  if (!hasBrand(instance, 'Builtin'+Type.name)) {\n    throw $$Exception('called_on_incompatible_object', [Type.name+'.prototype.subarray']);\n  }\n\n  var srcLength = instance.length;\n\n  begin = ToInt32(begin);\n  end = end === undefined ? srcLength : ToInt32(end);\n\n  begin = wrappingClamp(begin, 0, srcLength);\n  end = wrappingClamp(end, 0, srcLength);\n\n  if (end < begin) {\n    [begin, end] = [end, begin];\n  }\n\n  return new Type(instance.buffer, instance.byteOffset + begin * Type.BYTES_PER_ELEMENT, end - begin);\n}\n\ninternalFunction(subarray);\n\n\nexport class ArrayBuffer {\n  constructor(byteLength){\n    byteLength = ToUint32(byteLength);\n    return createArrayBuffer($$NativeBufferCreate(byteLength), byteLength);\n  }\n\n  slice(begin = 0, end = this.byteLength){\n    var sourceBuffer = ToObject(this),\n        sourceNativeBuffer = $$Get(sourceBuffer, 'NativeBuffer');\n\n    if (!sourceNativeBuffer) {\n      throw $$Exception('called_on_incompatible_object', ['ArrayBuffer.prototype.slice']);\n    }\n\n    var byteLength = sourceBuffer.byteLength;\n    begin = wrappingClamp(ToInt32(begin), 0, byteLength);\n    end = wrappingClamp(ToInt32(end), 0, byteLength);\n\n    return createArrayBuffer($$NativeBufferSlice(sourceNativeBuffer, begin, end), end - begin);\n  }\n}\n\nbuiltinClass(ArrayBuffer);\nconst ArrayBufferPrototype = ArrayBuffer.prototype;\n\nprivate @get, @set;\n\nexport class DataView {\n  constructor(buffer, byteOffset = 0, byteLength = buffer.byteLength - byteOffset){\n    buffer = ToObject(buffer);\n    if (!hasBrand(buffer, 'BuiltinArrayBuffer')) {\n      throw $$Exception('bad_argument', ['DataView', 'ArrayBuffer']);\n    }\n\n    byteOffset = ToUint32(byteOffset);\n    byteLength = ToUint32(byteLength);\n\n    if (byteOffset + byteLength > buffer.byteLength) {\n      throw $$Exception('buffer_out_of_bounds', ['DataView']);\n    }\n\n    define(this, 'byteLength', byteLength, 1);\n    define(this, 'byteOffset', byteOffset, 1);\n    define(this, 'buffer', buffer, 1);\n    $$Set(this, 'View', $$NativeDataViewCreate(buffer, byteOffset, byteLength));\n    $$Set(this, 'BuiltinBrand', 'BuiltinDataView');\n  }\n\n  getUint8(byteOffset){\n    return this.@get('Uint8', byteOffset);\n  }\n\n  getUint16(byteOffset, littleEndian){\n    return this.@get('Uint16', byteOffset, littleEndian);\n  }\n\n  getUint32(byteOffset, littleEndian){\n    return this.@get('Uint32', byteOffset, littleEndian);\n  }\n\n  getInt8(byteOffset){\n    return this.@get('Int8', byteOffset);\n  }\n\n  getInt16(byteOffset, littleEndian){\n    return this.@get('Int16', byteOffset, littleEndian);\n  }\n\n  getInt32(byteOffset, littleEndian){\n    return this.@get('Int32', byteOffset, littleEndian);\n  }\n\n  getFloat32(byteOffset, littleEndian){\n    return this.@get('Float32', byteOffset, littleEndian);\n  }\n\n  getFloat64(byteOffset, littleEndian){\n    return this.@get('Float64', byteOffset, littleEndian);\n  }\n\n  setUint8(byteOffset, value){\n    return this.@set('Uint8', byteOffset, value);\n  }\n\n  setUint16(byteOffset, value, littleEndian){\n    return this.@set('Uint16', byteOffset, value, littleEndian);\n  }\n\n  setUint32(byteOffset, value, littleEndian){\n    return this.@set('Uint32', byteOffset, value, littleEndian);\n  }\n\n  setInt8(byteOffset, value){\n    return this.@set('Int8', byteOffset, value);\n  }\n\n  setInt16(byteOffset, value, littleEndian){\n    return this.@set('Int16', byteOffset, value, littleEndian);\n  }\n\n  setInt32(byteOffset, value, littleEndian){\n    return this.@set('Int32', byteOffset, value, littleEndian);\n  }\n\n  setFloat32(byteOffset, value, littleEndian){\n    return this.@set('Float32', byteOffset, value, littleEndian);\n  }\n\n  setFloat64(byteOffset, value, littleEndian){\n    return this.@set('Float64', byteOffset, value, littleEndian);\n  }\n}\n\nbuiltinClass(DataView);\nDataView.prototype.@get = $$DataViewGet\nDataView.prototype.@set = $$DataViewSet\n\n\n\nexport class Float64Array {\n  constructor(buffer, byteOffset, length) {\n    return createTypedArray(Float64Array, buffer, byteOffset, length);\n  }\n\n  set(array, offset) {\n    return set(Float64Array, this, array, offset);\n  }\n\n  subarray(begin, end) {\n    return subarray(Float64Array, this, begin, end);\n  }\n}\n\nbuiltinClass(Float64Array);\ndefine(Float64Array, 'BYTES_PER_ELEMENT', 8, 0);\n\n\nexport class Float32Array {\n  constructor(buffer, byteOffset, length) {\n    return createTypedArray(Float32Array, buffer, byteOffset, length);\n  }\n\n  set(array, offset) {\n    return set(Float32Array, this, array, offset);\n  }\n\n  subarray(begin, end) {\n    return subarray(Float32Array, this, begin, end);\n  }\n}\n\nbuiltinClass(Float32Array);\ndefine(Float32Array, 'BYTES_PER_ELEMENT', 4, 0);\n\n\nexport class Int32Array {\n  constructor(buffer, byteOffset, length) {\n    return createTypedArray(Int32Array, buffer, byteOffset, length);\n  }\n\n  set(array, offset) {\n    return set(Int32Array, this, array, offset);\n  }\n\n  subarray(begin, end) {\n    return subarray(Int32Array, this, begin, end);\n  }\n}\n\nbuiltinClass(Int32Array);\ndefine(Int32Array, 'BYTES_PER_ELEMENT', 4, 0);\n\n\nexport class Int16Array {\n  constructor(buffer, byteOffset, length) {\n    return createTypedArray(Int16Array, buffer, byteOffset, length);\n  }\n\n  set(array, offset) {\n    return set(Int16Array, this, array, offset);\n  }\n\n  subarray(begin, end) {\n    return subarray(Int16Array, this, begin, end);\n  }\n}\n\nbuiltinClass(Int16Array);\ndefine(Int16Array, 'BYTES_PER_ELEMENT', 2, 0);\n\n\nexport class Int8Array {\n  constructor(buffer, byteOffset, length) {\n    return createTypedArray(Int8Array, buffer, byteOffset, length);\n  }\n\n  set(array, offset) {\n    return set(Int8Array, this, array, offset);\n  }\n\n  subarray(begin, end) {\n    return subarray(Int8Array, this, begin, end);\n  }\n}\n\nbuiltinClass(Int8Array);\ndefine(Int8Array, 'BYTES_PER_ELEMENT', 1, 0);\n\n\nexport class Uint32Array {\n  constructor(buffer, byteOffset, length) {\n    return createTypedArray(Uint32Array, buffer, byteOffset, length);\n  }\n\n  set(array, offset) {\n    return set(Uint32Array, this, array, offset);\n  }\n\n  subarray(begin, end) {\n    return subarray(Uint32Array, this, begin, end);\n  }\n}\n\nbuiltinClass(Uint32Array);\ndefine(Uint32Array, 'BYTES_PER_ELEMENT', 4, 0);\n\n\nexport class Uint16Array {\n  constructor(buffer, byteOffset, length) {\n    return createTypedArray(Uint16Array, buffer, byteOffset, length);\n  }\n\n  set(array, offset) {\n    return set(Uint16Array, this, array, offset);\n  }\n\n  subarray(begin, end) {\n    return subarray(Uint16Array, this, begin, end);\n  }\n}\n\nbuiltinClass(Uint16Array);\ndefine(Uint16Array, 'BYTES_PER_ELEMENT', 2, 0);\n\n\nexport class Uint8Array {\n  constructor(buffer, byteOffset, length) {\n    return createTypedArray(Uint8Array, buffer, byteOffset, length);\n  }\n\n  set(array, offset) {\n    return set(Uint8Array, this, array, offset);\n  }\n\n  subarray(begin, end) {\n    return subarray(Uint8Array, this, begin, end);\n  }\n}\n\nbuiltinClass(Uint8Array);\ndefine(Uint8Array, 'BYTES_PER_ELEMENT', 1, 0);\n";

exports.builtins["@weakmap"] = "import {\n  @@create: create\n} from '@@symbols';\n\nimport {\n  undefined\n} from '@@constants';\n\nimport {\n  $$Exception,\n  $$Has,\n  $$Set\n} from '@@internals';\n\n\nimport {\n  builtinClass,\n  builtinFunction,\n  extend,\n  internalFunction,\n  isInitializing\n} from '@@utilities';\n\nimport {\n  OrdinaryCreateFromConstructor\n} from '@@operations';\n\nimport {\n  Type\n} from '@@types';\n\nimport {\n  $$WeakMapGet,\n  $$WeakMapDelete,\n  $$WeakMapHas,\n  $$WeakMapSet,\n  $$WeakMapInitialization\n} from '@@collections';\n\n\nfunction ensureWeakMap(o, p, name){\n  if (Type(o) !== 'Object' || !$$Has(o, 'WeakMapData')) {\n    throw $$Exception('called_on_incompatible_object', [name]);\n  }\n\n  if (Type(p) !== 'Object') {\n    throw $$Exception('invalid_weakmap_key', []);\n  }\n}\ninternalFunction(ensureWeakMap);\n\n\nexport class WeakMap {\n  constructor(iterable){\n    if (!isInitializing(this, 'WeakMapData')) {\n      return new WeakMap(iterable);\n    }\n\n    $$WeakMapInitialization(this, iterable);\n  }\n\n  clear(){\n    if (Type(this) !== 'Object' || !$$Has(this, 'WeakMapData')) {\n      throw $$Exception('called_on_incompatible_object', ['WeakMap.prototype.clear']);\n    }\n\n    $$WeakMapInitialization(this);\n    return this;\n  }\n\n  delete(key){\n    ensureWeakMap(this, key, 'WeakMap.prototype.delete');\n    return $$WeakMapDelete(this, key);\n  }\n\n  get(key){\n    ensureWeakMap(this, key, 'WeakMap.prototype.get');\n    return $$WeakMapGet(this, key);\n  }\n\n  has(key){\n    ensureWeakMap(this, key, 'WeakMap.prototype.has');\n    $$WeakMapHas(this, key);\n  }\n\n  set(key, value){\n    ensureWeakMap(this, key, 'WeakMap.prototype.set');\n    $$WeakMapSet(this, key, value);\n    return this;\n  }\n}\n\nextend(WeakMap, {\n  @@create(){\n    const obj = OrdinaryCreateFromConstructor(this, '%WeakMapPrototype%');\n    $$Set(obj, 'BuiltinBrand', 'BuiltinWeakMap');\n    $$Set(obj, 'WeakMapData', undefined);\n    return obj;\n  }\n});\n\nbuiltinClass(WeakMap);\n\nconst WeakMapPrototype = WeakMap.prototype;\n\n\nfunction weakmapClear(weakmap, key){\n  if (Type(weakmap) !== 'Object' || !$$Has(weakmap, 'WeakMapData')) {\n    throw $$Exception('called_on_incompatible_object', ['@weakmap.clear']);\n  }\n\n  $$WeakMapInitialization(weakmap);\n  return weakmap;\n}\n\nbuiltinFunction(weakmapDelete);\n\nfunction weakmapDelete(weakmap, key){\n  ensureWeakMap(weakmap, key, '@weakmap.delete');\n  return $$WeakMapDelete(weakmap, key);\n}\n\nbuiltinFunction(weakmapDelete);\n\n\nfunction weakmapGet(weakmap, key){\n  ensureWeakMap(weakmap, key, '@weakmap.get');\n  return $$WeakMapGet(weakmap, key);\n}\n\nbuiltinFunction(weakmapGet);\n\n\nfunction weakmapHas(weakmap, key){\n  ensureWeakMap(weakmap, key, '@weakmap.has');\n  return $$WeakMapHas(weakmap, key);\n}\n\nbuiltinFunction(weakmapHas);\n\n\nfunction weakmapSet(weakmap, key, value){\n  ensureWeakMap(weakmap, key, '@weakmap.set');\n  $$WeakMapSet(weakmap, key, value);\n  return weakmap;\n}\n\nbuiltinFunction(weakmapSet);\n\n\nexport const clear  = weakmapClear,\n           //delete = weakmapDelete, TODO: fix exporting reserved names\n             get    = weakmapGet,\n             has    = weakmapHas,\n             set    = weakmapSet;\n";



  return exports.index;
}).apply(this, function(){
  var exports = {
    builtins: {},
    modules: {},
    fs: {
      readFile: function(path, encoding, callback){
        var xhr = new XMLHttpRequest;
        xhr.onerror = xhr.onload = function(evt){
          if (xhr.readyState === 4) {
            xhr.onload = xhr.onerror = null;
            callback(null, xhr.responseText);
          }
        }

        xhr.open('GET', path);
        xhr.send();
      }
    }
  };

  function require(request){
    request = request.slice(request.lastIndexOf('/') + 1);
    return exports[request];
  }

  return [this, exports, require];
}());
