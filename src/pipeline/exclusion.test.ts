import { describe, expect, it } from 'vitest'
import { abaValid, excludeRecords, hasAccountSignal, luhnOk, parseBlocklist } from './exclusion.ts'

describe('exclusion pass', () => {
  it('accepts a Luhn-valid card and rejects a near miss', () => {
    expect(luhnOk('4242424242424242')).toBe(true)
    expect(luhnOk('4242424242424243')).toBe(false)
    expect(hasAccountSignal('new card 4242 4242 4242 4242')).toBe(true)
    expect(hasAccountSignal('new card 4242-4242-4242-4242')).toBe(true)
    expect(hasAccountSignal('order 4242424242424243')).toBe(false)
  })

  it('flags routing numbers, SSNs, IBANs, and labeled accounts', () => {
    expect(abaValid('021000021')).toBe(true)
    expect(hasAccountSignal('routing number 021000021')).toBe(true)
    expect(hasAccountSignal('021000021')).toBe(false)
    expect(hasAccountSignal('ssn 212-34-5678')).toBe(true)
    expect(hasAccountSignal('call me at 555-123-4567')).toBe(false)
    expect(hasAccountSignal('IBAN GB82 WEST 1234 5698 7654 32')).toBe(true)
    expect(hasAccountSignal('account number 883311229900')).toBe(true)
  })

  it('drops medical terms and keeps ordinary dinner notes', () => {
    const result = excludeRecords([
      { id: 'meal', text: 'Roast chicken recipe for dinner. 425 oven, lemon, garlic.' },
      { id: 'rx', text: 'MyChart refill: metformin 500mg. A1C result posted.' },
      { id: 'clean', text: 'Sunday long run, 10 miles, easy pace.' },
    ])
    expect(result.kept.map((record) => record.id)).toEqual(['meal', 'clean'])
    expect(result.excludedCount).toBe(1)
    expect(result.byReason.medical).toBe(1)
    expect(JSON.stringify(result.kept)).not.toContain('metformin')
  })

  it('applies the blocklist with word boundaries and keeps only counts', () => {
    expect(parseBlocklist(' Sam, , a, Acme Corp ')).toEqual(['sam', 'acme corp'])
    const result = excludeRecords(
      [
        { id: 'chat', text: 'brunch with Sam at the bakery' },
        { id: 'same', text: 'same recipe, different dinner' },
        { id: 'work', text: 'the Acme Corp critique is on Thursday' },
        { id: 'card', text: 'card number 4242 4242 4242 4242 and a prescription for metformin' },
      ],
      parseBlocklist('sam, acme corp'),
    )
    expect(result.kept.map((record) => record.id)).toEqual(['same'])
    expect(result.excludedCount).toBe(3)
    expect(result.byReason).toEqual({ account: 1, medical: 1, blocklist: 2 })
    expect(result.kept[0]?.text).toContain('recipe')
    expect(JSON.stringify(result.kept)).not.toContain('4242')
    expect(JSON.stringify(result.kept)).not.toContain('metformin')
    expect(JSON.stringify(result.kept).toLowerCase()).not.toContain('acme')
  })

  it('does not let a one-letter blocklist wipe the set', () => {
    const result = excludeRecords([{ id: 'a', text: 'a recipe for pasta dinner tonight' }], parseBlocklist('a, be'))
    expect(result.kept).toHaveLength(1)
    expect(result.excludedCount).toBe(0)
  })
})
