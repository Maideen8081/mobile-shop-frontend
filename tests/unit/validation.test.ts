import { describe, it, expect } from 'vitest'
import { rules, validate, validateField } from '../../src/utils/adminValidation'
import { createValidator, required, email, minLength, passwordStrength, match } from '../../src/utils/validation'

describe('admin validation rules', () => {
  it('required', () => {
    expect(rules.required('Name')('  ')).toBe('Name is required')
    expect(rules.required('Name')('a')).toBe('')
  })

  it('indianMobile accepts 10 digits starting 6-9, with +91 and spacing', () => {
    const r = rules.indianMobile()
    expect(r('9876543210')).toBe('')
    expect(r('+91 98765-43210')).toBe('')
    expect(r('')).toBe('')
    expect(r('5876543210')).not.toBe('')
    expect(r('98765')).not.toBe('')
  })

  it('imei needs exactly 15 digits', () => {
    expect(rules.imei()('35-209900-176148-1')).toBe('')
    expect(rules.imei()('12345')).toBe('IMEI must be exactly 15 digits')
  })

  it('amount handles negatives, zero, bounds and decimals', () => {
    const r = rules.amount('Price', { min: 10, max: 1000 })
    expect(r('abc')).toBe('Price must be a number')
    expect(r('-1')).toBe('Price cannot be negative')
    expect(r('0')).toBe('Price must be greater than zero')
    expect(r('5')).toMatch(/at least/)
    expect(r('5000')).toMatch(/at most/)
    expect(r('10.123')).toMatch(/2 decimal places/)
    expect(r('99.99')).toBe('')
    expect(rules.amount('Fee', { allowZero: true })('0')).toBe('')
  })

  it('personName and email', () => {
    expect(rules.personName()("O'Neil-Smith Jr.")).toBe('')
    expect(rules.personName()('R2D2')).not.toBe('')
    expect(rules.email()('a@b.co')).toBe('')
    expect(rules.email()('a@b')).not.toBe('')
  })

  it('intRange, phone10to15, differentFrom', () => {
    expect(rules.intRange('Qty', 1, 5)('3')).toBe('')
    expect(rules.intRange('Qty', 1, 5)('2.5')).toMatch(/whole number/)
    expect(rules.intRange('Qty', 1, 5)('9')).toMatch(/between/)
    expect(rules.phone10to15()('123456789012')).toBe('')
    expect(rules.phone10to15()('123')).not.toBe('')
    expect(rules.differentFrom(() => '98765 43210', 'Must differ')('9876543210')).toBe('Must differ')
  })

  it('validate returns the first error per field', () => {
    const schema = { name: [rules.required('Name'), rules.minLength('Name', 3)], phone: [rules.indianMobile()] }
    expect(validate(schema, { name: '', phone: '98' })).toEqual({
      name: 'Name is required',
      phone: expect.stringContaining('valid 10-digit'),
    })
    expect(validate(schema, { name: 'Raj', phone: '9876543210' })).toEqual({})
    expect(validateField(schema, 'name', 'ab')).toBe('Name must be at least 3 characters')
  })
})

describe('form validator', () => {
  type F = { email: string; pw: string; pw2: string }
  const v = createValidator<F>({
    email: [required('Email', (d) => d.email), email((d) => d.email)],
    pw: [minLength(8, (d) => d.pw), passwordStrength((d) => d.pw)],
    pw2: [match((d) => d.pw, (d) => d.pw2)],
  })

  it('reports each failing field', () => {
    expect(v({ email: 'bad', pw: 'short', pw2: 'x' })).toEqual({
      email: 'Invalid email address',
      pw: 'At least 8 characters required',
      pw2: 'Passwords do not match',
    })
    expect(v({ email: 'a@b.com', pw: 'lowercase1', pw2: 'lowercase1' }).pw).toMatch(/uppercase/)
    expect(v({ email: 'a@b.com', pw: 'Str0ngPass', pw2: 'Str0ngPass' })).toEqual({})
  })
})
