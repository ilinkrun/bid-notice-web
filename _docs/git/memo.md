
```sh

sudo chown -R admin:users /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/
sudo chmod -R 666 /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/
sudo chmod -R +rwx /volume1/docker/platforms/ilmac-ubuntu-dev/projects

# NAS local
cd /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web
xgit -e make -u ilinkrun -n bid-notice-web -d "ilmac bid notice management"


# 저장소 삭제
# xgit -e del -u ilinkrun -n bid-notice-web
```