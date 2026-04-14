import { test, describe } from 'node:test';
import assert from 'node:assert';
import { extractJsonFromText } from './utils.js';

describe('extractJsonFromText', () => {
  test('should extract valid JSON from text', () => {
    const text = '{"key": "value"}';
    const result = extractJsonFromText(text);
    assert.deepStrictEqual(result, { key: 'value' });
  });

  test('should extract JSON embedded in other text', () => {
    const text = 'Here is the response: {"key": "value"} and more text.';
    const result = extractJsonFromText(text);
    assert.deepStrictEqual(result, { key: 'value' });
  });

  test('should extract JSON from Markdown code blocks', () => {
    const text = '```json\n{"key": "value"}\n```';
    const result = extractJsonFromText(text);
    assert.deepStrictEqual(result, { key: 'value' });
  });

  test('should throw AI_RESPONSE_INVALID for empty text', () => {
    assert.throws(() => extractJsonFromText(''), {
      message: 'AI_RESPONSE_INVALID'
    });
  });

  test('should throw AI_RESPONSE_INVALID for null text', () => {
    assert.throws(() => extractJsonFromText(null), {
      message: 'AI_RESPONSE_INVALID'
    });
  });

  test('should throw AI_RESPONSE_INVALID when no JSON is found', () => {
    const text = 'This text has no JSON.';
    assert.throws(() => extractJsonFromText(text), {
      message: 'AI_RESPONSE_INVALID'
    });
  });

  test('should throw AI_RESPONSE_INVALID for malformed JSON', () => {
    const text = '{"key": "value"'; // Missing closing brace
    assert.throws(() => extractJsonFromText(text), {
      message: 'AI_RESPONSE_INVALID'
    });
  });

  test('should handle multiple JSON objects by throwing AI_RESPONSE_INVALID (due to greedy matching)', () => {
    const text = 'First: {"a": 1} Second: {"b": 2}';
    // The current regex /\{[\s\S]*\}/ is greedy, matching '{"a": 1} Second: {"b": 2}'
    // which is not valid JSON.
    assert.throws(() => extractJsonFromText(text), {
        message: 'AI_RESPONSE_INVALID'
    });
  });
});
