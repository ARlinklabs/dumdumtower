-- Define a function to generate a hash
local function generateHash(data)
    local hash = 0
    for i = 1, #data do
      hash = (hash * 31 + string.byte(data, i)) % 2^32
    end
    return string.format("%08x", hash)
  end
  local registeredUsers = {}

  -- Handler to generate a provably fair seed
  Handlers.add(
    "GenerateSeed",
    Handlers.utils.hasMatchingTag("Action", "Generate-Seed"),
    function (msg)
      local messageId = msg.Id
      
      
      
      -- Combine the message ID and timestamp to generate the seed
      local seedData = messageId 
      local seed = generateHash(seedData)
       
      
      -- Send the seed back to the client
      Send({
        Target = msg.From,
        Action = "Seed-Generated",
        Seed = seed,
       
      })
    end
  )
  -- Handler to register a user
Handlers.add(
    "Register",
    Handlers.utils.hasMatchingTag("Action", "Register"),
    function (msg)
      local from = msg.From
      
      if registeredUsers[from]  then
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