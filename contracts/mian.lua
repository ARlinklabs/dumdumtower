-- Define a function to generate a hash
local function generateHash(data)
    local hash = 0
    for i = 1, #data do
      hash = (hash * 31 + string.byte(data, i)) % 2^32
    end
    return string.format("%08x", hash)
  end
  
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
  