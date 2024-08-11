// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PollContract {
    struct Poll {
        string title;
        mapping(string => uint256) votes;
        string[] options;
    }

    mapping(uint256 => Poll) public polls;
    uint256 public pollCount;

    event PollCreated(uint256 pollId, string title);
    event VoteCast(uint256 pollId, string option);

    function createPoll(string memory _title, string[] memory _options) public {
        pollCount++;
        Poll storage newPoll = polls[pollCount];
        newPoll.title = _title;
        newPoll.options = _options;
        emit PollCreated(pollCount, _title);
    }

    function vote(uint256 _pollId, string memory _option) public {
        require(_pollId > 0 && _pollId <= pollCount, "Invalid poll ID");
        polls[_pollId].votes[_option]++;
        emit VoteCast(_pollId, _option);
    }

    function getPollOptions(uint256 _pollId) public view returns (string[] memory) {
        return polls[_pollId].options;
    }

    function getPollVotes(uint256 _pollId, string memory _option) public view returns (uint256) {
        return polls[_pollId].votes[_option];
    }
}
