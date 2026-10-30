// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import BookmarkEditModal from '../../src/components/BookmarkEditModal.svelte'
import { toBookmarkForm, toBookmarkPayload } from '../../src/lib/adminFormAdapters'
import type { PublicBookmark } from '../../shared/types'
import { iconAccessKey } from '../../src/lib/iconAccessKey'

const imported: PublicBookmark = {
  id: 3, category_id: 1, title: 'Imported', url: 'https://example.com',
  icon: null, icon_source: 'custom', icon_blob: null, icon_cached: true,
  icon_background_color: null, description: null, open_method: 1, sort: 0,
}
const categories = [{ id: 1, title: 'Test', children: [] }]
afterEach(() => { cleanup(); iconAccessKey.set(''); vi.restoreAllMocks() })

it('导入图标在编辑窗口使用站内图片预览，保存不改动原图来源', async () => {
  const onSubmit = vi.fn()
  iconAccessKey.set('test-grant')
  render(BookmarkEditModal, { open: true, mode: 'edit', value: toBookmarkForm(imported), categories, onSubmit })
  const preview = screen.queryByAltText('图标预览')
  expect(preview).not.toBeNull()
  expect(preview?.getAttribute('src')).toContain('/api/icon/3?')
  expect(preview?.getAttribute('src')).toContain('key=test-grant')
  await fireEvent.submit(document.querySelector('form.modal-form')!)
  expect(toBookmarkPayload(onSubmit.mock.calls[0][0])).toMatchObject({ icon: null, icon_source: 'custom' })
})

it('手动输入新图标再清空时不会重新显示旧图，也不会保留旧来源', async () => {
  const onSubmit = vi.fn()
  render(BookmarkEditModal, { open: true, mode: 'edit', value: toBookmarkForm(imported), categories, onSubmit })
  const input = screen.getByPlaceholderText('图标 URL / 表情，如 ⭐')
  await fireEvent.input(input, { target: { value: '⭐' } })
  await fireEvent.input(input, { target: { value: '' } })
  expect(screen.queryByAltText('图标预览')).toBeNull()
  await fireEvent.submit(document.querySelector('form.modal-form')!)
  expect(toBookmarkPayload(onSubmit.mock.calls[0][0])).toMatchObject({ icon: null, icon_source: null })
})
