CXX ?= g++
CXXFLAGS ?= -std=c++20 -Wall -Wextra -pedantic -O2

BIN := trustctl
SRC := src/main.cpp

.PHONY: build clean test

build:
	$(CXX) $(CXXFLAGS) -o $(BIN) $(SRC)

test: build
	bash tests/run.sh

clean:
	rm -f $(BIN)
