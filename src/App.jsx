import React, { useState, useEffect } from 'react'
import { databaseService, authService } from './supabase'
import LoginForm from './components/LoginForm'
import ExpenseForm from './components/ExpenseForm'
import ExpenseFormTest from './components/ExpenseForm_Test'
import LeaderView from './components/LeaderView'
import SupervisorView from './components/SupervisorView'
import FinanceView from './components/FinanceView'
import AdminView from './components/AdminView'
import Dashboard from './components/Dashboard'
import EmployeeDashboard from './components/EmployeeDashboard'

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [user, setUser] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [allUsers, setAllUsers] = useState([])

  // 处理登录
  const handleLogin = async (email, password) => {
    console.log('开始登录...', email)
    setLoginLoading(true)
    try {
      const userData = await authService.login(email, password)
      console.log('登录成功:', userData.name, userData.role)
      setUser(userData)
      setCurrentPage('dashboard')
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    } finally {
      setLoginLoading(false)
    }
  }

  // 处理登出
  const handleLogout = () => {
    authService.logout()
    setUser(null)
    setCurrentPage('dashboard')
    setDashboardData(null)
  }

  // 加载所有用户数据
  const loadUsers = async () => {
    try {
      console.log('开始加载用户数据...')
      const users = await databaseService.getUsers()
      setAllUsers(users)
      console.log('用户数据加载完成:', { users: users.length })
    } catch (error) {
      console.error('加载用户数据失败:', error)
      // 设置空数组，避免界面卡死
      setAllUsers([])
    }
  }

  // 加载仪表板数据
  const loadDashboardData = async () => {
    if (!user) return
    
    console.log('开始加载仪表板数据...', user.role)
    setLoading(true)
    try {
      const data = await databaseService.getDashboardData(user.role, user.id)
      setDashboardData(data)
      console.log('仪表板数据加载完成')
    } catch (error) {
      console.error('加载仪表板数据失败:', error)
      // 设置默认数据，避免界面卡死
      setDashboardData({
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
      })
    } finally {
      setLoading(false)
    }
  }

  // 处理子组件的成功回调
  const handleSuccess = (action) => {
    if (action === 'openExpenseForm') {
      // 切换到申请表单页面
      setCurrentPage('expenses')
    } else {
      // 其他情况重新加载数据
      loadDashboardData()
    }
  }


  // 初始化检查登录状态
  useEffect(() => {
    console.log('开始初始化应用...')
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      console.log('发现已登录用户:', currentUser.name)
      setUser(currentUser)
      setLoading(false)
    } else {
      console.log('用户未登录')
      setLoading(false)
    }
    
    // 延迟加载用户数据，避免阻塞登录界面
    setTimeout(() => {
      loadUsers()
    }, 100)
  }, [])

  // 用户变化时加载数据
  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  // 订阅数据变化
  useEffect(() => {
    if (user) {
      const unsubscribe = databaseService.subscribe(() => {
        loadDashboardData()
      })
      return unsubscribe
    }
  }, [user])

  const renderContent = () => {
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

    // 如果未登录，显示登录界面
    if (!user) {
      return <LoginForm onLogin={handleLogin} loading={loginLoading} />
    }

    // 员工角色使用专门的EmployeeDashboard
    if (user.role === 'employee') {
      return <EmployeeDashboard user={user} onSuccess={loadDashboardData} />
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard data={dashboardData} role={user.role} user={user} />
      case 'expenses':
        return <ExpenseForm user={user} onSuccess={loadDashboardData} />
      case 'leader':
        return <LeaderView user={user} onSuccess={handleSuccess} />
      case 'supervisor':
        return <SupervisorView user={user} onSuccess={loadDashboardData} />
      case 'finance':
        return <FinanceView user={user} onSuccess={loadDashboardData} />
      case 'admin':
        return <AdminView user={user} onSuccess={loadDashboardData} />
      default:
        return <Dashboard data={dashboardData} role={user.role} user={user} />
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'employee': return '👤'
      case 'team_leader': return '👨‍💼'
      case 'supervisor': return '👨‍💻'
      case 'finance': return '💰'
      case 'admin': return '⚙️'
      default: return '👤'
    }
  }

  const getRoleName = (role) => {
    switch (role) {
      case 'employee': return '员工'
      case 'team_leader': return '组长'
      case 'supervisor': return '主管'
      case 'finance': return '财务'
      case 'admin': return '管理员'
      default: return '员工'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 - 只在登录后显示 */}
      {user && (
        <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                {/* Logo */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">企</span>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">企业管理系统</h1>
                </div>
              </div>
                    
            <div className="flex items-center space-x-4">
              {/* 页面导航 - 员工角色不显示 */}
              {user && user.role !== 'employee' && (
                <div className="hidden md:flex space-x-1">
                  <button
                    onClick={() => setCurrentPage('dashboard')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentPage === 'dashboard' 
                        ? 'bg-blue-100 text-blue-700 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    📊 仪表板
                  </button>
                  {(user.role === 'finance' || user.role === 'admin') && (
                    <button
                      onClick={() => setCurrentPage('expenses')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentPage === 'expenses' 
                          ? 'bg-blue-100 text-blue-700 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      📋 申请管理
                    </button>
                  )}
                  {user.role === 'team_leader' && (
                    <button
                      onClick={() => setCurrentPage('leader')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentPage === 'leader' 
                          ? 'bg-blue-100 text-blue-700 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      👨‍💼 组长管理
                    </button>
                  )}
                  {user.role === 'supervisor' && (
                    <button
                      onClick={() => setCurrentPage('supervisor')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentPage === 'supervisor' 
                          ? 'bg-blue-100 text-blue-700 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      👨‍💻 主管管理
                    </button>
                  )}
                  {user.role === 'finance' && (
                    <button
                      onClick={() => setCurrentPage('finance')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentPage === 'finance' 
                          ? 'bg-blue-100 text-blue-700 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      💰 财务管理
                    </button>
                  )}
                  {user.role === 'admin' && (
                    <button
                      onClick={() => setCurrentPage('admin')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentPage === 'admin' 
                          ? 'bg-blue-100 text-blue-700 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      ⚙️ 系统管理
                    </button>
                  )}
                </div>
              )}

              {/* 用户信息和登出按钮 */}
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-3 bg-gray-100 rounded-lg px-3 py-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-gray-500">{getRoleName(user.role)}</div>
                    </div>
                  </div>
                  
                  {/* 登出按钮 */}
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    title="登出"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
          </div>        </nav>
      )}

      {/* 主要内容区域 */}
      <div className={user ? "max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8" : ""}>
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </div>
                  
      {/* 移动端侧边栏 */}
      {sidebarOpen && user && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">企</span>
                </div>
                <h1 className="ml-3 text-lg font-semibold text-gray-900">企业管理系统</h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {user.role !== 'employee' && (
                  <>
                    <button
                      onClick={() => { setCurrentPage('dashboard'); setSidebarOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                      📊 仪表板
                    </button>
                    {(user.role === 'finance' || user.role === 'admin') && (
                      <button
                        onClick={() => { setCurrentPage('expenses'); setSidebarOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      >
                        📋 申请管理
                      </button>
                    )}
                    {user.role === 'team_leader' && (
                      <button
                        onClick={() => { setCurrentPage('leader'); setSidebarOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      >
                        👨‍💼 组长管理
                      </button>
                    )}
                    {user.role === 'supervisor' && (
                      <button
                        onClick={() => { setCurrentPage('supervisor'); setSidebarOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      >
                        👨‍💻 主管管理
                      </button>
                    )}
                    {user.role === 'finance' && (
                      <button
                        onClick={() => { setCurrentPage('finance'); setSidebarOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      >
                        💰 财务管理
                      </button>
                    )}
                    {user.role === 'admin' && (
                      <button
                        onClick={() => { setCurrentPage('admin'); setSidebarOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      >
                        ⚙️ 系统管理
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => { handleLogout(); setSidebarOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-900 hover:bg-red-50"
                >
                  🚪 登出
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
            </div>
  )
}