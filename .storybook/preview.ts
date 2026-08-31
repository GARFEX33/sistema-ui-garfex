import { setProjectAnnotations } from '@storybook/react-vite'
import type { Preview } from '@storybook/react'
import '../storybook/styles.css'

const preview: Preview = {
  parameters: {
    backgrounds: { default: 'light' },
    viewport: {
      viewports: {
        workstation: {
          name: 'Workstation 1440×980',
          styles: { width: '1440px', height: '980px' },
        },
      },
      defaultViewport: 'workstation',
    },
    a11y: { test: 'error' },
  },
}

setProjectAnnotations([preview])

export default preview
