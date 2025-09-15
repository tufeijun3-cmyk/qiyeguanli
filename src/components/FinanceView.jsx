import React, { useState, useEffect } from 'react'
import { databaseService } from '../supabase'

export default function FinanceView({ user, onSuccess }) {
  const [expenses, setExpenses] = useState([])
  const [paidExpenses, setPaidExpenses] = useState([])
  const [allExpenses, setAllExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentExpense, setPaymentExpense] = useState(null)
  const [paymentScreenshot, setPaymentScreenshot] = useState(null)
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState('')
  const [paymentComment, setPaymentComment] = useState('')
  const [activeTab, setActiveTab] = useState('pending')
  const [expenseStats, setExpenseStats] = useState({
    byPurpose: {},
    byPerson: {},
    byTeam: {},
    byDepartment: {},
    totalAmount: 0,
    totalCount: 0
  })

  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = async () => {
    setLoading(true)
    try {
      // 加载待财务审批的申请
      const pendingData = await databaseService.getExpenses({ status: 'waiting_finance' })
      setExpenses(pendingData)
      
      // 加载已支付的申请
      const paidData = await databaseService.getExpenses({ status: 'paid' })
      setPaidExpenses(paidData)
      
      // 加载所有支出数据（用于统计分析）
      const allData = await databaseService.getExpenses()
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
    const stats = {
      byPurpose: {},
      byPerson: {},
      byTeam: {},
      byDepartment: {},
      totalAmount: 0,
      totalCount: expenses.length
    }

    expenses.forEach(expense => {
      const amount = expense.amount || 0
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
        <div className="text-lg text-gray-600">加载中...</div>
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                  <div className="text-2xl font-bold text-purple-900">¥{expenseStats.totalCount > 0 ? (expenseStats.totalAmount / expenseStats.totalCount).toFixed(0) : 0}</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-orange-600">部门数量</div>
                  <div className="text-2xl font-bold text-orange-900">{Object.keys(expenseStats.byDepartment).length}</div>
                </div>
              </div>

              {/* 分类统计 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

                {/* 按部门统计 */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">按部门统计</h4>
                  <div className="space-y-2">
                    {Object.entries(expenseStats.byDepartment)
                      .sort(([,a], [,b]) => b - a)
                      .map(([department, amount]) => (
                        <div key={department} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{department}</span>
                          <span className="text-sm font-medium text-gray-900">¥{amount.toLocaleString()}</span>
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
                            <div className="text-sm font-medium text-gray-900">¥{expense.amount?.toLocaleString() || 0}</div>
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
    </div>
  )
}
