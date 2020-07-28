

### Initial Setup

1. sudo to root

        sudo su -
        
1. make directory for sftp / set ownership
        
        mkdir /sftp/
        chown root:root /sftp/
        chmod 700 /sftp/

1. create directory to store sftp keys (for safekeeping)

        mkdir /root/sftp-keys/
        
### Add User

1. create user / set passwd (make it hard, forget it)

        export SFTP_USER=<new_sftp_user>
        useradd ${SFTP_USER}
        passwd ${SFTP_USER}
        
1. generate keys

        ssh-keygen -t rsa -f /root/sftp-keys/${SFTP_USER}
        
1. copy keys to user

        mkdir /home/${SFTP_USER}/.ssh
        chmod 700 /home/${SFTP_USER}/.ssh
        cp /root/sftp-keys/${SFTP_USER}.pub /home/${SFTP_USER}/.ssh/.authorized_keys
        chmod 400 /home/${SFTP_USER}/.ssh/.authorized_keys
        
        NOTE: client can provide their rsa public keys, instead of generating.
        
        
1. setup sftp directory for user

        mkdir -p /sftp/${SFTP_USER}/upload
        chown root:root /sftp/${SFTP_USER}
        chmod 755 /sftp/${SFTP_USER}
        chown ${SFTP_USER}:${SFTP_USER} /sftp/${SFTP_USER}/upload
        chmod 700 /sftp/${SFTP_USER}/upload
        
1. edit /etc/ssh/sshd_config

    Add this to end (once):
    
        #Subsystem sftp /usr/libexec/openssh/sftp-server
        Subsystem sftp internal-sftp
    
    Add this block for each user
    
        Match User <new_sftp_user>           <<== substitute username here
            ForceCommand internal-sftp
            ChrootDirectory /sftp/%u/
            X11Forwarding no
            AllowTcpForwarding no

1. VERY IMPORTANT
    1. login into a session terminal session (otherwise, you can lock yourself out of system!!!)
    
    1. restart service
    
            systemctl restart sshd
            systemctl status sshd
            
            
    1. check for errors
    
            tail /var/log/secure
            tail /var/log/messages
            
    1. login normally to verify sshd_config is not broken
    
### Testing
    
    1. If keys were generated, provide private key to client securely
    2. SFTP to server
            sftp -i <identity_file> ${SFTPUSER}@sftpserver.host.name
    3. SSH to server.  Verify is it blocked
            ssh -i <identity_file> ${SFTPUSER}@sftpserver.host.name
            **This service allows sftp connections only.**
            

