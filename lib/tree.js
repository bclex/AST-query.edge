'use strict';
var parser = require('./roslyn/parser.js');
var render = require('./roslyn/render.js');
var traverse = require('traverse');
var _ = require('lodash');
var utils = require('./util/utils');
var Variable = require('./nodes/Variable');
var CallExpression = require('./nodes/CallExpression');
var AssignmentExpression = require('./nodes/AssignmentExpression');
var Body = require('./nodes/Body');

var parseOptionDefaults = {
};

var renderOptionDefaults = {
};

function Tree(source, renderOptions, parseOptions) {
  this.parseOptions = _.extend({}, parseOptionDefaults, parseOptions);
  this.tree = parser.parse(source.toString(), this.parseOptions);
  this.body = new Body(this.tree.body, this.parseOptionDefaults);
  this.renderOptions = _.extend({}, renderOptionDefaults, renderOptions);
}

/**
 * Return the regenerated code string
 * @return {String} outputted code
 */
Tree.prototype.toString = function () {
  // Filter the three to remove temporary placeholders
  var tree = traverse(this.tree).map(function (node) {
    if (node && node.TEMP === true) {
      this.remove();
    }
  });
  return render.generate(tree, this.renderOptions);
};

/**
 * Find variables declaration
 * @param  {String|RegExp} name  Name of the declared variable
 * @return {Variable}
 */
Tree.prototype.var = function (name) {
  var nodes = traverse(this.tree).nodes().filter(function (node) {
    if (node && node.type === 'VariableDeclarator' && utils.match(name, node.id.name)) {
      return true;
    }
  });
  return new Variable(nodes);
};

/**
 * Select function/method calls
 * @param  {String|RegExp} name Name of the called function (`foo`, `foo.bar`)
 * @return {CallExpression}
 */
Tree.prototype.callExpression = function callExpression(name) {
  var nodes = traverse(this.tree).nodes().filter(function (node) {
    if (!node || node.type !== 'CallExpression') return false;

    // Simple function call
    if (node.callee.type === 'Identifier' && utils.match(name, node.callee.name)) return true;

    // Method call
    if (utils.matchMemberExpression(name, node.callee)) return true;
  });
  return new CallExpression(nodes);
};

/**
 * Select an AssignmentExpression node
 * @param  {String|RegExp} assignedTo Name of assignment left handside
 * @return {AssignmentExpression} Matched node
 */
Tree.prototype.assignment = function (assignedTo) {
  var nodes = traverse(this.tree).nodes().filter(function (node) {
    if (!node || node.type !== 'AssignmentExpression') return false;

    // Simple assignment
    if (node.left.type === 'Identifier' && utils.match(assignedTo, node.left.name)) return true;

    // Assignment to an object key
    if (utils.matchMemberExpression(assignedTo, node.left)) return true;
  });
  return new AssignmentExpression(nodes);
};

module.exports = function (source, renderOptions, parseOptions) {
  return new Tree(source, renderOptions, parseOptions);
};