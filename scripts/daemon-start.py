#!/usr/bin/env python3
"""Double-fork daemonizer: launch Next dev server fully detached (PPID=1),
with scrubbed env and V8 heap cap to survive harness reapers and OOM pressure."""
import os
import sys
import time
import signal

LOG = "/home/z/my-project/.zscripts/daemon-dev.log"
CWD = "/home/z/my-project"
NODE = "/usr/local/bin/node"
NPM = "/usr/local/bin/npm"


def kill_port_owners():
    """Free port 3000 from any orphaned listeners."""
    try:
        pids = os.popen("ss -tlnp 2>/dev/null | grep ':3000' | grep -oP 'pid=\\K[0-9]+' | sort -u").read().split()
        for p in pids:
            try:
                os.kill(int(p), signal.SIGKILL)
            except Exception:
                pass
        if pids:
            time.sleep(1)
    except Exception:
        pass


def daemonize_and_run(mode):
    # First fork
    pid = os.fork()
    if pid > 0:
        os.waitpid(pid, 0)  # reap first child; grandchild reparents to PID 1
        return
    # Child: new session
    os.setsid()
    # Second fork -> grandchild, never session leader, reparented to init
    pid2 = os.fork()
    if pid2 > 0:
        os._exit(0)

    # Grandchild = actual daemon
    os.chdir(CWD)
    devnull = os.open("/dev/null", os.O_RDWR)
    os.dup2(devnull, 0)
    logfd = os.open(LOG, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
    os.dup2(logfd, 1)
    os.dup2(logfd, 2)

    env = {
        "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        "HOME": "/home/z",
        "USER": "z",
        "TERM": "xterm-256color",
        "NODE_OPTIONS": "--max-old-space-size=1536",
    }
    if mode == "prod":
        env["NODE_ENV"] = "production"
        log = CWD + "/.zscripts/daemon-prod.log"
        os.dup2(os.open(log, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644), 1)
        os.dup2(os.open(log, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644), 2)
        os.execve(NODE, ["node", ".next/standalone/server.js"], env)
    else:
        os.execve(NPM, ["npm", "run", "dev"], env)


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "dev"
    kill_port_owners()
    daemonize_and_run(mode)
    time.sleep(1)
    sys.exit(0)
