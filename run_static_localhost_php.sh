#!/bin/bash

# start browser before the server (async)
open http://localhost:8765/index.html

# pass control to php:
exec php -S localhost:8765
