// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import BookmarkEditModal from '../../src/components/BookmarkEditModal.svelte'
import { prepareLocalIcon } from '../../src/lib/localIconUpload'
import { toBookmarkPayload } from '../../src/lib/adminFormAdapters'

vi.mock('../../src/lib/localIconUpload', () => ({ prepareLocalIcon: vi.fn() }))
afterEach(() => { cleanup(); vi.resetAllMocks() })
const value = { id: 1, category_id: 1, title: '站点', url: 'https://example.com', icon: '⭐' }
const categories = [{ id: 1, title: '分类', children: [] }]
const file = new File(['image'], 'icon.png', { type: 'image/png' })

it('无图床时也能上传，处理期间禁止保存，处理后提交内嵌图片', async () => {
  let finish!: (value: string) => void
  vi.mocked(prepareLocalIcon).mockReturnValue(new Promise(resolve => { finish = resolve }))
  const onSubmit = vi.fn()
  render(BookmarkEditModal, { open: true, value, categories, onSubmit })
  await fireEvent.change(screen.getByLabelText('上传本地图标'), { target: { files: [file] } })
  expect((screen.getByRole('button', { name: '保存' }) as HTMLButtonElement).disabled).toBe(true)
  await fireEvent.submit(document.querySelector('form')!)
  expect(onSubmit).not.toHaveBeenCalled()
  finish('data:image/webp;base64,dGVzdA==')
  await waitFor(() => expect(screen.getByAltText('图标预览').getAttribute('src')).toBe('data:image/webp;base64,dGVzdA=='))
  await fireEvent.submit(document.querySelector('form')!)
  expect(toBookmarkPayload(onSubmit.mock.calls[0][0])).toMatchObject({ icon: 'data:image/webp;base64,dGVzdA==', icon_source: 'custom' })
})

it('处理失败保留原图并显示错误', async () => {
  vi.mocked(prepareLocalIcon).mockRejectedValue(new Error('图片无法读取'))
  render(BookmarkEditModal, { open: true, value, categories })
  await fireEvent.change(screen.getByLabelText('上传本地图标'), { target: { files: [file] } })
  await screen.findByText('图片无法读取')
  expect((screen.getByPlaceholderText('图标 URL / 表情，如 ⭐') as HTMLInputElement).value).toBe('⭐')
})

it('关闭并切换到另一书签后，迟到的图片处理不会覆盖新表单', async () => {
  let finish!: (value: string) => void
  vi.mocked(prepareLocalIcon).mockReturnValue(new Promise(resolve => { finish = resolve }))
  const view = render(BookmarkEditModal, { open: true, value, categories })
  await fireEvent.change(screen.getByLabelText('上传本地图标'), { target: { files: [file] } })
  await view.rerender({ open: false })
  await view.rerender({ open: true, value: { ...value, id: 2, icon: '🌟' } })
  finish('data:image/webp;base64,dGVzdA==')
  await waitFor(() => expect((screen.getByPlaceholderText('图标 URL / 表情，如 ⭐') as HTMLInputElement).value).toBe('🌟'))
  expect(screen.queryByAltText('图标预览')).toBeNull()
})
