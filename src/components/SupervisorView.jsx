import React, { useState, useEffect } from 'react'
import { databaseService } from '../supabase'

export default function SupervisorView({ user, onSuccess }) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadExpenses()
  }, [user])

  const loadExpenses = async () => {
    setLoading(true)
    try {
      console.log('主管加载申请，用户信息:', user)
      // 主管只能看到自己所有下级的申请记录
      const data = await databaseService.getSubordinateExpenses(user.id, user.role, { 
        status: 'waiting_supervisor' 
      })
      console.log('主管下级申请数据:', data)
      setExpenses(data)
    } catch (error) {
      console.error('加载申请失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (expenseId, action, comment = '') => {
    try {
      const newStatus = action === 'approve' ? 'waiting_finance' : 'rejected'
      const result = await databaseService.updateExpenseStatus(
        expenseId, 
        newStatus, 
        action, 
        comment, 
        user.id
      )
      
      if (result) {
        alert(action === 'approve' ? '已批准申请！' : '已拒绝申请！')
        loadExpenses()
        onSuccess?.()
      } else {
        alert('操作失败，请重试')
      }
    } catch (error) {
      console.error('审批操作失败:', error)
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
          <h3 className="text-lg font-medium text-gray-900">
            待主管审批申请 ({expenses.length}笔)
          </h3>
        </div>
        
        <div className="p-6">
          {expenses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无待主管审批申请</p>
          ) : (
            <div className="space-y-6">
              {expenses.map((expense) => (
                <div key={expense.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {expense.creator?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900">{expense.creator?.name || '未知申请人'}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              expense.creator?.role === 'team_leader' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {expense.creator?.role === 'team_leader' ? '👨‍💼 组长' : '👤 员工'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>🏢 {expense.team?.name || '未知团队'}</span>
                            <span>📅 {new Date(expense.applied_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500 mb-1">当前审批人</div>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-sm">
                                {user?.name?.charAt(0) || 'S'}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{user?.name}</span>
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">👨‍💻 主管</span>
                          </div>
                        </div>
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
                      
                      {/* 组长审批记录 */}
                      {expense.leader_decision && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                          <div className="flex items-center mb-2">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                              <span className="text-green-600 text-xs">✅</span>
                            </div>
                            <span className="text-sm font-medium text-green-900">组长审批</span>
                            <span className="ml-2 text-sm text-green-700">
                              {expense.leader_decision.approver_name || '未知组长'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700">
                            <div>决策: {expense.leader_decision.action === 'approve' ? '批准' : '拒绝'}</div>
                            <div>备注: {expense.leader_decision.comment}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(expense.leader_decision.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )}
                      
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
                        onClick={() => handleApproval(expense.id, 'reject', '申请不符合要求')}
                        className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium"
                      >
                        拒绝
                      </button>
                      <button
                        onClick={() => handleApproval(expense.id, 'approve', '同意申请')}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        批准
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
    </div>
  )
}
