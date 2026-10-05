import socket
target=input("192.0.0.1:")
port=[21,22,23,25,53,80,110,139,443,445,3306,8080]
print(f"\nScanning {target}...\n")
for port in ports:
    sock=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
    sock.settimeout(1)
    result=sock.connect_ex((target,port))
    if result==0:
        print(f"Port {port}:OPEN")
    else:
        print(f"Port {port}:CLOSED")
    sock.close()
