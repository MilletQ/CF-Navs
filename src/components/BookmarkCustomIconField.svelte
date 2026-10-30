<svelte:options runes />

<script lang="ts">
  import type { BookmarkFormValue } from '../lib/adminTypes'
  import { iconAccessKey, withIconAccessKey } from '../lib/iconAccessKey'
  import {
    canPreviewIcon,
    canPreviewIconAsImage,
    getFormIconPreviewUrl,
    getTextIconPreview,
  } from '../lib/bookmarkFormIcons'

  type AsyncVoid<T = void> = T | Promise<T>

  interface Props {
    form: BookmarkFormValue
    iconifyName?: string
    imageHostUrl?: string
    loading?: boolean
    uploading?: boolean
    faviconError?: string
    onIconInput?: (value: string) => AsyncVoid
    onOpenImageHost?: () => AsyncVoid
    onUpload?: (file: File) => AsyncVoid
  }

  let {
    form,
    iconifyName = '',
    imageHostUrl = '',
    loading = false,
    uploading = false,
    faviconError = '',
    onIconInput,
    onOpenImageHost,
    onUpload,
  }: Props = $props()

  const previewIcon = $derived(getFormIconPreviewUrl(form, iconifyName))
  const previewUrl = $derived(withIconAccessKey(previewIcon, $iconAccessKey))
  let fileInput: HTMLInputElement

  function handleFileChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (file) void onUpload?.(file)
  }

  function handleIconInput(event: Event) {
    const nextIcon = (event.currentTarget as HTMLInputElement).value
    void onIconInput?.(nextIcon)
  }

  function handleOpenImageHost() {
    void onOpenImageHost?.()
  }
</script>

<div class="field-wide">
  <label for="bookmark-custom-icon">自定义图标 / 手动输入</label>
  <input bind:this={fileInput} type="file" hidden aria-label="上传本地图标" accept="image/png,image/jpeg,image/webp,image/svg+xml" onchange={handleFileChange} disabled={loading || uploading} />
  <div class="icon-row">
    <input
      id="bookmark-custom-icon"
      value={form.icon.startsWith('data:image/') ? '' : form.icon}
      type="text"
      placeholder={form.icon.startsWith('data:image/') ? '已选择本地图片，可重新上传替换' : '图标 URL / 表情，如 ⭐'}
      oninput={handleIconInput}
      disabled={loading || uploading}
    />
    {#if canPreviewIcon(previewIcon)}
      <span class="icon-preview" title="图标预览">
        {#if canPreviewIconAsImage(previewIcon)}
          <img src={previewUrl} alt="图标预览" />
        {:else}
          <span class="icon-preview-text">{getTextIconPreview(form.icon)}</span>
        {/if}
      </span>
    {/if}
    <button type="button" class="ghost-button upload-button" disabled={loading || uploading} onclick={() => fileInput.click()}>
      {uploading ? '处理图片中…' : '上传图片'}
    </button>
    {#if imageHostUrl}
      <button
        type="button"
        class="ghost-button upload-button"
        onclick={handleOpenImageHost}
        disabled={loading}
        title="打开图床上传图标"
      >
        打开图床 ↗
      </button>
    {/if}
  </div>
  <small class="upload-hint" aria-live="polite">{uploading ? '正在本机拉伸并压缩图片…' : 'PNG、JPG、WebP、SVG，最大 10 MB；自动拉伸为 256×256 并压缩，点击保存后存入本站，无需图床。'}</small>
  {#if faviconError}
    <small class="field-error">{faviconError}</small>
  {/if}
</div>

<style>
  .field-wide {
    grid-column: 1 / -1;
    display: grid;
    min-width: 0;
    gap: 4px;
    color: #334155;
    font-size: 13px;
  }

  .icon-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) repeat(3, max-content);
    gap: 6px;
    align-items: center;
  }

  input {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    border: 1px solid #cbd5e1;
    border-radius: 9px;
    padding: 6px 9px;
    font-size: 13px;
    color: #0f172a;
    background: #ffffff;
    font-family: inherit;
  }

  input:focus-visible {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px var(--focus-ring);
  }

  .ghost-button {
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    background: #ffffff;
    color: #0f172a;
    cursor: pointer;
    font-size: 13px;
    padding: 7px 12px;
    transition: var(--transition-base);
  }

  .ghost-button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .upload-button {
    flex: 0 0 auto;
    white-space: nowrap;
  }

  .icon-preview {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid #e2e8f0;
    border-radius: 9px;
    background: #f8fafc;
    box-sizing: border-box;
  }

  .icon-preview img {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    object-fit: cover;
  }

  .icon-preview-text {
    max-width: 100%;
    color: #475569;
    font-size: 14px;
    font-weight: 700;
    line-height: 1;
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .field-error {
    margin: 0;
    color: #dc2626;
    font-size: 12px;
    line-height: 1.35;
  }

  .upload-hint {
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
  }

  @media (max-width: 500px) {
    .field-wide {
      grid-column: 1 / -1;
    }

    .icon-row {
      align-items: stretch;
      grid-template-columns: minmax(0, 1fr) 32px;
    }

    .icon-row .upload-button {
      grid-column: 1 / -1;
    }
  }
</style>
