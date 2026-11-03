import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { SegmentedControl } from './SegmentedControl.tsx'

function Harness() {
  const [value, setValue] = useState(25)
  return (
    <SegmentedControl
      label="Check weather every"
      options={[
        { value: 10, label: '10 mi' },
        { value: 25, label: '25 mi' },
        { value: 50, label: '50 mi' },
      ]}
      value={value}
      onChange={setValue}
    />
  )
}

describe('SegmentedControl', () => {
  it('selects another option from the visible label', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    expect(screen.getByRole('radio', { name: '25 mi' })).toBeChecked()

    await user.click(screen.getByText('10 mi'))

    expect(screen.getByRole('radio', { name: '10 mi' })).toBeChecked()
  })
})
