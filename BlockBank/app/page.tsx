"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Wallet,
  TrendingDown,
  DollarSign,
  PiggyBank,
  AlertTriangle,
  Settings,
  Coins,
  BarChart3,
  Shield,
  RefreshCw,
} from "lucide-react"
import ParticlesBackground from "@/components/particles-background"

declare global {
  interface Window {
    ethereum?: any
    ethers?: any
  }
}

export default function LendFiDashboard() {
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [network, setNetwork] = useState("")
  const [status, setStatus] = useState("Ready to connect wallet")
  const [hasActiveLoan, setHasActiveLoan] = useState(false)

  const [provider, setProvider] = useState<any>(null)
  const [signer, setSigner] = useState<any>(null)
  const [tokenContract, setTokenContract] = useState<any>(null)
  const [stakingContract, setStakingContract] = useState<any>(null)

  const [metrics, setMetrics] = useState({
    stkBalance: "0",
    stakedAmount: "0",
    rewards: "0",
    loanDebt: "0",
    collateral: "0",
    maxLoan: "0",
    totalLiquidity: "1,250,000",
    totalBorrows: "850,000",
    ethPrice: "2,450",
    protocolFees: "12,500",
    healthFactor: "1.85",
  })

  const [prevMetrics, setPrevMetrics] = useState(metrics)

  const portfolioChartRef = useRef<HTMLCanvasElement>(null)
  const historyChartRef = useRef<HTMLCanvasElement>(null)

  const TOKEN_ADDRESS = "0xREPLACE_TOKEN_ADDRESS"
  const STAKING_ADDRESS = "0xREPLACE_STAKING_ADDRESS"
  const LTV = 0.5

  const tokenAbi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
  ]

  const stakingAbi = [
    "function stake(uint256 amount)",
    "function withdraw()",
    "function getRewards(address user) view returns (uint256)",
    "function requestLoan(uint256 amount)",
    "function repayLoan(uint256 amount)",
    "function getUserInfo(address user) view returns (uint256,uint256,uint256,uint256,uint256)",
    "function calculateMaxLoan(address user) view returns (uint256)",
  ]

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask")
      return
    }

    try {
      // Load ethers.js dynamically
      const ethers = (await import("ethers")).ethers
      window.ethers = ethers

      const web3Provider = new ethers.providers.Web3Provider(window.ethereum)
      await web3Provider.send("eth_requestAccounts", [])
      const web3Signer = web3Provider.getSigner()
      const address = await web3Signer.getAddress()
      const networkInfo = await web3Provider.getNetwork()

      setProvider(web3Provider)
      setSigner(web3Signer)
      setIsWalletConnected(true)
      setWalletAddress(address)
      setNetwork(`${networkInfo.name} (${networkInfo.chainId})`)
      setStatus("Connected (simulation mode)")

      // Initialize contracts
      const token = new ethers.Contract(TOKEN_ADDRESS, tokenAbi, web3Signer)
      const staking = new ethers.Contract(STAKING_ADDRESS, stakingAbi, web3Signer)
      setTokenContract(token)
      setStakingContract(staking)

      // Set up event listeners
      window.ethereum.on("accountsChanged", () => window.location.reload())
      window.ethereum.on("chainChanged", () => window.location.reload())

      await refreshDashboard()
    } catch (error) {
      console.error("Connection failed:", error)
      setStatus("Connection failed")
    }
  }

  const disconnectWallet = () => {
    setIsWalletConnected(false)
    setWalletAddress("")
    setNetwork("")
    setStatus("Disconnected")
    setProvider(null)
    setSigner(null)
    setTokenContract(null)
    setStakingContract(null)
  }

  const refreshDashboard = async () => {
    try {
      setStatus("Updating dashboard...")

      // Simulate blockchain data (in real app, this would call actual contracts)
      const ethers = window.ethers
      if (!ethers) return

      const staked = ethers.utils.parseUnits("50", 18)
      const rewards = ethers.utils.parseUnits("5", 18)
      const balance = ethers.utils.parseUnits("200", 18)
      const loanDebt = ethers.utils.parseUnits("30", 18)
      const collateral = ethers.utils.parseUnits("40", 18)

      const ltvBN = ethers.utils.parseUnits(LTV.toString(), 18)
      const maxLoan = collateral.mul(ltvBN).div(ethers.utils.parseUnits("1", 18))

      const newMetrics = {
        ...metrics,
        stkBalance: ethers.utils.formatUnits(balance, 18),
        stakedAmount: ethers.utils.formatUnits(staked, 18),
        rewards: ethers.utils.formatUnits(rewards, 18),
        loanDebt: ethers.utils.formatUnits(loanDebt, 18),
        collateral: ethers.utils.formatUnits(collateral, 18),
        maxLoan: ethers.utils.formatUnits(maxLoan, 18),
      }

      setPrevMetrics(metrics)
      setMetrics(newMetrics)
      setStatus("Dashboard updated (simulated)")
    } catch (error) {
      console.error("Dashboard refresh failed:", error)
      setStatus("Error updating dashboard")
    }
  }

  const handleStake = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const amount = formData.get("stakeAmount") as string

    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount")
      return
    }

    console.log(`Simulation: stake ${amount} STK`)
    alert(`Simulation: stake ${amount} STK sent to contract`)
    await refreshDashboard()
  }

  const handleWithdraw = async () => {
    console.log("Simulation: withdraw")
    alert("Simulation: withdraw stake + rewards sent to contract")
    await refreshDashboard()
  }

  const handleDepositCollateral = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const amount = formData.get("collateralAmount") as string

    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount")
      return
    }

    console.log(`Simulation: deposit collateral ${amount} STK`)
    alert(`Simulation: collateral ${amount} STK deposited`)
    await refreshDashboard()
  }

  const handleRequestLoan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const amount = formData.get("loanAmount") as string

    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount")
      return
    }

    const maxLoanNum = Number.parseFloat(metrics.maxLoan)
    if (Number.parseFloat(amount) > maxLoanNum) {
      alert(`Amount exceeds maximum allowed: ${maxLoanNum} STK`)
      return
    }

    console.log(`Simulation: request loan ${amount} STK`)
    alert(`Simulation: loan ${amount} STK requested`)
    await refreshDashboard()
  }

  const handleRepayLoan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const amount = formData.get("repayAmount") as string

    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount")
      return
    }

    console.log(`Simulation: repay loan ${amount} STK`)
    alert(`Simulation: loan ${amount} STK repaid`)
    await refreshDashboard()
  }

  const calculateDelta = (current: string, previous: string) => {
    const curr = Number.parseFloat(current)
    const prev = Number.parseFloat(previous)
    const diff = curr - prev

    if (Math.abs(diff) < 0.0001) return "—"

    const pct = prev === 0 ? (diff > 0 ? "+∞" : "-∞") : ((diff / prev) * 100).toFixed(1) + "%"
    const isPositive = diff > 0

    return (
      <span className={isPositive ? "text-green-400" : "text-red-400"}>
        {isPositive ? "▲" : "▼"} {pct.replace("-", "")}
      </span>
    )
  }

  return (
    <div className="min-h-screen gradient-bg text-gray-100 relative overflow-hidden">
      <ParticlesBackground />

      {/* Header */}
      <header className="relative z-10 border-b border-gray-800 bg-gray-900/60 backdrop-blur-strong">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center glow-blue">
                  <Coins className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold gradient-text pulse-slow">LendFi Protocol</h1>
              </div>
              <nav className="hidden md:flex space-x-6 text-sm font-medium">
                <a href="#" className="text-gray-300 hover:text-cyan-400 transition-smooth">
                  Dashboard
                </a>
                <a href="#" className="text-gray-300 hover:text-green-400 transition-smooth">
                  Staking
                </a>
                <a href="#" className="text-gray-300 hover:text-purple-400 transition-smooth">
                  Collateral
                </a>
                <a href="#" className="text-gray-300 hover:text-red-400 transition-smooth">
                  Loans
                </a>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {isWalletConnected ? (
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="secondary"
                    className="bg-gray-800/60 backdrop-blur text-gray-100 flex items-center space-x-2 glow-green"
                  >
                    <Wallet className="h-4 w-4 text-green-400" />
                    <span className="font-mono">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </span>
                  </Badge>
                  <div className="text-xs text-gray-400">
                    <div>{network}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={disconnectWallet}
                    className="bg-transparent border-gray-700 transition-smooth hover:scale-105"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={connectWallet}
                  className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 glow-green hover:scale-105 transition-smooth flex items-center space-x-2"
                >
                  <Wallet className="h-4 w-4" />
                  <span>Connect Wallet</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Status Bar */}
      <div className="relative z-10 bg-gray-800/40 backdrop-blur-strong border-b border-gray-700">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-300">Status: {status}</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshDashboard}
              className="text-gray-400 hover:text-gray-100 hover:bg-gray-800/60 transition-smooth hover:scale-105"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800/60 backdrop-blur-strong border border-gray-700">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-gray-700 transition-smooth">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="lend" className="data-[state=active]:bg-gray-700 transition-smooth">
              Lend
            </TabsTrigger>
            <TabsTrigger value="borrow" className="data-[state=active]:bg-gray-700 transition-smooth">
              Borrow
            </TabsTrigger>
            <TabsTrigger value="liquidate" className="data-[state=active]:bg-gray-700 transition-smooth">
              Liquidate
            </TabsTrigger>
            <TabsTrigger value="admin" className="data-[state=active]:bg-gray-700 transition-smooth">
              Admin Panel
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="dashboard-grid">
              {/* Left Column - Mini KPI Cards */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Portfolio Overview</h2>

                <div className="grid grid-cols-1 gap-3">
                  <Card className="bg-gray-800/70 backdrop-blur-strong border-gray-700 card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-400">STK Balance</div>
                        <div className="text-xs text-gray-400">STK</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-green-400">
                          {Number.parseFloat(metrics.stkBalance).toFixed(2)}
                        </div>
                        <div className="text-sm">{calculateDelta(metrics.stkBalance, prevMetrics.stkBalance)}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/70 backdrop-blur-strong border-gray-700 card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-400">Staked</div>
                        <div className="text-xs text-gray-400">STK</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-green-300">
                          {Number.parseFloat(metrics.stakedAmount).toFixed(2)}
                        </div>
                        <div className="text-sm">{calculateDelta(metrics.stakedAmount, prevMetrics.stakedAmount)}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/70 backdrop-blur-strong border-gray-700 card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-400">Rewards</div>
                        <div className="text-xs text-gray-400">STK</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-yellow-400">
                          {Number.parseFloat(metrics.rewards).toFixed(2)}
                        </div>
                        <div className="text-sm">{calculateDelta(metrics.rewards, prevMetrics.rewards)}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/70 backdrop-blur-strong border-gray-700 card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-400">Collateral</div>
                        <div className="text-xs text-gray-400">STK</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-purple-400">
                          {Number.parseFloat(metrics.collateral).toFixed(2)}
                        </div>
                        <div className="text-sm">{calculateDelta(metrics.collateral, prevMetrics.collateral)}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-gray-800/70 backdrop-blur-strong border-gray-700 card-hover">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="text-sm text-gray-400">Health Factor</div>
                      <div className="w-full bg-gray-700 rounded-full h-4">
                        <div
                          className="h-4 rounded-full progress-bar bg-gradient-to-r from-green-400 to-green-500"
                          style={{ width: `${Math.min(100, Number.parseFloat(metrics.healthFactor) * 50)}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-gray-400">Utilization:</div>
                        <div className="font-semibold text-green-400">{metrics.healthFactor}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Columns - Protocol Stats */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gray-800/70 backdrop-blur-strong border-gray-700 card-hover">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Liquidity</CardTitle>
                    <PiggyBank className="h-4 w-4 text-green-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-400">{metrics.totalLiquidity} STK</div>
                    <p className="text-xs text-gray-400">Available for lending</p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/70 backdrop-blur-strong border-gray-700 card-hover">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Borrows</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-400">{metrics.totalBorrows} STK</div>
                    <p className="text-xs text-gray-400">Currently borrowed</p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/70 backdrop-blur-strong border-gray-700 card-hover">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ETH Price (in STK)</CardTitle>
                    <BarChart3 className="h-4 w-4 text-cyan-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-cyan-400">{metrics.ethPrice} STK</div>
                    <p className="text-xs text-gray-400">Current collateral rate</p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/70 backdrop-blur-strong border-gray-700 card-hover">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Protocol Fees</CardTitle>
                    <DollarSign className="h-4 w-4 text-yellow-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-400">{metrics.protocolFees} STK</div>
                    <p className="text-xs text-gray-400">Accumulated fees</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Lend Tab */}
          <TabsContent value="lend" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Staking & Rewards</h2>
              <Card className="bg-gray-800/70 backdrop-blur-strong border-gray-700 card-hover">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <span>Staking</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-600/30 text-green-400 pulse-slow">
                        Active
                      </span>
                    </CardTitle>
                  </div>
                  <CardDescription>Stake your STK tokens to earn rewards</CardDescription>
                </CardHeader>
                <CardContent className="form-enhanced">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-400">Your STK Balance</Label>
                      <p className="font-semibold text-green-400">
                        {Number.parseFloat(metrics.stkBalance).toFixed(4)} STK
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Current Staked</Label>
                      <p className="font-semibold text-green-300">
                        {Number.parseFloat(metrics.stakedAmount).toFixed(4)} STK
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleStake} className="flex gap-3 items-end">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="stakeAmount">Amount (STK)</Label>
                      <div className="relative">
                        <Input
                          id="stakeAmount"
                          name="stakeAmount"
                          placeholder="100"
                          className="bg-gray-700 border-gray-600 pr-12 focus-enhanced"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 font-semibold text-sm">
                          STK
                        </span>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 glow-green transition-smooth hover:scale-105"
                    >
                      Stake
                    </Button>
                  </form>

                  <Button
                    onClick={handleWithdraw}
                    variant="outline"
                    className="w-full bg-yellow-600/20 border-yellow-600 text-yellow-400 hover:bg-yellow-600/30 glow-yellow transition-smooth hover:scale-105"
                  >
                    Withdraw Stake + Rewards
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Borrow Tab */}
          <TabsContent value="borrow" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Collateral & Loans</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Collateral Section */}
                <Card className="bg-gray-800/70 backdrop-blur-strong border-gray-700 card-hover">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <span>Collateral</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-600/30 text-purple-400 pulse-slow">
                          Secure
                        </span>
                      </CardTitle>
                    </div>
                    <CardDescription>Deposit tokens as collateral for loans</CardDescription>
                  </CardHeader>
                  <CardContent className="form-enhanced">
                    <div className="text-sm">
                      <Label className="text-gray-400">Current Collateral</Label>
                      <p className="font-semibold text-purple-400">
                        {Number.parseFloat(metrics.collateral).toFixed(4)} STK
                      </p>
                    </div>

                    <form onSubmit={handleDepositCollateral} className="flex gap-3 items-end">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="collateralAmount">Amount (STK)</Label>
                        <div className="relative">
                          <Input
                            id="collateralAmount"
                            name="collateralAmount"
                            placeholder="50"
                            className="bg-gray-700 border-gray-600 pr-12 focus-enhanced"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 font-semibold text-sm">
                            STK
                          </span>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-700 glow-purple transition-smooth hover:scale-105"
                      >
                        Deposit
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Loans Section */}
                <Card className="bg-gray-800/70 backdrop-blur-strong border-gray-700 card-hover">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <span>Loans</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-red-600/30 text-red-400 pulse-slow">
                          Credit
                        </span>
                      </CardTitle>
                    </div>
                    <CardDescription>Request and repay loans based on collateral</CardDescription>
                  </CardHeader>
                  <CardContent className="form-enhanced">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-gray-400">Max Loan</Label>
                        <p className="font-semibold text-blue-400">
                          {Number.parseFloat(metrics.maxLoan).toFixed(4)} STK
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Current Debt</Label>
                        <p className="font-semibold text-red-400">
                          {Number.parseFloat(metrics.loanDebt).toFixed(4)} STK
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleRequestLoan} className="flex gap-3 items-end">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="loanAmount">Loan Amount (STK)</Label>
                        <div className="relative">
                          <Input
                            id="loanAmount"
                            name="loanAmount"
                            placeholder="200"
                            className="bg-gray-700 border-gray-600 pr-12 focus-enhanced"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 font-semibold text-sm">
                            STK
                          </span>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="bg-red-600 hover:bg-red-700 glow-red transition-smooth hover:scale-105"
                      >
                        Request
                      </Button>
                    </form>

                    <form onSubmit={handleRepayLoan} className="flex gap-3 items-end">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="repayAmount">Repay Amount (STK)</Label>
                        <div className="relative">
                          <Input
                            id="repayAmount"
                            name="repayAmount"
                            placeholder="150"
                            className="bg-gray-700 border-gray-600 pr-12 focus-enhanced"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 font-semibold text-sm">
                            STK
                          </span>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 glow-blue transition-smooth hover:scale-105"
                      >
                        Repay
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Liquidate Tab */}
          <TabsContent value="liquidate" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Liquidate Risky Loans</h2>
              <Card className="bg-gray-800/70 backdrop-blur-strong border-gray-700 card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <span>Loan Health Checker</span>
                  </CardTitle>
                  <CardDescription>Check if a borrower's loan is eligible for liquidation</CardDescription>
                </CardHeader>
                <CardContent className="form-enhanced">
                  <div className="space-y-2">
                    <Label htmlFor="wallet-address">Wallet Address</Label>
                    <Input
                      id="wallet-address"
                      placeholder="0x..."
                      className="font-mono bg-gray-700 border-gray-600 focus-enhanced"
                    />
                  </div>

                  <Button className="w-full bg-yellow-600 hover:bg-yellow-700 glow-yellow transition-smooth hover:scale-105">
                    Check Loan Health
                  </Button>

                  <div className="space-y-2">
                    <Label>Health Factor Result</Label>
                    <Textarea
                      placeholder="Results will appear here..."
                      className="min-h-[100px] bg-gray-700 border-gray-600"
                      readOnly
                    />
                  </div>

                  <Button variant="destructive" className="w-full transition-smooth hover:scale-105" disabled>
                    Liquidate
                  </Button>
                  <p className="text-xs text-gray-400 text-center">
                    Liquidation button will be enabled if loan is risky
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Admin Panel Tab */}
          <TabsContent value="admin" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center space-x-2 mb-6">
                <Settings className="h-6 w-6 text-cyan-400" />
                <h2 className="text-2xl font-bold">Admin Panel</h2>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-yellow-500" />
                  <p className="text-sm font-medium">Protocol Owner Functions Only</p>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  These functions are restricted to the protocol owner address
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Mint Mock STK */}
                <Card className="bg-gray-800/70 backdrop-blur-strong border-gray-700 card-hover">
                  <CardHeader>
                    <CardTitle className="text-lg">Mint Mock STK</CardTitle>
                    <CardDescription>Create STK tokens for testing</CardDescription>
                  </CardHeader>
                  <CardContent className="form-enhanced">
                    <div className="space-y-2">
                      <Label htmlFor="mint-address">Address</Label>
                      <Input
                        id="mint-address"
                        placeholder="0x..."
                        className="font-mono bg-gray-700 border-gray-600 focus-enhanced"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mint-amount">Amount</Label>
                      <Input
                        id="mint-amount"
                        placeholder="1000"
                        className="bg-gray-700 border-gray-600 focus-enhanced"
                      />
                    </div>
                    <Button className="w-full bg-green-600 hover:bg-green-700 glow-green transition-smooth hover:scale-105">
                      Mint
                    </Button>
                  </CardContent>
                </Card>

                {/* Update ETH Price */}
                <Card className="bg-gray-800/70 backdrop-blur-strong border-gray-700 card-hover">
                  <CardHeader>
                    <CardTitle className="text-lg">Update ETH Price</CardTitle>
                    <CardDescription>Set new collateral price</CardDescription>
                  </CardHeader>
                  <CardContent className="form-enhanced">
                    <div className="space-y-2">
                      <Label htmlFor="new-price">New Price (STK)</Label>
                      <Input id="new-price" placeholder="2450" className="bg-gray-700 border-gray-600 focus-enhanced" />
                    </div>
                    <div className="text-sm text-gray-400">Current: {metrics.ethPrice} STK</div>
                    <Button className="w-full bg-cyan-600 hover:bg-cyan-700 glow-cyan transition-smooth hover:scale-105">
                      Update
                    </Button>
                  </CardContent>
                </Card>

                {/* Withdraw Fees */}
                <Card className="bg-gray-800/70 backdrop-blur-strong border-gray-700 card-hover">
                  <CardHeader>
                    <CardTitle className="text-lg">Withdraw Fees</CardTitle>
                    <CardDescription>Collect protocol fees</CardDescription>
                  </CardHeader>
                  <CardContent className="form-enhanced">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">{metrics.protocolFees} STK</div>
                      <p className="text-sm text-gray-400">Available fees</p>
                    </div>
                    <Button className="w-full bg-yellow-600 hover:bg-yellow-700 glow-yellow transition-smooth hover:scale-105">
                      Withdraw
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
