

import datetime

def log_header(message):
    print(f"""======================================================================================
{message}
======================================================================================""")

def log_message(message):
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    print(f"{now} {message}")