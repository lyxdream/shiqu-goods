<template>
  <el-card>
    <template #header>
      <div class="card-header">操作日志</div>
    </template>

    <el-form :inline="true" :model="query" class="search-form">
      <el-form-item label="操作类型">
        <el-select
          v-model="query.action"
          clearable
          placeholder="全部"
          style="width: 140px"
        >
          <el-option
            v-for="item in AUDIT_ACTION_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="目标类型">
        <el-select
          v-model="query.targetType"
          clearable
          placeholder="全部"
          style="width: 120px"
        >
          <el-option
            v-for="item in AUDIT_TARGET_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="操作人">
        <el-input
          v-model="query.adminUsername"
          clearable
          placeholder="管理员用户名"
          style="width: 160px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list" border>
      <el-table-column label="操作时间" min-width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="adminUsername" label="操作人" width="120" />
      <el-table-column label="操作类型" width="120">
        <template #default="{ row }">
          <el-tag :type="getAuditActionMeta(row.action).tagType">
            {{ getAuditActionMeta(row.action).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="目标类型" width="100">
        <template #default="{ row }">
          {{ getAuditTargetMeta(row.targetType).label }}
        </template>
      </el-table-column>
      <el-table-column prop="targetLabel" label="操作对象" min-width="180" />
      <el-table-column label="详情" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openDetail(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <TablePagination
      v-model:page-num="query.pageNum"
      v-model:page-size="query.pageSize"
      :total="total"
      @page-change="fetchList"
      @size-change="search"
    />

    <el-dialog v-model="detailVisible" title="操作详情" width="480px">
      <el-descriptions v-if="currentLog" :column="1" border>
        <el-descriptions-item label="操作时间">
          {{ formatDateTime(currentLog.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="操作人">
          {{ currentLog.adminUsername }}
        </el-descriptions-item>
        <el-descriptions-item label="操作类型">
          {{ getAuditActionMeta(currentLog.action).label }}
        </el-descriptions-item>
        <el-descriptions-item label="操作对象">
          {{ currentLog.targetLabel }}
        </el-descriptions-item>
        <el-descriptions-item label="快照信息">
          <pre class="detail-pre">{{
            formatAuditDetail(currentLog.action, currentLog.detail)
          }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getAuditLogList, type AuditLogListQuery } from '@/api/audit'
import TablePagination from '@/components/TablePagination.vue'
import { useTable } from '@/composables/useTable'
import {
  AUDIT_ACTION_OPTIONS,
  AUDIT_TARGET_OPTIONS,
  formatAuditDetail,
  getAuditActionMeta,
  getAuditTargetMeta,
} from '@/constants/audit'
import type { AdminAuditLog } from '@/types'
import { formatDateTime } from '@/utils/date'

const { loading, list, total, query, fetchList, search } = useTable<
  AdminAuditLog,
  AuditLogListQuery
>(getAuditLogList, {
  pageNum: 1,
  pageSize: 10,
  action: '',
  targetType: '',
  adminUsername: '',
})

const detailVisible = ref(false)
const currentLog = ref<AdminAuditLog | null>(null)

function openDetail(row: AdminAuditLog) {
  currentLog.value = row
  detailVisible.value = true
}
</script>

<style scoped>
.detail-pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  line-height: 1.6;
}
</style>
