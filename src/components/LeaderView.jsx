import React, { useState, useEffect } from 'react'
import { databaseService } from '../supabase'

export default function LeaderView({ user, onSuccess }) {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  
  // 组长特有状态
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [selectedApproval, setSelectedApproval] = useState(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  
  // 表单状态
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    purpose: '',
    category: '', // 大类型
    type: '', // 小类型
    note: '',
    // 财务信息
    paymentMethod: '银行转账',
    payeeName: '',
    payeeContact: '',
    payeeAccount: '',
    payeeBank: '',
    receiptImage: null,
    receiptImageUrl: '',
    receiptImagePath: ''
  })
  const [expenseStep, setExpenseStep] = useState(1)
  
  // 申请类型分类 - 从数据库获取
  const [expenseCategories, setExpenseCategories] = useState({})
  const [customerForm, setCustomerForm] = useState({
    name: '',
    contact: '',
    source: '网站咨询',
    company: '',
    position: '',
    industry: '',
    budget: '',
    notes: ''
  })
  const [followupForm, setFollowupForm] = useState({
    customer_id: '',
    type: '电话',
    content: '',
    next_contact_date: '',
    status: '进行中'
  })
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCustomerDetail, setShowCustomerDetail] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [editCustomerForm, setEditCustomerForm] = useState({
    name: '',
    contact: '',
    age: '',
    occupation: '',
    investment_experience: '',
    budget_range: '',
    strategy_interest: '',
    risk_preference: '',
    source: '',
    additional_contacts: [],
    notes: ''
  })
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [customerViewMode, setCustomerViewMode] = useState('cards') // 'cards' 或 'list'

  useEffect(() => {
    loadEmployeeData()
    loadExpenseCategories()
  }, [])

  // 加载申请类型数据
  const loadExpenseCategories = async () => {
    try {
      const categories = await databaseService.getExpenseCategories()
      setExpenseCategories(categories)
    } catch (error) {
      console.error('加载申请类型失败:', error)
    }
  }

  const loadEmployeeData = async () => {
    setLoading(true)
    try {
      console.log('开始加载组长数据，用户ID:', user?.id)
      
      // 获取团队所有成员的数据
      const subordinates = await databaseService.getSubordinates(user.id, user.role)
      const subordinateIds = subordinates.map(sub => sub.id)
      
      // 获取团队所有成员的数据
      const [myExpenses, teamExpenses, myDevices, teamCustomers, allEmployees, myFollowups, teamFollowups] = await Promise.all([
        databaseService.getExpenses({ user_id: user.id }),
        databaseService.getExpenses({ user_ids: subordinateIds }),
        databaseService.getDevices(),
        databaseService.getCustomers(),
        databaseService.getUsers(),
        databaseService.getFollowups({ user_id: user.id }),
        databaseService.getFollowups({ user_ids: subordinateIds })
      ])
      
      // 获取待审批的申请
      const pendingApprovalsData = await databaseService.getSubordinateExpenses(user.id, user.role, { 
        status: 'waiting_leader' 
      })
      setPendingApprovals(pendingApprovalsData)
      
      console.log('待审批数据调试:', {
        userId: user.id,
        userRole: user.role,
        subordinates: subordinates.length,
        subordinateIds: subordinateIds,
        pendingApprovalsData: pendingApprovalsData.length,
        pendingApprovalsDataDetails: pendingApprovalsData
      })

      console.log('数据加载完成:', {
        myExpenses: myExpenses.length,
        teamExpenses: teamExpenses.length,
        devices: myDevices.length,
        customers: teamCustomers.length,
        employees: allEmployees.length,
        followups: myFollowups.length,
        teamFollowups: teamFollowups.length,
        subordinates: subordinates.length
      })

      // 合并团队所有成员的数据
      const allTeamExpenses = [...myExpenses, ...teamExpenses]
      const myDevicesFiltered = myDevices.filter(device => device.user_id === user.id)
      const teamCustomersFiltered = teamCustomers.filter(customer => 
        customer.owner_id === user.id || subordinateIds.includes(customer.owner_id)
      )
      const allTeamFollowups = [...myFollowups, ...teamFollowups]
      
      console.log('合并后数据:', {
        allTeamExpenses: allTeamExpenses.length,
        teamCustomersFiltered: teamCustomersFiltered.length,
        allTeamFollowups: allTeamFollowups.length
      })
      
      console.log('客户数据调试:', {
        teamCustomersTotal: teamCustomers.length,
        subordinateIds: subordinateIds,
        teamCustomersDetails: teamCustomers.map(customer => ({
          id: customer.id,
          name: customer.name,
          owner_id: customer.owner_id,
          owner_name: customer.owner?.name
        })),
        filteredCustomersDetails: teamCustomersFiltered.map(customer => ({
          id: customer.id,
          name: customer.name,
          owner_id: customer.owner_id,
          owner_name: customer.owner?.name
        }))
      })

      // 计算统计数据
      const totalAmount = allTeamExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
      const approvedAmount = allTeamExpenses
        .filter(exp => exp.status === 'paid')
        .reduce((sum, exp) => sum + (exp.amount || 0), 0)

      // 计算与其他员工的对比
      const otherEmployees = allEmployees.filter(emp => emp.id !== user.id && emp.role === 'employee')
      const avgAmount = otherEmployees.length > 0 
        ? otherEmployees.reduce((sum, emp) => sum + (emp.base_salary || 0), 0) / otherEmployees.length 
        : 0

      // 计算客户跟踪统计
      const todayFollowups = allTeamFollowups.filter(f => 
        new Date(f.created_at).toDateString() === new Date().toDateString()
      )
      const pendingFollowups = allTeamFollowups.filter(f => 
        f.status === '进行中' && new Date(f.next_contact_date) <= new Date()
      )

      const dashboardData = {
        expenses: allTeamExpenses,
        devices: myDevicesFiltered,
        customers: teamCustomersFiltered,
        followups: allTeamFollowups,
        stats: {
          totalExpenses: allTeamExpenses.length,
          totalAmount: totalAmount,
          approvedAmount: approvedAmount,
          pendingExpenses: pendingApprovalsData.length,
          deviceCount: myDevicesFiltered.length,
          customerCount: teamCustomersFiltered.length,
          followupCount: allTeamFollowups.length,
          todayFollowups: todayFollowups.length,
          pendingFollowups: pendingFollowups.length,
          avgSalary: avgAmount,
          mySalary: user.base_salary || 0
        }
      }

      console.log('设置仪表板数据:', dashboardData)
      setDashboardData(dashboardData)
    } catch (error) {
      console.error('加载员工数据失败:', error)
      // 设置空数据而不是null，避免显示错误页面
      setDashboardData({
        expenses: [],
        devices: [],
        customers: [],
        followups: [],
        stats: {
          totalExpenses: 0,
          totalAmount: 0,
          approvedAmount: 0,
          pendingExpenses: 0,
          deviceCount: 0,
          customerCount: 0,
          followupCount: 0,
          todayFollowups: 0,
          pendingFollowups: 0,
          avgSalary: 0,
          mySalary: 0
        }
      })
    } finally {
      setLoading(false)
    }
  }

  // 打开模态框
  const openModal = (type, item = null) => {
    setModalType(type)
    setEditingItem(item)
    setShowModal(true)
    
    // 根据类型初始化表单
    if (type === 'expense') {
      setExpenseForm({ 
        amount: '',
        purpose: '',
        category: '',
        type: '',
        note: '',
        paymentMethod: '银行转账',
        payeeName: '',
        payeeContact: '',
        payeeAccount: '',
        payeeBank: '',
        receiptImage: null,
        receiptImageUrl: '',
        receiptImagePath: ''
      })
      setExpenseStep(1)
    } else if (type === 'customer') {
      setCustomerForm({ 
        name: '', 
        contact: '', 
        source: '网站咨询',
        company: '',
        position: '',
        industry: '',
        budget: '',
        notes: ''
      })
    } else if (type === 'followup') {
      setFollowupForm({
        customer_id: '',
        type: '电话',
        content: '',
        next_contact_date: '',
        status: '进行中'
      })
    } else if (type === 'profile') {
      setProfileForm({ 
        name: user?.name || '', 
        email: user?.email || '', 
        phone: user?.phone || '' 
      })
    }
  }

  // 关闭模态框
  const closeModal = () => {
    setShowModal(false)
    setModalType('')
    setEditingItem(null)
  }

  // 组长特有的审批功能
  const handleApproval = async (expenseId, action, comment = '') => {
    try {
      const newStatus = action === 'approve' ? 'waiting_supervisor' : 'rejected'
      const result = await databaseService.updateExpenseStatus(
        expenseId, 
        newStatus, 
        action, 
        comment, 
        user.id
      )
      
      if (result) {
        alert(action === 'approve' ? '已批准申请！' : '已拒绝申请！')
        loadEmployeeData()
        onSuccess?.()
      } else {
        alert('操作失败，请重试')
      }
    } catch (error) {
      console.error('审批操作失败:', error)
      alert('操作失败，请重试')
    }
  }

  // 打开审批模态框
  const openApprovalModal = (expense) => {
    setSelectedApproval(expense)
    setShowApprovalModal(true)
  }

  // 关闭审批模态框
  const closeApprovalModal = () => {
    setShowApprovalModal(false)
    setSelectedApproval(null)
  }

  // 下载CSV模板
  const downloadTemplate = () => {
    const csvContent = [
      '姓名,联系方式,年龄,职业,投资经验,资金规模,关注策略,风险偏好,是否加群,最近回复时间,买入股票,备注,来源',
      '张三,13800138001,35,企业主,5年,100-500万,短线交易,激进型,已加群,2024-01-15,腾讯控股,关注科技股策略,朋友介绍',
      '李四,13800138002,28,金融分析师,3年,50-100万,价值投资,稳健型,未加群,2024-01-10,中国平安,偏好蓝筹股策略,网站咨询',
      '王五,13800138003,45,退休高管,10年,500万以上,量化交易,平衡型,已加群,2024-01-12,比亚迪,对AI选股感兴趣,电话咨询',
      '赵六,13800138004,32,医生,2年,20-50万,定投策略,保守型,已加群,2024-01-08,招商银行,希望稳定收益,广告推广',
      '钱七,13800138005,38,律师,6年,100-300万,趋势跟踪,积极型,未加群,2024-01-14,宁德时代,关注新能源板块,展会'
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', '客户资料模板.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 提交申请
  const handleSubmitExpense = async (e) => {
    e.preventDefault()
    try {
      const expense = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        created_by: user.id,
        team_id: user.team_id,
        amount: parseFloat(expenseForm.amount),
        purpose: `${expenseForm.category} - ${expenseForm.type}`,
        notes: expenseForm.note,
        status: user.role === 'team_leader' ? 'waiting_supervisor' : 'waiting_leader',
        attachments: {
          paymentMethod: expenseForm.paymentMethod,
          payeeName: expenseForm.payeeName,
          payeeContact: expenseForm.payeeContact,
          payeeAccount: expenseForm.payeeAccount,
          payeeBank: expenseForm.payeeBank,
          receiptImageUrl: expenseForm.receiptImageUrl,
          receiptImagePath: expenseForm.receiptImagePath,
          receiptFileName: expenseForm.receiptImage?.name || ''
        }
      }

      const result = await databaseService.addExpense(expense)
      if (result) {
        alert('申请提交成功！')
        closeModal()
        loadEmployeeData()
        onSuccess?.()
      }
    } catch (error) {
      console.error('提交申请失败:', error)
      alert('提交失败，请重试')
    }
  }

  // 添加客户
  const handleAddCustomer = async (e) => {
    e.preventDefault()
    try {
      const customer = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        name: customerForm.name,
        contact: customerForm.contact,
        source: customerForm.source,
        owner_id: user.id
      }

      const result = await databaseService.addCustomer(customer)
      if (result) {
        alert('客户添加成功！')
        closeModal()
        loadEmployeeData()
        onSuccess?.()
      }
    } catch (error) {
      console.error('添加客户失败:', error)
      alert('添加失败，请重试')
    }
  }

  // 更新个人信息
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      // 这里应该调用更新用户信息的API
      alert('个人信息更新成功！')
      closeModal()
      loadEmployeeData()
    } catch (error) {
      console.error('更新个人信息失败:', error)
      alert('更新失败，请重试')
    }
  }

  // 修改密码
  const handleChangePassword = async (e) => {
    e.preventDefault()
    try {
      // 验证新密码
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        alert('新密码和确认密码不一致')
        return
      }
      
      if (passwordForm.newPassword.length < 6) {
        alert('新密码长度至少6位')
        return
      }

      // 验证当前密码
      if (passwordForm.currentPassword !== user.password) {
        alert('当前密码错误')
        return
      }

      // 更新密码
      const { error } = await databaseService.supabase
        .from('users')
        .update({ password: passwordForm.newPassword })
        .eq('id', user.id)

      if (error) {
        throw error
      }

      alert('密码修改成功！')
      setShowPasswordModal(false)
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('修改密码失败:', error)
      alert('修改密码失败，请重试')
    }
  }

  // 更新客户信息
  const handleUpdateCustomer = async (e) => {
    e.preventDefault()
    if (!editingCustomer) return

    try {
      const updates = {
        name: editCustomerForm.name,
        age: editCustomerForm.age,
        occupation: editCustomerForm.occupation,
        investment_experience: editCustomerForm.investment_experience,
        budget_range: editCustomerForm.budget_range,
        strategy_interest: editCustomerForm.strategy_interest,
        risk_preference: editCustomerForm.risk_preference,
        source: editCustomerForm.source,
        additional_contacts: editCustomerForm.additional_contacts,
        notes: editCustomerForm.notes
      }

      const result = await databaseService.updateCustomer(editingCustomer.id, updates)
      if (result) {
        alert('客户信息更新成功！')
        setEditingCustomer(null)
        loadEmployeeData()
      }
    } catch (error) {
      console.error('更新客户信息失败:', error)
      alert('更新失败，请重试')
    }
  }

  // 添加客户跟踪
  const handleAddFollowup = async (e) => {
    e.preventDefault()
    try {
      // 检查必填字段
      if (!followupForm.customer_id) {
        alert('请选择客户')
        return
      }
      if (!followupForm.content) {
        alert('请填写跟踪内容')
        return
      }

      const followup = {
        customer_id: followupForm.customer_id,
        user_id: user.id,
        channel: followupForm.type, // 数据库字段是 channel，不是 type
        note: followupForm.content, // 数据库字段是 note，不是 content
        outcome: followupForm.status // 数据库字段是 outcome，不是 status
      }

      console.log('提交跟踪数据:', followup)
      const result = await databaseService.addFollowup(followup)
      console.log('跟踪结果:', result)
      
      if (result) {
        alert('跟踪记录添加成功！')
        closeModal()
        loadEmployeeData()
        onSuccess?.()
      } else {
        alert('添加失败，请重试')
      }
    } catch (error) {
      console.error('添加跟踪记录失败:', error)
      alert('添加失败，请重试')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">加载中...</div>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
  return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-gray-500 mb-4">无法加载数据</p>
              <button
          onClick={loadEmployeeData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          重新加载
              </button>
        </div>
    )
  }

  const { expenses, devices, customers, stats } = dashboardData

  const renderOverview = () => (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs">总申请数</p>
              <p className="text-xl font-bold">{stats.totalExpenses}</p>
            </div>
            <div className="text-2xl opacity-80">📝</div>
            </div>
          </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs">已批准金额</p>
              <p className="text-xl font-bold">¥{stats.approvedAmount.toFixed(2)}</p>
            </div>
            <div className="text-2xl opacity-80">💰</div>
            </div>
          </div>
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-xs">待审批</p>
              <p className="text-xl font-bold">{stats.pendingExpenses}</p>
            </div>
            <div className="text-2xl opacity-80">⏳</div>
            </div>
          </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs">我的客户</p>
              <p className="text-xl font-bold">{stats.customerCount}</p>
        </div>
            <div className="text-2xl opacity-80">👥</div>
            </div>
          </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-xs">今日跟踪</p>
              <p className="text-xl font-bold">{stats.todayFollowups}</p>
            </div>
            <div className="text-2xl opacity-80">📞</div>
            </div>
          </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-xs">待跟踪</p>
              <p className="text-xl font-bold">{stats.pendingFollowups}</p>
            </div>
            <div className="text-2xl opacity-80">⏰</div>
          </div>
        </div>
      </div>

      {/* 薪资对比 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">薪资对比</h3>
          <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">我的薪资</span>
              <span className="text-lg font-bold text-blue-600">¥{stats.mySalary.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${Math.min((stats.mySalary / stats.avgSalary) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">团队平均</span>
              <span className="text-xs text-gray-500">¥{stats.avgSalary.toFixed(2)}</span>
            </div>
          </div>
          </div>
        </div>
        

      {/* 最近活动 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">最近活动</h3>
        <div className="space-y-3">
          {expenses.slice(0, 3).map((expense) => (
            <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">📋</span>
              </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{typeof expense.purpose === 'string' ? expense.purpose : '费用申请'}</p>
                  <p className="text-xs text-gray-500">{new Date(expense.applied_at).toLocaleDateString()}</p>
                          </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">¥{expense.amount}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  expense.status === 'waiting_leader' ? 'bg-yellow-100 text-yellow-800' :
                  expense.status === 'waiting_supervisor' ? 'bg-purple-100 text-purple-800' :
                  expense.status === 'waiting_finance' ? 'bg-orange-100 text-orange-800' :
                  expense.status === 'paid' ? 'bg-green-100 text-green-800' :
                  expense.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {expense.status === 'waiting_leader' ? '等待组长审批' :
                   expense.status === 'waiting_supervisor' ? '等待主管审批' :
                   expense.status === 'waiting_finance' ? '等待财务审批' :
                   expense.status === 'paid' ? '已支付' :
                   expense.status === 'rejected' ? '已拒绝' :
                   '处理中'}
                              </span>
                            </div>
                            </div>
          ))}
                          </div>
                              </div>
                            </div>
  )

  // 组长特有的审批管理页面
  const renderApprovals = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">待审批申请</h3>
        <div className="text-sm text-gray-500">
          共 {pendingApprovals.length} 条待审批
                          </div>
                        </div>
                        
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          {pendingApprovals.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✅</div>
              <p className="text-gray-500 mb-4">暂无待审批申请</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((expense) => (
                <div key={expense.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h4 className="font-medium text-gray-900">{expense.creator?.name || '未知申请人'}</h4>
                        <span className="text-sm text-gray-500">{expense.team?.name || '未知团队'}</span>
                        <span className="text-sm text-gray-500">{new Date(expense.applied_at).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-2">
                          <div>
                            <span className="text-sm font-medium text-gray-600">申请金额:</span>
                          <p className="text-lg font-semibold text-gray-900">¥{expense.amount}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">用途说明:</span>
                            <p className="text-sm text-gray-900">{expense.purpose}</p>
                          </div>
                        </div>
                        
                        {expense.notes && (
                        <div className="mb-2">
                            <span className="text-sm font-medium text-gray-600">备注:</span>
                            <p className="text-sm text-gray-900">{expense.notes}</p>
                          </div>
                        )}
                      </div>
                      
                    <div className="flex flex-col space-y-2 ml-6">
                        <button
                        onClick={() => openApprovalModal(expense)}
                        className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium"
                        >
                          📋 查看详情
                        </button>
                            <button
                              onClick={() => handleApproval(expense.id, 'reject', '申请不符合要求')}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium"
                            >
                        拒绝申请
                            </button>
                            <button
                        onClick={() => handleApproval(expense.id, 'approve', '申请已批准')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        批准申请
                            </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          )}
                  </div>
                  </div>
                  </div>
  )

  const renderExpenses = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">团队申请记录</h3>
                  <button
          onClick={() => openModal('expense')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
          + 提交新申请
                  </button>
                </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-gray-500 mb-4">暂无申请记录</p>
                    <button
                onClick={() => openModal('expense')}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      立即提交申请
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
              {expenses.map((expense) => (
                <div key={expense.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                          <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h4 className="font-medium text-gray-900">{typeof expense.purpose === 'string' ? expense.purpose : '费用申请'}</h4>
                        <span className="text-sm text-gray-500">¥{expense.amount}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{new Date(expense.created_at).toLocaleDateString()}</span>
                        <span>{typeof expense.purpose === 'string' ? expense.purpose : '费用申请'}</span>
                      </div>
                      
                      {/* 审批历史 */}
                      {expense.leader_decision && (
                        <div className="mt-2 text-xs text-gray-400">
                          <span className="inline-flex items-center">
                            👨‍💼 组长审批: {expense.leader_decision.decision === 'approve' ? '✅ 同意' : '❌ 拒绝'}
                            <span className="ml-2">({new Date(expense.leader_decision.timestamp).toLocaleString()})</span>
                                </span>
                              </div>
                      )}
                      {expense.supervisor_decision && (
                        <div className="mt-1 text-xs text-gray-400">
                          <span className="inline-flex items-center">
                            👨‍💼 主管审批: {expense.supervisor_decision.decision === 'approve' ? '✅ 同意' : '❌ 拒绝'}
                            <span className="ml-2">({new Date(expense.supervisor_decision.timestamp).toLocaleString()})</span>
                          </span>
                                </div>
                      )}
                      {expense.finance_decision && (
                        <div className="mt-1 text-xs text-gray-400">
                          <span className="inline-flex items-center">
                            💰 财务审批: {expense.finance_decision.decision === 'pay' ? '✅ 已支付' : expense.finance_decision.decision === 'approve' ? '✅ 同意' : '❌ 拒绝'}
                            <span className="ml-2">({new Date(expense.finance_decision.timestamp).toLocaleString()})</span>
                          </span>
                                </div>
                      )}
                              </div>
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                      expense.status === 'waiting_leader' ? 'bg-yellow-100 text-yellow-800' :
                      expense.status === 'waiting_leader' ? 'bg-blue-100 text-blue-800' :
                      expense.status === 'waiting_supervisor' ? 'bg-purple-100 text-purple-800' :
                      expense.status === 'waiting_finance' ? 'bg-orange-100 text-orange-800' :
                      expense.status === 'paid' ? 'bg-green-100 text-green-800' :
                      expense.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {expense.status === 'waiting_leader' ? '等待组长审批' :
                       expense.status === 'waiting_supervisor' ? '等待主管审批' :
                       expense.status === 'waiting_finance' ? '等待财务审批' :
                       expense.status === 'paid' ? '已支付' :
                       expense.status === 'rejected' ? '已拒绝' :
                       '处理中'}
                    </span>
                                  </div>
                                </div>
              ))}
                              </div>
          )}
                            </div>
      </div>
    </div>
  )

  const renderDevices = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">我的设备</h3>
                              </div>
      <div className="p-6">
        {devices.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">💻</div>
            <p className="text-gray-500">暂无分配设备</p>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <div key={device.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                              <div>
                    <h4 className="font-medium text-gray-900">{device.name}</h4>
                    <p className="text-sm text-gray-500">{device.type} - {device.specs}</p>
                              </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      device.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {device.status === 'active' ? '使用中' : '停用'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(device.assigned_at).toLocaleDateString()}
                    </p>
                            </div>
                </div>
              </div>
            ))}
                              </div>
                            )}
                            </div>
                          </div>
  )

  const renderCustomers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">团队客户管理</h3>
        <div className="flex space-x-3">
          {/* 视图切换按钮 */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCustomerViewMode('cards')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                customerViewMode === 'cards' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 卡片视图
            </button>
            <button
              onClick={() => setCustomerViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                customerViewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 列表视图
            </button>
          </div>
          
          <button
            onClick={() => openModal('customer')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            + 添加客户
          </button>
          <button
            onClick={downloadTemplate}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200"
          >
            📥 下载模板
          </button>
          <button
            onClick={() => openModal('followup')}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors duration-200"
          >
            📞 客户跟踪
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          {customers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">👥</div>
              <p className="text-gray-500 mb-4">暂无负责客户</p>
              <button
                onClick={() => openModal('customer')}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                立即添加客户
              </button>
                      </div>
          ) : (
            customerViewMode === 'list' ? (
              // 列表视图
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客户信息</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">联系方式</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">来源</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">群状态</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">跟踪状态</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">投资信息</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.map((customer) => {
                      const customerFollowups = dashboardData.followups.filter(f => f.customer_id === customer.id)
                      const lastFollowup = customerFollowups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
                      const pendingFollowups = customerFollowups.filter(f => 
                        f.status === '进行中' && new Date(f.next_contact_date) <= new Date()
                      )
                      const completedFollowups = customerFollowups.filter(f => f.status === '已完成')
                      const daysSinceLastFollowup = lastFollowup ? 
                        Math.floor((new Date() - new Date(lastFollowup.created_at)) / (1000 * 60 * 60 * 24)) : 
                        Math.floor((new Date() - new Date(customer.created_at)) / (1000 * 60 * 60 * 24))
                      
                      // 跟踪状态判断
                      const getTrackingStatus = () => {
                        if (pendingFollowups.length > 0) return { status: 'urgent', text: '🔴 紧急跟踪', color: 'bg-red-100 text-red-800' }
                        if (daysSinceLastFollowup > 7) return { status: 'overdue', text: '🟡 超期跟踪', color: 'bg-yellow-100 text-yellow-800' }
                        if (daysSinceLastFollowup > 3) return { status: 'due', text: '🟠 即将到期', color: 'bg-orange-100 text-orange-800' }
                        return { status: 'normal', text: '🟢 正常跟踪', color: 'bg-green-100 text-green-800' }
                      }
                      
                      const trackingStatus = getTrackingStatus()
                      
                      return (
                        <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                <div className="text-sm text-gray-500">ID: {customer.id.slice(0, 8)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{customer.contact}</div>
                            {customer.additional_contacts && customer.additional_contacts.length > 0 && (
                              <div className="text-xs text-gray-500">
                                +{customer.additional_contacts.length} 个联系方式
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {customer.source}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {customer.joined_group ? (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                ✅ 已进群
                              </span>
                            ) : (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                                ❌ 未进群
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${trackingStatus.color}`}>
                                {trackingStatus.text}
                              </span>
                              <div className="text-xs text-gray-500">
                                跟踪: {customerFollowups.length}次 | 完成: {completedFollowups.length}次
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {customer.budget_range || '未设置'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {customer.strategy_interest || '未设置'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => startEditCustomer(customer)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => openStockEditModal(customer)}
                                className="text-green-600 hover:text-green-900"
                              >
                                股票
                              </button>
                              <button
                                onClick={() => openNotesEditModal(customer)}
                                className="text-purple-600 hover:text-purple-900"
                              >
                                备注
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              // 卡片视图
              <div className="space-y-4">
                {customers.map((customer) => {
                const customerFollowups = dashboardData.followups.filter(f => f.customer_id === customer.id)
                const lastFollowup = customerFollowups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
                const pendingFollowups = customerFollowups.filter(f => 
                  f.status === '进行中' && new Date(f.next_contact_date) <= new Date()
                )
                const completedFollowups = customerFollowups.filter(f => f.status === '已完成')
                const daysSinceLastFollowup = lastFollowup ? 
                  Math.floor((new Date() - new Date(lastFollowup.created_at)) / (1000 * 60 * 60 * 24)) : 
                  Math.floor((new Date() - new Date(customer.created_at)) / (1000 * 60 * 60 * 24))
                
                // 跟踪状态判断
                const getTrackingStatus = () => {
                  if (pendingFollowups.length > 0) return { status: 'urgent', text: '🔴 紧急跟踪', color: 'bg-red-100 text-red-800' }
                  if (daysSinceLastFollowup > 7) return { status: 'overdue', text: '🟡 超期跟踪', color: 'bg-yellow-100 text-yellow-800' }
                  if (daysSinceLastFollowup > 3) return { status: 'due', text: '🟠 即将到期', color: 'bg-orange-100 text-orange-800' }
                  return { status: 'normal', text: '🟢 正常跟踪', color: 'bg-green-100 text-green-800' }
                }
                
                const trackingStatus = getTrackingStatus()
                
                return (
                  <div key={customer.id} className={`border rounded-lg p-4 hover:shadow-lg transition-all duration-200 ${
                    trackingStatus.status === 'urgent' ? 'border-red-200 bg-red-50' :
                    trackingStatus.status === 'overdue' ? 'border-yellow-200 bg-yellow-50' :
                    trackingStatus.status === 'due' ? 'border-orange-200 bg-orange-50' :
                    'border-gray-200 bg-white'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* 客户名称和状态 */}
                        <div className="flex items-center space-x-3 mb-3">
                          <h4 className="font-bold text-gray-900 text-xl">{customer.name}</h4>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {customer.source}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${trackingStatus.color}`}>
                            {trackingStatus.text}
                          </span>
                          {/* 群状态显示 */}
                          {customer.joined_group ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                              ✅ 已进群
                            </span>
                          ) : (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                              ❌ 已退群
                            </span>
                          )}
              </div>
                        
                        {/* 跟踪状态 - 简化显示 */}
                        <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-gray-600">跟踪: {customerFollowups.length}次</span>
                            <span className="text-gray-600">完成: {completedFollowups.length}次</span>
                            <span className="text-gray-600">进行中: {pendingFollowups.length}次</span>
                          </div>
                          <div className="text-sm">
                            <span className={`font-medium ${
                              daysSinceLastFollowup > 7 ? 'text-red-600' :
                              daysSinceLastFollowup > 3 ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {daysSinceLastFollowup}天前跟踪
                              </span>
                            </div>
                          </div>
                          
                        {/* 重要投资数据 - 突出显示 */}
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 mb-3 border border-green-200">
                          <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                            💰 重要投资数据
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              制定跟踪方案
                        </span>
                          </h5>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 买入股票 - 重新设计 */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200 shadow-sm">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-semibold text-green-700 flex items-center">
                                  <span className="text-lg mr-2">📈</span>
                                  已买入股票
                                </span>
                            <button
                                  onClick={() => {
                                    // 这里可以添加编辑功能
                                  }}
                                  className="bg-green-100 hover:bg-green-200 text-green-700 text-xs px-2 py-1 rounded-full transition-colors duration-200 flex items-center"
                                >
                                  <span className="mr-1">✏️</span>
                                  编辑
                            </button>
                          </div>
                              
                              {customer.purchased_stocks ? (
                                <div className="space-y-2">
                                  {customer.purchased_stocks.split(' | ').map((item, index) => {
                                    // 特殊处理：第一个字段通常是股票代码（没有标签）
                                    if (index === 0 && !item.includes(':')) {
                                      return (
                                        <div key={index} className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center">
                                          <span className="mr-2">🏷️</span>
                                          <span className="font-semibold">股票代码:</span>
                                          <span className="ml-1">{item}</span>
                        </div>
                                      )
                                    }
                                    
                                    const [key, value] = item.split(': ')
                                    if (!key || !value) return null
                                    
                                    let icon = '📊'
                                    let bgColor = 'bg-green-100'
                                    let textColor = 'text-green-700'
                                    
                                    if (key.includes('价格')) {
                                      icon = '💰'
                                      bgColor = 'bg-yellow-100'
                                      textColor = 'text-yellow-700'
                                    } else if (key.includes('时间')) {
                                      icon = '📅'
                                      bgColor = 'bg-purple-100'
                                      textColor = 'text-purple-700'
                                    } else if (key.includes('金额')) {
                                      icon = '💵'
                                      bgColor = 'bg-red-100'
                                      textColor = 'text-red-700'
                                    } else if (key.includes('备注')) {
                                      icon = '📝'
                                      bgColor = 'bg-gray-100'
                                      textColor = 'text-gray-700'
                                    }
                                    
                                    return (
                                      <div key={index} className={`${bgColor} ${textColor} px-3 py-2 rounded-lg text-xs font-medium flex items-center`}>
                                        <span className="mr-2">{icon}</span>
                                        <span className="font-semibold">{key}:</span>
                                        <span className="ml-1">{value}</span>
                      </div>
                                    )
                                  })}
                                  <div className="flex items-center justify-center mt-3 pt-2 border-t border-green-200">
                                    <span className="text-xs text-green-600 font-medium flex items-center">
                                      <span className="mr-1">✅</span>
                                      交易已确认
                                    </span>
              </div>
            </div>
          ) : (
                                <div className="text-center py-4">
                                  <div className="text-2xl mb-2">📊</div>
                                  <div className="text-sm text-gray-500 font-medium">暂无股票记录</div>
                                  <div className="text-xs text-gray-400 mt-1">点击编辑按钮添加</div>
              </div>
                              )}
                      </div>

                            {/* 备注信息 - 突出显示 */}
                            <div className="bg-white rounded-lg p-3 border border-blue-300">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600 flex items-center">
                                  📝 备注信息
                                </span>
                                <button
                                  onClick={() => {
                                    // 这里可以添加编辑功能
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  ✏️ 编辑
                                </button>
                      </div>
                              <div className={`text-sm ${
                                customer.notes ? 'text-blue-600' : 'text-gray-400'
                              }`}>
                                {customer.notes ? (
                                  <div className="space-y-1">
                                    {customer.notes.split('\n').map((note, index) => (
                                      <div key={index} className="text-xs bg-blue-50 p-2 rounded border-l-2 border-blue-300">
                                        {note}
                    </div>
                                    ))}
                      </div>
                                ) : (
                                  <div className="text-lg font-bold text-gray-400">未记录</div>
                                )}
                      </div>
                              {customer.notes && (
                                <div className="text-xs text-blue-600 mt-1">
                                  📋 有备注记录
                      </div>
                              )}
                            </div>
                    </div>
                    
                          {/* 交流群状态 - 可编辑 */}
                          <div className="mt-3 bg-white rounded-lg p-3 border border-purple-300">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-600 mr-2">
                                  👥 交流群状态
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  customer.joined_group ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {customer.joined_group ? '✅ 已加群' : '❌ 未加群'}
                        </span>
                      </div>
                              <button
                                onClick={() => {
                                  const newStatus = !customer.joined_group
                                  // 这里可以添加更新群状态的功能
                                  alert(newStatus ? '客户已加入交流群' : '客户已退出交流群')
                                }}
                                className={`text-xs px-3 py-1 rounded font-medium transition-colors duration-200 ${
                                  customer.joined_group 
                                    ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                                }`}
                              >
                                {customer.joined_group ? '退群' : '进群'}
                              </button>
                    </div>
                            {customer.joined_group ? (
                              <div className="text-xs text-green-600 mt-2">
                                💡 可进行群内互动跟踪
                      </div>
                            ) : (
                              <div className="text-xs text-orange-600 mt-2">
                                💡 建议邀请加入交流群
                      </div>
                    )}
                  </div>
              </div>
                      
                        {/* 客户基本信息 - 简化显示 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600">📞 联系方式</p>
                            <p className="text-sm font-medium text-gray-900">{customer.contact}</p>
                            {customer.additional_contacts && customer.additional_contacts.length > 0 && (
                              <p className="text-xs text-gray-500">
                                其他: {customer.additional_contacts.map(contact => contact.phone || contact.contact).join(', ')}
                              </p>
                            )}
                              </div>
                          <div>
                            <p className="text-sm text-gray-600">💰 投资信息</p>
                            <p className="text-sm font-medium text-gray-900">
                              {customer.budget_range || '未填写'} | {customer.strategy_interest || '未填写'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {customer.age ? `${customer.age}岁` : '未填写'} / {customer.occupation || '未填写'}
                            </p>
        </div>
      </div>

                        {/* 重要备注 */}
                        {customer.notes && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-600">📝 重要备注</p>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded border-l-4 border-blue-400">
                              {customer.notes}
                            </p>
                                </div>
                              )}
                        
                        {/* 底部信息 */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-4">
                            <span>📅 创建: {new Date(customer.created_at).toLocaleDateString('zh-CN')}</span>
                            <span>🆔 ID: {customer.id.slice(0, 8)}...</span>
                  </div>
                      </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-4">
                        {/* 主要操作：查看详情 */}
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setShowCustomerDetail(true)
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                        >
                          📋 查看详情
                        </button>
                        
                        {/* 次要操作：编辑客户 */}
                        <button
                          onClick={() => {
                            setEditingCustomer(customer)
                            setEditCustomerForm({
                              name: customer.name || '',
                              contact: customer.contact || '',
                              age: customer.age || '',
                              occupation: customer.occupation || '',
                              investment_experience: customer.investment_experience || '',
                              budget_range: customer.budget_range || '',
                              strategy_interest: customer.strategy_interest || '',
                              risk_preference: customer.risk_preference || '',
                              source: customer.source || '',
                              additional_contacts: customer.additional_contacts || [],
                              notes: customer.notes || ''
                            })
                          }}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors duration-200"
                        >
                          ✏️ 编辑客户
                        </button>
                              </div>
                                </div>
                                </div>
                )
              })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )

  const renderFollowups = () => {
    const { followups } = dashboardData
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">客户跟踪记录</h3>
          <button
            onClick={() => openModal('followup')}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors duration-200"
          >
            + 添加跟踪
          </button>
                                </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {followups.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📞</div>
                <p className="text-gray-500 mb-4">暂无跟踪记录</p>
                <button
                  onClick={() => openModal('followup')}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors duration-200"
                >
                  立即添加跟踪
                </button>
                                </div>
            ) : (
              <div className="space-y-4">
                {followups.map((followup) => {
                  const customer = customers.find(c => c.id === followup.customer_id)
                  return (
                    <div key={followup.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-gray-900 text-lg">
                              {customer?.name || '未知客户'}
                            </h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              followup.status === '进行中' ? 'bg-blue-100 text-blue-800' :
                              followup.status === '已成交' ? 'bg-green-100 text-green-800' :
                              followup.status === '已放弃' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {followup.status}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                              {followup.type}
                            </span>
                              </div>
                          
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 mb-1">跟踪内容</p>
                            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                              {followup.content}
                            </p>
                            </div>
                      
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>跟踪时间: {new Date(followup.created_at).toLocaleString()}</span>
                            {followup.next_contact_date && (
                              <span>下次联系: {new Date(followup.next_contact_date).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
                  )
                })}
        </div>
      )}
                            </div>
                          </div>
      </div>
    )
  }

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">个人资料</h3>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors duration-200"
          >
            🔒 修改密码
          </button>
          <button
            onClick={() => openModal('profile')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200"
          >
            ✏️ 编辑资料
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
            <p className="text-gray-900">{user.name}</p>
            </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">角色</label>
            <p className="text-gray-900">员工</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">部门</label>
            <p className="text-gray-900">技术部</p>
        </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">薪资</label>
            <p className="text-gray-900">¥{stats.mySalary.toFixed(2)}</p>
                    </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
            <p className="text-gray-900">{user.email || '未设置'}</p>
                  </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">电话</label>
            <p className="text-gray-900">{user.phone || '未设置'}</p>
                </div>
              </div>
              </div>
            </div>
  )

  // 模态框组件
  const renderModal = () => {
    if (!showModal) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalType === 'expense' && '提交申请'}
                {modalType === 'customer' && '添加客户'}
                {modalType === 'followup' && '客户跟踪'}
                {modalType === 'profile' && '编辑资料'}
              </h3>
                  <button
                onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

            {modalType === 'expense' && (
                <div className="space-y-4">
                  {/* 步骤指示器 */}
                  <div className="flex items-center justify-center space-x-2 mb-6">
                    <div className={`flex items-center space-x-2 ${expenseStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        expenseStep >= 1 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        1
                      </div>
                      <span className="text-xs font-medium">基本信息</span>
                    </div>
                    <div className={`w-4 h-1 ${expenseStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                    <div className={`flex items-center space-x-2 ${expenseStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        expenseStep >= 2 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        2
                      </div>
                      <span className="text-xs font-medium">详细信息</span>
                    </div>
                    <div className={`w-4 h-1 ${expenseStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                    <div className={`flex items-center space-x-2 ${expenseStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        expenseStep >= 3 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        3
                      </div>
                      <span className="text-xs font-medium">财务信息</span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitExpense}>
                    {/* 第1步：基本信息 */}
                    {expenseStep === 1 && (
                      <div className="space-y-4">
                        <div className="text-center mb-4">
                          <h4 className="text-md font-semibold text-gray-900 mb-1">选择申请类型和金额</h4>
                          <p className="text-sm text-gray-600">请选择您的申请类型并输入金额</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">申请大类</label>
                          <select
                            value={expenseForm.category}
                            onChange={(e) => {
                              const category = e.target.value
                              setExpenseForm({
                                ...expenseForm, 
                                category: category,
                                type: '' // 重置小类型
                              })
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">请选择申请大类</option>
                            {Object.entries(expenseCategories).map(([key, category]) => (
                              <option key={key} value={key}>
                                {category.icon} {category.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {expenseForm.category && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">具体类型</label>
                            <select
                              value={expenseForm.type}
                              onChange={(e) => setExpenseForm({...expenseForm, type: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            >
                              <option value="">请选择具体类型</option>
                              {expenseCategories[expenseForm.category]?.types.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.icon} {type.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        
                        {expenseForm.category && expenseForm.type && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center">
                              <span className="text-blue-600 text-sm">
                                {expenseCategories[expenseForm.category]?.icon} {expenseForm.category} - {expenseCategories[expenseForm.category]?.types.find(t => t.value === expenseForm.type)?.icon} {expenseForm.type}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">申请金额 (元)</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500">¥</span>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={expenseForm.amount}
                              onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="请输入金额"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 第2步：详细信息 */}
                    {expenseStep === 2 && (
                      <div className="space-y-4">
                        <div className="text-center mb-4">
                          <h4 className="text-md font-semibold text-gray-900 mb-1">填写详细信息</h4>
                          <p className="text-sm text-gray-600">请详细说明申请用途和相关信息</p>
                        </div>
                        
                        {/* 申请摘要 */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <h5 className="font-medium text-gray-900 mb-1">申请摘要</h5>
                          <div className="flex items-center space-x-3 text-sm text-gray-600">
                            <span>类型: {expenseForm.type}</span>
                            <span>金额: ¥{expenseForm.amount}</span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">用途说明</label>
                          <textarea
                            value={expenseForm.purpose}
                            onChange={(e) => setExpenseForm({...expenseForm, purpose: e.target.value})}
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="请详细说明申请用途，包括具体项目、时间、地点等信息"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
                          <textarea
                            value={expenseForm.note}
                            onChange={(e) => setExpenseForm({...expenseForm, note: e.target.value})}
                            rows={2}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="其他需要说明的信息（可选）"
                          />
                        </div>
                      </div>
                    )}

                    {/* 第3步：财务信息 */}
                    {expenseStep === 3 && (
                      <div className="space-y-4">
                        <div className="text-center mb-4">
                          <h4 className="text-md font-semibold text-gray-900 mb-1">填写财务信息</h4>
                          <p className="text-sm text-gray-600">请填写付款方式和收款人信息</p>
                        </div>
                        
                        {/* 申请摘要 */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <h5 className="font-medium text-gray-900 mb-1">申请摘要</h5>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>类型: {expenseForm.type}</span>
                            <span>金额: ¥{expenseForm.amount}</span>
                            <span>用途: {expenseForm.purpose}</span>
                          </div>
                        </div>
                        
                        {/* 付款方式 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">付款方式</label>
                          <select
                            value={expenseForm.paymentMethod}
                            onChange={(e) => setExpenseForm({...expenseForm, paymentMethod: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                          <option value="银行转账">银行转账</option>
                          <option value="支付宝">支付宝</option>
                          <option value="微信支付">微信支付</option>
                          <option value="USDT">USDT</option>
                          <option value="现金">现金</option>
                          <option value="支票">支票</option>
                          </select>
                        </div>
                        
                        {/* 收款人信息 */}
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">收款人姓名 *</label>
                            <input
                              type="text"
                              value={expenseForm.payeeName}
                              onChange={(e) => setExpenseForm({...expenseForm, payeeName: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="请输入收款人姓名"
                              required
                            />
                          </div>
                          <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">联系方式 *</label>
                            <input
                              type="text"
                              value={expenseForm.payeeContact}
                              onChange={(e) => setExpenseForm({...expenseForm, payeeContact: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="手机号或邮箱"
                              required
                            />
                          </div>
                        </div>
                        
                        {/* 银行信息 */}
                      {expenseForm.paymentMethod === '银行转账' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">开户银行 *</label>
                            <input
                              type="text"
                              value={expenseForm.payeeBank}
                              onChange={(e) => setExpenseForm({...expenseForm, payeeBank: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="如：中国工商银行"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">银行账号 *</label>
                            <input
                              type="text"
                              value={expenseForm.payeeAccount}
                              onChange={(e) => setExpenseForm({...expenseForm, payeeAccount: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="请输入银行账号"
                              required
                            />
                          </div>
                        </div>
                      )}
                        
                      {/* 支付宝/微信账号 */}
                      {(expenseForm.paymentMethod === '支付宝' || expenseForm.paymentMethod === '微信支付') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {expenseForm.paymentMethod === '支付宝' ? '支付宝账号' : '微信账号'} *
                          </label>
                          <input
                            type="text"
                            value={expenseForm.payeeAccount}
                            onChange={(e) => setExpenseForm({...expenseForm, payeeAccount: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={expenseForm.paymentMethod === '支付宝' ? '支付宝账号或手机号' : '微信号或手机号'}
                            required
                          />
                            </div>
                      )}
                      
                      {/* USDT收款地址 */}
                      {expenseForm.paymentMethod === 'USDT' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">USDT收款地址 *</label>
                          <input
                            type="text"
                            value={expenseForm.payeeAccount}
                            onChange={(e) => setExpenseForm({...expenseForm, payeeAccount: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="请输入USDT钱包地址"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">请确保地址正确，错误的地址可能导致资金丢失</p>
                        </div>
                      )}
                      
                      {/* 上传凭证 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">上传凭证 *</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files[0]
                                if (file) {
                                  try {
                                    // 先显示本地预览
                                    setExpenseForm({...expenseForm, receiptImage: file})
                                    const reader = new FileReader()
                                    reader.onload = (e) => {
                                      setExpenseForm({...expenseForm, receiptImage: file, receiptImageUrl: e.target.result})
                                    }
                                    reader.readAsDataURL(file)
                                    
                                    // 上传到服务器获取真实URL
                                    const uploadResult = await databaseService.uploadImage(file, 'receipts')
                                  setExpenseForm({...expenseForm, 
                                      receiptImage: file, 
                                      receiptImageUrl: uploadResult.url,
                                      receiptImagePath: uploadResult.path
                                  })
                                  } catch (error) {
                                    console.error('图片上传失败:', error)
                                    alert('图片上传失败，请重试')
                                  }
                                }
                              }}
                              className="hidden"
                              id="receipt-upload"
                            required
                          />
                          <label htmlFor="receipt-upload" className="cursor-pointer">
                            {expenseForm.receiptImage ? (
                              <div>
                                <div className="text-green-600 text-lg mb-1">✅</div>
                                <p className="text-xs text-gray-600">已上传: {expenseForm.receiptImage.name}</p>
                              </div>
                            ) : (
                              <div>
                                <div className="text-gray-400 text-2xl mb-1">📷</div>
                                <p className="text-xs text-gray-600">点击上传发票、收据等凭证</p>
                                <p className="text-xs text-gray-500">支持 JPG、PNG 格式</p>
                              </div>
                            )}
                          </label>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* 按钮组 */}
                  <div className="flex space-x-3 pt-4">
                    {expenseStep === 1 ? (
                      <>
                      <button
                        type="button"
                          onClick={closeModal}
                          className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                      >
                        取消
                      </button>
                          <button
                            type="button"
                          onClick={() => setExpenseStep(2)}
                          disabled={!expenseForm.type || !expenseForm.amount}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          下一步 →
                        </button>
                      </>
                    ) : expenseStep === 2 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setExpenseStep(1)}
                          className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                          >
                            ← 上一步
                          </button>
                          <button
                            type="button"
                          onClick={() => setExpenseStep(3)}
                          disabled={!expenseForm.purpose}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            下一步 →
                          </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setExpenseStep(2)}
                          className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                        >
                          ← 上一步
                        </button>
                          <button
                            type="submit"
                          disabled={!expenseForm.payeeName || !expenseForm.payeeContact || !expenseForm.payeeAccount || !expenseForm.receiptImage}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            提交申请
                          </button>
                      </>
                        )}
                      </div>
                </form>
              </div>
            )}

            {modalType === 'customer' && (
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">客户姓名 *</label>
                    <input
                      type="text"
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="请输入客户姓名"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">联系方式 *</label>
                    <input
                      type="text"
                      value={customerForm.contact}
                      onChange={(e) => setCustomerForm({...customerForm, contact: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="请输入联系方式"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">公司名称</label>
                    <input
                      type="text"
                      value={customerForm.company}
                      onChange={(e) => setCustomerForm({...customerForm, company: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="请输入公司名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">职位</label>
                    <input
                      type="text"
                      value={customerForm.position}
                      onChange={(e) => setCustomerForm({...customerForm, position: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="请输入职位"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">行业</label>
                    <select
                      value={customerForm.industry}
                      onChange={(e) => setCustomerForm({...customerForm, industry: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">请选择行业</option>
                      <option value="互联网">互联网</option>
                      <option value="金融">金融</option>
                      <option value="制造业">制造业</option>
                      <option value="教育">教育</option>
                      <option value="医疗">医疗</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">预算范围</label>
                    <select
                      value={customerForm.budget}
                      onChange={(e) => setCustomerForm({...customerForm, budget: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">请选择预算</option>
                      <option value="1万以下">1万以下</option>
                      <option value="1-5万">1-5万</option>
                      <option value="5-10万">5-10万</option>
                      <option value="10-50万">10-50万</option>
                      <option value="50万以上">50万以上</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">客户来源</label>
                  <select
                    value={customerForm.source}
                    onChange={(e) => setCustomerForm({...customerForm, source: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="网站咨询">网站咨询</option>
                    <option value="电话咨询">电话咨询</option>
                    <option value="朋友介绍">朋友介绍</option>
                    <option value="广告推广">广告推广</option>
                    <option value="展会">展会</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">备注信息</label>
                  <textarea
                    value={customerForm.notes}
                    onChange={(e) => setCustomerForm({...customerForm, notes: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="3"
                    placeholder="请输入备注信息"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    添加客户
                  </button>
                    </div>
                  </form>
            )}

            {modalType === 'followup' && (
              <form onSubmit={handleAddFollowup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择客户 *</label>
                  <select
                    value={followupForm.customer_id}
                    onChange={(e) => setFollowupForm({...followupForm, customer_id: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">请选择客户</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.contact}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">跟踪方式</label>
                    <select
                      value={followupForm.type}
                      onChange={(e) => setFollowupForm({...followupForm, type: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="电话">电话</option>
                      <option value="微信">微信</option>
                      <option value="邮件">邮件</option>
                      <option value="面谈">面谈</option>
                      <option value="其他">其他</option>
                    </select>
              </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">跟踪状态</label>
                    <select
                      value={followupForm.status}
                      onChange={(e) => setFollowupForm({...followupForm, status: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="进行中">进行中</option>
                      <option value="已成交">已成交</option>
                      <option value="已放弃">已放弃</option>
                      <option value="待回复">待回复</option>
                    </select>
            </div>
          </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">跟踪内容 *</label>
                  <textarea
                    value={followupForm.content}
                    onChange={(e) => setFollowupForm({...followupForm, content: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows="4"
                    placeholder="请详细记录本次跟踪的内容、客户反馈、需求等"
                    required
                  />
        </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">下次联系时间</label>
                  <input
                    type="datetime-local"
                    value={followupForm.next_contact_date}
                    onChange={(e) => setFollowupForm({...followupForm, next_contact_date: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors duration-200"
                  >
                    添加跟踪
                  </button>
                </div>
              </form>
            )}

            {modalType === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">电话</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200"
                  >
                    保存修改
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
    </div>
  )
}

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">组长工作台</h1>
            <p className="text-blue-100 mt-1">欢迎回来，{user.name}！</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">当前角色</p>
            <p className="text-lg font-semibold">组长</p>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: '概览', icon: '📊' },
              { id: 'approvals', name: '待审批', icon: '✅' },
              { id: 'expenses', name: '团队申请', icon: '📝' },
              { id: 'customers', name: '团队客户', icon: '👥' },
              { id: 'followups', name: '客户跟踪', icon: '📞' },
              { id: 'devices', name: '我的设备', icon: '💻' },
              { id: 'profile', name: '个人资料', icon: '👤' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'approvals' && renderApprovals()}
          {activeTab === 'expenses' && renderExpenses()}
          {activeTab === 'customers' && renderCustomers()}
          {activeTab === 'followups' && renderFollowups()}
          {activeTab === 'devices' && renderDevices()}
          {activeTab === 'profile' && renderProfile()}
        </div>
      </div>

      {/* 模态框 */}
      {renderModal()}
      
      {/* 审批模态框 */}
      {showApprovalModal && selectedApproval && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeApprovalModal}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <span className="text-blue-600 text-lg">✅</span>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      审批申请
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">申请人:</span>
                        <span>{selectedApproval.creator?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">金额:</span>
                        <span className="font-bold">¥{selectedApproval.amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">用途:</span>
                        <span>{selectedApproval.purpose}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">申请时间:</span>
                        <span>{new Date(selectedApproval.applied_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    handleApproval(selectedApproval.id, 'approve', '申请已批准')
                    closeApprovalModal()
                  }}
                >
                  批准
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    handleApproval(selectedApproval.id, 'reject', '申请不符合要求')
                    closeApprovalModal()
                  }}
                >
                  拒绝
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closeApprovalModal}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 客户详情弹窗 */}
      {showCustomerDetail && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  📋 客户详情 - {selectedCustomer.name}
                </h3>
                <button
                  onClick={() => setShowCustomerDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">关闭</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 基本信息 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">👤 基本信息</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">姓名:</span>
                      <span className="ml-2 text-gray-900">{selectedCustomer.name}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">联系方式:</span>
                      <span className="ml-2 text-gray-900">{selectedCustomer.contact}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">来源:</span>
                      <span className="ml-2 inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {selectedCustomer.source}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">年龄:</span>
                      <span className="ml-2 text-gray-900">{selectedCustomer.age ? `${selectedCustomer.age}岁` : '未填写'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">职业:</span>
                      <span className="ml-2 text-gray-900">{selectedCustomer.occupation || '未填写'}</span>
                    </div>
                  </div>
                </div>

                {/* 投资信息 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">💰 投资信息</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">投资经验:</span>
                      <span className="ml-2 text-gray-900">{selectedCustomer.investment_experience || '未填写'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">资金规模:</span>
                      <span className="ml-2 text-gray-900">{selectedCustomer.budget_range || '未填写'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">关注策略:</span>
                      <span className="ml-2 text-gray-900">{selectedCustomer.strategy_interest || '未填写'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">风险偏好:</span>
                      <span className="ml-2 text-gray-900">{selectedCustomer.risk_preference || '未填写'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">是否加群:</span>
                      <span className="ml-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          selectedCustomer.joined_group ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedCustomer.joined_group ? '✅ 已加群' : '❌ 未加群'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 交易记录 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">💹 交易记录</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">最近回复时间:</span>
                      <span className="ml-2 text-gray-900">
                        {selectedCustomer.last_reply_time ? 
                          new Date(selectedCustomer.last_reply_time).toLocaleDateString('zh-CN') : 
                          '未记录'
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">买入股票:</span>
                      <span className="ml-2 text-gray-900">{selectedCustomer.purchased_stocks || '未记录'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">最后读群时间:</span>
                      <span className="ml-2 text-gray-900">
                        {selectedCustomer.last_group_read_time ? 
                          new Date(selectedCustomer.last_group_read_time).toLocaleDateString('zh-CN') : 
                          '未记录'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* 备注信息 */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">📝 备注信息</h4>
                  <div className="text-gray-900">
                    {selectedCustomer.notes || '暂无备注'}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowCustomerDetail(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 transition-colors duration-200"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑客户弹窗 */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setEditingCustomer(null)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <span className="text-green-600 text-lg">✏️</span>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      编辑客户信息
                    </h3>
                    
                    <form onSubmit={handleUpdateCustomer} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">客户姓名 *</label>
                          <input
                            type="text"
                            value={editCustomerForm.name}
                            onChange={(e) => setEditCustomerForm({...editCustomerForm, name: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="请输入客户姓名"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">主联系方式 *</label>
                          <input
                            type="text"
                            value={editCustomerForm.contact}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed"
                            placeholder="主联系方式（不可修改）"
                            disabled
                          />
                          <p className="text-xs text-gray-500 mt-1">主联系方式不可修改，可在下方添加新的联系方式</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">年龄</label>
                          <input
                            type="number"
                            min="18"
                            max="100"
                            value={editCustomerForm.age}
                            onChange={(e) => setEditCustomerForm({...editCustomerForm, age: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="请输入年龄"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">职业</label>
                          <input
                            type="text"
                            value={editCustomerForm.occupation}
                            onChange={(e) => setEditCustomerForm({...editCustomerForm, occupation: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="请输入职业"
                          />
                        </div>
                      </div>
                      
                      {/* 投资相关信息 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">投资经验</label>
                          <select
                            value={editCustomerForm.investment_experience}
                            onChange={(e) => setEditCustomerForm({...editCustomerForm, investment_experience: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="">请选择投资经验</option>
                            <option value="新手">新手（0-1年）</option>
                            <option value="1-3年">1-3年</option>
                            <option value="3-5年">3-5年</option>
                            <option value="5-10年">5-10年</option>
                            <option value="10年以上">10年以上</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">资金规模</label>
                          <select
                            value={editCustomerForm.budget_range}
                            onChange={(e) => setEditCustomerForm({...editCustomerForm, budget_range: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="">请选择资金规模</option>
                            <option value="1万以下">1万以下</option>
                            <option value="1-5万">1-5万</option>
                            <option value="5-10万">5-10万</option>
                            <option value="10-50万">10-50万</option>
                            <option value="50-100万">50-100万</option>
                            <option value="100-500万">100-500万</option>
                            <option value="500万以上">500万以上</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* 投资偏好 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">关注策略</label>
                          <select
                            value={editCustomerForm.strategy_interest}
                            onChange={(e) => setEditCustomerForm({...editCustomerForm, strategy_interest: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="">请选择关注策略</option>
                            <option value="短线交易">短线交易</option>
                            <option value="中线投资">中线投资</option>
                            <option value="长线投资">长线投资</option>
                            <option value="价值投资">价值投资</option>
                            <option value="成长投资">成长投资</option>
                            <option value="技术分析">技术分析</option>
                            <option value="基本面分析">基本面分析</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">风险偏好</label>
                          <select
                            value={editCustomerForm.risk_preference}
                            onChange={(e) => setEditCustomerForm({...editCustomerForm, risk_preference: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="">请选择风险偏好</option>
                            <option value="保守型">保守型</option>
                            <option value="稳健型">稳健型</option>
                            <option value="平衡型">平衡型</option>
                            <option value="积极型">积极型</option>
                            <option value="激进型">激进型</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* 客户来源 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">客户来源</label>
                        <select
                          value={editCustomerForm.source}
                          onChange={(e) => setEditCustomerForm({...editCustomerForm, source: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">请选择客户来源</option>
                          <option value="朋友介绍">朋友介绍</option>
                          <option value="网站咨询">网站咨询</option>
                          <option value="广告推广">广告推广</option>
                          <option value="电话营销">电话营销</option>
                          <option value="线下活动">线下活动</option>
                          <option value="其他渠道">其他渠道</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">备注信息</label>
                        <textarea
                          value={editCustomerForm.notes}
                          onChange={(e) => setEditCustomerForm({...editCustomerForm, notes: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                          rows="3"
                          placeholder="请输入备注信息"
                        />
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleUpdateCustomer}
                >
                  保存修改
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setEditingCustomer(null)}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 密码修改模态框 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">修改密码</h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">当前密码</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">新密码</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                    minLength="6"
                  />
                  <p className="text-xs text-gray-500 mt-1">密码长度至少6位</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">确认新密码</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors duration-200"
                  >
                    确认修改
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}