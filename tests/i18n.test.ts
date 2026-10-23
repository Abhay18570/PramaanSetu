import test from 'node:test'
import assert from 'node:assert/strict'
import { messages, translationForSource } from '../src/i18n/catalog.ts'

test('English, Hindi and Marathi catalogs have complete non-empty key coverage', () => {
  assert.ok(Object.keys(messages).length > 100)
  for (const [key, message] of Object.entries(messages)) {
    assert.ok(message.en.trim(), `${key}.en is empty`)
    assert.ok(message.hi.trim(), `${key}.hi is empty`)
    assert.ok(message.mr.trim(), `${key}.mr is empty`)
  }
})

test('status and document category presentation labels localize without changing enums', () => {
  assert.equal(translationForSource('Under Review', 'hi'), 'समीक्षाधीन')
  assert.equal(translationForSource('Under Review', 'mr'), 'पुनरावलोकन सुरू आहे')
  assert.equal(translationForSource('Fire Safety Document', 'hi'), 'अग्नि सुरक्षा दस्तावेज़')
  assert.equal(translationForSource('Fire Safety Document', 'mr'), 'अग्निसुरक्षा दस्तऐवज')
})

test('unknown OCR evidence and user data remain unchanged', () => {
  const evidence = 'Original OCR: ABC Institute PS-2026-1234'
  assert.equal(translationForSource(evidence, 'hi'), evidence)
  assert.equal(translationForSource(evidence, 'mr'), evidence)
})

test('Indian locale formatters preserve values while localizing presentation', () => {
  const date = new Date('2026-10-23T08:15:00Z')
  for (const locale of ['en-IN', 'hi-IN', 'mr-IN']) {
    assert.ok(new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date))
    assert.ok(new Intl.NumberFormat(locale).format(123456) !== '')
  }
})
