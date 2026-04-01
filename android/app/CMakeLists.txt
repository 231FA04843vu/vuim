cmake_minimum_required(VERSION 3.10.2)

project("vuim")

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Add native source file
add_library(
    native-lib
    SHARED
    src/main/cpp/native-lib.cpp
)

# Find Android log library
find_library(
    log-lib
    log
)

# Link libraries
target_link_libraries(
    native-lib
    ${log-lib}
    c++_shared
)
