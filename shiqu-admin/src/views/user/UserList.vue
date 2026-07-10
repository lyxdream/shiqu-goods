<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>用户管理</span>
      </div>
    </template>

    <el-form :inline="true" :model="query" class="search-form">
      <el-form-item label="用户名">
        <el-input v-model="query.username" clearable placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部" style="width: 140px">
          <el-option
            v-for="item in USER_STATUS_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="nickname" label="昵称" />
      <el-table-column prop="phone" label="手机号" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getUserStatusMeta(row.status).tagType">
            {{ getUserStatusMeta(row.status).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="注册时间" min-width="170" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            @click="$router.push({ name: 'UserEdit', params: { id: row.id } })"
          >
            编辑
          </el-button>
          <el-button
            :type="row.status === 'enabled' ? 'danger' : 'success'"
            link
            @click="toggleStatus(row)"
          >
            {{ row.status === 'enabled' ? '禁用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        :total="total"
        @current-change="fetchList"
        @size-change="search"
      />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { getUserList, updateUserStatus, type UserListQuery } from '@/api/user'
import { useTable } from '@/composables/useTable'
import { getUserStatusMeta, USER_STATUS_OPTIONS } from '@/constants/status'
import type { AdminUser } from '@/types'
import { applyStatusChange } from '@/utils/status'

const { loading, list, total, query, fetchList, search } = useTable<
  AdminUser,
  UserListQuery
>(getUserList, {
  pageNum: 1,
  pageSize: 10,
  username: '',
  status: '',
})

function toggleStatus(row: AdminUser) {
  const status = row.status === 'enabled' ? 'disabled' : 'enabled'
  return applyStatusChange(() => updateUserStatus(row.id, status), fetchList)
}
</script>
