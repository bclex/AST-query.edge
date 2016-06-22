'use strict';

exports.pushQuery = pushQuery;
exports.pushAdditional = pushAdditional;
exports.syntaxList = syntaxList;

var _ = require('lodash');

// Push a new query onto the compiled "sequence" stack,
// creating a new formatter, returning the compiler.
function pushQuery(method, query) {
  if (!query) return;
  query = { method: method, ast: query };
  if (!query.bindings) {
    query.bindings = {};
  }
  this.sequence.push(query);
}

// Used in cases where we need to push some additional column specific statements.
function pushAdditional(fn) {
  var child = new this.constructor(this.tree, this.classCompiler, this.memberBuilder);
  fn.call(child, _.tail(arguments));
  this.sequence.additional = (this.sequence.additional || []).concat(child.sequence);
}

function syntaxList(type, array) {
  if (array.length == 0) return {};
  if (array.length == 1) {
    var obj = {};
    obj['f:SingletonList<' + type + '>'] = array;
    return obj;
  }
  var obj2 = {};
  obj2['n:' + type] = array;
  var obj = {};
  obj['f:List<' + type + '>'] = [obj2];
  return obj;
}