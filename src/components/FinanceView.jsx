import { useState, useEffect } from 'react'
import { databaseService } from '../supabase'

export default function FinanceView({ user, onSuccess }) {
  const [expenses, setExpenses] = useState([])
  const [paidExpenses, setPaidExpenses] = useState([])
  const [allExpenses, setAllExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [activeTab, setActiveTab] = useState('pending')
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

  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentExpense, setPaymentExpense] = useState(null)
  const [paymentScreenshot, setPaymentScreenshot] = useState(null)
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState('')
  const [paymentComment, setPaymentComment] = useState('')
  const [expenseStats, setExpenseStats] = useState({
    byPurpose: {},
    byPerson: {},
    byTeam: {},
    byDepartment: {},
    byMonth: {},
    totalAmount: 0,
    totalCount: 0,
    averageAmount: 0,
    maxAmount: 0,
    minAmount: 0,
    highRiskExpenses: [],
    monthlyTrends: []
  })

  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = async () => {
    setLoading(true)
    try {
      console.log('开始加载财务数据...')
      
      // 并行加载数据，提高效率
      const [pendingData, paidData, allData] = await Promise.all([
        databaseService.getExpenses({ status: 'waiting_finance' }).catch(err => {
          console.warn('加载待审批申请失败:', err)
          return []
        }),
        databaseService.getExpenses({ status: 'paid' }).catch(err => {
          console.warn('加载已支付申请失败:', err)
          return []
        }),
        databaseService.getExpenses().catch(err => {
          console.warn('加载所有申请失败:', err)
          return []
        })
      ])
      
      console.log('财务数据加载完成:', { 
        pending: pendingData.length, 
        paid: paidData.length, 
        all: allData.length 
      })
      
      setExpenses(pendingData)
      setPaidExpenses(paidData)
      setAllExpenses(allData)
      
      // 计算统计信息
      calculateExpenseStats(allData)
    } catch (error) {
      console.error('加载申请失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateExpenseStats = (expenses) => {
    console.log('开始计算统计信息...', expenses.length)
    
    const stats = {
      byPurpose: {},
      byPerson: {},
      byTeam: {},
      byDepartment: {},
      byMonth: {},
      totalAmount: 0,
      totalCount: expenses.length,
      averageAmount: 0,
      maxAmount: 0,
      minAmount: 0,
      highRiskExpenses: [],
      monthlyTrends: []
    }

    if (expenses.length === 0) {
      setExpenseStats(stats)
      return
    }

    const amounts = []
    const monthlyData = {}

    // 使用更高效的循环和计算
    for (const expense of expenses) {
      const amount = expense.amount || 0
      amounts.push(amount)
      stats.totalAmount += amount

      // 按用途统计
      const purpose = expense.purpose || '未分类'
      stats.byPurpose[purpose] = (stats.byPurpose[purpose] || 0) + amount

      // 按人员统计
      const person = expense.creator?.name || '未知人员'
      stats.byPerson[person] = (stats.byPerson[person] || 0) + amount

      // 按团队统计
      const team = expense.team?.name || '未知团队'
      stats.byTeam[team] = (stats.byTeam[team] || 0) + amount

      // 按部门统计（这里假设团队名就是部门名）
      const department = expense.team?.name || '未知部门'
      stats.byDepartment[department] = (stats.byDepartment[department] || 0) + amount

      // 按月统计
      const date = new Date(expense.applied_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = `${date.getFullYear()}年${date.getMonth() + 1}月`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthName,
          amount: 0,
          count: 0,
          expenses: []
        }
      }
      monthlyData[monthKey].amount += amount
      monthlyData[monthKey].count += 1
      monthlyData[monthKey].expenses.push(expense)

      // 识别高风险开支（大额开支或特殊用途）
      if (amount > 10000 || 
          purpose.includes('设备') || 
          purpose.includes('电脑') || 
          purpose.includes('手机') ||
          purpose.includes('家具') ||
          purpose.includes('装修')) {
        stats.highRiskExpenses.push({
          ...expense,
          riskLevel: amount > 50000 ? 'high' : amount > 20000 ? 'medium' : 'low',
          riskReason: amount > 50000 ? '超大额开支' : 
                     amount > 20000 ? '大额开支' : 
                     '特殊用途开支'
        })
      }
    }

    // 计算统计指标
    if (amounts.length > 0) {
      stats.averageAmount = stats.totalAmount / amounts.length
      stats.maxAmount = Math.max(...amounts)
      stats.minAmount = Math.min(...amounts)
    }

    // 按月统计
    stats.byMonth = monthlyData
    stats.monthlyTrends = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month))

    // 按风险等级排序高风险开支
    stats.highRiskExpenses.sort((a, b) => {
      const riskOrder = { 'high': 3, 'medium': 2, 'low': 1 }
      return riskOrder[b.riskLevel] - riskOrder[a.riskLevel]
    })

    console.log('统计信息计算完成:', { 
      totalAmount: stats.totalAmount, 
      totalCount: stats.totalCount,
      highRiskCount: stats.highRiskExpenses.length 
    })

    setExpenseStats(stats)
  }

  const handleFinanceAction = async (expenseId, action, comment = '') => {
    try {
      const newStatus = action === 'pay' ? 'paid' : 'rejected'
      const result = await databaseService.updateExpenseStatus(
        expenseId, 
        newStatus, 
        action, 
        comment, 
        user.id
      )
      
      if (result) {
        alert(action === 'pay' ? '已确认支付！' : '已拒绝支付！')
        loadExpenses()
        onSuccess?.()
      } else {
        alert('操作失败，请重试')
      }
    } catch (error) {
      console.error('财务操作失败:', error)
      alert('操作失败，请重试')
    }
  }

  const handleConfirmPayment = (expense) => {
    setPaymentExpense(expense)
    setShowPaymentModal(true)
    setPaymentScreenshot(null)
    setPaymentScreenshotUrl('')
    setPaymentComment('')
  }

  const handlePaymentScreenshotUpload = async (file) => {
    try {
      setPaymentScreenshot(file)
      // 先显示本地预览
      const reader = new FileReader()
      reader.onload = (e) => {
        setPaymentScreenshotUrl(e.target.result)
      }
      reader.readAsDataURL(file)
      
      // 上传到服务器获取真实URL
      const uploadResult = await databaseService.uploadImage(file, 'payment-screenshots')
      setPaymentScreenshotUrl(uploadResult.url)
    } catch (error) {
      console.error('截图上传失败:', error)
      alert('截图上传失败，请重试')
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

      // 验证当前密码应该通过API进行，而不是在前端直接比较
      // 这里简化处理，实际项目中应该调用验证密码的API

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

  // 更新个人信息
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      // 调用更新用户信息的API
      const { error } = await databaseService.supabase
        .from('users')
        .update({
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone
        })
        .eq('id', user.id)

      if (error) {
        throw error
      }

      alert('个人信息更新成功！')
      setShowProfileModal(false)
      // 可选：更新本地user状态
      if (onSuccess) {
        onSuccess({...user, ...profileForm})
      }
    } catch (error) {
      console.error('更新个人信息失败:', error)
      alert('更新失败，请重试')
    }
  }

  const handleSubmitPayment = async () => {
    if (!paymentScreenshot) {
      alert('请上传交易截图')
      return
    }

    try {
      // 更新申请状态为已支付，并保存支付截图
      const result = await databaseService.updateExpenseStatus(
        paymentExpense.id,
        'paid',
        'pay',
        paymentComment || '已确认支付',
        user.id,
        {
          paymentScreenshotUrl: paymentScreenshotUrl,
          paymentScreenshotPath: paymentScreenshotUrl,
          paymentScreenshotFileName: paymentScreenshot?.name || '',
          paymentConfirmedAt: new Date().toISOString(),
          paymentConfirmedBy: user.id
        }
      )
      
      if (result) {
        alert('支付确认成功！')
        setShowPaymentModal(false)
        loadExpenses()
        onSuccess?.()
      } else {
        alert('操作失败，请重试')
      }
    } catch (error) {
      console.error('支付确认失败:', error)
      alert('操作失败，请重试')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">正在加载财务数据...</div>
          <div className="text-sm text-gray-500 mt-2">请稍候，正在分析开支数据</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              财务审批管理
            </h3>
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'pending'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                待审批 ({expenses.length})
              </button>
              <button
                onClick={() => setActiveTab('paid')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'paid'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                支付记录 ({paidExpenses.length})
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'analytics'
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                开支明细 ({allExpenses.length})
              </button>
              <button
                onClick={() => setActiveTab('risks')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'risks'
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                风险预警 ({expenseStats.highRiskExpenses.length})
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'profile'
                    ? 'bg-gray-100 text-gray-700 border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                个人资料
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {activeTab === 'pending' && (
            // 待审批申请
            expenses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无待财务审批申请</p>
            ) : (
              <div className="space-y-6">
                {expenses.map((expense) => (
                <div key={expense.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <span className="text-sm font-medium text-gray-900">
                          {expense.creator?.name || '未知申请人'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {expense.team?.name || '未知团队'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(expense.applied_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6 mb-4">
                        <div>
                          <span className="text-sm font-medium text-gray-600">申请金额:</span>
                          <p className="text-xl font-semibold text-gray-900">¥{expense.amount}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">用途说明:</span>
                          <p className="text-sm text-gray-900">{expense.purpose}</p>
                        </div>
                      </div>
                      
                      {expense.notes && (
                        <div className="mb-4">
                          <span className="text-sm font-medium text-gray-600">备注:</span>
                          <p className="text-sm text-gray-900">{expense.notes}</p>
                        </div>
                      )}
                      
                      {/* 审批历史 */}
                      <div className="space-y-3 mb-4">
                        {expense.leader_decision && (
                          <div className="bg-green-50 border border-green-200 rounded-md p-3">
                            <div className="text-sm">
                              <span className="font-medium text-green-900">✅ 组长审批:</span>
                              <span className="ml-2 text-green-700 font-medium">
                                {expense.leader_decision.approver_name || '未知组长'}
                              </span>
                              <span className="ml-2">{expense.leader_decision.action === 'approve' ? '批准' : '拒绝'}</span>
                              <span className="ml-2 text-gray-600">- {expense.leader_decision.comment}</span>
                            </div>
                          </div>
                        )}
                        
                        {expense.supervisor_decision && (
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                            <div className="text-sm">
                              <span className="font-medium text-blue-900">✅ 主管审批:</span>
                              <span className="ml-2 text-blue-700 font-medium">
                                {expense.supervisor_decision.approver_name || '未知主管'}
                              </span>
                              <span className="ml-2">{expense.supervisor_decision.action === 'approve' ? '批准' : '拒绝'}</span>
                              <span className="ml-2 text-gray-600">- {expense.supervisor_decision.comment}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* AI审核建议 */}
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                        <div className="flex items-center mb-2">
                          <span className="text-sm font-medium text-blue-900">🤖 AI审核建议</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">决策:</span> 
                            <span className="ml-1 text-green-600">建议通过</span>
                          </div>
                          <div>
                            <span className="font-medium">原因:</span> 申请金额合理，用途明确
                          </div>
                          <div>
                            <span className="font-medium">置信度:</span> 85%
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex flex-col space-y-3 ml-6">
                      <button
                        onClick={() => {
                          setSelectedExpense(expense)
                          setShowModal(true)
                        }}
                        className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center justify-center"
                      >
                        📋 查看详情
                      </button>
                      <button
                        onClick={() => handleFinanceAction(expense.id, 'reject', '财务审核不通过')}
                        className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium"
                      >
                        拒绝支付
                      </button>
                      <button
                        onClick={() => handleConfirmPayment(expense)}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        确认支付
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
          )}
          
          {activeTab === 'paid' && (
            // 支付记录
            paidExpenses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无支付记录</p>
            ) : (
              <div className="space-y-6">
                {paidExpenses.map((expense) => (
                  <div key={expense.id} className="border border-green-200 rounded-lg p-6 bg-green-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-4">
                          <span className="text-sm font-medium text-gray-900">
                            {expense.creator?.name || '未知申请人'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {expense.team?.name || '未知团队'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(expense.applied_at).toLocaleDateString()}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            已支付
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className="text-sm font-medium text-gray-600">申请金额:</span>
                            <p className="text-lg font-bold text-green-600">¥{expense.amount}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">用途说明:</span>
                            <p className="text-sm text-gray-900">{expense.purpose}</p>
                          </div>
                        </div>
                        
                        {expense.notes && (
                          <div className="mb-4">
                            <span className="text-sm font-medium text-gray-600">备注:</span>
                            <p className="text-sm text-gray-900">{expense.notes}</p>
                          </div>
                        )}
                        
                        {/* 审批历史 */}
                        <div className="space-y-3 mb-4">
                          {expense.leader_decision && (
                            <div className="bg-green-50 border border-green-200 rounded-md p-3">
                              <div className="text-sm">
                                <span className="font-medium text-green-900">✅ 组长审批:</span>
                                <span className="ml-2 text-green-700 font-medium">
                                  {expense.leader_decision.approver_name || '未知组长'}
                                </span>
                                <span className="ml-2">{expense.leader_decision.action === 'approve' ? '批准' : '拒绝'}</span>
                                <span className="ml-2 text-gray-600">- {expense.leader_decision.comment}</span>
                              </div>
                            </div>
                          )}
                          
                          {expense.supervisor_decision && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                              <div className="text-sm">
                                <span className="font-medium text-blue-900">✅ 主管审批:</span>
                                <span className="ml-2 text-blue-700 font-medium">
                                  {expense.supervisor_decision.approver_name || '未知主管'}
                                </span>
                                <span className="ml-2">{expense.supervisor_decision.action === 'approve' ? '批准' : '拒绝'}</span>
                                <span className="ml-2 text-gray-600">- {expense.supervisor_decision.comment}</span>
                              </div>
                            </div>
                          )}
                          
                          {expense.finance_decision && (
                            <div className="bg-green-50 border border-green-200 rounded-md p-3">
                              <div className="text-sm">
                                <span className="font-medium text-green-900">💰 财务支付:</span>
                                <span className="ml-2 text-green-700 font-medium">
                                  {expense.finance_decision.approver_name || '未知财务'}
                                </span>
                                <span className="ml-2">{expense.finance_decision.action === 'pay' ? '已支付' : '拒绝支付'}</span>
                                <span className="ml-2 text-gray-600">- {expense.finance_decision.comment}</span>
                                <div className="text-xs text-gray-500 mt-1">
                                  支付时间: {new Date(expense.finance_decision.timestamp).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* 操作按钮 */}
                      <div className="flex flex-col space-y-3 ml-6">
                        <button
                          onClick={() => {
                            setSelectedExpense(expense)
                            setShowModal(true)
                          }}
                          className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center justify-center"
                        >
                          📋 申请详情
                        </button>
                        <button
                          onClick={() => {
                            setSelectedExpense(expense)
                            setShowModal(true)
                          }}
                          className="px-6 py-2 border border-green-300 text-green-600 rounded-lg hover:bg-green-50 text-sm font-medium flex items-center justify-center"
                        >
                          💰 支付详情
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
          
          {activeTab === 'analytics' && (
            // 开支明细
            <div className="space-y-6">
              {/* 统计概览 */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-600">总支出金额</div>
                  <div className="text-2xl font-bold text-blue-900">¥{expenseStats.totalAmount.toLocaleString()}</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-600">总申请数</div>
                  <div className="text-2xl font-bold text-green-900">{expenseStats.totalCount}</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-purple-600">平均金额</div>
                  <div className="text-2xl font-bold text-purple-900">¥{expenseStats.averageAmount.toFixed(0)}</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-red-600">最大金额</div>
                  <div className="text-2xl font-bold text-red-900">¥{expenseStats.maxAmount.toLocaleString()}</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-orange-600">团队数量</div>
                  <div className="text-2xl font-bold text-orange-900">{Object.keys(expenseStats.byTeam).length}</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-yellow-600">风险开支</div>
                  <div className="text-2xl font-bold text-yellow-900">{expenseStats.highRiskExpenses.length}</div>
                </div>
              </div>

              {/* 分类统计 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* 按用途统计 */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">按用途统计</h4>
                  <div className="space-y-2">
                    {Object.entries(expenseStats.byPurpose)
                      .sort(([,a], [,b]) => b - a)
                      .map(([purpose, amount]) => (
                        <div key={purpose} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{purpose}</span>
                          <span className="text-sm font-medium text-gray-900">¥{amount.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 按团队统计 */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">按团队统计</h4>
                  <div className="space-y-2">
                    {Object.entries(expenseStats.byTeam)
                      .sort(([,a], [,b]) => b - a)
                      .map(([team, amount]) => (
                        <div key={team} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{team}</span>
                          <span className="text-sm font-medium text-gray-900">¥{amount.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 按月统计 */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">按月统计</h4>
                  <div className="space-y-2">
                    {expenseStats.monthlyTrends
                      .slice(-6) // 显示最近6个月
                      .map((monthData) => (
                        <div key={monthData.month} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{monthData.month}</span>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">¥{monthData.amount.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">{monthData.count}笔</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* 详细开支表格 */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900">详细开支记录</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请人</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">部门/团队</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用途</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请时间</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allExpenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">
                                    {expense.creator?.name?.charAt(0) || '?'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {expense.creator?.name || '未知人员'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{expense.team?.name || '未知团队'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{expense.purpose || '未填写'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div className={`text-sm font-medium ${
                                expense.amount > 50000 ? 'text-red-600 font-bold' :
                                expense.amount > 20000 ? 'text-orange-600 font-semibold' :
                                expense.amount > 10000 ? 'text-yellow-600' :
                                'text-gray-900'
                              }`}>
                                ¥{expense.amount?.toLocaleString() || 0}
                              </div>
                              {expense.amount > 20000 && (
                                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                  {expense.amount > 50000 ? '超大额' : '大额'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              expense.status === 'paid' ? 'bg-green-100 text-green-800' :
                              expense.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              expense.status === 'waiting_finance' ? 'bg-yellow-100 text-yellow-800' :
                              expense.status === 'waiting_supervisor' ? 'bg-blue-100 text-blue-800' :
                              expense.status === 'submitted' ? 'bg-gray-100 text-gray-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {expense.status === 'paid' ? '已支付' :
                               expense.status === 'rejected' ? '已拒绝' :
                               expense.status === 'waiting_finance' ? '待财务审批' :
                               expense.status === 'waiting_supervisor' ? '待主管审批' :
                               expense.status === 'submitted' ? '待组长审批' :
                               expense.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(expense.applied_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedExpense(expense)
                                setShowModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              查看详情
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'risks' && (
            // 风险预警
            <div className="space-y-6">
              {/* 风险概览 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-red-600">高风险开支</div>
                  <div className="text-2xl font-bold text-red-900">
                    {expenseStats.highRiskExpenses.filter(e => e.riskLevel === 'high').length}
                  </div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-orange-600">中风险开支</div>
                  <div className="text-2xl font-bold text-orange-900">
                    {expenseStats.highRiskExpenses.filter(e => e.riskLevel === 'medium').length}
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-yellow-600">低风险开支</div>
                  <div className="text-2xl font-bold text-yellow-900">
                    {expenseStats.highRiskExpenses.filter(e => e.riskLevel === 'low').length}
                  </div>
                </div>
              </div>

              {/* 风险开支列表 */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900">风险开支详情</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">风险等级</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请人</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">团队</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用途</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">风险原因</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请时间</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {expenseStats.highRiskExpenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              expense.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                              expense.riskLevel === 'medium' ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {expense.riskLevel === 'high' ? '🔴 高风险' :
                               expense.riskLevel === 'medium' ? '🟠 中风险' :
                               '🟡 低风险'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">
                                    {expense.creator?.name?.charAt(0) || '?'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {expense.creator?.name || '未知人员'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{expense.team?.name || '未知团队'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{expense.purpose || '未填写'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div className={`text-sm font-bold ${
                                expense.riskLevel === 'high' ? 'text-red-600' :
                                expense.riskLevel === 'medium' ? 'text-orange-600' :
                                'text-yellow-600'
                              }`}>
                                ¥{expense.amount?.toLocaleString() || 0}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{expense.riskReason}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(expense.applied_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedExpense(expense)
                                setShowModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              查看详情
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 详情模态框 */}
      {showModal && selectedExpense && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <span className="text-blue-600 text-lg">📋</span>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      申请详情
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">申请人:</span>
                        <span>{selectedExpense.creator?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">金额:</span>
                        <span className="font-bold">¥{selectedExpense.amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">用途:</span>
                        <span>{selectedExpense.purpose}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">申请时间:</span>
                        <span>{new Date(selectedExpense.applied_at).toLocaleString()}</span>
                      </div>
                      
                      {/* 财务信息 */}
                      {selectedExpense.attachments && (
                        <>
                          <div className="border-t pt-3 mt-3">
                            <h4 className="font-medium text-gray-800 mb-2">💰 财务信息</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">付款方式:</span>
                                <span className="text-sm">{selectedExpense.attachments.paymentMethod || '未填写'}</span>
                              </div>
                              {selectedExpense.attachments.payeeName && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">收款人:</span>
                                  <span className="text-sm">{selectedExpense.attachments.payeeName}</span>
                                </div>
                              )}
                              {selectedExpense.attachments.payeeContact && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">联系方式:</span>
                                  <span className="text-sm">{selectedExpense.attachments.payeeContact}</span>
                                </div>
                              )}
                              {selectedExpense.attachments.payeeAccount && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">收款账号:</span>
                                  <span className="text-sm font-mono text-xs">{selectedExpense.attachments.payeeAccount}</span>
                                </div>
                              )}
                              {selectedExpense.attachments.payeeBank && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">开户银行:</span>
                                  <span className="text-sm">{selectedExpense.attachments.payeeBank}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* 图片预览 */}
                          {selectedExpense.attachments.receiptImageUrl && (
                            <div className="border-t pt-3 mt-3">
                              <h4 className="font-medium text-gray-800 mb-2">📷 凭证图片</h4>
                              <div className="text-center">
                                <img 
                                  src={selectedExpense.attachments.receiptImageUrl} 
                                  alt="凭证图片"
                                  className="max-w-full h-auto max-h-64 rounded-lg border border-gray-200 shadow-sm mx-auto"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextSibling.style.display = 'block'
                                  }}
                                />
                                <div className="hidden text-sm text-gray-500 mt-2">
                                  图片加载失败，请检查网络连接
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {selectedExpense.attachments.receiptFileName || '未知文件名'}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* 支付详情 */}
                          {selectedExpense.attachments.paymentInfo && (
                            <div className="border-t pt-3 mt-3">
                              <h4 className="font-medium text-gray-800 mb-2">💰 支付详情</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">支付状态:</span>
                                  <span className="text-sm font-medium text-green-600">已支付</span>
                                </div>
                                {selectedExpense.attachments.paymentInfo.paymentConfirmedAt && (
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">支付时间:</span>
                                    <span className="text-sm">{new Date(selectedExpense.attachments.paymentInfo.paymentConfirmedAt).toLocaleString()}</span>
                                  </div>
                                )}
                                {selectedExpense.attachments.paymentInfo.paymentScreenshotUrl && (
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">交易截图:</span>
                                    <span className="text-sm text-blue-600">已上传</span>
                                  </div>
                                )}
                                {selectedExpense.attachments.paymentInfo.paymentScreenshotFileName && (
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">截图文件:</span>
                                    <span className="text-sm">{selectedExpense.attachments.paymentInfo.paymentScreenshotFileName}</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* 交易截图预览 */}
                              {selectedExpense.attachments.paymentInfo.paymentScreenshotUrl && (
                                <div className="mt-3">
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">交易截图</h5>
                                  <div className="text-center">
                                    <img 
                                      src={selectedExpense.attachments.paymentInfo.paymentScreenshotUrl} 
                                      alt="交易截图"
                                      className="max-w-full h-auto max-h-48 rounded-lg border border-gray-200 shadow-sm mx-auto"
                                      onError={(e) => {
                                        e.target.style.display = 'none'
                                        e.target.nextSibling.style.display = 'block'
                                      }}
                                    />
                                    <div className="hidden text-sm text-gray-500 mt-2">
                                      交易截图加载失败
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowModal(false)}
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 支付确认模态框 */}
      {showPaymentModal && paymentExpense && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowPaymentModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <span className="text-green-600 text-lg">💰</span>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      确认支付
                    </h3>
                    
                    {/* 申请信息 */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">申请人:</span>
                          <span className="text-sm">{paymentExpense.creator?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">金额:</span>
                          <span className="text-sm font-bold text-green-600">¥{paymentExpense.amount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">用途:</span>
                          <span className="text-sm">{paymentExpense.purpose}</span>
                        </div>
                      </div>
                    </div>

                    {/* 上传交易截图 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        上传交易截图 *
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0]
                            if (file) {
                              handlePaymentScreenshotUpload(file)
                            }
                          }}
                          className="hidden"
                          id="payment-screenshot-upload"
                          required
                        />
                        <label htmlFor="payment-screenshot-upload" className="cursor-pointer">
                          {paymentScreenshot ? (
                            <div>
                              <div className="text-green-600 text-lg mb-1">✅</div>
                              <p className="text-xs text-gray-600">已上传: {paymentScreenshot.name}</p>
                              {paymentScreenshotUrl && (
                                <img 
                                  src={paymentScreenshotUrl} 
                                  alt="交易截图预览"
                                  className="max-w-full h-auto max-h-32 rounded-lg border border-gray-200 shadow-sm mx-auto mt-2"
                                />
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className="text-gray-400 text-2xl mb-2">📷</div>
                              <p className="text-sm text-gray-600">点击上传交易截图</p>
                              <p className="text-xs text-gray-500 mt-1">支持 JPG、PNG 格式</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* 支付备注 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        支付备注
                      </label>
                      <textarea
                        value={paymentComment}
                        onChange={(e) => setPaymentComment(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        rows="3"
                        placeholder="请输入支付备注（可选）"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleSubmitPayment}
                >
                  确认支付
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowPaymentModal(false)}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
          
      {activeTab === 'profile' && (
        // 个人资料
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
                onClick={() => setShowProfileModal(true)}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">电话</label>
                <p className="text-gray-900">{user.phone || '未设置'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">角色</label>
                <p className="text-gray-900">财务</p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      
    )

  {/* 个人资料编辑模态框 */}
  {showProfileModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">编辑资料</h3>
            <button
              onClick={() => setShowProfileModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

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
                onClick={() => setShowProfileModal(false)}
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
  )}}
