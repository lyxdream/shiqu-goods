import { ElMessage } from 'element-plus'

/** 切换状态后提示并刷新列表 */
export async function applyStatusChange(
  action: () => Promise<unknown>,
  refresh: () => void | Promise<void>,
  message = '状态已更新',
) {
  await action()
  ElMessage.success(message)
  await refresh()
}
