-- Define a function to generate a hash
local function generateHash(data)
    local hash = 0
    for i = 1, #data do
      hash = (hash * 31 + string.byte(data, i)) % 2^32
    end
    return string.format("%08x", hash)
  end
  
  -- Function to calculate the multiplier based on the grid state
  local function calculateMultiplier(gridState)
    local multiplier = 1
    print("Calculating multiplier for grid state: " .. gridState)
    for i = #gridState, 1, -1 do  -- Iterate from bottom to top
      if gridState:sub(i, i) == "1" then
        multiplier = multiplier + 0.5
        print("Row " .. i .. ": Egg found. New multiplier: " .. multiplier)
      else
        print("Row " .. i .. ": No egg. Breaking loop.")
        break
      end
    end
    print("Final calculated multiplier: " .. multiplier)
    return multiplier
  end
  
  -- Table to keep track of registered users
  local registeredUsers = {}
  
  -- Handler to generate a provably fair seed
  Handlers.add(
    "GenerateSeed",
    Handlers.utils.hasMatchingTag("Action", "Generate-Seed"),
    function (msg)
      local messageId = msg.Id
      
      -- Combine the message ID and timestamp to generate the seed
      local seedData = messageId .. os.time()
      local seed = generateHash(seedData)
      
      -- Send the seed back to the client
      Send({
        Target = msg.From,
        Action = "Seed-Generated",
        Tags = {
          Seed = seed,
        }
      })
    end
  )
  
  -- Handler to register a user
  Handlers.add(
    "Register",
    Handlers.utils.hasMatchingTag("Action", "Register"),
    function (msg)
      local from = msg.From
      
      if registeredUsers[from] then
        -- User already registered, send a message indicating already claimed
        print("User already registered")
        Send({
          Target = from,
          Action = "Already-Claimed",
          Message = "You have already claimed your reward."
        })
      else
        -- Register the user and send the transfer message
        registeredUsers[from] = true
        Send({
          Target = ao.id,
          Tags = { Action = "Transfer", Recipient = from, Quantity = "101" }
        })
        print("User registered")
      end
    end
  )
  
  -- Handler to verify and send winnings
  Handlers.add(
    "VerifyAndSendWinnings",
    Handlers.utils.hasMatchingTag("Action", "Claim-Winnings"),
    function (msg)
      local from = msg.From
      local betAmount = tonumber(msg.Tags.BetAmount)
      local claimedMultiplier = tonumber(msg.Tags.Multiplier)
      local gridState = msg.Tags.GridState
  
      print("Received claim:")
      print("From: " .. from)
      print("Bet Amount: " .. tostring(betAmount))
      print("Claimed Multiplier: " .. tostring(claimedMultiplier))
      print("Grid State: " .. gridState)
  
      -- Verify the game result
      local calculatedMultiplier = calculateMultiplier(gridState)
      
      print("Calculated Multiplier: " .. tostring(calculatedMultiplier))
  
      if calculatedMultiplier == claimedMultiplier then
        local winnings = math.floor(betAmount * claimedMultiplier)
        print("Winnings: " .. tostring(winnings))
  
        -- Send the winnings to the user
        Send({
          Target = ao.id,
          Tags = { 
            Action = "Transfer", 
            Recipient = from, 
            Quantity = tostring(winnings)
          }
        })
        
        Send({
          Target = from,
          Action = "Winnings-Sent",
          Tags = {
            Amount = tostring(winnings)
          }
        })
        print("Winnings sent to user: " .. tostring(winnings))
      else
        -- Multiplier mismatch, potential cheating attempt
        print("Multiplier mismatch. Claimed: " .. tostring(claimedMultiplier) .. ", Calculated: " .. tostring(calculatedMultiplier))
        Send({
          Target = from,
          Action = "Claim-Rejected",
          Message = "Multiplier mismatch detected."
        })
      end
    end
  )