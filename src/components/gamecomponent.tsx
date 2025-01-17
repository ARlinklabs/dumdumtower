'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Skull, ChevronsUp, Loader2 } from 'lucide-react'
import { createDataItemSigner, result, connect } from "@permaweb/aoconnect"
import { verifyAndClaimWinnings, placeBet } from "@/lib/hooks"
import { ConnectButton, useConnection, useActiveAddress } from "@arweave-wallet-kit/react"
import CryptoJS from 'crypto-js'

const GRID_HEIGHT = 9
const GRID_WIDTH = 3

declare global {
  interface Window {
    arweaveWallet: {
      connect: (foo: string[]) => void
      disconnect: () => void
      getActiveAddress: () => void
    }
  }
}

export function Game() {
  const { connected } = useConnection()
  const ao = connect()
  const [betAmount, setBetAmount] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentRow, setCurrentRow] = useState(GRID_HEIGHT - 1)
  const [multiplier, setMultiplier] = useState(1)
  const [grid, setGrid] = useState<boolean[][]>(Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(false)))
  const [revealedGrid, setRevealedGrid] = useState<boolean[][]>(Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(false)))
  const [isAutopick, setIsAutopick] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [clientSeed, setClientSeed] = useState('')
  const [serverSeed, setServerSeed] = useState('')
  const [, setServerSeedHash] = useState('')
  const activeAddress = useActiveAddress()
  const [canCashOut, setCanCashOut] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isPlaying && clientSeed && serverSeed) {
      generateGrid(clientSeed, serverSeed)
    }
  }, [isPlaying, clientSeed, serverSeed])
  
  const generateClientSeed = async () => {
    try {
      if (!connected) {
        throw new Error("Not connected to Arweave wallet")
      }
      const register = await ao.message({
        process: 'al0r2Hwq9opOTqMmR7ue6hzrZ4f8wEzTsnxHF5756ng',
        tags: [
          { name: 'Action', value: 'Register' },
        ],
        signer: createDataItemSigner(window.arweaveWallet),
      })
      const response = await ao.message({
        process: 'al0r2Hwq9opOTqMmR7ue6hzrZ4f8wEzTsnxHF5756ng',
        tags: [{ name: 'Action', value: 'Generate-Seed' }],
        signer: createDataItemSigner(window.arweaveWallet),
      })

      let seed
      try {
        const { Output, Messages } = await result({
          message: response,
          process: 'pLpjfAlAUgdyb6n9UjYimnL2FVXA81RIbdsZV_8jzWA',
        })
        
        if (Array.isArray(Messages) && Messages.length > 0) {
          const seedTag = Messages[0].Tags.find((tag: { name: string; value: string }) => tag.name === 'Seed')
          if (seedTag) {
            seed = seedTag.value
          }
        }

        if (!seed && Output && typeof Output === 'string') {
          const parsedOutput = JSON.parse(Output)
          seed = parsedOutput.Seed || parsedOutput.seed
        }

        if (!seed) {
          throw new Error('Seed not found in response')
        }
      } catch (error) {
        throw error
      }

      const nonce = Math.random().toString(36).substring(2, 15)
      const combinedSeed = CryptoJS.SHA256(seed + nonce).toString()
      setClientSeed(combinedSeed)
      return combinedSeed
    } catch (error) {
      const seed = CryptoJS.lib.WordArray.random(128/8).toString()
      setClientSeed(seed)
      return seed
    }
  }

  const generateHash = (data: string): string => {
    return CryptoJS.SHA256(data).toString()
  }

  const generateGrid = (clientSeed: string, serverSeed: string) => {
    const combinedSeed = clientSeed + serverSeed
    let hash = generateHash(combinedSeed)
    
    const newGrid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(false))
    let hashIndex = 0

    // Ensure at least one box on the bottom of any column has an egg
    const bottomRow = GRID_HEIGHT - 1
    const bottomEggColumn = parseInt(hash.substr(0, 2), 16) % GRID_WIDTH
    newGrid[bottomRow][bottomEggColumn] = true

    const sectionHeight = Math.floor(GRID_HEIGHT / 3)
    const sections = [
      { start: 0, end: sectionHeight },
      { start: sectionHeight, end: sectionHeight * 2 },
      { start: sectionHeight * 2, end: GRID_HEIGHT - 1 } // Exclude the bottom row
    ]

    sections.forEach((section) => {
      for (let col = 0; col < GRID_WIDTH; col++) {
        let placed = false
        while (!placed) {
          if (hashIndex >= hash.length - 1) {
            hash = generateHash(hash)
            hashIndex = 0
          }
          const randomValue = parseInt(hash.substr(hashIndex, 2), 16)
          const row = section.start + (randomValue % (section.end - section.start))
          if (!newGrid[row][col]) {
            newGrid[row][col] = true
            placed = true
          }
          hashIndex += 2
        }
      }
    })

    // Fill remaining eggs, if any
    for (let i = GRID_WIDTH * 3; i < GRID_HEIGHT - 1; i++) { // Exclude the bottom row
      let placed = false
      while (!placed) {
        if (hashIndex >= hash.length - 1) {
          hash = generateHash(hash)
          hashIndex = 0
        }
        const randomValue = parseInt(hash.substr(hashIndex, 2), 16)
        const row = randomValue % (GRID_HEIGHT - 1) // Exclude the bottom row
        const col = (randomValue >> 8) % GRID_WIDTH
        if (!newGrid[row][col]) {
          newGrid[row][col] = true
          placed = true
        }
        hashIndex += 2
      }
    }

    setGrid(newGrid)
    setRevealedGrid(Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(false)))
    setMultiplier(1)
  }

  const resetGameState = () => {
    setIsPlaying(false)
    setGameOver(false)
    setCurrentRow(GRID_HEIGHT - 1)
    setMultiplier(1)
    setCanCashOut(false)
    setGrid(Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(false)))
    setRevealedGrid(Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(false)))
    setClientSeed('')
    setServerSeed('')
    setServerSeedHash('')
  }

  const handlePlay = async () => {
    if (!connected || !activeAddress) {
      alert("Please connect your Arweave wallet first.")
      return
    }

    setIsLoading(true)
    try {
      await placeBet(betAmount)

      const clientSeed = await generateClientSeed()
      const serverSeed = CryptoJS.lib.WordArray.random(128/8).toString()
      setServerSeed(serverSeed)
      setServerSeedHash(CryptoJS.SHA256(serverSeed).toString())

      setIsPlaying(true)
      setGameOver(false)
      setCurrentRow(GRID_HEIGHT - 1)
      setMultiplier(1)
      setCanCashOut(false)
      generateGrid(clientSeed, serverSeed)
    } catch (error) {
      alert('Failed to start the game. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTileClick = (row: number, col: number) => {
    if (!isPlaying || row !== currentRow || gameOver) return

    const newRevealedGrid = revealedGrid.map((r, i) => 
      i === row ? r.map((c, j) => j === col ? true : c) : r
    )
    setRevealedGrid(newRevealedGrid)

    if (grid[row][col]) {
      const newMultiplier = multiplier + 0.5
      setMultiplier(newMultiplier)
      
      if (newMultiplier >= 1.5 && !canCashOut) {
        setCanCashOut(true)
      }

      if (currentRow > 0) {
        setCurrentRow(prev => prev - 1)
      } else {
        handleWin()
      }
    } else {
      handleLoss()
    }
  }

  const handleCashOut = async () => {
    if (!canCashOut) return

    setIsLoading(true)
    try {
      const gridState = grid.map(row => row.includes(true) ? '1' : '0').join('')
      
      const payout = await verifyAndClaimWinnings(betAmount, multiplier, gridState)
      alert(`Congratulations! You've cashed out ${payout.toFixed(2)} tokens!`)
      
      resetGameState()
    } catch (error) {
      alert('Failed to cash out. ' + (error instanceof Error ? error.message : 'Please check wallet transaction.'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleAutopick = () => {
    if (!isPlaying || gameOver) return
    const col = Math.floor(Math.random() * GRID_WIDTH)
    handleTileClick(currentRow, col)
  }

  const handleWin = () => {
    setCanCashOut(true)
    setGameOver(true)
    
  }

  const handleLoss = () => {
    setGameOver(true)
    setRevealedGrid(grid.map(row => row.map(() => true)))
  }

  return (
    <div className="h-screen bg-gray-900 text-gray-100 p-1 flex items-center justify-center">
      <div className="w-full max-w-4xl h-full max-h-[800px] bg-gray-800 rounded-lg shadow-lg overflow-hidden flex">
        {/* Left panel */}
        <div className="w-1/3 p-2 bg-gray-700 space-y-2 flex flex-col">
          <div className="flex space-x-1">
            <Button 
              variant={isAutopick ? "outline" : "secondary"} 
              className="w-1/2 text-xs py-1 h-8"
              onClick={() => setIsAutopick(false)}
            >
              Manual
            </Button>
            <Button 
              variant={isAutopick ? "secondary" : "outline"} 
              className="w-1/2 text-xs py-1 h-8"
              onClick={() => setIsAutopick(true)}
            >
              Autopick
            </Button>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Bet </label>
            <Input 
              type="number" 
              value={betAmount} 
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full bg-gray-600 h-8 text-xs"
              min={1}
            />
          </div>
          <Button 
            className="w-full bg-green-500 hover:bg-green-600 text-white text-xs py-1 h-8" 
            onClick={handlePlay}
            disabled={isPlaying && !gameOver || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : isPlaying && !gameOver ? 'Playing...' : 'Play'}
          </Button>
          {isPlaying && !gameOver && isAutopick && (
            <Button 
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 h-8" 
              onClick={handleAutopick}
            >
              Autopick
            </Button>
          )}
          {isPlaying && canCashOut && !gameOver && (
            <Button 
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-xs py-1 h-8" 
              onClick={handleCashOut}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cashing Out...
                </>
              ) : `Cash Out (${(betAmount * multiplier).toFixed(2)})`}
            </Button>
          )}
          <ConnectButton/>
          <div className="flex-grow" />
        </div>
        
        {/* Game area */}
        <div className="w-2/3 p-2 flex flex-col">
          <div className="flex-grow grid grid-cols-3 gap-1 auto-rows-fr">
            {grid.map((row, rowIndex) => (
              row.map((isEgg, colIndex) => (
                <Card 
                  key={`${rowIndex}-${colIndex}`} 
                  className={`flex items-center justify-center cursor-pointer
                    ${rowIndex === currentRow && !gameOver ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-600'}
                    ${revealedGrid[rowIndex][colIndex] ? (isEgg ? 'bg-green-500' : 'bg-red-500') : ''}
                  `}
                  onClick={() => handleTileClick(rowIndex, colIndex)}
                >
                  {(revealedGrid[rowIndex][colIndex] || gameOver) && (
                    isEgg ? <span className="text-2xl">🧃</span> : (revealedGrid[rowIndex][colIndex] ? <Skull className="w-5 h-5" /> : null)
                  )}
                  {rowIndex === currentRow && !gameOver && !revealedGrid[rowIndex][colIndex] && (
                    <ChevronsUp className="w-5 h-5 animate-bounce" />
                  )}
                </Card>
              ))
            ))}
          </div>
          {isPlaying && (
            <div className="mt-2 bg-black bg-opacity-50 p-2 text-center rounded-md">
              <div className="text-xl font-bold">{multiplier.toFixed(2)}x</div>
              {canCashOut && !gameOver && (
                <div className="text-sm mt-1">
                  Cash Out Available: {(betAmount * multiplier).toFixed(2)} tokens
                </div>
              )}
              {gameOver && (
                <div className="text-lg font-bold mt-1">
                  {currentRow === 0 ? 'You Win!' : 'Game Over: You Lose Everything'}
                </div>
              )}
              {gameOver && (
                <Button 
                  className="bg-green-500 hover:bg-green-600 text-white text-xs py-1 mt-1 h-8"
                  onClick={handlePlay}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : 'Play Again'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
