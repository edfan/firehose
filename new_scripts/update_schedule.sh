#! /bin/sh
cd "${0%/*}"
echo "=== coursews.py ==="
python3 coursews.py
echo "=== sublist_ws.py ==="
python3 sublist_ws.py
echo "=== combiner_ws.py ==="
python3 combiner_ws.py
cp full.json ../public/full.json
