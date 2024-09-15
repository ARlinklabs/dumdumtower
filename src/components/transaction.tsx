// import React from 'react';
// import { message, createDataItemSigner } from "@permaweb/aoconnect";
// import { ConnectButton, useConnection } from "@arweave-wallet-kit/react";
// import { Button } from "@/components/ui/button";

// declare global {
//     interface Window {
//       arweaveWallet: {
//         connect: (foo: string[]) => void;
//         disconnect: () => void;
//         getActiveAddress: () => void;
//       };
//     }
// }

// export async function sendMessage() {
//     try {
//         const response = await message({
//             process: "i4JjTOGaNtO7Lo5l3i7m-0cjyZWpsK9ELxOqZkE9RlA",
//             tags: [
//                 { name: "Action", value: "Transfer" },
//                 { name: "Recipient", value: "i4JjTOGaNtO7Lo5l3i7m-0cjyZWpsK9ELxOqZkE9RlA" },
//                 { name: "Quantity", value: "100" },
//             ],
//             signer: createDataItemSigner(window.arweaveWallet),
//             data: "",
//         });
//         console.log("Message sent successfully:", response);
//         return response;
//     } catch (error) {
//         console.error("Error sending message:", error);
//         throw error;
//     }
// }

// function Transaction() {
//     const { connected } = useConnection();

//     const handleSendMessage = async () => {
//         if (!connected) {
//             alert("Please connect your Arweave wallet first.");
//             return;
//         }

//         try {
//             await sendMessage();
//             alert("Message sent successfully!");
//         } catch (error) {
//             alert("Failed to send message. Please try again.");
//         }
//     };

//     return (
//         <div className="flex flex-col items-center space-y-4 p-4">
//             <ConnectButton />
//             <Button
//                 onClick={handleSendMessage}
//                 disabled={!connected}
//                 className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
//             >
//                 Send Message
//             </Button>
//         </div>
//     );
// }

// export default Transaction;

