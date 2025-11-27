/**
 * Tree-sitter grammar for the Jam programming language
 *
 * @see https://github.com/user/jam
 */

module.exports = grammar({
  name: "jam",

  extras: $ => [
    /\s/,
    $.comment,
  ],

  word: $ => $.identifier,

  rules: {
    // Entry point
    source_file: $ => repeat($._top_level_item),

    _top_level_item: $ => choice(
      $.import_declaration,
      $.function_declaration,
    ),

    // Comments
    comment: $ => token(seq('//', /.*/)),

    // Import declaration: const std = import("std");
    import_declaration: $ => seq(
      'const',
      field('name', $.identifier),
      '=',
      'import',
      '(',
      field('path', $.string_literal),
      ')',
      ';'
    ),

    // Function declaration
    function_declaration: $ => seq(
      optional(choice('extern', 'export')),
      'fn',
      field('name', $.identifier),
      field('parameters', $.parameter_list),
      optional(field('return_type', $.type)),
      choice(
        field('body', $.block),
        ';'  // extern functions have no body
      )
    ),

    parameter_list: $ => seq(
      '(',
      optional(seq(
        $.parameter,
        repeat(seq(',', $.parameter))
      )),
      ')'
    ),

    parameter: $ => seq(
      field('name', $.identifier),
      ':',
      field('type', $.type)
    ),

    // Types
    type: $ => choice(
      $.primitive_type,
      $.array_type,
    ),

    primitive_type: $ => choice(
      'u8', 'u16', 'u32', 'u64',
      'i8', 'i16', 'i32', 'i64',
      'bool', 'str'
    ),

    array_type: $ => seq(
      '[', ']',
      $.type
    ),

    // Block
    block: $ => seq(
      '{',
      repeat($._statement),
      '}'
    ),

    // Statements
    _statement: $ => choice(
      $.variable_declaration,
      $.return_statement,
      $.if_statement,
      $.while_statement,
      $.for_statement,
      $.break_statement,
      $.continue_statement,
      $.expression_statement,
    ),

    variable_declaration: $ => seq(
      choice('const', 'var'),
      field('name', $.identifier),
      optional(seq(':', field('type', $.type))),
      optional(seq('=', field('value', $._expression))),
      ';'
    ),

    return_statement: $ => seq(
      'return',
      $._expression,
      ';'
    ),

    if_statement: $ => seq(
      'if',
      '(',
      field('condition', $._expression),
      ')',
      field('consequence', $.block),
      optional(seq(
        'else',
        field('alternative', $.block)
      ))
    ),

    while_statement: $ => seq(
      'while',
      '(',
      field('condition', $._expression),
      ')',
      field('body', $.block)
    ),

    for_statement: $ => seq(
      'for',
      field('variable', $.identifier),
      'in',
      field('start', $._expression),
      ':',
      field('end', $._expression),
      field('body', $.block)
    ),

    break_statement: $ => seq('break', ';'),

    continue_statement: $ => seq('continue', ';'),

    expression_statement: $ => seq(
      $._expression,
      ';'
    ),

    // Expressions
    _expression: $ => choice(
      $.binary_expression,
      $.call_expression,
      $.member_expression,
      $.identifier,
      $.number_literal,
      $.string_literal,
      $.boolean_literal,
      $.parenthesized_expression,
    ),

    parenthesized_expression: $ => seq(
      '(',
      $._expression,
      ')'
    ),

    binary_expression: $ => choice(
      prec.left(1, seq($._expression, '==', $._expression)),
      prec.left(1, seq($._expression, '!=', $._expression)),
      prec.left(2, seq($._expression, '<', $._expression)),
      prec.left(2, seq($._expression, '<=', $._expression)),
      prec.left(2, seq($._expression, '>', $._expression)),
      prec.left(2, seq($._expression, '>=', $._expression)),
      prec.left(3, seq($._expression, '+', $._expression)),
      prec.left(3, seq($._expression, '-', $._expression)),
    ),

    call_expression: $ => prec(4, seq(
      field('function', choice($.identifier, $.member_expression)),
      field('arguments', $.argument_list)
    )),

    member_expression: $ => prec.left(5, seq(
      field('object', choice($.identifier, $.member_expression)),
      '.',
      field('member', $.identifier)
    )),

    argument_list: $ => seq(
      '(',
      optional(seq(
        $._expression,
        repeat(seq(',', $._expression))
      )),
      ')'
    ),

    // Literals
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    number_literal: $ => /-?[0-9]+/,

    string_literal: $ => seq(
      '"',
      repeat(choice(
        $.escape_sequence,
        /[^"\\]+/
      )),
      '"'
    ),

    escape_sequence: $ => token.immediate(seq(
      '\\',
      choice(
        /[nrt\\0"]/,
        /x[0-9a-fA-F]{2}/
      )
    )),

    boolean_literal: $ => choice('true', 'false'),
  }
});
