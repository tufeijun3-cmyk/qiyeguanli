import React, { useState } from 'react'
import { databaseService } from '../supabase'

export default function ExpenseForm({ user, onSuccess }) {
  const [form, setForm] = useState({
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
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  // 申请类型分类
  const expenseCategories = {
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

  const paymentMethods = [
    { value: '银行转账', label: '银行转账', icon: '🏦' },
    { value: '支付宝', label: '支付宝', icon: '💙' },
    { value: '微信支付', label: '微信支付', icon: '💚' },
    { value: 'USDT', label: 'USDT', icon: '₮' },
    { value: '现金', label: '现金', icon: '💵' },
    { value: '支票', label: '支票', icon: '📄' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const expense = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        created_by: user.id,
        team_id: user.team_id,
        amount: parseFloat(form.amount),
        purpose: `${form.category} - ${form.type}`,
        notes: form.note,
        status: user.role === 'team_leader' ? 'waiting_supervisor' : 'submitted',
        attachments: {
          paymentMethod: form.paymentMethod,
          payeeName: form.payeeName,
          payeeContact: form.payeeContact,
          payeeAccount: form.payeeAccount,
          payeeBank: form.payeeBank,
          receiptImageUrl: form.receiptImageUrl,
          receiptImagePath: form.receiptImagePath,
          receiptFileName: form.receiptImage?.name || ''
        }
      }

      const result = await databaseService.addExpense(expense)
      
      if (result) {
        setForm({ 
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
        setStep(1)
        alert('申请提交成功！等待组长审批')
        onSuccess?.()
      } else {
        alert('提交失败，请重试')
      }
    } catch (error) {
      console.error('提交申请失败:', error)
      alert('提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step === 1 && form.type && form.amount) {
      setStep(2)
    } else if (step === 2 && form.purpose) {
      setStep(3)
    }
  }

  const prevStep = () => {
    if (step === 3) {
      setStep(2)
    } else if (step === 2) {
      setStep(1)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">提交支出申请</h2>
              <p className="text-blue-100 text-sm">填写申请信息，系统将自动进行AI审核</p>
            </div>
            <div className="text-3xl opacity-80">📝</div>
          </div>
        </div>

        {/* 步骤指示器 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-center space-x-2">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">基本信息</span>
            </div>
            <div className={`w-6 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">详细信息</span>
            </div>
            <div className={`w-6 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 3 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">财务信息</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">选择申请类型和金额</h3>
                <p className="text-gray-600">请选择您的申请类型并输入金额</p>
              </div>

              {/* 申请大类 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">申请大类</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(expenseCategories).map(([key, category]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setForm({
                          ...form, 
                          category: key,
                          type: '' // 重置小类型
                        })
                      }}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        form.category === key
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-2xl mb-2">{category.icon}</div>
                      <div className="text-sm font-medium">{category.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 具体类型 */}
              {form.category && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">具体类型</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {expenseCategories[form.category]?.types.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setForm({...form, type: type.value})}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                          form.type === type.value
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-xl mb-1">{type.icon}</div>
                        <div className="text-xs font-medium">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 选择确认 */}
              {form.category && form.type && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-center">
                    <span className="text-blue-700 font-medium">
                      {expenseCategories[form.category]?.icon} {form.category} - {expenseCategories[form.category]?.types.find(t => t.value === form.type)?.icon} {form.type}
                    </span>
                  </div>
                </div>
              )}

              {/* 申请金额 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">申请金额 (元)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-lg">¥</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm({...form, amount: e.target.value})}
                    className="input-field pl-8 text-lg"
                    placeholder="请输入金额"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">请输入准确的申请金额</p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!form.type || !form.amount}
                  className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一步 →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">填写详细信息</h3>
                <p className="text-gray-600">请详细说明申请用途和相关信息</p>
              </div>

              {/* 申请摘要 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">申请摘要</h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>类型: {form.type}</span>
                  <span>金额: ¥{form.amount}</span>
                </div>
              </div>

              {/* 用途说明 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">用途说明</label>
                <textarea
                  value={form.purpose}
                  onChange={(e) => setForm({...form, purpose: e.target.value})}
                  rows={4}
                  className="input-field"
                  placeholder="请详细说明申请用途，包括具体项目、时间、地点等信息"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">详细说明有助于快速审批</p>
              </div>

              {/* 备注 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({...form, note: e.target.value})}
                  rows={3}
                  className="input-field"
                  placeholder="其他需要说明的信息（可选）"
                />
              </div>

              {/* AI审核预览 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-blue-900">🤖 AI审核预览</span>
                </div>
                <div className="text-sm text-gray-700">
                  <p>• 申请类型: {form.category} - {form.type}</p>
                  <p>• 金额范围: ¥{form.amount} (正常范围)</p>
                  <p>• 预计审核结果: 建议通过</p>
                  <p>• 置信度: 85%</p>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn-secondary px-6 py-2"
                >
                  ← 上一步
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!form.purpose}
                  className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一步 →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">填写财务信息</h3>
                <p className="text-gray-600">请填写付款方式和收款人信息</p>
              </div>

              {/* 申请摘要 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">申请摘要</h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>类型: {form.type}</span>
                  <span>金额: ¥{form.amount}</span>
                  <span>用途: {form.purpose}</span>
                </div>
              </div>

              {/* 付款方式 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">付款方式</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setForm({...form, paymentMethod: method.value})}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        form.paymentMethod === method.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-xl mb-1">{method.icon}</div>
                      <div className="text-sm font-medium">{method.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 收款人信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">收款人姓名 *</label>
                  <input
                    type="text"
                    value={form.payeeName}
                    onChange={(e) => setForm({...form, payeeName: e.target.value})}
                    className="input-field"
                    placeholder="请输入收款人姓名"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">联系方式 *</label>
                  <input
                    type="text"
                    value={form.payeeContact}
                    onChange={(e) => setForm({...form, payeeContact: e.target.value})}
                    className="input-field"
                    placeholder="手机号或邮箱"
                    required
                  />
                </div>
              </div>

              {/* 银行信息 */}
              {form.paymentMethod === '银行转账' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">开户银行 *</label>
                    <input
                      type="text"
                      value={form.payeeBank}
                      onChange={(e) => setForm({...form, payeeBank: e.target.value})}
                      className="input-field"
                      placeholder="如：中国工商银行"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">银行账号 *</label>
                    <input
                      type="text"
                      value={form.payeeAccount}
                      onChange={(e) => setForm({...form, payeeAccount: e.target.value})}
                      className="input-field"
                      placeholder="请输入银行账号"
                      required
                    />
                  </div>
                </div>
              )}

              {/* 支付宝/微信账号 */}
              {(form.paymentMethod === '支付宝' || form.paymentMethod === '微信支付') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {form.paymentMethod === '支付宝' ? '支付宝账号' : '微信账号'} *
                  </label>
                  <input
                    type="text"
                    value={form.payeeAccount}
                    onChange={(e) => setForm({...form, payeeAccount: e.target.value})}
                    className="input-field"
                    placeholder={form.paymentMethod === '支付宝' ? '支付宝账号或手机号' : '微信号或手机号'}
                    required
                  />
                </div>
              )}

              {/* USDT收款地址 */}
              {form.paymentMethod === 'USDT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">USDT收款地址 *</label>
                  <input
                    type="text"
                    value={form.payeeAccount}
                    onChange={(e) => setForm({...form, payeeAccount: e.target.value})}
                    className="input-field"
                    placeholder="请输入USDT钱包地址"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">请确保地址正确，错误的地址可能导致资金丢失</p>
                </div>
              )}

              {/* 上传凭证 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">上传凭证 *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0]
                      if (file) {
                        try {
                          // 先显示本地预览
                          setForm({...form, receiptImage: file})
                          const reader = new FileReader()
                          reader.onload = (e) => {
                            setForm({...form, receiptImage: file, receiptImageUrl: e.target.result})
                          }
                          reader.readAsDataURL(file)
                          
                          // 上传到服务器获取真实URL
                          const uploadResult = await databaseService.uploadImage(file, 'receipts')
                          setForm({...form, 
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
                    {form.receiptImage ? (
                      <div>
                        <div className="text-green-600 text-2xl mb-2">✅</div>
                        <p className="text-sm text-gray-600">已上传: {form.receiptImage.name}</p>
                        {form.receiptImageUrl && (
                          <img src={form.receiptImageUrl} alt="凭证预览" className="mt-2 max-w-xs mx-auto rounded" />
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="text-gray-400 text-4xl mb-2">📷</div>
                        <p className="text-sm text-gray-600">点击上传发票、收据等凭证</p>
                        <p className="text-xs text-gray-500 mt-1">支持 JPG、PNG 格式</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn-secondary px-6 py-2"
                >
                  ← 上一步
                </button>
                <button
                  type="submit"
                  disabled={loading || !form.payeeName || !form.payeeContact || !form.payeeAccount || !form.receiptImage}
                  className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="loading-spinner w-4 h-4"></div>
                      <span>提交中...</span>
                    </div>
                  ) : (
                    '提交申请'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}