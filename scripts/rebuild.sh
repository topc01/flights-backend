# Usage: bash scripts/rebuild.sh -w 3

workers=2

while getopts w: flag
do
    case "${flag}" in
        w) workers=${OPTARG};;
    esac
done



git pull
sudo docker compose down
bash scripts/imagenator.sh
sudo docker compose up -d --scale worker=$workers
sudo docker compose logs -f

