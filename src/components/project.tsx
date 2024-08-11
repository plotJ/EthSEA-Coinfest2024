"use client";

import React, { useState, useEffect } from 'react';
import { ethers, BrowserProvider, JsonRpcSigner, Contract } from 'ethers';
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface Poll {
  id: number;
  title: string;
  options: string[];
  votes: string[];
}

const contractABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_title",
        "type": "string"
      },
      {
        "internalType": "string[]",
        "name": "_options",
        "type": "string[]"
      }
    ],
    "name": "createPoll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_pollId",
        "type": "uint256"
      }
    ],
    "name": "getPollOptions",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_pollId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_option",
        "type": "string"
      }
    ],
    "name": "getPollVotes",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pollCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "polls",
    "outputs": [
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_pollId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_option",
        "type": "string"
      }
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
const contractAddress = "0x3da8ea380Fc9bEe79E8016b7Ade75B94795eE595";

export default function MantaPolls() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [connectedWallet, setConnectedWallet] = useState('');
  const [newPollTitle, setNewPollTitle] = useState('');
  const [newPollOptions, setNewPollOptions] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [networkName, setNetworkName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);
    }
  }, []);

  const handleError = (error: unknown, prefix: string) => {
    console.error(prefix, error);
    if (error instanceof Error) {
      setError(`${prefix}: ${error.message}`);
    } else {
      setError(`${prefix}: An unknown error occurred`);
    }
  };

  const connectWallet = async () => {
    if (provider) {
      try {
        console.log("Connecting wallet...");
        const signer = await provider.getSigner();
        console.log("Signer obtained");

        const contract = new ethers.Contract(contractAddress, contractABI, signer);
        console.log("Contract instance created");

        setSigner(signer);
        setContract(contract);

        const address = await signer.getAddress();
        console.log("Connected wallet address:", address);
        setConnectedWallet(address);

        // Load polls after successful connection
        await loadPolls(contract);
      } catch (error) {
        handleError(error, "Failed to connect wallet");
      }
    } else {
      console.error("Provider not available");
      setError("Provider not available. Please make sure you have MetaMask installed and try again.");
    }
  };

  const loadPolls = async (contractInstance: Contract | null = null) => {
    const contractToUse = contractInstance || contract;
    if (contractToUse) {
      try {
        setError('');
        console.log("Starting to load polls...");
        
        const pollCount = await contractToUse.pollCount();
        console.log("Poll count:", pollCount.toString());
        
        const loadedPolls: Poll[] = [];
  
        for (let i = 1; i <= pollCount; i++) {
          console.log(`Loading poll ${i}...`);
          try {
            const poll = await contractToUse.polls(i);
            console.log(`Poll ${i} title:`, poll.title);
            
            const options = await contractToUse.getPollOptions(i);
            console.log(`Poll ${i} options:`, options);
            
            const votes = await Promise.all(options.map(async (option: string) => {
              const voteCount = await contractToUse.getPollVotes(i, option);
              console.log(`Poll ${i}, Option "${option}" votes:`, voteCount.toString());
              return voteCount;
            }));
  
            loadedPolls.push({
              id: i,
              title: poll.title,
              options: options,
              votes: votes.map(v => v.toString())
            });
          } catch (pollError) {
            console.error(`Error loading poll ${i}:`, pollError);
          }
        }
  
        console.log("All polls loaded:", loadedPolls);
        setPolls(loadedPolls);
      } catch (error) {
        handleError(error, "Failed to load polls");
      }
    } else {
      console.error("Contract is not initialized");
      setError("Contract is not initialized. Please connect your wallet.");
    }
  };
  
  const createPoll = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Create Poll button clicked");
    
    if (!connectedWallet) {
      setError("Please connect your wallet first");
      return;
    }
  
    if (!contract) {
      setError("Contract is not initialized. Please try reconnecting your wallet.");
      return;
    }
  
    if (!newPollTitle || !newPollOptions) {
      setError("Please enter both a title and options for the poll");
      return;
    }
  
    try {
      setError('');
      console.log("Creating poll with title:", newPollTitle);
      console.log("Poll options:", newPollOptions);
  
      const options = newPollOptions.split(',').map(option => option.trim());
      console.log("Processed options:", options);
  
      console.log("Calling contract.createPoll");
      
      const tx = await contract.createPoll(newPollTitle, options);
      console.log("Transaction sent:", tx.hash);
  
      console.log("Waiting for transaction to be mined");
      await tx.wait();
      console.log("Transaction mined");
  
      setNewPollTitle('');
      setNewPollOptions('');
      console.log("Form reset");
  
      await loadPolls();
      console.log("Polls reloaded");
    } catch (error) {
      handleError(error, "Failed to create poll");
    }
  };
  
  const handleCreatePoll = async (title: string, options: string[]) => {
    if (!contract) {
      setError("Contract is not initialized. Please connect your wallet.");
      return;
    }
  
    try {
      setError('');
      console.log("Creating poll with title:", title);
      console.log("Poll options:", options);
  
      const tx = await contract.createPoll(title, options);
      console.log("Transaction sent:", tx.hash);
  
      console.log("Waiting for transaction to be mined");
      await tx.wait();
      console.log("Transaction mined");
  
      await loadPolls(contract);
    } catch (error) {
      handleError(error, "Failed to create poll");
    }
  };
  
  const castVote = async (pollId: number, option: string) => {
    if (contract) {
      try {
        setError('');
        const tx = await contract.vote(pollId, option);
        await tx.wait();
        await loadPolls();
      } catch (error) {
        handleError(error, "Failed to cast vote");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f0f0f0] dark:bg-[#1a1b1e]">
      <div className="w-full max-w-4xl mx-4 sm:mx-8 md:mx-12 lg:mx-16 xl:mx-20 2xl:mx-24">
        <header className="flex items-center justify-between py-4 border-b border-[#e0e0e0] dark:border-[#2c2d30]">
          <div className="flex items-center gap-2">
            <NetworkIcon className="w-8 h-8 text-[#0077b6]" />
            <h1 className="text-2xl font-bold text-[#0077b6]">Manta Polls</h1>
          </div>
          {connectedWallet ? (
            <div className="text-sm text-[#0077b6]">
              Connected Wallet: <span className="font-bold">{connectedWallet}</span>
              <br />
              Network: <span className="font-bold">{networkName}</span>
            </div>
          ) : (
            <Button onClick={connectWallet} disabled={isConnecting} className="bg-[#0077b6] text-white hover:bg-[#005a8f]">
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </header>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <main className="py-8">
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-[#0077b6]">Create Poll</h2>
            <form onSubmit={createPoll} className="bg-white dark:bg-[#2c2d30] rounded-lg shadow-md p-6">
              <div className="mb-4">
                <Label htmlFor="title">Poll Title</Label>
                <Input
                  id="title"
                  value={newPollTitle}
                  onChange={(e) => setNewPollTitle(e.target.value)}
                  placeholder="Enter poll title"
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="options">Poll Options</Label>
                <Textarea
                  id="options"
                  value={newPollOptions}
                  onChange={(e) => setNewPollOptions(e.target.value)}
                  placeholder="Enter poll options separated by commas"
                  className="min-h-[100px]"
                />
              </div>
              <Button type="submit" className="bg-[#0077b6] text-white hover:bg-[#005a8f] w-full">Create Poll</Button>
            </form>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-4 text-[#0077b6]">Polls</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {polls.map((poll: Poll) => (
                <Card key={poll.id} className="bg-white dark:bg-[#2c2d30] rounded-lg shadow-md">
                  <CardHeader className="border-b border-[#e0e0e0] dark:border-[#2c2d30] p-4">
                    <h3 className="text-lg font-bold text-[#0077b6]">{poll.title}</h3>
                  </CardHeader>
                  <CardContent className="p-4">
                    {poll.options.map((option: string, index: number) => (
                      <div key={index} className="mb-2">
                        <div className="flex items-center justify-between">
                          <span>{option}</span>
                          <span className="font-bold">{poll.votes[index]}</span>
                        </div>
                        <Progress
                          value={parseInt(poll.votes[index])}
                          max={poll.votes.reduce((a, b) => a + parseInt(b), 0)}
                          className="h-2 bg-[#0077b6]"
                        />
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter className="border-t border-[#e0e0e0] dark:border-[#2c2d30] p-4">
                    <div className="flex items-center justify-between">
                      <select
                        onChange={(e) => castVote(poll.id, e.target.value)}
                        className="bg-[#0077b6] text-white hover:bg-[#005a8f] p-2 rounded"
                      >
                        <option value="">Select an option</option>
                        {poll.options.map((option: string, index: number) => (
                          <option key={index} value={option}>{option}</option>
                        ))}
                      </select>
                      <div className="text-sm text-[#0077b6] font-bold">
                      Total Votes: {poll.votes.reduce((a, b) => a + parseInt(b), 0)}
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <footer className="flex items-center justify-between py-4 border-t border-[#e0e0e0] dark:border-[#2c2d30]">
        <div>
          <div className="text-[#0077b6]" />
        </div>
      </footer>
    </div>
  </div>
  )
}

function NetworkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="16" y="16" width="6" height="6" rx="1" />
      <rect x="2" y="16" width="6" height="6" rx="1" />
      <rect x="9" y="2" width="6" height="6" rx="1" />
      <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
      <path d="M12 12V8" />
    </svg>
  )
}