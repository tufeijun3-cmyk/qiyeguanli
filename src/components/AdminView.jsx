import React, { useState, useEffect } from 'react'
import { databaseService } from '../supabase'

export default function AdminView({ user, onSuccess }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [dashboardData, setDashboardData] = useState(null)
  const [users, setUsers] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  
  // 申请类型管理状态
  const [expenseCategories, setExpenseCategories] = useState({})
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingType, setEditingType] = useState(null)
  const [categoryForm, setCategoryForm] = useState({
    key: '',
    label: '',
    icon: ''
  })
  const [typeForm, setTypeForm] = useState({
    value: '',
    label: '',
    icon: ''
  })

  // 客户管理状态
  const [customers, setCustomers] = useState([])
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [customerForm, setCustomerForm] = useState({
    name: '',
    contact: '',
    age: '',
    occupation: '',
    investment_experience: '',
    budget_range: '',
    strategy_interest: '',
    risk_preference: '',
    source: '',
    notes: '',
    owner_id: ''
  })
  
  // 批量操作状态
  const [selectedCustomers, setSelectedCustomers] = useState([])
  const [showBatchActions, setShowBatchActions] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadPreview, setUploadPreview] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // 已删除客户管理
  const [showDeletedCustomers, setShowDeletedCustomers] = useState(false)
  const [deletedCustomers, setDeletedCustomers] = useState([])

  // 默认申请类型数据
  const defaultExpenseCategories = {
    '设备费用': {
      label: '设备费用',
      icon: '💻',
      types: [
        { value: '手机', label: '手机', icon: '📱' },
        { value: '电脑', label: '电脑', icon: '💻' },
        { value: '平板', label: '平板', icon: '📱' },
        { value: '打印机', label: '打印机', icon: '🖨️' },
        { value: '服务器', label: '服务器', icon: '🖥️' },
        { value: '网络设备', label: '网络设备', icon: '🌐' },
        { value: '其他设备', label: '其他设备', icon: '🔧' }
      ]
    },
    '物业费用': {
      label: '物业费用',
      icon: '🏢',
      types: [
        { value: '房租', label: '房租', icon: '🏠' },
        { value: '水电费', label: '水电费', icon: '⚡' },
        { value: '网络费', label: '网络费', icon: '🌐' },
        { value: '物业费', label: '物业费', icon: '🏢' },
        { value: '停车费', label: '停车费', icon: '🅿️' },
        { value: '清洁费', label: '清洁费', icon: '🧹' },
        { value: '其他物业', label: '其他物业', icon: '🏢' }
      ]
    },
    '差旅费用': {
      label: '差旅费用',
      icon: '✈️',
      types: [
        { value: '交通费', label: '交通费', icon: '🚗' },
        { value: '住宿费', label: '住宿费', icon: '🏨' },
        { value: '餐饮费', label: '餐饮费', icon: '🍽️' },
        { value: '机票费', label: '机票费', icon: '✈️' },
        { value: '火车票', label: '火车票', icon: '🚄' },
        { value: '出租车费', label: '出租车费', icon: '🚕' },
        { value: '其他差旅', label: '其他差旅', icon: '🎒' }
      ]
    },
    '办公费用': {
      label: '办公费用',
      icon: '📋',
      types: [
        { value: '文具用品', label: '文具用品', icon: '✏️' },
        { value: '办公软件', label: '办公软件', icon: '💿' },
        { value: '办公家具', label: '办公家具', icon: '🪑' },
        { value: '办公耗材', label: '办公耗材', icon: '📄' },
        { value: '快递费', label: '快递费', icon: '📦' },
        { value: '印刷费', label: '印刷费', icon: '🖨️' },
        { value: '其他办公', label: '其他办公', icon: '📋' }
      ]
    },
    '培训费用': {
      label: '培训费用',
      icon: '🎓',
      types: [
        { value: '课程费用', label: '课程费用', icon: '📚' },
        { value: '培训材料', label: '培训材料', icon: '📖' },
        { value: '考试费用', label: '考试费用', icon: '📝' },
        { value: '认证费用', label: '认证费用', icon: '🏆' },
        { value: '会议费用', label: '会议费用', icon: '👥' },
        { value: '研讨会', label: '研讨会', icon: '🎤' },
        { value: '其他培训', label: '其他培训', icon: '🎓' }
      ]
    },
    '营销费用': {
      label: '营销费用',
      icon: '📢',
      types: [
        { value: '广告费', label: '广告费', icon: '📺' },
        { value: '推广费', label: '推广费', icon: '📢' },
        { value: '活动费', label: '活动费', icon: '🎉' },
        { value: '礼品费', label: '礼品费', icon: '🎁' },
        { value: '宣传材料', label: '宣传材料', icon: '📄' },
        { value: '展会费用', label: '展会费用', icon: '🏢' },
        { value: '其他营销', label: '其他营销', icon: '📢' }
      ]
    }
  }
  
  // 员工表单状态
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'employee',
    team_id: '',
    supervisor_id: '',
    base_salary: ''
  })

  useEffect(() => {
    loadAdminData()
    loadExpenseCategories()
  }, [])

  // 加载申请类型数据
  const loadExpenseCategories = async () => {
    try {
      const categories = await databaseService.getExpenseCategories()
      setExpenseCategories(categories)
    } catch (error) {
      console.error('加载申请类型失败:', error)
      // 如果数据库加载失败，使用默认数据
      setExpenseCategories(defaultExpenseCategories)
    }
  }

  const loadAdminData = async () => {
    setLoading(true)
    try {
      const [dashboardData, usersData, teamsData, customersData, deletedCustomersData] = await Promise.all([
        databaseService.getDashboardData('admin', user.id),
        databaseService.getUsers(),
        databaseService.getTeams(),
        databaseService.getAllCustomers(),
        databaseService.getDeletedCustomers()
      ])
      
      setDashboardData(dashboardData)
      setUsers(usersData)
      setTeams(teamsData)
      setCustomers(customersData)
      setDeletedCustomers(deletedCustomersData)
    } catch (error) {
      console.error('加载管理员数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 打开模态框
  const openModal = (type, userData = null) => {
    setModalType(type)
    setEditingUser(userData)
    setShowModal(true)
    
    if (type === 'add' || type === 'edit') {
      if (userData) {
        setUserForm({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          role: userData.role || 'employee',
          team_id: userData.team_id || '',
          supervisor_id: userData.supervisor_id || '',
          base_salary: userData.base_salary || ''
        })
      } else {
        setUserForm({
          name: '',
          email: '',
          phone: '',
          role: 'employee',
          team_id: '',
          supervisor_id: '',
          base_salary: ''
        })
      }
    } else if (type === 'addCategory') {
      setCategoryForm({
        key: '',
        label: '',
        icon: ''
      })
      setEditingCategory(null)
    } else if (type === 'editCategory' && userData) {
      setCategoryForm({
        key: userData.key || '',
        label: userData.label || '',
        icon: userData.icon || ''
      })
      setEditingCategory(userData)
    } else if (type === 'addType') {
      setTypeForm({
        value: '',
        label: '',
        icon: ''
      })
      setEditingType(null)
    } else if (type === 'editType' && userData) {
      setTypeForm({
        value: userData.value || '',
        label: userData.label || '',
        icon: userData.icon || ''
      })
      setEditingType(userData)
    } else if (type === 'addCustomer' || type === 'editCustomer') {
      if (userData) { // userData在这里实际上是customerData
        setCustomerForm({
          name: userData.name || '',
          contact: userData.contact || '',
          age: userData.age || '',
          occupation: userData.occupation || '',
          investment_experience: userData.investment_experience || '',
          budget_range: userData.budget_range || '',
          strategy_interest: userData.strategy_interest || '',
          risk_preference: userData.risk_preference || '',
          source: userData.source || '',
          notes: userData.notes || '',
          owner_id: userData.owner_id || ''
        })
        // 编辑客户时需要设置editingCustomer
        if (type === 'editCustomer') {
          setEditingCustomer(userData)
        }
      } else {
        setCustomerForm({
          name: '',
          contact: '',
          age: '',
          occupation: '',
          investment_experience: '',
          budget_range: '',
          strategy_interest: '',
          risk_preference: '',
          source: '',
          notes: '',
          owner_id: ''
        })
      }
    }
  }

  // 申请类型管理功能
  const handleAddCategory = async () => {
    if (!categoryForm.key || !categoryForm.label || !categoryForm.icon) {
      alert('请填写完整的大类型信息')
      return
    }
    
    try {
      // 添加大类型到数据库
      await databaseService.addExpenseCategory({
        category_key: categoryForm.key,
        category_name: categoryForm.label,
        category_icon: categoryForm.icon,
        type_key: null,
        type_name: null,
        type_icon: null,
        sort_order: Object.keys(expenseCategories).length,
        is_active: true
      })

      // 重新加载申请类型数据
      await loadExpenseCategories()
      setShowModal(false)
      alert('大类型添加成功！')
    } catch (error) {
      console.error('添加大类型失败:', error)
      alert('添加失败，请重试')
    }
  }

  const handleEditCategory = () => {
    if (!categoryForm.key || !categoryForm.label || !categoryForm.icon) {
      alert('请填写完整的大类型信息')
      return
    }
    
    const newCategories = { ...expenseCategories }
    if (editingCategory && editingCategory.key !== categoryForm.key) {
      // 如果key改变了，需要删除旧的key
      delete newCategories[editingCategory.key]
    }
    newCategories[categoryForm.key] = {
      label: categoryForm.label,
      icon: categoryForm.icon,
      types: newCategories[categoryForm.key]?.types || []
    }
    setExpenseCategories(newCategories)
    setShowModal(false)
    alert('大类型修改成功！')
  }

  const handleDeleteCategory = (categoryKey) => {
    if (confirm(`确定要删除大类型"${categoryKey}"吗？这将同时删除该大类型下的所有小类型。`)) {
      const newCategories = { ...expenseCategories }
      delete newCategories[categoryKey]
      setExpenseCategories(newCategories)
      alert('大类型删除成功！')
    }
  }

  const handleAddType = async (categoryKey) => {
    if (!typeForm.value || !typeForm.label || !typeForm.icon) {
      alert('请填写完整的小类型信息')
      return
    }
    
    try {
      // 添加小类型到数据库
      await databaseService.addExpenseCategory({
        category_key: categoryKey,
        category_name: expenseCategories[categoryKey]?.label || categoryKey,
        category_icon: expenseCategories[categoryKey]?.icon || '📋',
        type_key: typeForm.value,
        type_name: typeForm.label,
        type_icon: typeForm.icon,
        sort_order: (expenseCategories[categoryKey]?.types?.length || 0),
        is_active: true
      })

      // 重新加载申请类型数据
      await loadExpenseCategories()
      setShowModal(false)
      alert('小类型添加成功！')
    } catch (error) {
      console.error('添加小类型失败:', error)
      alert('添加失败，请重试')
    }
  }

  const handleEditType = (categoryKey, oldValue) => {
    if (!typeForm.value || !typeForm.label || !typeForm.icon) {
      alert('请填写完整的小类型信息')
      return
    }
    
    const newCategories = { ...expenseCategories }
    const typeIndex = newCategories[categoryKey].types.findIndex(t => t.value === oldValue)
    if (typeIndex !== -1) {
      newCategories[categoryKey].types[typeIndex] = {
        value: typeForm.value,
        label: typeForm.label,
        icon: typeForm.icon
      }
    }
    
    setExpenseCategories(newCategories)
    setShowModal(false)
    alert('小类型修改成功！')
  }

  const handleDeleteType = (categoryKey, typeValue) => {
    if (confirm(`确定要删除小类型"${typeValue}"吗？`)) {
      const newCategories = { ...expenseCategories }
      newCategories[categoryKey].types = newCategories[categoryKey].types.filter(t => t.value !== typeValue)
      setExpenseCategories(newCategories)
      alert('小类型删除成功！')
    }
  }

  // 关闭模态框
  const closeModal = () => {
    setShowModal(false)
    setModalType('')
    setEditingUser(null)
    setEditingCustomer(null)
  }

  // 添加/编辑员工
  const handleSubmitUser = async (e) => {
    e.preventDefault()
    try {
      const userData = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
        role: userForm.role,
        team_id: userForm.team_id || null,
        supervisor_id: userForm.supervisor_id || null,
        base_salary: parseFloat(userForm.base_salary) || 0
      }

      if (modalType === 'add') {
        const result = await databaseService.addUser(userData)
        if (result) {
          alert('员工添加成功！')
          closeModal()
          loadAdminData()
          onSuccess?.()
        }
      } else if (modalType === 'edit') {
        if (!editingUser || !editingUser.id) {
          alert('编辑员工信息失败：员工数据无效')
          return
        }
        const result = await databaseService.updateUser(editingUser.id, userData)
        if (result) {
          alert('员工信息更新成功！')
          closeModal()
          loadAdminData()
          onSuccess?.()
        } else {
          alert('员工信息更新失败，请重试')
        }
      }
    } catch (error) {
      console.error('操作失败:', error)
      alert('操作失败，请重试')
    }
  }

  // 删除员工
  const handleDeleteUser = async (userId) => {
    if (window.confirm('确定要删除这个员工吗？此操作不可撤销。')) {
      try {
        const result = await databaseService.deleteUser(userId)
        if (result) {
          alert('员工删除成功！')
          loadAdminData()
          onSuccess?.()
        }
      } catch (error) {
        console.error('删除员工失败:', error)
        alert('删除失败，请重试')
      }
    }
  }

  // 添加/编辑客户
  const handleSubmitCustomer = async (e) => {
    e.preventDefault()
    try {
      const customerData = {
        name: customerForm.name,
        contact: customerForm.contact,
        age: customerForm.age || null,
        occupation: customerForm.occupation || null,
        investment_experience: customerForm.investment_experience || null,
        budget_range: customerForm.budget_range || null,
        strategy_interest: customerForm.strategy_interest || null,
        risk_preference: customerForm.risk_preference || null,
        source: customerForm.source || null,
        notes: customerForm.notes || null,
        owner_id: customerForm.owner_id,
        // 确保时间戳字段不为空字符串
        last_reply_time: null,
        last_group_read_time: null,
        joined_group: false,
        purchased_stocks: null,
        additional_contacts: [],
        is_deleted: false
      }

      if (modalType === 'addCustomer') {
        const result = await databaseService.addCustomer(customerData)
        if (result) {
          alert('客户添加成功！')
          closeModal()
          loadAdminData()
        }
      } else if (modalType === 'editCustomer') {
        if (!editingCustomer || !editingCustomer.id) {
          alert('编辑客户信息失败：客户数据无效')
          return
        }
        const result = await databaseService.updateCustomer(editingCustomer.id, customerData)
        if (result) {
          alert('客户信息更新成功！')
          closeModal()
          loadAdminData()
        }
      }
    } catch (error) {
      console.error('操作失败:', error)
      alert('操作失败，请重试')
    }
  }

  // 删除客户
  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('确定要删除这个客户吗？此操作不可撤销。')) {
      try {
        const result = await databaseService.deleteCustomer(customerId)
        if (result) {
          alert('客户删除成功！')
          loadAdminData()
        }
      } catch (error) {
        console.error('删除客户失败:', error)
        alert('删除失败，请重试')
      }
    }
  }

  // 批量删除客户
  const handleBatchDeleteCustomers = async () => {
    if (selectedCustomers.length === 0) {
      alert('请先选择要删除的客户')
      return
    }
    
    if (window.confirm(`确定要删除选中的 ${selectedCustomers.length} 个客户吗？此操作不可撤销。`)) {
      try {
        setUploadProgress(0)
        const total = selectedCustomers.length
        
        for (let i = 0; i < selectedCustomers.length; i++) {
          await databaseService.deleteCustomer(selectedCustomers[i])
          setUploadProgress(((i + 1) / total) * 100)
        }
        
        alert(`成功删除 ${selectedCustomers.length} 个客户！`)
        setSelectedCustomers([])
        setShowBatchActions(false)
        loadAdminData()
      } catch (error) {
        console.error('批量删除客户失败:', error)
        alert('批量删除失败，请重试')
      } finally {
        setUploadProgress(0)
      }
    }
  }

  // 物理删除客户
  const handlePermanentlyDeleteCustomer = async (customerId) => {
    if (window.confirm('确定要永久删除这个客户吗？此操作将彻底从数据库中删除，无法恢复！')) {
      try {
        const result = await databaseService.permanentlyDeleteCustomer(customerId)
        if (result) {
          alert('客户已永久删除！')
          loadAdminData()
        }
      } catch (error) {
        console.error('永久删除客户失败:', error)
        alert('永久删除失败，请重试')
      }
    }
  }

  // 恢复客户
  const handleRestoreCustomer = async (customerId) => {
    try {
      const result = await databaseService.updateCustomer(customerId, { is_deleted: false })
      if (result) {
        alert('客户已恢复！')
        loadAdminData()
      }
    } catch (error) {
      console.error('恢复客户失败:', error)
      alert('恢复失败，请重试')
    }
  }

  // 客户选择处理
  const handleCustomerSelect = (customerId, isSelected) => {
    if (isSelected) {
      setSelectedCustomers([...selectedCustomers, customerId])
    } else {
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId))
    }
  }

  // 全选/取消全选
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedCustomers(customers.map(c => c.id))
    } else {
      setSelectedCustomers([])
    }
  }

  // 批量上传客户
  const handleBatchUpload = async () => {
    if (!uploadFile) {
      alert('请先选择要上传的CSV文件')
      return
    }

    try {
      setUploadProgress(0)
      const result = await databaseService.batchUploadCustomers(uploadFile, user.id)
      
      if (result) {
        alert(`批量上传成功！共上传 ${result.uploadedCount} 个客户`)
        setUploadFile(null)
        setUploadPreview(null)
        loadAdminData()
      }
    } catch (error) {
      console.error('批量上传失败:', error)
      alert(`批量上传失败: ${error.message}`)
    } finally {
      setUploadProgress(0)
    }
  }

  // 文件选择处理
  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('请选择CSV格式的文件')
      return
    }

    setUploadFile(file)
    
    // 预览文件内容
    const reader = new FileReader()
    reader.onload = (e) => {
      const csvContent = e.target.result
      const lines = csvContent.split('\n').slice(0, 6) // 只显示前6行
      setUploadPreview(lines.join('\n'))
    }
    reader.readAsText(file, 'utf-8')
  }

  // 下载客户模板
  const downloadCustomerTemplate = () => {
    const csvContent = [
      '姓名,联系方式,年龄,职业,投资经验,资金规模,关注策略,风险偏好,客户来源,备注,归属员工邮箱',
      '张三,13800138001,35,企业主,5年,100-500万,短线交易,激进型,朋友介绍,关注科技股策略,employee1@example.com',
      '李四,13800138002,28,金融分析师,3年,50-100万,价值投资,稳健型,网站咨询,偏好蓝筹股策略,employee2@example.com',
      '王五,13800138003,45,退休高管,10年,500万以上,量化交易,平衡型,电话咨询,对AI选股感兴趣,employee1@example.com'
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = '客户资料批量上传模板.csv'
    link.click()
  }

  // 获取角色名称
  const getRoleName = (role) => {
    const roleNames = {
      'employee': '员工',
      'team_leader': '组长',
      'supervisor': '主管',
      'finance': '财务',
      'admin': '管理员'
    }
    return roleNames[role] || role
  }

  // 获取团队名称
  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId)
    return team ? team.name : '未分配'
  }

  // 获取上级名称
  const getSupervisorName = (supervisorId) => {
    const supervisor = users.find(u => u.id === supervisorId)
    return supervisor ? supervisor.name : '无'
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

  const renderOverview = () => (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">总员工数</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
            <div className="text-3xl opacity-80">👥</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">团队数量</p>
              <p className="text-2xl font-bold">{teams.length}</p>
            </div>
            <div className="text-3xl opacity-80">🏢</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">总申请数</p>
              <p className="text-2xl font-bold">{dashboardData?.stats?.totalExpenses || 0}</p>
            </div>
            <div className="text-3xl opacity-80">📝</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">客户总数</p>
              <p className="text-2xl font-bold">{dashboardData?.stats?.totalCustomers || 0}</p>
            </div>
            <div className="text-3xl opacity-80">👤</div>
          </div>
        </div>
      </div>

      {/* 角色分布 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">员工角色分布</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {['employee', 'team_leader', 'supervisor', 'finance', 'admin'].map(role => {
            const count = users.filter(u => u.role === role).length
            return (
              <div key={role} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600">{getRoleName(role)}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  // 构建部门结构
  const buildDepartmentStructure = () => {
    const departments = {}
    
    // 按部门分组用户
    users.forEach(user => {
      const teamId = user.team_id
      if (!departments[teamId]) {
        departments[teamId] = {
          team: teams.find(t => t.id === teamId),
          users: []
        }
      }
      departments[teamId].users.push(user)
    })
    
    // 为每个部门构建层级结构
    Object.keys(departments).forEach(teamId => {
      const dept = departments[teamId]
      const userMap = new Map()
      
      // 创建用户映射
      dept.users.forEach(user => {
        userMap.set(user.id, { ...user, subordinates: [] })
      })
      
      // 构建层级关系
      dept.users.forEach(user => {
        if (user.supervisor_id && userMap.has(user.supervisor_id)) {
          userMap.get(user.supervisor_id).subordinates.push(userMap.get(user.id))
        }
      })
      
      // 找到部门负责人（没有上级的用户）
      dept.leader = dept.users.find(user => !user.supervisor_id || !dept.users.find(u => u.id === user.supervisor_id))
      dept.orgTree = dept.leader ? [userMap.get(dept.leader.id)] : []
    })
    
    return departments
  }

  // 渲染部门卡片
  const renderDepartmentCard = (teamId, department) => {
    const { team, orgTree, users } = department
    
    return (
      <div key={teamId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              {team?.name?.charAt(0) || '?'}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{team?.name || '未知部门'}</h3>
              <p className="text-sm text-gray-500">{users.length} 名员工</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">部门负责人</div>
            <div className="font-medium text-gray-900">
              {department.leader ? department.leader.name : '未指定'}
            </div>
          </div>
        </div>
        
        {/* 部门组织架构图 */}
        <div className="space-y-3">
          {orgTree.length > 0 ? renderOrgChart(orgTree) : (
            <div className="text-center py-4 text-gray-500">
              <div className="text-2xl mb-2">👥</div>
              <p>暂无组织架构</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 渲染组织架构图（树形结构）
  const renderOrgChart = (nodes, level = 0) => {
    return nodes.map(node => (
      <div key={node.id} className="relative">
        {/* 连接线 */}
        {level > 0 && (
          <div className="absolute left-0 top-0 w-6 h-6 border-l-2 border-b-2 border-gray-300 rounded-bl-lg"></div>
        )}
        
        <div className={`flex items-center p-3 rounded-lg border ml-6 ${
          level === 0 ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200' :
          level === 1 ? 'bg-gray-50 border-gray-200' :
          'bg-white border-gray-100'
        }`}>
          <div className="flex items-center space-x-3 flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shadow-md ${
              node.role === 'admin' ? 'bg-red-500' :
              node.role === 'supervisor' ? 'bg-purple-500' :
              node.role === 'team_leader' ? 'bg-blue-500' :
              node.role === 'finance' ? 'bg-green-500' :
              'bg-gray-500'
            }`}>
              {node.name.charAt(0)}
            </div>
            <div>
              <div className="font-medium text-gray-900">{node.name}</div>
              <div className="text-sm text-gray-500">
                {getRoleName(node.role)} · ¥{node.base_salary || 0}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              node.subordinates.length > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}>
              {node.subordinates.length} 下级
            </span>
            <div className="flex space-x-1">
              <button
                onClick={() => openModal('edit', node)}
                className="text-blue-600 hover:text-blue-900 text-sm px-2 py-1 rounded hover:bg-blue-50"
              >
                编辑
              </button>
              <button
                onClick={() => handleDeleteUser(node.id)}
                className="text-red-600 hover:text-red-900 text-sm px-2 py-1 rounded hover:bg-red-50"
              >
                删除
              </button>
            </div>
          </div>
        </div>
        
        {/* 下级 */}
        {node.subordinates.length > 0 && (
          <div className="mt-2 ml-6">
            {renderOrgChart(node.subordinates, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  const renderEmployeeManagement = () => {
    const departments = buildDepartmentStructure()
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">员工管理</h3>
          <button
            onClick={() => openModal('add')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            + 添加员工
          </button>
        </div>

        {/* 角色图例 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">角色说明</h4>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span>管理员</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                <span>主管</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span>组长</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span>财务</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                <span>员工</span>
              </div>
            </div>
          </div>
        </div>

        {/* 部门组织架构 */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-gray-900">部门组织架构</h4>
          {Object.keys(departments).length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(departments).map(([teamId, department]) => 
                renderDepartmentCard(teamId, department)
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🏢</div>
              <p className="text-lg">暂无部门数据</p>
              <p className="text-sm">请先添加员工和团队信息</p>
            </div>
          )}
        </div>

        {/* 详细列表 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">员工详细信息</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">邮箱</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">电话</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">团队</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">上级</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">下级数量</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">薪资</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => {
                  const subordinateCount = users.filter(u => u.supervisor_id === user.id).length
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center space-x-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                            user.role === 'admin' ? 'bg-red-500' :
                            user.role === 'supervisor' ? 'bg-purple-500' :
                            user.role === 'team_leader' ? 'bg-blue-500' :
                            user.role === 'finance' ? 'bg-green-500' :
                            'bg-gray-500'
                          }`}>
                            {user.name.charAt(0)}
                          </div>
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'supervisor' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'team_leader' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'finance' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getRoleName(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getTeamName(user.team_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          {user.supervisor_id ? (
                            <>
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${
                                users.find(u => u.id === user.supervisor_id)?.role === 'admin' ? 'bg-red-500' :
                                users.find(u => u.id === user.supervisor_id)?.role === 'supervisor' ? 'bg-purple-500' :
                                users.find(u => u.id === user.supervisor_id)?.role === 'team_leader' ? 'bg-blue-500' :
                                'bg-gray-500'
                              }`}>
                                {getSupervisorName(user.supervisor_id).charAt(0)}
                              </div>
                              <span>{getSupervisorName(user.supervisor_id)}</span>
                            </>
                          ) : (
                            <span className="text-gray-400">无</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          subordinateCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {subordinateCount} 人
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ¥{user.base_salary || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openModal('edit', user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // 模态框组件
  const renderModal = () => {
    if (!showModal) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalType === 'add' && '添加员工'}
                {modalType === 'edit' && '编辑员工'}
                {modalType === 'addCategory' && '添加大类型'}
                {modalType === 'editCategory' && '编辑大类型'}
                {modalType === 'addType' && '添加小类型'}
                {modalType === 'editType' && '编辑小类型'}
                {modalType === 'addCustomer' && '添加客户'}
                {modalType === 'editCustomer' && '编辑客户'}
                {modalType === 'batchUpload' && '批量上传客户'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* 员工管理表单 */}
            {(modalType === 'add' || modalType === 'edit') && (
              <form onSubmit={handleSubmitUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">姓名 *</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入员工姓名"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入邮箱地址"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">电话</label>
                  <input
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入电话号码"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">基本薪资</label>
                  <input
                    type="number"
                    value={userForm.base_salary}
                    onChange={(e) => setUserForm({...userForm, base_salary: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入基本薪资"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">角色 *</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="employee">员工</option>
                    <option value="team_leader">组长</option>
                    <option value="supervisor">主管</option>
                    <option value="finance">财务</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">所属团队</label>
                  <select
                    value={userForm.team_id}
                    onChange={(e) => setUserForm({...userForm, team_id: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择团队</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">上级领导</label>
                <select
                  value={userForm.supervisor_id}
                  onChange={(e) => setUserForm({...userForm, supervisor_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择上级</option>
                  {users.filter(u => ['team_leader', 'supervisor', 'admin'].includes(u.role)).map(supervisor => (
                    <option key={supervisor.id} value={supervisor.id}>
                      {supervisor.name} ({getRoleName(supervisor.role)})
                    </option>
                  ))}
                </select>
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
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  {modalType === 'add' ? '添加员工' : '保存修改'}
                </button>
              </div>
            </form>
            )}

            {/* 大类型管理表单 */}
            {(modalType === 'addCategory' || modalType === 'editCategory') && (
              <form onSubmit={(e) => { e.preventDefault(); modalType === 'addCategory' ? handleAddCategory() : handleEditCategory(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">类型标识 *</label>
                  <input
                    type="text"
                    value={categoryForm.key}
                    onChange={(e) => setCategoryForm({...categoryForm, key: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：设备费用"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">显示名称 *</label>
                  <input
                    type="text"
                    value={categoryForm.label}
                    onChange={(e) => setCategoryForm({...categoryForm, label: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：设备费用"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">图标 *</label>
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({...categoryForm, icon: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：💻"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">请输入一个emoji图标</p>
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
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    {modalType === 'addCategory' ? '添加大类型' : '保存修改'}
                  </button>
                </div>
              </form>
            )}

            {/* 小类型管理表单 */}
            {(modalType === 'addType' || modalType === 'editType') && (
              <form onSubmit={(e) => { e.preventDefault(); modalType === 'addType' ? handleAddType(editingCategory.key) : handleEditType(editingCategory.key, editingType.value); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">所属大类型</label>
                  <input
                    type="text"
                    value={editingCategory?.key || ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">类型标识 *</label>
                  <input
                    type="text"
                    value={typeForm.value}
                    onChange={(e) => setTypeForm({...typeForm, value: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：手机"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">显示名称 *</label>
                  <input
                    type="text"
                    value={typeForm.label}
                    onChange={(e) => setTypeForm({...typeForm, label: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：手机"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">图标 *</label>
                  <input
                    type="text"
                    value={typeForm.icon}
                    onChange={(e) => setTypeForm({...typeForm, icon: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：📱"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">请输入一个emoji图标</p>
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
                    {modalType === 'addType' ? '添加小类型' : '保存修改'}
                  </button>
                </div>
              </form>
            )}

            {/* 客户管理表单 */}
            {(modalType === 'addCustomer' || modalType === 'editCustomer') && (
              <form onSubmit={handleSubmitCustomer} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">客户姓名 *</label>
                    <input
                      type="text"
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入手机号码"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">年龄</label>
                    <input
                      type="number"
                      value={customerForm.age}
                      onChange={(e) => setCustomerForm({...customerForm, age: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入年龄"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">职业</label>
                    <input
                      type="text"
                      value={customerForm.occupation}
                      onChange={(e) => setCustomerForm({...customerForm, occupation: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入职业"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">投资经验</label>
                    <select
                      value={customerForm.investment_experience}
                      onChange={(e) => setCustomerForm({...customerForm, investment_experience: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">请选择投资经验</option>
                      <option value="无经验">无经验</option>
                      <option value="1年以下">1年以下</option>
                      <option value="1-3年">1-3年</option>
                      <option value="3-5年">3-5年</option>
                      <option value="5-10年">5-10年</option>
                      <option value="10年以上">10年以上</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">资金规模</label>
                    <select
                      value={customerForm.budget_range}
                      onChange={(e) => setCustomerForm({...customerForm, budget_range: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">请选择资金规模</option>
                      <option value="5万以下">5万以下</option>
                      <option value="5-10万">5-10万</option>
                      <option value="10-50万">10-50万</option>
                      <option value="50-100万">50-100万</option>
                      <option value="100-500万">100-500万</option>
                      <option value="500万以上">500万以上</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">关注策略</label>
                    <select
                      value={customerForm.strategy_interest}
                      onChange={(e) => setCustomerForm({...customerForm, strategy_interest: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">请选择关注策略</option>
                      <option value="短线交易">短线交易</option>
                      <option value="价值投资">价值投资</option>
                      <option value="定投策略">定投策略</option>
                      <option value="趋势跟踪">趋势跟踪</option>
                      <option value="量化交易">量化交易</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">风险偏好</label>
                    <select
                      value={customerForm.risk_preference}
                      onChange={(e) => setCustomerForm({...customerForm, risk_preference: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">客户来源</label>
                    <select
                      value={customerForm.source}
                      onChange={(e) => setCustomerForm({...customerForm, source: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">请选择客户来源</option>
                      <option value="朋友介绍">朋友介绍</option>
                      <option value="网站咨询">网站咨询</option>
                      <option value="电话咨询">电话咨询</option>
                      <option value="广告推广">广告推广</option>
                      <option value="展会">展会</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">归属员工 *</label>
                    <select
                      value={customerForm.owner_id}
                      onChange={(e) => setCustomerForm({...customerForm, owner_id: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">请选择归属员工</option>
                      {users.filter(user => user.role === 'employee').map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">备注信息</label>
                  <textarea
                    value={customerForm.notes}
                    onChange={(e) => setCustomerForm({...customerForm, notes: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
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
                    {modalType === 'addCustomer' ? '添加客户' : '保存修改'}
                  </button>
                </div>
              </form>
            )}

            {/* 批量上传表单 */}
            {modalType === 'batchUpload' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">📋 批量上传说明</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• 请使用CSV格式文件，编码为UTF-8</li>
                    <li>• 第一行必须为标题行，包含所有必需字段</li>
                    <li>• 手机号码必须唯一，不能重复</li>
                    <li>• 归属员工邮箱必须存在于系统中</li>
                    <li>• 建议先下载模板文件，按模板格式填写</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择CSV文件 *</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {uploadPreview && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">文件预览</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">{uploadPreview}</pre>
                    </div>
                  </div>
                )}

                {uploadProgress > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">上传进度</label>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{Math.round(uploadProgress)}% 完成</p>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={downloadCustomerTemplate}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    下载模板
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchUpload}
                    disabled={!uploadFile || uploadProgress > 0}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {uploadProgress > 0 ? '上传中...' : '开始上传'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 申请类型管理界面
  const renderExpenseTypeManagement = () => {
    return (
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">申请类型管理</h3>
            <p className="text-sm text-gray-600">管理财务申请的大类型和小类型</p>
          </div>
          <button
            onClick={() => openModal('addCategory')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <span>➕</span>
            <span>添加大类型</span>
          </button>
        </div>

        {/* 申请类型列表 */}
        <div className="space-y-6">
          {Object.entries(expenseCategories).map(([categoryKey, category]) => (
            <div key={categoryKey} className="bg-white border border-gray-200 rounded-lg p-6">
              {/* 大类型标题和操作 */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{category.label}</h4>
                    <p className="text-sm text-gray-500">大类型</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openModal('editCategory', { key: categoryKey, label: category.label, icon: category.icon })}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors duration-200"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(categoryKey)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors duration-200"
                  >
                    删除
                  </button>
                </div>
              </div>

              {/* 小类型列表 */}
              <div className="ml-8">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="text-md font-medium text-gray-700">小类型列表</h5>
                  <button
                    onClick={() => {
                      setEditingCategory({ key: categoryKey })
                      openModal('addType')
                    }}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors duration-200"
                  >
                    ➕ 添加小类型
                  </button>
                </div>
                
                {category.types.length === 0 ? (
                  <p className="text-gray-500 text-sm">暂无小类型</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {category.types.map((type) => (
                      <div key={type.value} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors duration-200">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{type.icon}</span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{type.label}</p>
                              <p className="text-xs text-gray-500">{type.value}</p>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => openModal('editType', { value: type.value, label: type.label, icon: type.icon })}
                              className="p-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors duration-200"
                              title="编辑"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteType(categoryKey, type.value)}
                              className="p-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors duration-200"
                              title="删除"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 空状态 */}
        {Object.keys(expenseCategories).length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无申请类型</h3>
            <p className="text-gray-500 mb-4">请添加第一个申请大类型</p>
            <button
              onClick={() => openModal('addCategory')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              添加大类型
            </button>
          </div>
        )}
      </div>
    )
  }

  // 客户管理界面
  const renderCustomerManagement = () => {
    return (
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">客户管理</h3>
            <p className="text-sm text-gray-600">管理系统中的所有客户信息，包括分配、编辑、删除等操作</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowDeletedCustomers(!showDeletedCustomers)}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 ${
                showDeletedCustomers 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <span>🗑️</span>
              <span>{showDeletedCustomers ? '查看正常客户' : '查看已删除客户'}</span>
            </button>
            {!showDeletedCustomers && (
              <>
                <button
                  onClick={downloadCustomerTemplate}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <span>📥</span>
                  <span>下载模板</span>
                </button>
                <button
                  onClick={() => openModal('batchUpload')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <span>📤</span>
                  <span>批量上传</span>
                </button>
                <button
                  onClick={() => openModal('addCustomer')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>添加客户</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 批量操作栏 */}
        {selectedCustomers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  已选择 {selectedCustomers.length} 个客户
                </span>
                <button
                  onClick={() => setSelectedCustomers([])}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  取消选择
                </button>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleBatchDeleteCustomers}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <span>🗑️</span>
                  <span>批量删除</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 客户列表 */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.length === customers.length && customers.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    客户信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    联系方式
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    投资信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    归属员工
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    来源
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(showDeletedCustomers ? deletedCustomers : customers).map((customer) => (
                  <tr key={customer.id} className={`hover:bg-gray-50 ${selectedCustomers.includes(customer.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={(e) => handleCustomerSelect(customer.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {customer.name ? customer.name.charAt(0) : '客'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">
                            {customer.age ? `${customer.age}岁` : '年龄未填写'} 
                            {customer.occupation && ` · ${customer.occupation}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.contact}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.budget_range || '未填写'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {customer.investment_experience || '经验未填写'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.owner ? customer.owner.name : '未分配'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {customer.owner ? customer.owner.email : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {customer.source || '未知'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(customer.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {showDeletedCustomers ? (
                          <>
                            <button
                              onClick={() => handleRestoreCustomer(customer.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              恢复
                            </button>
                            <button
                              onClick={() => handlePermanentlyDeleteCustomer(customer.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              永久删除
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => openModal('editCustomer', customer)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              删除
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {(showDeletedCustomers ? deletedCustomers : customers).length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">
              {showDeletedCustomers ? '🗑️' : '👤'}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {showDeletedCustomers ? '暂无已删除客户' : '暂无客户数据'}
            </h3>
            <p className="text-gray-500 mb-4">
              {showDeletedCustomers ? '没有已删除的客户记录' : '系统中还没有客户记录'}
            </p>
            {!showDeletedCustomers && (
              <button
                onClick={() => openModal('addCustomer')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                添加第一个客户
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 标签页导航 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: '系统概览', icon: '📊' },
              { id: 'employees', name: '员工管理', icon: '👥' },
              { id: 'expenseTypes', name: '申请类型管理', icon: '📋' },
              { id: 'customers', name: '客户管理', icon: '👤' }
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
          {activeTab === 'employees' && renderEmployeeManagement()}
          {activeTab === 'expenseTypes' && renderExpenseTypeManagement()}
          {activeTab === 'customers' && renderCustomerManagement()}
        </div>
      </div>

      {/* 模态框 */}
      {renderModal()}
    </div>
  )
}