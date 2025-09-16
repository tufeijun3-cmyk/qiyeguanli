import { createClient } from '@supabase/supabase-js'

// Supabase配置
const supabaseUrl = 'https://bikdpdwqsfrflvplzrxy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpa2RwZHdxc2ZyZmx2cGx6cnh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MjY3MjYsImV4cCI6MjA3MzEwMjcyNn0.O7zgDEiDiHykHf7EcRUGDTDSZ2tKJdTJie07P0kwm2Y'

export const supabase = createClient(supabaseUrl, supabaseKey)

// 表名常量
export const TABLES = {
  COMPANIES: 'companies',
  USERS: 'users',
  TEAMS: 'teams',
  DEVICES: 'devices',
  ACCOUNTS: 'accounts',
  CUSTOMERS: 'customers',
  FOLLOWUPS: 'followups',
  EXPENSES: 'expenses',
  APPROVALS: 'approvals',
  ATTENDANCE: 'attendance',
  PAYROLLS: 'payrolls',
  BUDGETS: 'budgets',
  AI_REVIEWS: 'ai_reviews',
  AUDIT_LOGS: 'audit_logs',
  EXPENSE_CATEGORIES: 'expense_categories'
}

// 认证服务类
export class AuthService {
  constructor() {
    this.currentUser = null
  }

  // 用户登录
  async login(email, password) {
    try {
      // 首先从用户表中查找用户
      const { data: userData, error: userError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('email', email)
        .single()

      if (userError || !userData) {
        throw new Error('用户不存在')
      }

      // 简单的密码验证（实际项目中应该使用加密）
      if (userData.password !== password) {
        throw new Error('密码错误')
      }

      // 登录成功，保存用户信息
      this.currentUser = userData
      
      // 保存到localStorage
      localStorage.setItem('currentUser', JSON.stringify(userData))
      
      return userData
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  // 用户登出
  logout() {
    this.currentUser = null
    localStorage.removeItem('currentUser')
  }

  // 获取当前用户
  getCurrentUser() {
    if (this.currentUser) {
      return this.currentUser
    }

    // 从localStorage恢复用户信息
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser)
        return this.currentUser
      } catch (error) {
        console.error('恢复用户信息失败:', error)
        localStorage.removeItem('currentUser')
      }
    }

    return null
  }

  // 检查是否已登录
  isAuthenticated() {
    return this.getCurrentUser() !== null
  }

  // 检查用户权限
  hasPermission(requiredRole) {
    const user = this.getCurrentUser()
    if (!user) return false

    // 角色权限层级
    const roleHierarchy = {
      'employee': 1,
      'team_leader': 2,
      'supervisor': 3,
      'finance': 4,
      'admin': 5
    }

    const userLevel = roleHierarchy[user.role] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0

    return userLevel >= requiredLevel
  }
}

// 数据库操作类
export class DatabaseService {
  constructor() {
    this.listeners = []
  }

  // 订阅数据变化
  subscribe(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  // 通知所有监听器
  notify() {
    this.listeners.forEach(callback => callback({}))
  }

  // ==================== 用户管理 ====================
  async getUsers() {
    try {
      console.log('开始查询用户数据...')
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Supabase 用户查询错误:', error)
        throw error
      }
      
      console.log('用户数据查询完成:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('获取用户列表失败:', error)
      return []
    }
  }

  async getUserById(id) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return null
    }
  }

  async addUser(user) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .insert([user])
        .select()
        .single()

      if (error) throw error
      this.notify()
      return data
    } catch (error) {
      console.error('添加用户失败:', error)
      return null
    }
  }

  async updateUser(id, updates) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      this.notify()
      return data
    } catch (error) {
      console.error('更新用户失败:', error)
      return null
    }
  }

  async deleteUser(id) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .delete()
        .eq('id', id)
        .select()

      if (error) throw error
      this.notify()
      return data
    } catch (error) {
      console.error('删除用户失败:', error)
      return null
    }
  }

  // ==================== 团队管理 ====================
  async getTeams() {
    try {
      const { data, error } = await supabase
        .from(TABLES.TEAMS)
        .select(`
          *,
          leader:users!teams_leader_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取团队列表失败:', error)
      return []
    }
  }

  async addTeam(teamData) {
    try {
      console.log('添加团队数据:', teamData)
      
      // 构建插入数据，只包含必要的字段
      const insertData = {
        name: teamData.name
      }
      
      // 如果有 description 字段，添加它
      if (teamData.description && teamData.description.trim() !== '') {
        insertData.description = teamData.description
      }
      
      // 如果有 leader_id 且不为空，则添加
      if (teamData.leader_id && teamData.leader_id !== '') {
        insertData.leader_id = teamData.leader_id
      }
      
      console.log('插入数据:', insertData)
      
      const { data, error } = await supabase
        .from(TABLES.TEAMS)
        .insert([insertData])
        .select()
        .single()
      
      if (error) {
        console.error('Supabase 错误:', error)
        throw new Error(`数据库错误: ${error.message}`)
      }
      
      console.log('团队添加成功:', data)
      return data
    } catch (error) {
      console.error('添加团队失败:', error)
      throw new Error(`添加团队失败: ${error.message}`)
    }
  }

  async updateTeam(teamId, teamData) {
    try {
      console.log('更新团队数据:', teamData)
      
      // 构建更新数据
      const updateData = {
        name: teamData.name
      }
      
      // 如果有 description 字段，添加它
      if (teamData.description !== undefined) {
        updateData.description = teamData.description || ''
      }
      
      // 如果有 leader_id，添加它
      if (teamData.leader_id !== undefined) {
        updateData.leader_id = teamData.leader_id || null
      }
      
      console.log('更新数据:', updateData)
      
      const { data, error } = await supabase
        .from(TABLES.TEAMS)
        .update(updateData)
        .eq('id', teamId)
        .select()
        .single()
      
      if (error) {
        console.error('Supabase 错误:', error)
        throw new Error(`数据库错误: ${error.message}`)
      }
      
      console.log('团队更新成功:', data)
      return data
    } catch (error) {
      console.error('更新团队失败:', error)
      throw new Error(`更新团队失败: ${error.message}`)
    }
  }

  async deleteTeam(teamId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.TEAMS)
        .delete()
        .eq('id', teamId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('删除团队失败:', error)
      throw error
    }
  }

  // ==================== 支出申请管理 ====================
  async getExpenses(filters = {}) {
    try {
      console.log('开始查询申请数据...', filters)
      
      let query = supabase
        .from(TABLES.EXPENSES)
        .select(`
          *,
          creator:users!expenses_created_by_fkey(*),
          team:teams(*)
        `)
        .order('applied_at', { ascending: false })

      // 应用过滤器
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.team_id) {
        query = query.eq('team_id', filters.team_id)
      }
      if (filters.user_id) {
        query = query.eq('created_by', filters.user_id)
      }
      if (filters.user_ids && Array.isArray(filters.user_ids)) {
        query = query.in('created_by', filters.user_ids)
      }

      const { data, error } = await query
      
      if (error) {
        console.error('Supabase 查询错误:', error)
        throw error
      }
      
      console.log('申请数据查询完成:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('获取支出申请失败:', error)
      return []
    }
  }

  // 获取下级用户的申请记录（用于主管和组长）
  async getSubordinateExpenses(userId, userRole, filters = {}) {
    try {
      // 首先获取当前用户的所有下级
      const subordinates = await this.getSubordinates(userId, userRole)
      const subordinateIds = subordinates.map(sub => sub.id)
      
      console.log('getSubordinateExpenses 调试:', {
        userId,
        userRole,
        subordinatesCount: subordinates.length,
        subordinateIds,
        filters
      })
      
      if (subordinateIds.length === 0) {
        console.log('没有下级用户，返回空数组')
        return []
      }

      let query = supabase
        .from(TABLES.EXPENSES)
        .select(`
          *,
          creator:users!expenses_created_by_fkey(*),
          team:teams(*)
        `)
        .in('created_by', subordinateIds)
        .order('applied_at', { ascending: false })

      // 应用状态过滤器
      if (filters.status) {
        // 支持多种状态值
        if (filters.status === 'waiting_leader') {
          // 待组长审批的状态可能是多种值
          query = query.in('status', ['waiting_leader', 'pending', '待审批', '待审核'])
        } else {
          query = query.eq('status', filters.status)
        }
        console.log('应用状态过滤器:', filters.status)
      }

      const { data, error } = await query
      
      if (error) {
        console.error('查询申请记录失败:', error)
        throw error
      }
      
      console.log('查询结果:', {
        totalRecords: data?.length || 0,
        filters: filters,
        records: data?.map(record => ({
          id: record.id,
          status: record.status,
          creator: record.creator?.name,
          amount: record.amount,
          applied_at: record.applied_at
        })) || []
      })
      
      // 如果没有找到指定状态的记录，尝试查找所有记录来调试
      if (filters.status && (!data || data.length === 0)) {
        console.log('未找到指定状态的记录，查询所有记录进行调试...')
        const { data: allData, error: allError } = await supabase
          .from(TABLES.EXPENSES)
          .select(`
            *,
            creator:users!expenses_created_by_fkey(*),
            team:teams(*)
          `)
          .in('created_by', subordinateIds)
          .order('applied_at', { ascending: false })
        
        if (!allError && allData) {
          console.log('所有下级申请记录:', allData.map(record => ({
            id: record.id,
            status: record.status,
            creator: record.creator?.name,
            amount: record.amount,
            applied_at: record.applied_at
          })))
          
          // 特别检查waiting_leader状态的记录
          const waitingLeaderRecords = allData.filter(record => 
            record.status === 'waiting_leader' || 
            record.status === 'pending' || 
            record.status === '待审批' || 
            record.status === '待审核'
          )
          console.log('待审批状态的记录:', waitingLeaderRecords.map(record => ({
            id: record.id,
            status: record.status,
            creator: record.creator?.name,
            amount: record.amount
          })))
        }
      }
      
      return data || []
    } catch (error) {
      console.error('获取下级申请失败:', error)
      return []
    }
  }

  // 获取下级用户列表
  async getSubordinates(userId, userRole) {
    try {
      let query = supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('company_id', '550e8400-e29b-41d4-a716-446655440000')

      if (userRole === 'supervisor') {
        // 主管可以看到所有下级（组长和员工）
        query = query.or('supervisor_id.eq.' + userId + ',supervisor_id.in.(' + 
          await this.getTeamLeaderIds(userId) + ')')
      } else if (userRole === 'team_leader') {
        // 组长可以看到同一团队中的员工，或者supervisor_id指向自己的员工
        console.log('查找组长团队信息:', { userId, userRole })
        
        // 首先尝试获取组长所在的团队ID
        const { data: leaderData, error: leaderError } = await supabase
          .from(TABLES.TEAMS)
          .select('id')
          .eq('leader_id', userId)
          .single()
        
        console.log('团队查询结果:', { leaderData, leaderError })
        
        // 组长直接通过supervisor_id查询下级员工，不依赖团队记录
        console.log('组长查询下级员工，使用supervisor_id:', userId)
        query = query.eq('supervisor_id', userId).neq('id', userId)
      }

      const { data, error } = await query
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取下级用户失败:', error)
      return []
    }
  }

  // 获取主管管理的组长ID列表
  async getTeamLeaderIds(supervisorId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('id')
        .eq('supervisor_id', supervisorId)
        .eq('role', 'team_leader')

      if (error) throw error
      return data?.map(user => user.id).join(',') || ''
    } catch (error) {
      console.error('获取组长ID失败:', error)
      return ''
    }
  }

  async addExpense(expense) {
    try {
      const { data, error } = await supabase
        .from(TABLES.EXPENSES)
        .insert([expense])
        .select()
        .single()

      if (error) throw error
      
      // 触发AI审核
      this.triggerAIReview('expense', data.id)
      
      this.notify()
      return data
    } catch (error) {
      console.error('添加支出申请失败:', error)
      return null
    }
  }

  async updateExpenseStatus(id, status, decision, comment, approverId, paymentInfo = null) {
    try {
      console.log('更新申请状态:', { id, status, decision, comment, approverId })
      
      // 获取审批人姓名
      const { data: approverData } = await supabase
        .from(TABLES.USERS)
        .select('name')
        .eq('id', approverId)
        .single()
      
      const approverName = approverData?.name || '未知审批人'
      
      const updates = {
        status
      }

      // 根据状态更新相应的决策字段
      if (status === 'waiting_supervisor') {
        updates.leader_decision = { 
          decision: decision, 
          action: decision, 
          comment, 
          approver_id: approverId, 
          approver_name: approverName, 
          approverId: approverId,
          approverName: approverName,
          approverRole: 'team_leader',
          timestamp: new Date().toISOString() 
        }
      } else if (status === 'waiting_finance') {
        updates.supervisor_decision = { 
          decision: decision, 
          action: decision, 
          comment, 
          approver_id: approverId, 
          approver_name: approverName, 
          approverId: approverId,
          approverName: approverName,
          approverRole: 'supervisor',
          timestamp: new Date().toISOString() 
        }
      } else if (status === 'paid' || status === 'rejected') {
        updates.finance_decision = { 
          decision: decision, 
          action: decision, 
          comment, 
          approver_id: approverId, 
          approver_name: approverName, 
          approverId: approverId,
          approverName: approverName,
          approverRole: 'finance',
          timestamp: new Date().toISOString() 
        }
        
        // 如果是支付确认，将支付信息保存到attachments字段中
        if (status === 'paid' && paymentInfo) {
          // 获取现有的attachments数据
          const { data: currentExpense } = await supabase
            .from(TABLES.EXPENSES)
            .select('attachments')
            .eq('id', id)
            .single()
          
          const currentAttachments = currentExpense?.attachments || {}
          updates.attachments = {
            ...currentAttachments,
            paymentInfo: paymentInfo
          }
        }
      }

      console.log('更新数据:', updates)

      const { data, error } = await supabase
        .from(TABLES.EXPENSES)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('数据库更新错误:', error)
        throw error
      }

      console.log('申请状态更新成功:', data)

      // 记录审批历史（可选操作）
      try {
        const approvalData = {
          expense_id: id,
          action_by: approverId,
          action: decision,
          comment: comment || '',
          created_at: new Date().toISOString()
        }
        console.log('准备插入审批历史:', approvalData)
        
        const { data: approvalResult, error: approvalError } = await supabase
          .from(TABLES.APPROVALS)
          .insert([approvalData])
          .select()
        
        if (approvalError) {
          console.warn('审批历史记录失败:', approvalError)
        } else {
          console.log('审批历史记录成功:', approvalResult)
        }
      } catch (approvalError) {
        console.warn('审批历史记录异常:', approvalError)
        // 不抛出错误，因为主要操作已成功
      }

      this.notify()
      return data
    } catch (error) {
      console.error('更新支出申请状态失败:', error)
      return null
    }
  }

  // ==================== 客户管理 ====================
  async getCustomers() {
    try {
      const { data, error } = await supabase
        .from(TABLES.CUSTOMERS)
        .select(`
          *,
          owner:users!customers_owner_id_fkey(*)
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取客户列表失败:', error)
      return []
    }
  }

  // 获取所有客户（管理员用）
  async getAllCustomers() {
    try {
      const { data, error } = await supabase
        .from(TABLES.CUSTOMERS)
        .select(`
          *,
          owner:users!customers_owner_id_fkey(id, name, email)
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取所有客户失败:', error)
      return []
    }
  }

  // 获取已删除的客户（管理员用）
  async getDeletedCustomers() {
    try {
      const { data, error } = await supabase
        .from(TABLES.CUSTOMERS)
        .select(`
          *,
          owner:users!customers_owner_id_fkey(id, name, email)
        `)
        .eq('is_deleted', true)
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取已删除客户失败:', error)
      return []
    }
  }

  async addCustomer(customer) {
    try {
      // 检查手机号码是否已存在
      const { data: existingCustomers, error: checkError } = await supabase
        .from(TABLES.CUSTOMERS)
        .select(`
          *,
          owner:users!customers_owner_id_fkey(name, id)
        `)
        .eq('contact', customer.contact)
        .eq('is_deleted', false)

      if (checkError) {
        throw checkError
      }

      if (existingCustomers && existingCustomers.length > 0) {
        // 取第一个找到的记录（因为联系方式应该唯一）
        const existingCustomer = existingCustomers[0]
        const ownerName = existingCustomer.owner?.name || '未知'
        throw new Error(`客户 ${customer.name} 的联系方式 ${customer.contact} 已存在于员工 ${ownerName} 的团队中`)
      }

      const { data, error } = await supabase
        .from(TABLES.CUSTOMERS)
        .insert([customer])
        .select()
        .single()

      if (error) throw error
      this.notify()
      return data
    } catch (error) {
      console.error('添加客户失败:', error)
      throw error
    }
  }

  // 批量上传客户
  async batchUploadCustomers(file, userId) {
    try {
      // 解析CSV文件
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        throw new Error('文件格式错误：至少需要标题行和一行数据')
      }

      const headers = lines[0].split(',').map(h => h.trim())
      const customers = []
      const duplicateContacts = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        if (values.length !== headers.length) continue

        const customer = {
          company_id: '550e8400-e29b-41d4-a716-446655440000',
          owner_id: userId,
          created_by: userId,
          is_deleted: false,
          // 确保时间戳字段有默认值
          last_reply_time: null,
          last_group_read_time: null,
          joined_group: false,
          purchased_stocks: null,
          additional_contacts: []
        }

        // 映射字段
        headers.forEach((header, index) => {
          const value = values[index]
          switch (header.toLowerCase()) {
            case '姓名':
            case 'name':
              customer.name = value
              break
            case '联系方式':
            case 'contact':
            case '电话':
            case 'phone':
              customer.contact = value
              break
            case '年龄':
            case 'age':
              customer.age = value ? parseInt(value) : null
              break
            case '职业':
            case 'occupation':
              customer.occupation = value
              break
            case '投资经验':
            case 'investment_experience':
            case 'experience':
              customer.investment_experience = value
              break
            case '资金规模':
            case 'fund_size':
            case 'capital':
            case '资金预算':
            case 'budget':
            case '预算':
            case 'budget_range':
              customer.budget_range = value
              break
            case '关注策略':
            case 'strategy':
            case '关注':
              customer.strategy_interest = value
              break
            case '风险偏好':
            case 'risk_preference':
            case '风险':
              customer.risk_preference = value
              break
            case '是否加群':
            case 'joined_group':
            case '加群':
              customer.joined_group = value === '已加群' || value === '是' || value === 'true'
              break
            case '最近回复时间':
            case 'last_reply_time':
            case '回复时间':
              customer.last_reply_time = value && value.trim() !== '' ? value : null
              break
            case '买入股票':
            case 'purchased_stocks':
            case '持仓':
              customer.purchased_stocks = value
              break
            case '备注':
            case 'notes':
              customer.notes = value
              break
            case '来源':
            case 'source':
              customer.source = value || '批量导入'
              break
            case '归属员工邮箱':
            case 'owner_email':
            case 'employee_email':
              customer.owner_email = value
              break
          }
        })

        // 处理归属员工邮箱
        if (customer.owner_email) {
          try {
            const { data: ownerUser, error: ownerError } = await supabase
              .from(TABLES.USERS)
              .select('id, name, email')
              .eq('email', customer.owner_email)
              .single()

            if (ownerError || !ownerUser) {
              throw new Error(`找不到邮箱为 ${customer.owner_email} 的员工`)
            }

            customer.owner_id = ownerUser.id
            customer.created_by = ownerUser.id
          } catch (error) {
            console.error(`处理员工邮箱失败: ${customer.owner_email}`, error)
            throw new Error(`员工邮箱 ${customer.owner_email} 不存在或无效`)
          }
        }

        // 验证必需字段
        if (customer.name && customer.contact) {
          // 检查手机号码是否已存在
          const { data: existingCustomers, error: checkError } = await supabase
            .from(TABLES.CUSTOMERS)
            .select(`
              *,
              owner:users!customers_owner_id_fkey(name, id)
            `)
            .eq('contact', customer.contact)
            .eq('is_deleted', false)

          if (checkError) {
            throw checkError
          }

          if (existingCustomers && existingCustomers.length > 0) {
            // 取第一个找到的记录（因为联系方式应该唯一）
            const existingCustomer = existingCustomers[0]
            duplicateContacts.push({
              name: customer.name,
              contact: customer.contact,
              existingOwner: existingCustomer.owner?.name || '未知',
              existingOwnerId: existingCustomer.owner?.id
            })
          } else {
            customers.push(customer)
          }
        }
      }

      // 如果有任何重复的联系方式，阻止整个批量上传
      if (duplicateContacts.length > 0) {
        const duplicateMessages = duplicateContacts.map(dup => 
          `客户 ${dup.name} (${dup.contact}) 已存在于员工 ${dup.existingOwner} 的团队中`
        ).join('\n')
        
        throw new Error(`发现重复的联系方式，无法上传：\n${duplicateMessages}`)
      }

      if (customers.length === 0) {
        throw new Error('没有找到有效的客户数据')
      }

      // 批量插入所有有效的客户（确保没有重复）
      const { data, error } = await supabase
        .from(TABLES.CUSTOMERS)
        .insert(customers)
        .select()

      if (error) throw error

      return {
        success: true,
        uploadedCount: customers.length,
        customers: data
      }
    } catch (error) {
      console.error('批量上传客户失败:', error)
      throw error
    }
  }

  // 更新客户信息
  async updateCustomer(customerId, updates) {
    try {
      const { data, error } = await supabase
        .from(TABLES.CUSTOMERS)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('更新客户失败:', error)
      throw error
    }
  }

  // 软删除客户（实际上不允许删除，这里只是标记）
  async deleteCustomer(customerId) {
    try {
      // 根据需求，客户基础资料不能删除，只能标记为删除状态
      const { data, error } = await supabase
        .from(TABLES.CUSTOMERS)
        .update({ 
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('删除客户失败:', error)
      throw error
    }
  }

  // 物理删除客户（管理员专用）
  async permanentlyDeleteCustomer(customerId) {
    try {
      // 先删除相关的跟进记录
      const { error: followupError } = await supabase
        .from('followups')
        .delete()
        .eq('customer_id', customerId)

      if (followupError) {
        console.error('删除跟进记录失败:', followupError)
        throw followupError
      }

      // 然后删除客户记录
      const { data, error } = await supabase
        .from(TABLES.CUSTOMERS)
        .delete()
        .eq('id', customerId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('永久删除客户失败:', error)
      throw error
    }
  }

  // ==================== 设备管理 ====================
  async getDevices() {
    try {
      const { data, error } = await supabase
        .from(TABLES.DEVICES)
        .select(`
          *,
          user:users!devices_user_id_fkey(*)
        `)
        .order('assigned_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取设备列表失败:', error)
      return []
    }
  }

  // ==================== 客户跟踪管理 ====================
  async getFollowups(filters = {}) {
    try {
      let query = supabase
        .from(TABLES.FOLLOWUPS)
        .select(`
          *,
          customer:customers(*),
          user:users!followups_user_id_fkey(*)
        `)
        .order('followup_at', { ascending: false })

      // 应用过滤器
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id)
      }
      if (filters.user_ids && Array.isArray(filters.user_ids)) {
        query = query.in('user_id', filters.user_ids)
      }
      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id)
      }
      if (filters.outcome) {
        query = query.eq('outcome', filters.outcome)
      }

      const { data, error } = await query
      
      if (error) throw error
      
      // 转换字段名以匹配前端期望的格式
      const transformedData = (data || []).map(item => ({
        ...item,
        type: item.channel,
        content: item.note,
        status: item.outcome,
        created_at: item.followup_at
      }))
      
      return transformedData
    } catch (error) {
      console.error('获取客户跟踪记录失败:', error)
      return []
    }
  }

  async addFollowup(followup) {
    try {
      console.log('添加跟踪记录，原始数据:', followup)
      
      const { data, error } = await supabase
        .from(TABLES.FOLLOWUPS)
        .insert([followup])
        .select()
        .single()

      if (error) {
        console.error('数据库错误:', error)
        throw error
      }
      
      console.log('跟踪记录添加成功:', data)
      this.notify()
      return data
    } catch (error) {
      console.error('添加客户跟踪记录失败:', error)
      return null
    }
  }

  // ==================== AI审核 ====================
  async triggerAIReview(resourceType, resourceId) {
    try {
      // 这里应该调用AI服务，暂时模拟
      const mockAIResponse = {
        decision: Math.random() > 0.5 ? 'approve' : 'suspect',
        score: Math.random(),
        reason: 'AI审核建议：申请金额合理，建议通过',
        model: 'gpt-4o-mini'
      }

      const { data, error } = await supabase
        .from(TABLES.AI_REVIEWS)
        .insert([{
          resource_type: resourceType,
          resource_id: resourceId,
          model: mockAIResponse.model,
          decision: mockAIResponse.decision,
          score: mockAIResponse.score,
          reason: mockAIResponse.reason,
          raw_response: mockAIResponse
        }])

      if (error) throw error
      return data
    } catch (error) {
      console.error('AI审核失败:', error)
      return null
    }
  }

  async getAIReviews(resourceType, resourceId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.AI_REVIEWS)
        .select('*')
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取AI审核结果失败:', error)
      return []
    }
  }

  // ==================== 文件上传 ====================
  async uploadImage(file, folder = 'receipts') {
    try {
      // 生成唯一文件名
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      // 上传文件到Supabase Storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (error) {
        console.error('图片上传失败:', error)
        throw error
      }

      // 获取公开URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      console.log('图片上传成功:', publicUrl)
      return {
        url: publicUrl,
        path: filePath,
        fileName: fileName
      }
    } catch (error) {
      console.error('图片上传异常:', error)
      throw error
    }
  }

  async deleteImage(filePath) {
    try {
      const { error } = await supabase.storage
        .from('images')
        .remove([filePath])

      if (error) {
        console.error('图片删除失败:', error)
        throw error
      }

      console.log('图片删除成功:', filePath)
      return true
    } catch (error) {
      console.error('图片删除异常:', error)
      throw error
    }
  }

  // ==================== 仪表板数据 ====================
  getPendingExpensesCount(expenses, role) {
    // 根据角色统计待审批申请数量
    switch (role) {
      case 'team_leader':
        // 组长审批：status === 'submitted'
        return expenses.filter(exp => exp.status === 'submitted').length
      case 'supervisor':
        // 主管审批：status === 'waiting_supervisor'
        return expenses.filter(exp => exp.status === 'waiting_supervisor').length
      case 'finance':
        // 财务审批：status === 'waiting_finance'
        return expenses.filter(exp => exp.status === 'waiting_finance').length
      case 'employee':
        // 员工：自己的申请中状态为submitted的
        return expenses.filter(exp => exp.status === 'submitted').length
      case 'admin':
        // 管理员：所有待审批的申请
        return expenses.filter(exp => 
          exp.status === 'submitted' || 
          exp.status === 'waiting_supervisor' || 
          exp.status === 'waiting_finance'
        ).length
      default:
        return 0
    }
  }

  async getDashboardData(role, userId) {
    try {
      console.log('开始加载仪表板数据...')
      
      // 分别加载数据，避免某个表不存在导致整个加载失败
      const customers = await this.getCustomers().catch(err => {
        console.warn('加载客户数据失败:', err)
        return []
      })
      
      const devices = await this.getDevices().catch(err => {
        console.warn('加载设备数据失败:', err)
        return []
      })
      
      const users = await this.getUsers().catch(err => {
        console.warn('加载用户数据失败:', err)
        return []
      })
      
      console.log('基础数据加载完成:', { customers: customers.length, devices: devices.length, users: users.length })

      // 根据角色获取申请数据
      let expenses = []
      try {
        if (role === 'team_leader' || role === 'supervisor') {
          // 组长和主管使用权限控制方法
          expenses = await this.getSubordinateExpenses(userId, role)
        } else if (role === 'employee') {
          // 员工只能看到自己的申请
          expenses = await this.getExpenses({ user_id: userId })
        } else {
          // 管理员和财务可以看到所有申请
          expenses = await this.getExpenses()
        }
        console.log('申请数据加载完成:', expenses.length)
      } catch (err) {
        console.warn('加载申请数据失败:', err)
        expenses = []
      }

      return {
        expenses,
        customers,
        devices,
        users,
        stats: {
          totalExpenses: expenses.length,
          pendingExpenses: this.getPendingExpensesCount(expenses, role),
          totalAmount: expenses
            .filter(exp => exp.status !== 'rejected' && exp.status !== 'waiting_leader')
            .reduce((sum, exp) => sum + (exp.amount || 0), 0),
          totalCustomers: customers.length,
          totalDevices: devices.length
        }
      }
    } catch (error) {
      console.error('获取仪表板数据失败:', error)
      return {
        expenses: [],
        customers: [],
        devices: [],
        users: [],
        stats: {
          totalExpenses: 0,
          pendingExpenses: 0,
          totalAmount: 0,
          totalCustomers: 0,
          totalDevices: 0
        }
      }
    }
  }

  // ==================== 申请类型管理 ====================
  
  // 获取所有申请类型
  async getExpenseCategories() {
    try {
      const { data, error } = await supabase
        .from(TABLES.EXPENSE_CATEGORIES)
        .select('*')
        .eq('is_active', true)
        .order('category_key', { ascending: true })
        .order('sort_order', { ascending: true })
      
      if (error) throw error
      
      // 将数据库数据转换为前端需要的格式
      const categories = {}
      data.forEach(item => {
        if (!categories[item.category_key]) {
          categories[item.category_key] = {
            label: item.category_name,
            icon: item.category_icon,
            types: []
          }
        }
        
        if (item.type_key && item.type_name) {
          categories[item.category_key].types.push({
            value: item.type_key,
            label: item.type_name,
            icon: item.type_icon
          })
        }
      })
      
      return categories
    } catch (error) {
      console.error('获取申请类型失败:', error)
      return {}
    }
  }

  // 添加申请类型
  async addExpenseCategory(categoryData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.EXPENSE_CATEGORIES)
        .insert([categoryData])
        .select()
        .single()

      if (error) throw error
      this.notify()
      return data
    } catch (error) {
      console.error('添加申请类型失败:', error)
      throw error
    }
  }

  // 更新申请类型
  async updateExpenseCategory(id, updateData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.EXPENSE_CATEGORIES)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      this.notify()
      return data
    } catch (error) {
      console.error('更新申请类型失败:', error)
      throw error
    }
  }

  // 删除申请类型
  async deleteExpenseCategory(id) {
    try {
      const { data, error } = await supabase
        .from(TABLES.EXPENSE_CATEGORIES)
        .delete()
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      this.notify()
      return data
    } catch (error) {
      console.error('删除申请类型失败:', error)
      throw error
    }
  }
}

// 创建单例实例
export const databaseService = new DatabaseService()
export const authService = new AuthService()
