CMAKE ?= cmake
BUILD_DIR ?= build
BIN := a.out

.PHONY: configure build test clean

configure:
	$(CMAKE) -S . -B $(BUILD_DIR) -DCMAKE_BUILD_TYPE=Debug

build: configure
	$(CMAKE) --build $(BUILD_DIR)
	cp $(BUILD_DIR)/$(BIN) ./$(BIN)

test: build
	bash tests/run.sh

clean:
	rm -rf $(BUILD_DIR) $(BIN)
